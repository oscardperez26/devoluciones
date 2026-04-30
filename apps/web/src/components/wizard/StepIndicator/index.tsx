import './StepIndicator.css';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '@/store/wizard.store';

const STEPS = [
  { label: 'Acceso' },
  { label: 'Productos' },
  { label: 'Resumen' },
  { label: 'Entrega' },
  { label: 'Reembolso' },
];

const BACK_ROUTES: Record<number, string> = {
  2: '/',
  3: '/paso-2',
  4: '/paso-3',
  5: '/paso-4',
};

const LOGO_SRC = `${import.meta.env.BASE_URL}favicon.svg`;

function IconCheck() {
  return (
    <svg viewBox="0 0 12 12" fill="none" className="si-check-svg">
      <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconArrowLeft() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="si-back-svg">
      <path d="M12 15l-5-5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function StepIndicator({ current }: { current: number }) {
  const navigate = useNavigate();
  const { reset } = useWizardStore();

  function handleLogout() {
    reset();
    navigate('/');
  }

  function handleBack() {
    const route = BACK_ROUTES[current];
    if (route) navigate(route);
  }

  const progress = ((current - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="si-root">

      {/* ── Logo ── */}
      <a href="#/" className="si-logo-link" aria-label="KOAJ inicio">
        <img src={LOGO_SRC} alt="KOAJ" className="si-logo" />
      </a>

      {/* ── Separador visual ── */}
      <div className="si-sep" />

      {/* ── Botón Volver ── */}
      {current > 1 ? (
        <button type="button" className="si-back" onClick={handleBack}>
          <IconArrowLeft />
          <span className="si-back-label">Volver</span>
        </button>
      ) : (
        <div className="si-back-ghost" />
      )}

      {/* ── Track completo (desktop ≥ 640px) ── */}
      <div className="si-track">
        {STEPS.map(({ label }, i) => {
          const step = i + 1;
          const active = step === current;
          const done = step < current;
          return (
            <div key={step} className="si-step">
              {/* Línea antes del dot */}
              {i > 0 && (
                <div className={`si-line ${done || active ? 'si-line--fill' : 'si-line--empty'}`} />
              )}

              {/* Dot + label */}
              <div className="si-step-col">
                <div className={`si-dot ${active ? 'si-dot--active' : done ? 'si-dot--done' : 'si-dot--pending'}`}>
                  {done ? <IconCheck /> : step}
                </div>
                <span className={`si-label ${active ? 'si-label--active' : done ? 'si-label--done' : 'si-label--pending'}`}>
                  {label}
                </span>
              </div>

              {/* Línea después del dot */}
              {i < STEPS.length - 1 && (
                <div className={`si-line ${done ? 'si-line--fill' : 'si-line--empty'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Track compacto (mobile < 640px) ── */}
      <div className="si-mobile-track">
        <div className="si-mobile-info">
          <span className="si-mobile-name">{STEPS[current - 1].label}</span>
          <span className="si-mobile-of">Paso {current} / {STEPS.length}</span>
        </div>
        <div className="si-mobile-bar">
          <div className="si-mobile-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* ── Cerrar sesión ── */}
      <button type="button" onClick={handleLogout} className="si-logout">
        Cerrar sesión
      </button>

    </div>
  );
}
