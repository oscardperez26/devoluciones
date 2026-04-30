import './StorePicker.css';
import { useEffect, useRef, useState } from 'react';
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

function IconBack() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="sp-back-svg">
      <path d="M12 15l-5-5 5-5" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" className="sp-pin-svg">
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

type Step = 'dept' | 'city' | 'store';

export default function StorePicker({ onSelect, onClose, selectedStoreId }: Props) {
  const [step, setStep] = useState<Step>('dept');
  const [dept, setDept] = useState('');
  const [city, setCity] = useState('');
  const [pending, setPending] = useState<Store | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

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

  /* Scroll al inicio al cambiar de paso */
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  function selectDept(d: string) {
    setDept(d);
    setCity('');
    setPending(null);
    setStep('city');
  }

  function selectCity(c: string) {
    setCity(c);
    setPending(null);
    setStep('store');
  }

  function handleConfirm() {
    if (pending) { onSelect(pending); onClose(); }
  }

  /* Título y breadcrumb */
  const titles: Record<Step, string> = {
    dept:  'Selecciona el departamento',
    city:  'Selecciona la ciudad',
    store: 'Elige tu tienda',
  };

  return (
    <div className="sp-backdrop" onClick={onClose}>
      <div className="sp-sheet" onClick={(e) => e.stopPropagation()}>

        {/* Handle móvil */}
        <div className="sp-handle" />

        {/* Header */}
        <div className="sp-header">
          <div className="sp-header-left">
            {step !== 'dept' && (
              <button type="button" className="sp-back-btn"
                onClick={() => setStep(step === 'city' ? 'dept' : 'city')}>
                <IconBack />
              </button>
            )}
            <div>
              <p className="sp-header-title">{titles[step]}</p>
              {(dept || city) && (
                <p className="sp-breadcrumb">
                  {dept}{city ? ` › ${city}` : ''}
                </p>
              )}
            </div>
          </div>
          <button type="button" className="sp-close-btn" onClick={onClose}>
            <IconClose />
          </button>
        </div>

        {/* Progreso de pasos */}
        <div className="sp-steps">
          {(['dept', 'city', 'store'] as Step[]).map((s, i) => (
            <div key={s} className={`sp-step-item ${step === s ? 'sp-step-item--active' : (step === 'city' && s === 'dept') || step === 'store' ? 'sp-step-item--done' : ''}`}>
              <div className="sp-step-dot">
                {((step === 'city' && s === 'dept') || step === 'store') && s !== step
                  ? '✓' : i + 1}
              </div>
              <span className="sp-step-label">
                {s === 'dept' ? 'Depto.' : s === 'city' ? 'Ciudad' : 'Tienda'}
              </span>
              {i < 2 && <div className={`sp-step-line ${step !== 'dept' && (i === 0 || step === 'store') ? 'sp-step-line--done' : ''}`} />}
            </div>
          ))}
        </div>

        {/* Cuerpo scrolleable */}
        <div className="sp-body" ref={bodyRef}>

          {/* PASO 1 — Departamentos */}
          {step === 'dept' && (
            <div className="sp-list">
              {loadingDepts && <p className="sp-loading">Cargando departamentos…</p>}
              {depts.map((d) => (
                <button key={d} type="button"
                  className={`sp-pill ${dept === d ? 'sp-pill--on' : ''}`}
                  onClick={() => selectDept(d)}>
                  {d}
                  <span className="sp-pill-arrow">›</span>
                </button>
              ))}
            </div>
          )}

          {/* PASO 2 — Ciudades */}
          {step === 'city' && (
            <div className="sp-list">
              {loadingCities && <p className="sp-loading">Cargando ciudades…</p>}
              {cities.map((c) => (
                <button key={c} type="button"
                  className={`sp-pill ${city === c ? 'sp-pill--on' : ''}`}
                  onClick={() => selectCity(c)}>
                  {c}
                  <span className="sp-pill-arrow">›</span>
                </button>
              ))}
            </div>
          )}

          {/* PASO 3 — Tiendas */}
          {step === 'store' && (
            <div className="sp-stores">
              {loadingStores && <p className="sp-loading">Buscando tiendas…</p>}
              {!loadingStores && stores.length === 0 && (
                <p className="sp-empty">No hay tiendas disponibles en {city}.</p>
              )}
              {stores.map((store) => {
                const isOn = pending?.id === store.id || selectedStoreId === store.id;
                return (
                  <button key={store.id} type="button"
                    className={`sp-store ${isOn ? 'sp-store--on' : ''}`}
                    onClick={() => setPending(store)}>
                    <div className="sp-store-icon">🏪</div>
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
          )}

        </div>

        {/* Footer — confirmar tienda */}
        {step === 'store' && (
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
              <p className="sp-footer-hint">Selecciona una tienda para continuar</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
