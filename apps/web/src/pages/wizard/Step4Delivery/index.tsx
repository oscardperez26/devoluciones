import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorMessage, FormInput, PrimaryButton, StepCard, StepSubtitle, StepTitle, WizardPage } from '@/components/ui';
import StorePicker from '@/components/wizard/StorePicker';
import StepIndicator from '@/components/wizard/StepIndicator';
import { setDeliveryCarrier as apiSetCarrier, setDeliveryStore as apiSetStore } from '@/api/returns.api';
import { useWizardStore } from '@/store/wizard.store';
import type { CarrierAddress, Store } from '@/types';

type Method = 'TIENDA' | 'TRANSPORTADORA';

const emptyAddress: CarrierAddress = {
  fullName: '', address: '', city: '', department: '', phone: '', documentId: '',
};

const ADDRESS_FIELDS: { field: keyof CarrierAddress; label: string }[] = [
  { field: 'fullName',   label: 'Nombre completo' },
  { field: 'documentId', label: 'Número de documento' },
  { field: 'phone',      label: 'Teléfono de contacto' },
  { field: 'address',    label: 'Dirección' },
  { field: 'city',       label: 'Ciudad' },
  { field: 'department', label: 'Departamento' },
];

export default function Step4Delivery() {
  const navigate = useNavigate();
  const { returnId, setDeliveryStore: storeDelivery, setDeliveryCarrier: storeSetCarrier, goToStep } = useWizardStore();
  const [method, setMethod] = useState<Method | null>(null);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [addr, setAddr] = useState<CarrierAddress>(emptyAddress);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleAddrChange(field: keyof CarrierAddress, value: string) {
    setAddr((prev) => ({ ...prev, [field]: value }));
  }

  async function handleContinue() {
    if (!returnId) return;
    setError('');
    setSaving(true);
    try {
      if (method === 'TIENDA') {
        if (!selectedStore) { setError('Selecciona una tienda.'); setSaving(false); return; }
        await apiSetStore(returnId, selectedStore.id);
        storeDelivery(selectedStore.id);
      } else {
        if (ADDRESS_FIELDS.some(({ field }) => !addr[field].trim())) {
          setError('Completa todos los campos de la dirección.'); setSaving(false); return;
        }
        await apiSetCarrier(returnId, addr);
        storeSetCarrier(addr);
      }
      goToStep(5);
      navigate('/paso-5');
    } catch {
      setError('Error al guardar el método de entrega. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <WizardPage>
      <StepIndicator current={4} />
      <StepTitle>Método de entrega</StepTitle>
      <StepSubtitle>¿Cómo nos entregas el producto?</StepSubtitle>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {(['TIENDA', 'TRANSPORTADORA'] as Method[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            className={`p-4 rounded-xl border-2 text-left transition-colors ${
              method === m ? 'border-[#111827] bg-gray-50' : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <p className="text-2xl mb-1">{m === 'TIENDA' ? '🏪' : '🚚'}</p>
            <p className="font-semibold text-sm">{m === 'TIENDA' ? 'Entrega en tienda' : 'Recogida en domicilio'}</p>
            <p className="text-xs text-gray-500 mt-1">
              {m === 'TIENDA' ? 'Lleva el producto a nuestra tienda más cercana' : 'Una transportadora recoge el paquete en tu dirección'}
            </p>
          </button>
        ))}
      </div>

      {method === 'TIENDA' && (
        <StepCard className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Selecciona la tienda</p>
          <StorePicker onSelect={setSelectedStore} selectedStoreId={selectedStore?.id ?? null} />
        </StepCard>
      )}

      {method === 'TRANSPORTADORA' && (
        <StepCard className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Dirección de recogida</p>
          <div className="space-y-3">
            {ADDRESS_FIELDS.map(({ field, label }) => (
              <FormInput
                key={field}
                label={label}
                value={addr[field]}
                onChange={(v) => handleAddrChange(field, v)}
              />
            ))}
          </div>
        </StepCard>
      )}

      <ErrorMessage message={error} />

      <PrimaryButton
        disabled={!method || saving}
        onClick={() => { void handleContinue(); }}
      >
        {saving ? 'Guardando...' : 'Continuar →'}
      </PrimaryButton>
    </WizardPage>
  );
}
