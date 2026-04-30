import './StatusTracking.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReturnStatus } from '@/api/returns.api';
import type { ReturnStatus } from '@/api/returns.api';
import { useWizardStore } from '@/store/wizard.store';
import StepIndicator from '@/components/wizard/StepIndicator';

type StepState = 'done' | 'current' | 'pending' | 'rejected';

interface StatusStep { key: string; label: string; desc: string; icon: string; }

const STEPS: StatusStep[] = [
  { key: 'ENVIADA',               label: 'Solicitud recibida',   desc: 'Tu solicitud fue registrada exitosamente.',        icon: '📋' },
  { key: 'EN_REVISION',           label: 'En revisión',          desc: 'Nuestro equipo está revisando tu solicitud.',      icon: '🔍' },
  { key: 'APROBADA',              label: 'Aprobada',             desc: 'Tu devolución fue aprobada.',                      icon: '✅' },
  { key: 'PRODUCTO_RECIBIDO',     label: 'Producto recibido',    desc: 'Recibimos el producto en nuestras instalaciones.', icon: '📦' },
  { key: 'REEMBOLSO_EN_PROCESO',  label: 'Reembolso en proceso', desc: 'Estamos procesando tu reembolso.',                 icon: '💰' },
  { key: 'COMPLETADA',            label: 'Completada',           desc: '¡Tu reembolso fue procesado exitosamente!',        icon: '🎉' },
];

const REFUND_LABELS: Record<string, string> = {
  TARJETA_REGALO: 'Tarjeta regalo', MERCADOPAGO: 'Mercado Pago', MEDIO_ORIGINAL: 'Medio original',
};
const DELIVERY_LABELS: Record<string, string> = {
  TIENDA: 'Entrega en tienda', TRANSPORTADORA: 'Recogida en domicilio',
};

function getState(stepKey: string, current: string): StepState {
  if (current === 'RECHAZADA') {
    const idx = STEPS.findIndex(s => s.key === stepKey);
    return idx < STEPS.findIndex(s => s.key === 'EN_REVISION') ? 'done' : 'rejected';
  }
  const si = STEPS.findIndex(s => s.key === stepKey);
  const ci = STEPS.findIndex(s => s.key === current);
  if (si < ci)  return 'done';
  if (si === ci) return 'current';
  return 'pending';
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 14 14">
      <polyline points="2 7 6 11 12 3" />
    </svg>
  );
}

function Dot({ state, icon }: { state: StepState; icon: string }) {
  return (
    <div className={`st-dot st-dot--${state}`}>
      {state === 'done' ? <CheckIcon /> : icon}
    </div>
  );
}

export default function StatusTracking() {
  const navigate = useNavigate();
  const { returnId, ticketNumber, totalRefund, resetReturn } = useWizardStore();
  const [status, setStatus] = useState<ReturnStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!returnId) { setLoading(false); return; }
    getReturnStatus(returnId)
      .then(setStatus)
      .catch(() => setError('No se pudo cargar el estado.'))
      .finally(() => setLoading(false));
  }, [returnId]);

  if (loading) return <div className="st-loading">Cargando estado…</div>;

  const displayTicket  = status?.ticketNumber ?? ticketNumber ?? '—';
  const displayRefund  = status?.totalRefund  ?? totalRefund;
  const currentStatus  = status?.status ?? 'ENVIADA';
  const isRejected     = currentStatus === 'RECHAZADA';
  const isCompleted    = currentStatus === 'COMPLETADA';

  return (
    <div className="st-root">

      {/* ── Header sticky ── */}
      <header className="st-header">
        <div className="st-header-inner">
          <StepIndicator current={5} />
        </div>
      </header>

      {/* ── Cuerpo ── */}
      <main className="st-body">

        {/* Tarjeta de ticket */}
        <div className="st-ticket">
          <div className="st-ticket-top">
            <div>
              <p className="st-ticket-label">Número de ticket</p>
              <p className="st-ticket-number">{displayTicket}</p>
            </div>
            <span className={`st-badge ${isRejected ? 'st-badge--rejected' : isCompleted ? 'st-badge--completed' : 'st-badge--active'}`}>
              {isRejected ? 'Rechazada' : isCompleted ? 'Completada' : 'En proceso'}
            </span>
          </div>

          <div className="st-ticket-grid">
            <div className="st-ticket-cell">
              <p className="st-cell-label">Total a reembolsar</p>
              <p className="st-cell-value st-cell-value--green">${displayRefund.toLocaleString('es-CO')}</p>
            </div>
            {status?.refundMethod && (
              <div className="st-ticket-cell">
                <p className="st-cell-label">Método de reembolso</p>
                <p className="st-cell-value">{REFUND_LABELS[status.refundMethod] ?? status.refundMethod}</p>
              </div>
            )}
            {status?.deliveryMethod && (
              <div className="st-ticket-cell">
                <p className="st-cell-label">Método de entrega</p>
                <p className="st-cell-value">{DELIVERY_LABELS[status.deliveryMethod] ?? status.deliveryMethod}</p>
              </div>
            )}
            {status?.submittedAt && (
              <div className="st-ticket-cell">
                <p className="st-cell-label">Enviada el</p>
                <p className="st-cell-value">
                  {new Date(status.submittedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="st-timeline-card">
          <p className="st-timeline-title">Estado de tu devolución</p>

          <div className="st-steps">
            {STEPS.map((step, idx) => {
              const state = getState(step.key, currentStatus);
              const isLast = idx === STEPS.length - 1;
              const lineState = state === 'done' ? 'done' : 'pending';
              return (
                <div key={step.key} className="st-step">
                  <div className="st-step-aside">
                    <Dot state={state} icon={step.icon} />
                    {!isLast && <div className={`st-line st-line--${lineState}`} />}
                  </div>
                  <div className="st-step-body">
                    <p className={`st-step-name st-step-name--${state}`}>{step.label}</p>
                    {(state === 'done' || state === 'current') && (
                      <p className="st-step-desc">{step.desc}</p>
                    )}
                    {state === 'current' && <span className="st-step-now">Estado actual</span>}
                    {state === 'rejected' && idx === STEPS.findIndex(s => s.key === 'EN_REVISION') + 1 && (
                      <>
                        <p className="st-step-desc">Tu solicitud no cumplió los requisitos de devolución.</p>
                        {status?.history.find(h => h.status === 'RECHAZADA')?.notes && (
                          <p className="st-rejection-note">
                            {status.history.find(h => h.status === 'RECHAZADA')!.notes}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {error && <p className="st-error">{error}</p>}
        </div>

      </main>

      {/* ── Barra de acciones fija ── */}
      <div className="st-action-bar">
        <div className="st-action-inner">
          <button
            type="button"
            className="st-btn-secondary"
            onClick={() => navigate('/paso-2')}
          >
            <svg viewBox="0 0 20 20" fill="none" className="st-back-svg">
              <path d="M13 16l-5-5 5-5" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Volver
          </button>
          <button
            type="button"
            className="st-btn-primary"
            onClick={() => { resetReturn(); navigate('/paso-2'); }}
          >
            Iniciar otra devolución
          </button>
        </div>
      </div>

    </div>
  );
}
