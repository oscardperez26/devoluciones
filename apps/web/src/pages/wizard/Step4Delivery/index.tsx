import './Step4Delivery.css';
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

      <div className="delivery-methods">
        {(['TIENDA', 'TRANSPORTADORA'] as Method[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            className={`delivery-method-btn ${method === m ? 'delivery-method-btn--selected' : ''}`}
          >
            <span className="delivery-method-icon">{m === 'TIENDA' ? '🏪' : '🚚'}</span>
            <p className="delivery-method-name">{m === 'TIENDA' ? 'Entrega en tienda' : 'Recogida en domicilio'}</p>
            <p className="delivery-method-desc">
              {m === 'TIENDA' ? 'Lleva el producto a nuestra tienda más cercana' : 'Una transportadora recoge el paquete en tu dirección'}
            </p>
          </button>
        ))}
      </div>

      {method === 'TIENDA' && (
        <StepCard>
          <p className="address-section-label">Selecciona la tienda</p>
          <StorePicker onSelect={setSelectedStore} selectedStoreId={selectedStore?.id ?? null} />
        </StepCard>
      )}

      {method === 'TRANSPORTADORA' && (
        <StepCard>
          <p className="address-section-label">Dirección de recogida</p>
          <div className="address-form">
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
