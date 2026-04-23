import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCities, getDepartments, getStores } from '@/api/stores.api';
import type { Store } from '@/types';

interface Props {
  onSelect: (store: Store) => void;
  selectedStoreId: string | null;
}

export default function StorePicker({ onSelect, selectedStoreId }: Props) {
  const [dept, setDept] = useState('');
  const [city, setCity] = useState('');

  const { data: depts = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  });

  const { data: cities = [] } = useQuery({
    queryKey: ['cities', dept],
    queryFn: () => getCities(dept),
    enabled: !!dept,
  });

  const { data: stores = [] } = useQuery({
    queryKey: ['stores', dept, city],
    queryFn: () => getStores(dept, city),
    enabled: !!dept && !!city,
  });

  useEffect(() => { setCity(''); }, [dept]);

  return (
    <div className="space-y-3">
      <select
        value={dept}
        onChange={(e) => setDept(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]"
      >
        <option value="">Selecciona departamento</option>
        {depts.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>

      {dept && (
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]"
        >
          <option value="">Selecciona ciudad</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      )}

      {stores.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {stores.map((store) => (
            <button
              key={store.id}
              type="button"
              onClick={() => onSelect(store)}
              className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                selectedStoreId === store.id
                  ? 'border-[#111827] bg-gray-50'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <p className="font-medium text-sm">{store.nombre}</p>
              <p className="text-xs text-gray-500">{store.direccion}</p>
              {store.horario && <p className="text-xs text-gray-400">{store.horario}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
