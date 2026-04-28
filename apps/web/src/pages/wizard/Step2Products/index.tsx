import './Step2Products.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSessionOrder } from '@/api/orders.api';
import { createOrUpdateDraft } from '@/api/returns.api';
import { ErrorMessage, PrimaryButton, WizardPage } from '@/components/ui';
import EvidenceUpload from '@/components/wizard/EvidenceUpload';
import StepIndicator from '@/components/wizard/StepIndicator';
import type { SelectedItem } from '@/store/wizard.store';
import { useWizardStore } from '@/store/wizard.store';
import type { EligibleReason, OrderItem } from '@/types';

const BLOCKED_LABELS: Record<string, { text: string; icon: string }> = {
  ACTIVE_RETURN:    { icon: '🔄', text: 'Ya tiene una solicitud de devolución en proceso.' },
  ALREADY_REFUNDED: { icon: '✅', text: 'Este producto ya fue reembolsado anteriormente.' },
  NOT_RETURNABLE:   { icon: '🚫', text: 'Este producto no es elegible para devolución.' },
};

const GROUP_ORDER = ['Talla y expectativa', 'Entrega y despacho', 'Calidad del producto'];

type Phase = 'selecting' | 'evidence';

function groupReasons(reasons: EligibleReason[]): { grupo: string; items: EligibleReason[] }[] {
  const map = new Map<string, EligibleReason[]>();
  for (const r of reasons) {
    const g = r.grupo ?? 'Otros';
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(r);
  }
  const ordered: { grupo: string; items: EligibleReason[] }[] = [];
  for (const g of GROUP_ORDER) {
    if (map.has(g)) ordered.push({ grupo: g, items: map.get(g)! });
  }
  for (const [g, items] of map) {
    if (!GROUP_ORDER.includes(g)) ordered.push({ grupo: g, items });
  }
  return ordered;
}

function ReasonPicker({
  reasons,
  selected,
  onSelect,
}: {
  reasons: EligibleReason[];
  selected: string;
  onSelect: (code: string) => void;
}) {
  const groups = groupReasons(reasons);
  const selectedReason = reasons.find((r) => r.code === selected);
  const [openGroup, setOpenGroup] = useState<string | null>(
    selectedReason ? (selectedReason.grupo ?? null) : null,
  );

  if (reasons.length === 0) {
    return <p className="reason-no-motivos">No hay motivos disponibles para este producto (plazo vencido).</p>;
  }

  function toggleGroup(grupo: string) {
    setOpenGroup((prev) => (prev === grupo ? null : grupo));
  }

  return (
    <div className="reason-groups">
      {groups.map(({ grupo, items }) => {
        const isOpen = openGroup === grupo;
        const groupSelected = items.find((r) => r.code === selected);

        return (
          <div key={grupo} className={`reason-group ${isOpen ? 'reason-group--open' : ''}`}>
            <button
              type="button"
              onClick={() => toggleGroup(grupo)}
              className={`reason-group-header ${isOpen ? 'reason-group-header--open' : 'reason-group-header--closed'}`}
            >
              <div className="reason-group-header-left">
                <span className="reason-group-name">{grupo}</span>
                {groupSelected && !isOpen && (
                  <span className="reason-group-selected-tag">✓ {groupSelected.label}</span>
                )}
              </div>
              <span className={`reason-group-chevron ${isOpen ? 'reason-group-chevron--open' : 'reason-group-chevron--closed'}`}>
                {isOpen ? '▲' : '▼'}
              </span>
            </button>

            {isOpen && (
              <div className="reason-options">
                {items.map((r) => {
                  const isSelected = r.code === selected;
                  return (
                    <button
                      key={r.code}
                      type="button"
                      onClick={() => { onSelect(r.code); setOpenGroup(null); }}
                      className={`reason-option ${isSelected ? 'reason-option--selected' : ''}`}
                    >
                      <div className="reason-option-left">
                        <div className={`reason-radio ${isSelected ? 'reason-radio--selected' : ''}`}>
                          {isSelected && <div className="reason-radio-dot" />}
                        </div>
                        <span className="reason-option-label">{r.label}</span>
                      </div>
                      <div className="reason-option-right">
                        {r.requiresEvidence && (
                          <span className="reason-evidence-badge">📷</span>
                        )}
                        <span className="reason-days">{r.daysLeft}d</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {groupSelected && !isOpen && (
              <div className="reason-selected-preview">
                <div className="reason-selected-dot" />
                <span className="reason-selected-label">{groupSelected.label}</span>
                {groupSelected.requiresEvidence && (
                  <span className="reason-evidence-badge">📷</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Step2Products() {
  const navigate = useNavigate();
  const { returnId, setReturnId, setViewReturnId, goToStep } = useWizardStore();
  const [phase, setPhase] = useState<Phase>('selecting');
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [evidenceDone, setEvidenceDone] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['session-order'],
    queryFn: getSessionOrder,
  });

  function toggleItem(item: OrderItem) {
    setSelected((prev) => {
      const exists = prev.find((s) => s.orderItemId === item.id);
      if (exists) return prev.filter((s) => s.orderItemId !== item.id);
      return [...prev, { orderItemId: item.id, reasonCodes: [], comments: '', quantity: 1, productName: item.productName }];
    });
  }

  function selectReason(itemId: string, code: string) {
    setSelected((prev) =>
      prev.map((s) => {
        if (s.orderItemId !== itemId) return s;
        return { ...s, reasonCodes: s.reasonCodes[0] === code ? [] : [code] };
      }),
    );
  }

  function handleViewBlockedReturn(item: OrderItem) {
    if (!item.blockingReturnId) return;
    setViewReturnId(item.blockingReturnId);
    navigate('/estado');
  }

  async function saveDraft() {
    if (selected.length === 0) { setError('Selecciona al menos un producto.'); return; }
    if (selected.some((s) => s.reasonCodes.length === 0)) { setError('Selecciona el motivo de devolución de cada producto.'); return; }
    setError('');
    setSaving(true);
    try {
      const draft = await createOrUpdateDraft(selected);
      const enriched: SelectedItem[] = draft.items.map((di, idx) => ({
        ...selected[idx],
        devolucionItemId: di.id,
        requiresEvidence: di.requiresEvidence,
      }));
      setReturnId(draft.returnId, enriched);
      const needsEvidence = enriched.some((s) => s.requiresEvidence);
      if (needsEvidence) {
        setSelected(enriched);
        setPhase('evidence');
      } else {
        goToStep(3);
        navigate('/paso-3');
      }
    } catch {
      setError('Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  function handleEvidenceDone(itemId: string) {
    setEvidenceDone((prev) => {
      const next = new Set([...prev, itemId]);
      if (itemsNeedingEvidence.every((s) => next.has(s.devolucionItemId!))) {
        goToStep(3);
        navigate('/paso-3');
      }
      return next;
    });
  }

  const itemsNeedingEvidence = selected.filter((s) => s.requiresEvidence && s.devolucionItemId);

  if (isLoading) {
    return (
      <div className="products-loading">
        <p className="products-loading-text">Cargando productos...</p>
      </div>
    );
  }

  return (
    <WizardPage>
      <StepIndicator current={2} />

      {phase === 'selecting' ? (
        <>
          <h2 className="step-title">Selecciona los productos a devolver</h2>
          <p className="step-subtitle">Marca los productos y elige el motivo de devolución.</p>

          <div className="products-list">
            {data?.items.map((item) => {
              const isSelected = selected.some((s) => s.orderItemId === item.id);
              const sel = selected.find((s) => s.orderItemId === item.id);
              const blocked = !item.isReturnable || !!item.blockedReason;

              return (
                <div
                  key={item.id}
                  className={`product-card ${blocked ? 'product-card--blocked' : isSelected ? 'product-card--selected' : ''}`}
                >
                  <div
                    className={`product-card-body ${!blocked ? 'product-card-body--clickable' : ''}`}
                    onClick={() => { if (!blocked) toggleItem(item); }}
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="product-img"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="product-img-placeholder">
                        <span>👕</span>
                      </div>
                    )}

                    <div className="product-body">
                      <div className="product-header">
                        {!blocked && (
                          <div className={`product-checkbox ${isSelected ? 'product-checkbox--checked' : ''}`}>
                            {isSelected && <span className="product-checkbox-mark">✓</span>}
                          </div>
                        )}
                        <div className="product-info">
                          <p className={`product-name ${blocked ? 'product-name--blocked' : ''}`}>{item.productName}</p>
                          <p className="product-meta">{item.sku}{item.size && ` · Talla ${item.size}`}{item.color && ` · Color ${item.color}`}</p>
                          <p className="product-price">${item.unitPrice.toLocaleString('es-CO')}</p>
                          {blocked && (() => {
                            const bl = BLOCKED_LABELS[item.blockedReason ?? ''];
                            return (
                              <div className="blocked-info">
                                <p className="blocked-reason">
                                  <span>{bl?.icon ?? '🚫'}</span>
                                  <span>{bl?.text ?? 'No disponible para devolución.'}</span>
                                </p>
                                {item.blockingReturnId && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleViewBlockedReturn(item); }}
                                    className="blocked-link"
                                  >
                                    Ver estado de esta devolución →
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isSelected && sel && (
                    <div className="reason-section">
                      <p className="reason-section-label">Motivo de devolución:</p>
                      <ReasonPicker
                        reasons={item.eligibleReasons}
                        selected={sel.reasonCodes[0] ?? ''}
                        onSelect={(code) => selectReason(item.id, code)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {error && <ErrorMessage message={error} />}

          <div className="products-action">
            <PrimaryButton disabled={saving} onClick={() => { void saveDraft(); }}>
              {saving ? 'Guardando...' : 'Guardar ítems →'}
            </PrimaryButton>
          </div>
        </>
      ) : (
        <>
          <h2 className="step-title">Sube las evidencias fotográficas</h2>
          <p className="step-subtitle">Algunos productos requieren fotos del defecto.</p>

          <div className="evidence-items">
            {itemsNeedingEvidence.map((s) => {
              const item = data?.items.find((i) => i.id === s.orderItemId);
              return (
                <div key={s.devolucionItemId} className="evidence-item-card">
                  <div className="evidence-item-header">
                    {item?.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="evidence-item-img" />
                    ) : (
                      <div className="evidence-item-img-placeholder">
                        <span>👕</span>
                      </div>
                    )}
                    <div>
                      <p className="evidence-item-name">{item?.productName ?? s.orderItemId}</p>
                      <p className="evidence-item-reason">Motivo: {s.reasonCodes.join(', ')}</p>
                    </div>
                  </div>
                  {evidenceDone.has(s.devolucionItemId!) ? (
                    <p className="evidence-done-text">✓ Foto subida correctamente</p>
                  ) : (
                    <EvidenceUpload
                      returnId={returnId!}
                      devolucionItemId={s.devolucionItemId!}
                      onUploaded={() => handleEvidenceDone(s.devolucionItemId!)}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <p className="evidence-hint">Confirma la foto de cada producto para continuar.</p>
        </>
      )}
    </WizardPage>
  );
}
