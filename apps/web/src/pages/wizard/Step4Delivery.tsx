import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StorePicker from '@/components/wizard/StorePicker';
import StepIndicator from '@/components/wizard/StepIndicator';
import { setDeliveryCarrier as apiSetCarrier, setDeliveryStore as apiSetStore } from '@/api/returns.api';
import { useWizardStore } from '@/store/wizard.store';
import type { CarrierAddress, Store } from '@/types';

type Method = 'TIENDA' | 'TRANSPORTADORA';

const emptyAddress: CarrierAddress = {
  fullName: '', address: '', city: '', department: '', phone: '', documentId: '',
};

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
        const required: (keyof CarrierAddress)[] = ['fullName', 'address', 'city', 'department', 'phone', 'documentId'];
        if (required.some((k) => !addr[k].trim())) { setError('Completa todos los campos de la dirección.'); setSaving(false); return; }
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
    <div className="min-h-screen bg-[#F9FAFB] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <StepIndicator current={4} />
        <h2 className="text-xl font-bold text-[#111827] mb-2">Método de entrega</h2>
        <p className="text-sm text-gray-500 mb-6">¿Cómo nos entregas el producto?</p>

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
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Selecciona la tienda</p>
            <StorePicker onSelect={setSelectedStore} selectedStoreId={selectedStore?.id ?? null} />
          </div>
        )}

        {method === 'TRANSPORTADORA' && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Dirección de recogida</p>
            <div className="space-y-3">
              {[
                { field: 'fullName' as const, label: 'Nombre completo' },
                { field: 'documentId' as const, label: 'Número de documento' },
                { field: 'phone' as const, label: 'Teléfono de contacto' },
                { field: 'address' as const, label: 'Dirección' },
                { field: 'city' as const, label: 'Ciudad' },
                { field: 'department' as const, label: 'Departamento' },
              ].map(({ field, label }) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input
                    type="text"
                    value={addr[field]}
                    onChange={(e) => handleAddrChange(field, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <button
          onClick={() => { void handleContinue(); }}
          disabled={!method || saving}
          className="w-full bg-[#111827] hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 transition-colors"
        >
          {saving ? 'Guardando...' : 'Continuar →'}
        </button>
      </div>
    </div>
  );
}
