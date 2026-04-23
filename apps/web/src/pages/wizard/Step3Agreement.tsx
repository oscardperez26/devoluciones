import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="min-h-screen bg-[#F9FAFB] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <StepIndicator current={3} />

        <h2 className="text-xl font-bold text-[#111827] mb-2">Resumen de tu devolución</h2>
        <p className="text-sm text-gray-500 mb-6">Revisa los productos y acepta los términos para continuar.</p>

        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 space-y-3">
          {selectedItems.map((item) => (
            <div key={item.orderItemId} className="flex justify-between items-start text-sm border-b border-gray-50 pb-3 last:border-0 last:pb-0">
              <div>
                <p className="font-medium text-[#111827]">{item.orderItemId}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.reasonCodes.map((c) => REASON_LABELS[c] ?? c).join(' · ')}
                </p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">×{item.quantity}</span>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
          <p className="font-medium mb-2">Condiciones de devolución</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>El producto debe estar sin usar, con etiquetas originales.</li>
            <li>El reembolso se procesa una vez recibamos el producto.</li>
            <li>Los plazos de reembolso dependen del método seleccionado.</li>
          </ul>
        </div>

        <label className="flex items-start gap-3 cursor-pointer mb-6">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[#111827]"
          />
          <span className="text-sm text-gray-700">Acepto las condiciones de devolución y confirmo que la información es correcta.</span>
        </label>

        <button
          onClick={() => { goToStep(4); navigate('/paso-4'); }}
          disabled={!accepted}
          className="w-full bg-[#111827] hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 transition-colors"
        >
          Continuar →
        </button>
      </div>
    </div>
  );
}
