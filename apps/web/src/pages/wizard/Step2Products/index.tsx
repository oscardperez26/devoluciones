import './Step2Products.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSessionOrder } from '@/api/orders.api';
import { createOrUpdateDraft } from '@/api/returns.api';
import { ErrorMessage } from '@/components/ui';
import EvidenceUpload from '@/components/wizard/EvidenceUpload';
import StepIndicator from '@/components/wizard/StepIndicator';
import type { SelectedItem } from '@/store/wizard.store';
import { useWizardStore } from '@/store/wizard.store';
import type { EligibleReason, OrderItem } from '@/types';

const BLOCKED_LABELS: Record<string, { text: string; icon: string }> = {
  ACTIVE_RETURN:    { icon: '🔄', text: 'Ya tiene una devolución en proceso.' },
  ALREADY_REFUNDED: { icon: '✅', text: 'Ya fue reembolsado.' },
  NOT_RETURNABLE:   { icon: '🚫', text: 'No elegible para devolución.' },
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

function ReasonChips({
  reasons,
  selected,
  onSelect,
}: {
  reasons: EligibleReason[];
  selected: string;
  onSelect: (code: string) => void;
}) {
  if (reasons.length === 0) {
    return <p className="p2-no-reasons">Plazo de devolución vencido.</p>;
  }
  const groups = groupReasons(reasons);
  return (
    <div className="p2-reason-groups">
      {groups.map(({ grupo, items }) => (
        <div key={grupo} className="p2-reason-group">
          <span className="p2-reason-group-label">{grupo}</span>
          <div className="p2-chips">
            {items.map((r) => {
              const isSelected = r.code === selected;
              return (
                <button
                  key={r.code}
                  type="button"
                  onClick={() => onSelect(r.code)}
                  className={`p2-chip ${isSelected ? 'p2-chip--on' : ''}`}
                >
                  {r.label}
                  {r.requiresEvidence && <span className="p2-chip-cam">📷</span>}
                  {r.daysLeft <= 5 && !isSelected && (
                    <span className="p2-chip-days">{r.daysLeft}d</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
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
    if (selected.some((s) => s.reasonCodes.length === 0)) { setError('Selecciona el motivo de cada producto seleccionado.'); return; }
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
  const selCount = selected.length;
  const allHaveReason = selected.every((s) => s.reasonCodes.length > 0);

  if (isLoading) {
    return (
      <div className="p2-loading">
        <div className="p2-spinner" />
        <p className="p2-loading-text">Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className="p2-root">
      {/* ── Header sticky ── */}
      <header className="p2-header">
        <div className="p2-header-inner">
          <span className="p2-logo">KOAJ</span>
          <StepIndicator current={2} />
        </div>
      </header>

      {/* ── Scrollable body ── */}
      <main className="p2-body">
        {phase === 'selecting' ? (
          <>
            <div className="p2-title-block">
              <h2 className="p2-title">¿Qué deseas devolver?</h2>
              <p className="p2-subtitle">
                Selecciona el producto y el motivo. {data?.items.length ? `${data.items.length} producto${data.items.length > 1 ? 's' : ''} en tu pedido.` : ''}
              </p>
            </div>

            <div className="p2-list">
              {data?.items.map((item) => {
                const isSelected = selected.some((s) => s.orderItemId === item.id);
                const sel = selected.find((s) => s.orderItemId === item.id);
                const blocked = !item.isReturnable || !!item.blockedReason;
                const bl = blocked ? BLOCKED_LABELS[item.blockedReason ?? ''] : null;

                return (
                  <div
                    key={item.id}
                    className={`p2-card ${blocked ? 'p2-card--blocked' : isSelected ? 'p2-card--on' : ''}`}
                  >
                    {/* Row principal */}
                    <div
                      className={`p2-card-row ${!blocked ? 'p2-card-row--click' : ''}`}
                      onClick={() => { if (!blocked) toggleItem(item); }}
                    >
                      {/* Thumbnail */}
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="p2-thumb"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="p2-thumb-ph">👕</div>
                      )}

                      {/* Info */}
                      <div className="p2-info">
                        <p className={`p2-name ${blocked ? 'p2-name--dim' : ''}`}>{item.productName}</p>
                        <p className="p2-meta">
                          {[item.sku, item.size && `Talla ${item.size}`, item.color].filter(Boolean).join(' · ')}
                        </p>
                        <p className="p2-price">${item.unitPrice.toLocaleString('es-CO')}</p>

                        {blocked && bl && (
                          <div className="p2-blocked">
                            <span>{bl.icon}</span>
                            <span>{bl.text}</span>
                            {item.blockingReturnId && (
                              <button
                                className="p2-blocked-link"
                                onClick={(e) => { e.stopPropagation(); handleViewBlockedReturn(item); }}
                              >
                                Ver estado →
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Checkbox */}
                      {!blocked && (
                        <div className={`p2-check ${isSelected ? 'p2-check--on' : ''}`}>
                          {isSelected && (
                            <svg viewBox="0 0 12 12" fill="none" className="p2-check-svg">
                              <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Motivos inline cuando está seleccionado */}
                    {isSelected && sel && (
                      <div className="p2-reasons">
                        <span className="p2-reasons-label">
                          {sel.reasonCodes.length > 0
                            ? <><span className="p2-reasons-ok">✓</span> Motivo seleccionado</>
                            : 'Selecciona el motivo:'}
                        </span>
                        <ReasonChips
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
          </>
        ) : (
          <>
            <div className="p2-title-block">
              <h2 className="p2-title">Sube las fotos del defecto</h2>
              <p className="p2-subtitle">Requerido para continuar con tu devolución.</p>
            </div>

            <div className="p2-list">
              {itemsNeedingEvidence.map((s) => {
                const item = data?.items.find((i) => i.id === s.orderItemId);
                return (
                  <div key={s.devolucionItemId} className="p2-card p2-card--evidence">
                    <div className="p2-ev-header">
                      {item?.imageUrl ? (
                        <img src={item.imageUrl} alt={item?.productName} className="p2-thumb" />
                      ) : (
                        <div className="p2-thumb-ph">👕</div>
                      )}
                      <div className="p2-info">
                        <p className="p2-name">{item?.productName ?? s.orderItemId}</p>
                        <p className="p2-meta">Motivo: {s.reasonCodes.join(', ')}</p>
                      </div>
                    </div>

                    {evidenceDone.has(s.devolucionItemId!) ? (
                      <div className="p2-ev-done">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="p2-ev-done-icon">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                        </svg>
                        Foto subida correctamente
                      </div>
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

            <p className="p2-ev-hint">Confirma la foto de cada producto para avanzar automáticamente.</p>
          </>
        )}
      </main>

      {/* ── Barra de acción sticky ── */}
      {phase === 'selecting' && (
        <div className="p2-action-bar">
          {error && (
            <div className="p2-action-error">
              <ErrorMessage message={error} />
            </div>
          )}
          <div className="p2-action-inner">
            <div className="p2-action-summary">
              {selCount === 0
                ? <span className="p2-action-hint">Ningún producto seleccionado</span>
                : <span className="p2-action-count">{selCount} producto{selCount > 1 ? 's' : ''} seleccionado{selCount > 1 ? 's' : ''}</span>
              }
              {selCount > 0 && !allHaveReason && (
                <span className="p2-action-warn">— falta motivo</span>
              )}
            </div>
            <button
              type="button"
              disabled={saving || selCount === 0}
              onClick={() => { void saveDraft(); }}
              className="p2-action-btn"
            >
              {saving ? 'Guardando...' : 'Continuar →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
