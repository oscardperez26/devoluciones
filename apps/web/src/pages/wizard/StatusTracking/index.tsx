import './StatusTracking.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReturnStatus } from '@/api/returns.api';
import type { ReturnStatus } from '@/api/returns.api';
import { useWizardStore } from '@/store/wizard.store';

type StepState = 'completed' | 'current' | 'pending' | 'rejected';

interface StatusStep {
  key: string;
  label: string;
  description: string;
  icon: string;
}

const HAPPY_PATH: StatusStep[] = [
  { key: 'ENVIADA',               label: 'Solicitud recibida',   description: 'Tu solicitud fue registrada exitosamente.',       icon: '📋' },
  { key: 'EN_REVISION',          label: 'En revisión',          description: 'Nuestro equipo está revisando tu solicitud.',     icon: '🔍' },
  { key: 'APROBADA',             label: 'Aprobada',             description: 'Tu devolución fue aprobada.',                     icon: '✅' },
  { key: 'PRODUCTO_RECIBIDO',    label: 'Producto recibido',    description: 'Recibimos el producto en nuestras instalaciones.', icon: '📦' },
  { key: 'REEMBOLSO_EN_PROCESO', label: 'Reembolso en proceso', description: 'Estamos procesando tu reembolso.',                icon: '💰' },
  { key: 'COMPLETADA',           label: 'Completada',           description: '¡Tu reembolso fue procesado exitosamente!',       icon: '🎉' },
];

const REFUND_LABELS: Record<string, string> = {
  TARJETA_REGALO: 'Tarjeta regalo', MERCADOPAGO: 'Mercado Pago', MEDIO_ORIGINAL: 'Medio original',
};
const DELIVERY_LABELS: Record<string, string> = {
  TIENDA: 'Entrega en tienda', TRANSPORTADORA: 'Recogida en domicilio',
};

function getStepState(stepKey: string, currentStatus: string): StepState {
  if (currentStatus === 'RECHAZADA') {
    const idx      = HAPPY_PATH.findIndex((s) => s.key === stepKey);
    const rejectIdx = HAPPY_PATH.findIndex((s) => s.key === 'EN_REVISION');
    return idx < rejectIdx ? 'completed' : 'rejected';
  }
  const stepIdx = HAPPY_PATH.findIndex((s) => s.key === stepKey);
  const curIdx  = HAPPY_PATH.findIndex((s) => s.key === currentStatus);
  if (stepIdx < curIdx)  return 'completed';
  if (stepIdx === curIdx) return 'current';
  return 'pending';
}

function StepIcon({ state, icon }: { state: StepState; icon: string }) {
  if (state === 'completed') return <div className="step-icon step-icon--completed"><span>✓</span></div>;
  if (state === 'current')   return <div className="step-icon step-icon--current">{icon}</div>;
  if (state === 'rejected')  return <div className="step-icon step-icon--rejected">❌</div>;
  return <div className="step-icon step-icon--pending"><span>{icon}</span></div>;
}

function StepRow({ step, state }: { step: StatusStep; state: StepState }) {
  return (
    <div className="rejection-row">
      <StepIcon state={state} icon={step.icon} />
      <div className="rejection-content">
        <p className="step-name step-name--active">{step.label}</p>
        <p className="step-description">{step.description}</p>
      </div>
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

  const displayTicket = status?.ticketNumber ?? ticketNumber ?? '—';
  const displayRefund = status?.totalRefund ?? totalRefund;
  const currentStatus = status?.status ?? 'ENVIADA';
  const isRejected    = currentStatus === 'RECHAZADA';

  if (loading) {
    return <div className="tracking-loading">Cargando estado...</div>;
  }

  return (
    <div className="tracking-page">
      <div className="tracking-container">

        {/* Cabecera */}
        <div className="status-header-card">
          <div className="status-header-top">
            <div>
              <p className="ticket-label">Número de ticket</p>
              <p className="ticket-number">{displayTicket}</p>
            </div>
            {isRejected ? (
              <span className="status-badge status-badge--rejected">Rechazada</span>
            ) : currentStatus === 'COMPLETADA' ? (
              <span className="status-badge status-badge--completed">Completada</span>
            ) : (
              <span className="status-badge status-badge--active">En proceso</span>
            )}
          </div>

          <div className="status-data-grid">
            <div className="status-stat">
              <p className="status-stat-label">Total a reembolsar</p>
              <p className="status-stat-value">${displayRefund.toLocaleString('es-CO')}</p>
            </div>
            {status?.refundMethod && (
              <div className="status-stat">
                <p className="status-stat-label">Método de reembolso</p>
                <p className="status-stat-value">{REFUND_LABELS[status.refundMethod] ?? status.refundMethod}</p>
              </div>
            )}
            {status?.deliveryMethod && (
              <div className="status-stat">
                <p className="status-stat-label">Método de entrega</p>
                <p className="status-stat-value">{DELIVERY_LABELS[status.deliveryMethod] ?? status.deliveryMethod}</p>
              </div>
            )}
            {status?.submittedAt && (
              <div className="status-stat">
                <p className="status-stat-label">Enviada el</p>
                <p className="status-stat-value">
                  {new Date(status.submittedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stepper */}
        <div className="stepper-card">
          <h2 className="stepper-title">Estado de tu devolución</h2>

          {isRejected ? (
            <div className="rejected-steps">
              {HAPPY_PATH.slice(0, 2).map((step) => (
                <StepRow key={step.key} step={step} state="completed" />
              ))}
              <div className="rejection-row">
                <StepIcon state="rejected" icon="❌" />
                <div className="rejection-content">
                  <p className="rejection-title">Rechazada</p>
                  <p className="rejection-subtitle">Tu solicitud no cumplió los requisitos de devolución.</p>
                  {status?.history.find(h => h.status === 'RECHAZADA')?.notes && (
                    <p className="rejection-note">
                      {status.history.find(h => h.status === 'RECHAZADA')!.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="stepper-list">
              {HAPPY_PATH.map((step, idx) => {
                const state = getStepState(step.key, currentStatus);
                return (
                  <div key={step.key} className="step-row">
                    <div className="step-col-icon">
                      <StepIcon state={state} icon={step.icon} />
                      {idx < HAPPY_PATH.length - 1 && (
                        <div className={`step-connector-line ${state === 'completed' ? 'step-connector-line--done' : 'step-connector-line--pending'}`} />
                      )}
                    </div>
                    <div className={`step-content ${idx === HAPPY_PATH.length - 1 ? 'step-content--last' : ''}`}>
                      <p className={`step-name ${state === 'pending' ? 'step-name--pending' : 'step-name--active'}`}>
                        {step.label}
                      </p>
                      {state !== 'pending' && (
                        <p className="step-description">{step.description}</p>
                      )}
                      {state === 'current' && (
                        <span className="step-current-badge">Estado actual</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {error && <p className="tracking-error">{error}</p>}

        <div className="tracking-actions">
          <button onClick={() => { resetReturn(); navigate('/paso-2'); }} className="tracking-btn-primary">
            Iniciar otra devolución
          </button>
          <button onClick={() => navigate('/paso-2')} className="tracking-btn-secondary">
            Volver a mis productos
          </button>
        </div>
      </div>
    </div>
  );
}
