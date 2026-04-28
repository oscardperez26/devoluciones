import './Step5Refund.css';
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

      <div className="refund-option">
        <span className="refund-option-icon">🎁</span>
        <div className="refund-option-body">
          <p className="refund-option-title">Tarjeta regalo (Bono Ogloba)</p>
          <p className="refund-option-desc">Tarjeta digital enviada al correo. Disponible en ≈ 1 día hábil.</p>
        </div>
        <div className="refund-option-check">
          <span className="refund-option-check-mark">✓</span>
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
