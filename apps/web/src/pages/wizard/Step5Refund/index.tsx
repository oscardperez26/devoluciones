import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorMessage, PrimaryButton, StepSubtitle, StepTitle, WizardPage } from '@/components/ui';
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
    <WizardPage>
      <StepIndicator current={5} />
      <StepTitle>Método de reembolso</StepTitle>
      <StepSubtitle>Tu reembolso se procesará mediante bono Ogloba.</StepSubtitle>

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

      <ErrorMessage message={error} />

      <PrimaryButton
        disabled={saving}
        onClick={() => { void handleSubmit(); }}
      >
        {saving ? 'Enviando solicitud...' : 'Enviar solicitud de devolución'}
      </PrimaryButton>
    </WizardPage>
  );
}
