import './Step3Agreement.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PrimaryButton, StepCard, StepSubtitle, StepTitle, WizardPage } from '@/components/ui';
import StepIndicator from '@/components/wizard/StepIndicator';
import { useWizardStore } from '@/store/wizard.store';

const REASON_LABELS: Record<string, string> = {
  SIZE_SMALL: 'Demasiado pequeño', SIZE_LARGE: 'Demasiado grande',
  NOT_EXPECTED: 'No es lo que esperaba', LATE_DELIVERY: 'Retraso — ya no lo quiero',
  WRONG_ITEM: 'Artículo errado', SEAM_DEFECT: 'Defecto de costura',
  SHRUNK: 'Se encogió', COLOR_LOSS: 'Perdió el color',
};

export default function Step3Agreement() {
  const navigate = useNavigate();
  const { selectedItems, goToStep } = useWizardStore();
  const [accepted, setAccepted] = useState(false);

  return (
    <WizardPage>
      <StepIndicator current={3} />
      <StepTitle>Resumen de tu devolución</StepTitle>
      <StepSubtitle>Revisa los productos y acepta los términos para continuar.</StepSubtitle>

      <StepCard>
        <div className="summary-items">
          {selectedItems.map((item) => (
            <div key={item.orderItemId} className="summary-item">
              <div>
                <p className="summary-item-name">{item.productName ?? item.orderItemId}</p>
                <p className="summary-item-reason">
                  {item.reasonCodes.map((c) => REASON_LABELS[c] ?? c).join(' · ')}
                </p>
              </div>
              <span className="summary-item-qty">×{item.quantity}</span>
            </div>
          ))}
        </div>
      </StepCard>

      <div className="conditions-box">
        <p className="conditions-title">Condiciones de devolución</p>
        <ul className="conditions-list">
          <li>El producto debe estar sin usar, con etiquetas originales.</li>
          <li>El reembolso se procesa una vez recibamos el producto.</li>
          <li>Los plazos de reembolso dependen del método seleccionado.</li>
        </ul>
      </div>

      <label className="accept-row">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="accept-checkbox"
        />
        <span className="accept-text">Acepto las condiciones de devolución y confirmo que la información es correcta.</span>
      </label>

      <PrimaryButton
        disabled={!accepted}
        onClick={() => { goToStep(4); navigate('/paso-4'); }}
      >
        Continuar →
      </PrimaryButton>
    </WizardPage>
  );
}
