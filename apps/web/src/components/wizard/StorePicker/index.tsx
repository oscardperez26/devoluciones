import './StorePicker.css';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCities, getDepartments, getStores } from '@/api/stores.api';
import type { Store } from '@/types';

interface Props {
  onSelect: (store: Store) => void;
  onClose: () => void;
  selectedStoreId: string | null;
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" className="sp-close-svg">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function IconMap() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" className="sp-field-ico">
      <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13V7m0 13l6-3m-6-10l6-3m0 16l5.447-2.724A1 1 0 0021 16.382V5.618a1 1 0 00-1.447-.894L15 7m0 10V7" />
    </svg>
  );
}

function IconCity() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" className="sp-field-ico">
      <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" className="sp-item-ico">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" className="sp-clock-svg">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="sp-chevron"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
      <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function StorePicker({ onSelect, onClose, selectedStoreId }: Props) {
  const [dept, setDept] = useState('');
  const [city, setCity] = useState('');
  const [pending, setPending] = useState<Store | null>(null);
  const [deptOpen, setDeptOpen] = useState(true);
  const [cityOpen, setCityOpen] = useState(false);

  const { data: depts = [], isLoading: loadingDepts } = useQuery({
    queryKey: ['departments'], queryFn: getDepartments,
  });
  const { data: cities = [], isLoading: loadingCities } = useQuery({
    queryKey: ['cities', dept], queryFn: () => getCities(dept), enabled: !!dept,
  });
  const { data: stores = [], isLoading: loadingStores } = useQuery({
    queryKey: ['stores', dept, city], queryFn: () => getStores(dept, city), enabled: !!dept && !!city,
  });

  /* Cierra con Escape */
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  /* Bloquea scroll del body */
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  function selectDept(d: string) {
    setDept(d);
    setCity('');
    setPending(null);
    setDeptOpen(false);
    setCityOpen(true);
  }

  function selectCity(c: string) {
    setCity(c);
    setPending(null);
    setCityOpen(false);
  }

  function handleConfirm() {
    if (pending) { onSelect(pending); onClose(); }
  }

  return (
    <div className="sp-backdrop" onClick={onClose}>
      <div className="sp-sheet" onClick={(e) => e.stopPropagation()}>

        {/* Handle móvil */}
        <div className="sp-handle" />

        {/* Header */}
        <div className="sp-header">
          <p className="sp-header-title">Selecciona tu tienda</p>
          <button type="button" className="sp-close-btn" onClick={onClose}>
            <IconClose />
          </button>
        </div>

        {/* Cuerpo scrolleable */}
        <div className="sp-body">

          {/* ── Campo Departamento ── */}
          <div className="sp-field-block">
            <button
              type="button"
              className={`sp-field-header ${deptOpen ? 'sp-field-header--open' : ''}`}
              onClick={() => setDeptOpen((v) => !v)}
            >
              <span className="sp-field-icon-wrap"><IconMap /></span>
              <span className="sp-field-label">
                {dept ? <><span className="sp-field-value">{dept}</span></> : 'Departamento'}
              </span>
              {dept && !deptOpen && <span className="sp-field-check">✓</span>}
              <IconChevron open={deptOpen} />
            </button>

            {deptOpen && (
              <div className="sp-dropdown">
                {loadingDepts && <p className="sp-loading">Cargando…</p>}
                {depts.map((d) => (
                  <button key={d} type="button"
                    className={`sp-option ${dept === d ? 'sp-option--on' : ''}`}
                    onClick={() => selectDept(d)}>
                    <span className="sp-option-ico"><IconPin /></span>
                    <span className="sp-option-text">{d}</span>
                    {dept === d && <span className="sp-option-dot" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Campo Ciudad (aparece tras elegir depto) ── */}
          {dept && (
            <div className="sp-field-block">
              <button
                type="button"
                className={`sp-field-header ${cityOpen ? 'sp-field-header--open' : ''}`}
                onClick={() => setCityOpen((v) => !v)}
              >
                <span className="sp-field-icon-wrap"><IconCity /></span>
                <span className="sp-field-label">
                  {city ? <><span className="sp-field-value">{city}</span></> : 'Ciudad'}
                </span>
                {city && !cityOpen && <span className="sp-field-check">✓</span>}
                <IconChevron open={cityOpen} />
              </button>

              {cityOpen && (
                <div className="sp-dropdown">
                  {loadingCities && <p className="sp-loading">Cargando…</p>}
                  {cities.map((c) => (
                    <button key={c} type="button"
                      className={`sp-option ${city === c ? 'sp-option--on' : ''}`}
                      onClick={() => selectCity(c)}>
                      <span className="sp-option-ico"><IconPin /></span>
                      <span className="sp-option-text">{c}</span>
                      {city === c && <span className="sp-option-dot" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Tiendas (aparece tras elegir ciudad) ── */}
          {dept && city && (
            <div className="sp-stores-block">
              <p className="sp-stores-label">Tiendas disponibles en {city}</p>
              {loadingStores && <p className="sp-loading">Buscando tiendas…</p>}
              {!loadingStores && stores.length === 0 && (
                <p className="sp-empty">No hay tiendas disponibles en {city}.</p>
              )}
              <div className="sp-stores">
                {stores.map((store) => {
                  const isOn = pending?.id === store.id || selectedStoreId === store.id;
                  return (
                    <button key={store.id} type="button"
                      className={`sp-store ${isOn ? 'sp-store--on' : ''}`}
                      onClick={() => setPending(store)}>
                      <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="KOAJ" className="sp-store-logo" />
                      <div className="sp-store-info">
                        <p className="sp-store-name">{store.nombre}</p>
                        <p className="sp-store-addr">
                          <IconPin />{store.direccion}
                        </p>
                        {store.horario && (
                          <p className="sp-store-hours">
                            <IconClock />{store.horario}
                          </p>
                        )}
                      </div>
                      {isOn && (
                        <div className="sp-store-check">
                          <svg viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2"
                              strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer — confirmar */}
        <div className="sp-footer">
          {pending ? (
            <>
              <div className="sp-footer-info">
                <p className="sp-footer-name">{pending.nombre}</p>
                <p className="sp-footer-addr">{pending.direccion}</p>
              </div>
              <button type="button" className="sp-confirm-btn" onClick={handleConfirm}>
                Confirmar →
              </button>
            </>
          ) : (
            <p className="sp-footer-hint">
              {!dept ? 'Selecciona el departamento' : !city ? 'Selecciona la ciudad' : 'Elige una tienda para continuar'}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
