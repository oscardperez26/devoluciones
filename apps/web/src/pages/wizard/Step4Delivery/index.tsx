import './Step4Delivery.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorMessage, FormInput } from '@/components/ui';
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
  const [storeModalOpen, setStoreModalOpen] = useState(false);
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
    <div className="s4-root">

      {/* ── Header fijo ── */}
      <header className="s4-header">
        <div className="s4-header-inner">
          <StepIndicator current={4} />
        </div>
      </header>

      {/* ── Contenido scrolleable ── */}
      <main className="s4-body">

        <div className="s4-title-block">
          <h2 className="s4-title">Método de entrega</h2>
          <p className="s4-subtitle">¿Cómo nos entregas el producto?</p>
        </div>

        {/* Opciones de método */}
        <div className="s4-methods">
          {(['TIENDA', 'TRANSPORTADORA'] as Method[]).map((m) => {
            const isOn = method === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMethod(m);
                  if (m === 'TIENDA') setStoreModalOpen(true);
                }}
                className={`s4-method ${isOn ? 's4-method--on' : ''}`}
              >
                <span className="s4-method-icon">{m === 'TIENDA' ? '🏪' : '🚚'}</span>
                <p className="s4-method-name">
                  {m === 'TIENDA' ? 'Entrega en tienda' : 'Recogida en domicilio'}
                </p>
                <p className="s4-method-desc">
                  {m === 'TIENDA'
                    ? 'Lleva el producto a nuestra tienda más cercana'
                    : 'Una transportadora recoge el paquete en tu dirección'}
                </p>
                {isOn && (
                  <span className="s4-method-badge">✓ Seleccionado</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tienda elegida — resumen clicable para cambiar */}
        {method === 'TIENDA' && selectedStore && (
          <button
            type="button"
            className="s4-store-summary"
            onClick={() => setStoreModalOpen(true)}
          >
            <span className="s4-store-summary-icon">🏪</span>
            <div className="s4-store-summary-info">
              <p className="s4-store-summary-name">{selectedStore.nombre}</p>
              <p className="s4-store-summary-addr">{selectedStore.direccion}</p>
              {selectedStore.horario && (
                <p className="s4-store-summary-hours">{selectedStore.horario}</p>
              )}
            </div>
            <span className="s4-store-summary-change">Cambiar ›</span>
          </button>
        )}

        {/* Detalle transportadora */}
        {method === 'TRANSPORTADORA' && (
          <div className="s4-card">
            <p className="s4-card-label">Dirección de recogida</p>
            <div className="s4-address-form">
              {ADDRESS_FIELDS.map(({ field, label }) => (
                <FormInput
                  key={field}
                  label={label}
                  value={addr[field]}
                  onChange={(v) => handleAddrChange(field, v)}
                />
              ))}
            </div>
          </div>
        )}

        {error && <ErrorMessage message={error} />}

      </main>

      {/* ── Barra inferior fija ── */}
      <div className="s4-action-bar">
        <div className="s4-action-inner">
          <button
            type="button"
            className="s4-back-btn"
            onClick={() => navigate('/paso-3')}
          >
            <svg viewBox="0 0 20 20" fill="none" className="s4-back-svg">
              <path d="M12 15l-5-5 5-5" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Volver
          </button>

          <div className="s4-action-info">
            {!method && (
              <span className="s4-action-hint">Selecciona un método de entrega</span>
            )}
            {method === 'TIENDA' && !selectedStore && (
              <span className="s4-action-hint">Elige la tienda más cercana</span>
            )}
            {method === 'TIENDA' && selectedStore && (
              <span className="s4-action-ready">✓ {selectedStore.nombre}</span>
            )}
            {method === 'TRANSPORTADORA' && (
              <span className="s4-action-hint">Completa tu dirección de recogida</span>
            )}
          </div>

          <button
            type="button"
            disabled={!method || saving || (method === 'TIENDA' && !selectedStore)}
            className="s4-continue-btn"
            onClick={() => { void handleContinue(); }}
          >
            {saving ? 'Guardando...' : 'Continuar →'}
          </button>
        </div>
      </div>

      {/* Modal de selección de tienda */}
      {storeModalOpen && (
        <StorePicker
          onSelect={(store) => { setSelectedStore(store); }}
          onClose={() => setStoreModalOpen(false)}
          selectedStoreId={selectedStore?.id ?? null}
        />
      )}

    </div>
  );
}
