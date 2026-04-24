import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StepIndicator from '@/components/wizard/StepIndicator';
import { setRefundMethod, submitReturn } from '@/api/returns.api';
import { useWizardStore } from '@/store/wizard.store';

export default function Step5Refund() {
  const navigate = useNavigate();
  const { returnId, setRefundMethod: storeSetRefund, setConfirmation } = useWizardStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!returnId) return;
    setError('');
    setSaving(true);
    try {
      await setRefundMethod(returnId, 'TARJETA_REGALO');
      storeSetRefund('TARJETA_REGALO');
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
        <p className="text-sm text-gray-500 mb-6">Tu reembolso se procesará mediante bono Ogloba.</p>

        <div className="bg-white rounded-xl border-2 border-[#111827] p-5 flex gap-4 items-start mb-6">
          <span className="text-3xl flex-shrink-0">🎁</span>
          <div className="flex-1">
            <p className="font-semibold text-sm text-[#111827]">Tarjeta regalo (Bono Ogloba)</p>
            <p className="text-xs text-gray-500 mt-1">Tarjeta digital enviada al correo. Disponible en ≈ 1 día hábil.</p>
          </div>
          <div className="w-5 h-5 rounded-full border-2 border-[#111827] bg-[#111827] flex-shrink-0 flex items-center justify-center mt-0.5">
            <span className="text-white text-xs">✓</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <button
          onClick={() => { void handleSubmit(); }}
          disabled={saving}
          className="w-full bg-[#111827] hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 transition-colors"
        >
          {saving ? 'Enviando solicitud...' : 'Enviar solicitud de devolución'}
        </button>
      </div>
    </div>
  );
}
