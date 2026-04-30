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

const BLOCKED_LABELS: Record<string, { text: string }> = {
  ACTIVE_RETURN:    { text: 'Devolución en proceso' },
  ALREADY_REFUNDED: { text: 'Ya reembolsado' },
  NOT_RETURNABLE:   { text: 'No retornable' },
};

const GROUP_ORDER = ['Talla y expectativa', 'Entrega y despacho', 'Calidad del producto'];

type Phase = 'selecting' | 'evidence';

function groupReasons(reasons: EligibleReason[]) {
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
    return <p className="p2-no-reasons">Plazo vencido.</p>;
  }
  const groups = groupReasons(reasons);
  return (
    <div className="p2-reason-groups">
      {groups.map(({ grupo, items }) => (
        <div key={grupo} className="p2-reason-group">
          <span className="p2-reason-group-label">{grupo}</span>
          <div className="p2-chips">
            {items.map((r) => {
              const isSel = r.code === selected;
              return (
                <button
                  key={r.code}
                  type="button"
                  onClick={() => onSelect(r.code)}
                  className={`p2-chip ${isSel ? 'p2-chip--on' : ''}`}
                >
                  {r.label}
                  {r.requiresEvidence && <span className="p2-chip-cam">📷</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* Ícono check SVG */
function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" className="p2-chk-svg">
      <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
    if (selected.some((s) => s.reasonCodes.length === 0)) { setError('Selecciona el motivo de cada producto.'); return; }
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

      {/* ── Cuerpo scrollable ── */}
      <main className="p2-body">
        {phase === 'selecting' ? (
          <>
            <div className="p2-title-block">
              <h2 className="p2-title">¿Qué deseas devolver?</h2>
              <p className="p2-subtitle">
                Toca el producto, selecciónalo y elige el motivo.
                {data?.items.length ? ` · ${data.items.length} prenda${data.items.length > 1 ? 's' : ''} en tu pedido` : ''}
              </p>
            </div>

            {/* ── Grid de productos ── */}
            <div className="p2-grid">
              {data?.items.map((item) => {
                const isSelected = selected.some((s) => s.orderItemId === item.id);
                const sel = selected.find((s) => s.orderItemId === item.id);
                const blocked = !item.isReturnable || !!item.blockedReason;
                const bl = blocked ? BLOCKED_LABELS[item.blockedReason ?? ''] : null;
                const reasonDone = (sel?.reasonCodes.length ?? 0) > 0;

                return (
                  <div
                    key={item.id}
                    className={`p2-card ${blocked ? 'p2-card--blocked' : isSelected ? 'p2-card--on' : ''}`}
                  >
                    {/* ── Imagen protagonista ── */}
                    <div
                      className={`p2-img-wrap ${!blocked ? 'p2-img-wrap--click' : ''}`}
                      onClick={() => { if (!blocked) toggleItem(item); }}
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className={`p2-img ${blocked ? 'p2-img--dim' : ''}`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('p2-img-ph--hidden');
                          }}
                        />
                      ) : null}
                      <div className={`p2-img-ph ${item.imageUrl ? 'p2-img-ph--hidden' : ''}`}>👕</div>

                      {/* Badge de estado bloqueado */}
                      {blocked && bl && (
                        <div className="p2-blocked-badge">{bl.text}</div>
                      )}

                      {/* Checkbox flotante */}
                      {!blocked && (
                        <div className={`p2-chk ${isSelected ? 'p2-chk--on' : ''}`}>
                          {isSelected && <CheckIcon />}
                        </div>
                      )}

                      {/* Badge "motivo ✓" sobre imagen cuando está ok */}
                      {isSelected && reasonDone && (
                        <div className="p2-reason-badge">✓ Listo</div>
                      )}
                    </div>

                    {/* ── Info del producto ── */}
                    <div
                      className={`p2-info ${!blocked ? 'p2-info--click' : ''}`}
                      onClick={() => { if (!blocked) toggleItem(item); }}
                    >
                      <p className={`p2-name ${blocked ? 'p2-name--dim' : ''}`}>{item.productName}</p>
                      <div className="p2-meta-row">
                        {item.size && <span className="p2-tag">T. {item.size}</span>}
                        {item.color && <span className="p2-tag p2-tag--color">C. {item.color}</span>}
                      </div>
                      <p className={`p2-price ${blocked ? 'p2-price--dim' : ''}`}>
                        ${item.unitPrice.toLocaleString('es-CO')}
                      </p>
                      {blocked && item.blockingReturnId && (
                        <button
                          className="p2-blocked-link"
                          onClick={(e) => { e.stopPropagation(); handleViewBlockedReturn(item); }}
                        >
                          Ver estado →
                        </button>
                      )}
                    </div>

                    {/* ── Motivos (expandible cuando está seleccionado) ── */}
                    {isSelected && sel && (
                      <div className="p2-reasons">
                        <p className="p2-reasons-label">
                          {reasonDone
                            ? <><span className="p2-reasons-ok">✓</span> Motivo elegido</>
                            : '¿Por qué lo devuelves?'}
                        </p>
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
          /* ── Fase evidencia ── */
          <>
            <div className="p2-title-block">
              <h2 className="p2-title">Fotos del defecto</h2>
              <p className="p2-subtitle">Sube una foto por cada prenda que requiere evidencia.</p>
            </div>

            <div className="p2-ev-grid">
              {itemsNeedingEvidence.map((s) => {
                const item = data?.items.find((i) => i.id === s.orderItemId);
                const done = evidenceDone.has(s.devolucionItemId!);
                return (
                  <div key={s.devolucionItemId} className={`p2-ev-card ${done ? 'p2-ev-card--done' : ''}`}>
                    <div className="p2-ev-img-wrap">
                      {item?.imageUrl
                        ? <img src={item.imageUrl} alt={item.productName} className="p2-ev-img" />
                        : <div className="p2-ev-img-ph">👕</div>
                      }
                      {done && (
                        <div className="p2-ev-done-overlay">
                          <svg viewBox="0 0 24 24" fill="none" className="p2-ev-done-icon">
                            <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p2-ev-info">
                      <p className="p2-ev-name">{item?.productName ?? s.orderItemId}</p>
                      {done ? (
                        <p className="p2-ev-done-text">Foto subida</p>
                      ) : (
                        <EvidenceUpload
                          returnId={returnId!}
                          devolucionItemId={s.devolucionItemId!}
                          onUploaded={() => handleEvidenceDone(s.devolucionItemId!)}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* ── Barra de acción sticky ── */}
      {phase === 'selecting' && (
        <div className="p2-action-bar">
          {error && <div className="p2-action-error"><ErrorMessage message={error} /></div>}
          <div className="p2-action-inner">
            <div className="p2-action-summary">
              {selCount === 0
                ? <span className="p2-action-hint">Selecciona una prenda</span>
                : <>
                    <span className="p2-action-count">{selCount} prenda{selCount > 1 ? 's' : ''}</span>
                    {!allHaveReason && <span className="p2-action-warn"> · falta motivo</span>}
                  </>
              }
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
