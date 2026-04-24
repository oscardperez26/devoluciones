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
  { key: 'ENVIADA',              label: 'Solicitud recibida',   description: 'Tu solicitud fue registrada exitosamente.',          icon: '📋' },
  { key: 'EN_REVISION',         label: 'En revisión',          description: 'Nuestro equipo está revisando tu solicitud.',        icon: '🔍' },
  { key: 'APROBADA',            label: 'Aprobada',             description: 'Tu devolución fue aprobada.',                        icon: '✅' },
  { key: 'PRODUCTO_RECIBIDO',   label: 'Producto recibido',    description: 'Recibimos el producto en nuestras instalaciones.',    icon: '📦' },
  { key: 'REEMBOLSO_EN_PROCESO',label: 'Reembolso en proceso', description: 'Estamos procesando tu reembolso.',                   icon: '💰' },
  { key: 'COMPLETADA',          label: 'Completada',           description: '¡Tu reembolso fue procesado exitosamente!',          icon: '🎉' },
];

const REFUND_LABELS: Record<string, string> = {
  TARJETA_REGALO:  'Tarjeta regalo',
  MERCADOPAGO:     'Mercado Pago',
  MEDIO_ORIGINAL:  'Medio original',
};

const DELIVERY_LABELS: Record<string, string> = {
  TIENDA:          'Entrega en tienda',
  TRANSPORTADORA:  'Recogida en domicilio',
};

function getStepState(stepKey: string, currentStatus: string): StepState {
  if (currentStatus === 'RECHAZADA') {
    const idx = HAPPY_PATH.findIndex((s) => s.key === stepKey);
    const rejectIdx = HAPPY_PATH.findIndex((s) => s.key === 'EN_REVISION');
    if (idx < rejectIdx) return 'completed';
    return 'rejected';
  }

  const stepIdx = HAPPY_PATH.findIndex((s) => s.key === stepKey);
  const curIdx  = HAPPY_PATH.findIndex((s) => s.key === currentStatus);
  if (stepIdx < curIdx)  return 'completed';
  if (stepIdx === curIdx) return 'current';
  return 'pending';
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

  const displayTicket  = status?.ticketNumber ?? ticketNumber ?? '—';
  const displayRefund  = status?.totalRefund ?? totalRefund;
  const currentStatus  = status?.status ?? 'ENVIADA';
  const isRejected     = currentStatus === 'RECHAZADA';

  function handleNewReturn() {
    resetReturn();
    navigate('/paso-2');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <p className="text-gray-500 animate-pulse">Cargando estado...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8 px-4">
      <div className="max-w-lg mx-auto">

        {/* Cabecera */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Número de ticket</p>
              <p className="text-xl font-bold text-[#111827]">{displayTicket}</p>
            </div>
            {isRejected ? (
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">Rechazada</span>
            ) : currentStatus === 'COMPLETADA' ? (
              <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">Completada</span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">En proceso</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-[#F9FAFB] rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Total a reembolsar</p>
              <p className="font-semibold text-[#111827]">${displayRefund.toLocaleString('es-CO')}</p>
            </div>
            {status?.refundMethod && (
              <div className="bg-[#F9FAFB] rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">Método de reembolso</p>
                <p className="font-semibold text-[#111827]">{REFUND_LABELS[status.refundMethod] ?? status.refundMethod}</p>
              </div>
            )}
            {status?.deliveryMethod && (
              <div className="bg-[#F9FAFB] rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">Método de entrega</p>
                <p className="font-semibold text-[#111827]">{DELIVERY_LABELS[status.deliveryMethod] ?? status.deliveryMethod}</p>
              </div>
            )}
            {status?.submittedAt && (
              <div className="bg-[#F9FAFB] rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">Enviada el</p>
                <p className="font-semibold text-[#111827]">
                  {new Date(status.submittedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stepper */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-5">Estado de tu devolución</h2>

          {isRejected ? (
            <div className="flex flex-col gap-4">
              {/* Steps before rejection */}
              {HAPPY_PATH.slice(0, 2).map((step) => (
                <StepRow key={step.key} step={step} state="completed" />
              ))}
              {/* Rejection step */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-red-100 border-2 border-red-500 flex items-center justify-center text-lg flex-shrink-0">
                    ❌
                  </div>
                </div>
                <div className="pt-1.5 pb-2">
                  <p className="font-semibold text-sm text-red-700">Rechazada</p>
                  <p className="text-xs text-gray-500 mt-0.5">Tu solicitud no cumplió los requisitos de devolución.</p>
                  {status?.history.find(h => h.status === 'RECHAZADA')?.notes && (
                    <p className="text-xs text-red-600 mt-1 bg-red-50 rounded-lg px-2 py-1">
                      {status.history.find(h => h.status === 'RECHAZADA')!.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-0">
              {HAPPY_PATH.map((step, idx) => {
                const state = getStepState(step.key, currentStatus);
                return (
                  <div key={step.key} className="flex gap-4">
                    {/* Icon + connector */}
                    <div className="flex flex-col items-center">
                      <StepIcon state={state} icon={step.icon} />
                      {idx < HAPPY_PATH.length - 1 && (
                        <div className={`w-0.5 flex-1 my-1 ${state === 'completed' ? 'bg-[#111827]' : 'bg-gray-200'}`} style={{ minHeight: 24 }} />
                      )}
                    </div>
                    {/* Content */}
                    <div className={`pb-5 pt-1.5 ${idx === HAPPY_PATH.length - 1 ? 'pb-0' : ''}`}>
                      <p className={`font-semibold text-sm ${state === 'pending' ? 'text-gray-400' : 'text-[#111827]'}`}>
                        {step.label}
                      </p>
                      {state !== 'pending' && (
                        <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                      )}
                      {state === 'current' && (
                        <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          Estado actual
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600 mb-4 text-center">{error}</p>}

        {/* Acciones */}
        <div className="space-y-3">
          <button
            onClick={handleNewReturn}
            className="w-full bg-[#111827] hover:bg-gray-800 text-white font-semibold rounded-xl py-3 transition-colors"
          >
            Iniciar otra devolución
          </button>
          <button
            onClick={() => navigate('/paso-2')}
            className="w-full border border-gray-300 hover:border-gray-400 text-gray-600 font-semibold rounded-xl py-3 transition-colors"
          >
            Volver a mis productos
          </button>
        </div>

      </div>
    </div>
  );
}

function StepIcon({ state, icon }: { state: StepState; icon: string }) {
  const base = 'w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 border-2 transition-colors';
  if (state === 'completed') return <div className={`${base} bg-[#111827] border-[#111827]`}><span className="text-white text-sm">✓</span></div>;
  if (state === 'current')   return <div className={`${base} bg-white border-[#111827] ring-4 ring-gray-100`}>{icon}</div>;
  if (state === 'rejected')  return <div className={`${base} bg-red-50 border-red-300`}>❌</div>;
  return <div className={`${base} bg-gray-50 border-gray-200`}><span className="text-gray-300">{icon}</span></div>;
}

function StepRow({ step, state }: { step: StatusStep; state: StepState }) {
  return (
    <div className="flex gap-4 pb-4">
      <StepIcon state={state} icon={step.icon} />
      <div className="pt-1.5">
        <p className="font-semibold text-sm text-[#111827]">{step.label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
      </div>
    </div>
  );
}
