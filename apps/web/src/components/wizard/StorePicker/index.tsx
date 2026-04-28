import './StorePicker.css';
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

  const { data: depts = [] } = useQuery({ queryKey: ['departments'], queryFn: getDepartments });
  const { data: cities = [] } = useQuery({ queryKey: ['cities', dept], queryFn: () => getCities(dept), enabled: !!dept });
  const { data: stores = [] } = useQuery({ queryKey: ['stores', dept, city], queryFn: () => getStores(dept, city), enabled: !!dept && !!city });

  useEffect(() => { setCity(''); }, [dept]);

  return (
    <div className="store-picker">
      <select value={dept} onChange={(e) => setDept(e.target.value)} className="store-select">
        <option value="">Selecciona departamento</option>
        {depts.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>

      {dept && (
        <select value={city} onChange={(e) => setCity(e.target.value)} className="store-select">
          <option value="">Selecciona ciudad</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      )}

      {stores.length > 0 && (
        <div className="store-list">
          {stores.map((store) => (
            <button
              key={store.id}
              type="button"
              onClick={() => onSelect(store)}
              className={`store-option ${selectedStoreId === store.id ? 'store-option--selected' : ''}`}
            >
              <p className="store-name">{store.nombre}</p>
              <p className="store-address">{store.direccion}</p>
              {store.horario && <p className="store-hours">{store.horario}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
