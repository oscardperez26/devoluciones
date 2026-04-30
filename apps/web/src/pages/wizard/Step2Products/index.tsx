import './Step2Products.css';
import { useEffect, useState } from 'react';
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

interface ReasonModalItem {
  item: OrderItem;
  currentCode: string;
}

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

/* ── Modal / bottom-sheet de motivos ── */
function ReasonModal({
  data,
  onConfirm,
  onClose,
}: {
  data: ReasonModalItem;
  onConfirm: (code: string) => void;
  onClose: () => void;
}) {
  const { item, currentCode } = data;
  const [selected, setSelected] = useState(currentCode);
  const groups = groupReasons(item.eligibleReasons);

  // Cierra con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Bloquea scroll del body mientras está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const canConfirm = selected !== '';

  return (
    <div className="rm-backdrop" onClick={onClose}>
      <div className="rm-sheet" onClick={(e) => e.stopPropagation()}>

        {/* Handle visual (mobile) */}
        <div className="rm-handle" />

        {/* Header */}
        <div className="rm-header">
          <div className="rm-header-product">
            {item.imageUrl && (
              <img src={item.imageUrl} alt={item.productName} className="rm-thumb" />
            )}
            <div className="rm-header-info">
              <p className="rm-header-label">Motivo de devolución</p>
              <p className="rm-header-name">{item.productName}</p>
              {item.size && <p className="rm-header-meta">Talla {item.size}{item.color ? ` · Color ${item.color}` : ''}</p>}
            </div>
          </div>
          <button className="rm-close" onClick={onClose} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Causales */}
        <div className="rm-body">
          {item.eligibleReasons.length === 0 ? (
            <p className="rm-empty">El plazo de devolución para este producto ha vencido.</p>
          ) : (
            groups.map(({ grupo, items }) => (
              <div key={grupo} className="rm-group">
                <p className="rm-group-label">{grupo}</p>
                <div className="rm-options">
                  {items.map((r) => {
                    const isSel = r.code === selected;
                    return (
                      <button
                        key={r.code}
                        type="button"
                        className={`rm-option ${isSel ? 'rm-option--on' : ''}`}
                        onClick={() => setSelected(isSel ? '' : r.code)}
                      >
                        {/* Radio indicator */}
                        <span className={`rm-radio ${isSel ? 'rm-radio--on' : ''}`}>
                          {isSel && <span className="rm-radio-dot" />}
                        </span>

                        {/* Label */}
                        <span className="rm-option-label">{r.label}</span>

                        {/* Badges */}
                        <span className="rm-option-badges">
                          {r.requiresEvidence && (
                            <span className="rm-badge rm-badge--cam" title="Requiere foto">📷</span>
                          )}
                          {r.daysLeft <= 5 && (
                            <span className="rm-badge rm-badge--days">{r.daysLeft}d</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer con botón confirmar */}
        <div className="rm-footer">
          <button
            type="button"
            className="rm-btn-cancel"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            className="rm-btn-confirm"
            onClick={() => { onConfirm(selected); onClose(); }}
          >
            Confirmar motivo
          </button>
        </div>
      </div>
    </div>
  );
}

/* Ícono check */
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
  const [reasonModal, setReasonModal] = useState<ReasonModalItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['session-order'],
    queryFn: getSessionOrder,
  });

  function toggleItem(item: OrderItem) {
    const exists = selected.find((s) => s.orderItemId === item.id);
    if (exists) {
      // Deseleccionar — quitar de la lista
      setSelected((prev) => prev.filter((s) => s.orderItemId !== item.id));
    } else {
      // Seleccionar — agregar y abrir modal de motivo inmediatamente
      setSelected((prev) => [
        ...prev,
        { orderItemId: item.id, reasonCodes: [], comments: '', quantity: 1, productName: item.productName },
      ]);
      setReasonModal({ item, currentCode: '' });
    }
  }

  function openReasonModal(item: OrderItem, currentCode: string) {
    setReasonModal({ item, currentCode });
  }

  function confirmReason(itemId: string, code: string) {
    setSelected((prev) =>
      prev.map((s) => s.orderItemId === itemId ? { ...s, reasonCodes: code ? [code] : [] } : s),
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
      {/* Header sticky */}
      <header className="p2-header">
        <div className="p2-header-inner">
          <span className="p2-logo">KOAJ</span>
          <StepIndicator current={2} />
        </div>
      </header>

      {/* Cuerpo */}
      <main className="p2-body">
        {phase === 'selecting' ? (
          <>
            <div className="p2-title-block">
              <h2 className="p2-title">¿Qué deseas devolver?</h2>
              <p className="p2-subtitle">
                Toca la prenda para seleccionarla y elegir el motivo.
                {data?.items.length ? ` · ${data.items.length} prenda${data.items.length > 1 ? 's' : ''}` : ''}
              </p>
            </div>

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
                    {/* Imagen protagonista */}
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
                          }}
                        />
                      ) : (
                        <div className="p2-img-ph">👕</div>
                      )}

                      {blocked && bl && (
                        <div className="p2-blocked-badge">{bl.text}</div>
                      )}

                      {!blocked && (
                        <div className={`p2-chk ${isSelected ? 'p2-chk--on' : ''}`}>
                          {isSelected && <CheckIcon />}
                        </div>
                      )}

                      {isSelected && reasonDone && (
                        <div className="p2-reason-badge">✓ Listo</div>
                      )}

                      {isSelected && !reasonDone && (
                        <div className="p2-reason-badge p2-reason-badge--pending">+ Motivo</div>
                      )}
                    </div>

                    {/* Info */}
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

                    {/* Botón de motivo (solo cuando está seleccionado) */}
                    {isSelected && (
                      <button
                        type="button"
                        className={`p2-reason-btn ${reasonDone ? 'p2-reason-btn--done' : 'p2-reason-btn--pending'}`}
                        onClick={() => openReasonModal(item, sel?.reasonCodes[0] ?? '')}
                      >
                        {reasonDone
                          ? <>✓ {item.eligibleReasons.find(r => r.code === sel?.reasonCodes[0])?.label ?? 'Motivo elegido'}</>
                          : '¿Por qué lo devuelves? →'
                        }
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
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
                      {done
                        ? <p className="p2-ev-done-text">Foto subida</p>
                        : <EvidenceUpload returnId={returnId!} devolucionItemId={s.devolucionItemId!} onUploaded={() => handleEvidenceDone(s.devolucionItemId!)} />
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Barra de acción sticky */}
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

      {/* Modal de motivos */}
      {reasonModal && (
        <ReasonModal
          data={reasonModal}
          onClose={() => setReasonModal(null)}
          onConfirm={(code) => confirmReason(reasonModal.item.id, code)}
        />
      )}
    </div>
  );
}
