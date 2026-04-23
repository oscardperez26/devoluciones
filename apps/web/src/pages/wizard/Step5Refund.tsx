import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StepIndicator from '@/components/wizard/StepIndicator';
import { setRefundMethod, submitReturn } from '@/api/returns.api';
import { useWizardStore } from '@/store/wizard.store';

const OPTIONS = [
  { code: 'TARJETA_REGALO', icon: '🎁', label: 'Tarjeta regalo', desc: 'Tarjeta digital enviada al correo. Disponible en ≈ 1 día hábil.' },
  { code: 'MERCADOPAGO', icon: '💳', label: 'Mercado Pago', desc: 'Transferencia a tu cuenta MP. ≈ 2 días hábiles.' },
  { code: 'MEDIO_ORIGINAL', icon: '🔄', label: 'Medio original', desc: 'Crédito a tu método de pago original. Puede tardar hasta 30 días.' },
];

export default function Step5Refund() {
  const navigate = useNavigate();
  const { returnId, setRefundMethod: storeSetRefund, setConfirmation } = useWizardStore();
  const [selected, setSelected] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!selected || !returnId) return;
    setError('');
    setSaving(true);
    try {
      await setRefundMethod(returnId, selected);
      storeSetRefund(selected);
      const result = await submitReturn(returnId);
      setConfirmation(result.ticketNumber, result.totalRefund, result.confirmationEmail);
      navigate('/confirmacion');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(msg ? `Error: ${msg}` : 'Error al procesar la solicitud. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <StepIndicator current={5} />
        <h2 className="text-xl font-bold text-[#111827] mb-2">Método de reembolso</h2>
        <p className="text-sm text-gray-500 mb-6">¿Cómo prefieres recibir tu dinero?</p>

        <div className="space-y-3 mb-6">
          {OPTIONS.map((opt) => (
            <button
              key={opt.code}
              type="button"
              onClick={() => setSelected(opt.code)}
              className={`w-full p-4 rounded-xl border-2 text-left flex gap-4 items-start transition-colors ${
                selected === opt.code ? 'border-[#111827] bg-gray-50' : 'border-gray-200 hover:border-gray-400 bg-white'
              }`}
            >
              <span className="text-2xl flex-shrink-0">{opt.icon}</span>
              <div>
                <p className="font-semibold text-sm">{opt.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
              </div>
              <div className={`ml-auto mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                selected === opt.code ? 'border-[#111827] bg-[#111827]' : 'border-gray-300'
              }`}>
                {selected === opt.code && <span className="flex items-center justify-center h-full text-white text-xs">✓</span>}
              </div>
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <button
          onClick={() => { void handleSubmit(); }}
          disabled={!selected || saving}
          className="w-full bg-[#111827] hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 transition-colors"
        >
          {saving ? 'Enviando solicitud...' : 'Enviar solicitud de devolución'}
        </button>
      </div>
    </div>
  );
}
