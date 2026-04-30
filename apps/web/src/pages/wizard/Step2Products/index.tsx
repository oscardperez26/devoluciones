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

/* ══════════════════════════════════════════════════════
   Iconos por causal — mapeo por palabras clave
   ══════════════════════════════════════════════════════ */
function ReasonIcon({ reason }: { reason: EligibleReason }) {
  const t = (reason.label + ' ' + (reason.grupo ?? '')).toLowerCase();
  const cls = 'rm-reason-icon';

  // ── Talla & fit ──────────────────────────────────────
  if (t.match(/grande|ancho|ampli/))
    return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8V6a2 2 0 0 1 2-2h2M4 16v2a2 2 0 0 0 2 2h2M16 4h2a2 2 0 0 1 2 2v2M16 20h2a2 2 0 0 0 2-2v-2M9 12h6M12 9l3 3-3 3"/></svg>;

  if (t.match(/pequeñ|estrech|ajust|corto/))
    return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3M9 12h6M15 9l-3 3 3 3"/></svg>;

  if (t.match(/talla|medida|tallaje|size/))
    return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20M5 12V8m4 4V6m4 4V4m4 4v4"/></svg>;

  // ── Color / apariencia ───────────────────────────────
  if (t.match(/color|tono|decolor|mancha/))
    return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="6.5" cy="13.5" r="2.5"/><circle cx="17" cy="17" r="2.5"/><path d="M2 20l8-8M12 2l8 8"/></svg>;

  // ── Expectativa / foto / descripción ─────────────────
  if (t.match(/foto|imagen|espera|descri|parec|muest/))
    return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/><line x1="3" y1="3" x2="21" y2="21"/></svg>;

  // ── Modelo / diseño / producto diferente ─────────────
  if (t.match(/model|diseño|referencia|estilo|product/))
    return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H5v10a2 2 0 002 2h10a2 2 0 002-2V10h1.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/></svg>;

  // ── Material / tela ──────────────────────────────────
  if (t.match(/material|tela|tejido|fibra|acabado/))
    return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3zM13 13l6 6"/></svg>;

  // ── Defecto de fabricación ───────────────────────────
  if (t.match(/defecto|falla|fabri|manufactu/))
    return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.77 3.77z"/></svg>;

  // ── Costura / hilo / botón / cremallera ──────────────
  if (t.match(/costura|hilo|borda|cremall|botón|boton|zipper|puntada/))
    return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><path d="M12 2a10 10 0 100 20A10 10 0 0012 2z"/><path d="M12 8v1M12 15v1M8 12h1M15 12h1M9.17 9.17l.7.7M14.13 14.13l.7.7M9.17 14.83l.7-.7M14.13 9.87l.7-.7"/></svg>;

  // ── Producto equivocado / incorrecto ─────────────────
  if (t.match(/equivoc|incorrect|error|cambio|equipa/))
    return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3l4 4-4 4M8 7h12M8 21l-4-4 4-4M4 17h12"/></svg>;

  // ── Daño en tránsito / llegó roto ────────────────────
  if (t.match(/dañ|roto|rota|golpe|maltrat|transit|transpor/))
    return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><line x1="12" y1="22" x2="12" y2="11.5"/><line x1="12" y1="7" x2="12" y2="7.01"/></svg>;

  // ── Demora / tardanza ────────────────────────────────
  if (t.match(/tard|demor|tiempo|plazo|retraso/))
    return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;

  // ── Fallback por grupo ───────────────────────────────
  const g = (reason.grupo ?? '').toLowerCase();

  if (g.includes('talla'))
    return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 6H3M21 12H3M21 18H3"/><circle cx="9" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1" fill="currentColor" stroke="none"/></svg>;

  if (g.includes('entrega') || g.includes('despacho'))
    return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8zM5.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM18.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/></svg>;

  if (g.includes('calidad'))
    return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;

  // Genérico
  return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
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
                        {/* Icono alusivo a la causal */}
                        <span className={`rm-icon-wrap ${isSel ? 'rm-icon-wrap--on' : ''}`}>
                          <ReasonIcon reason={r} />
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
                    {/* Fila cabecera: miniatura + nombre */}
                    <div className="p2-ev-header">
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
                      <p className="p2-ev-name">{item?.productName ?? s.orderItemId}</p>
                    </div>

                    {/* Zona de upload — ancho completo */}
                    <div className="p2-ev-body">
                      {done
                        ? <p className="p2-ev-done-text">✓ Foto subida correctamente</p>
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
