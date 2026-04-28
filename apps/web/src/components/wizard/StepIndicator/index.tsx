import './StepIndicator.css';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '@/store/wizard.store';

const STEPS = ['Acceso', 'Productos', 'Resumen', 'Entrega', 'Reembolso'];

export default function StepIndicator({ current }: { current: number }) {
  const navigate = useNavigate();
  const { reset } = useWizardStore();

  function handleLogout() {
    reset();
    navigate('/');
  }

  return (
    <div className="step-indicator">
      <div className="step-dots">
        {STEPS.map((label, i) => {
          const step = i + 1;
          const active = step === current;
          const done = step < current;
          return (
            <div key={step} className="step-item">
              <div className="step-dot-wrapper">
                <div className={`step-dot ${active ? 'step-dot--active' : done ? 'step-dot--done' : 'step-dot--pending'}`}>
                  {done ? '✓' : step}
                </div>
                <span className={`step-label ${active ? 'step-label--active' : 'step-label--pending'}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`step-connector ${done ? 'step-connector--done' : 'step-connector--pending'}`} />
              )}
            </div>
          );
        })}
      </div>
      <button onClick={handleLogout} className="step-logout">
        Cerrar sesión
      </button>
    </div>
  );
}
