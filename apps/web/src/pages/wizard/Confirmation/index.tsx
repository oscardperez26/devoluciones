import './Confirmation.css';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '@/store/wizard.store';

export default function Confirmation() {
  const navigate = useNavigate();
  const { ticketNumber, totalRefund, confirmationEmail, returnId, resetReturn } = useWizardStore();

  function handleViewStatus() { navigate('/estado'); }
  function handleNewReturn() { resetReturn(); navigate('/paso-2'); }

  if (!ticketNumber) {
    return (
      <div className="confirm-empty">
        <div className="confirm-empty-inner">
          <p className="confirm-empty-text">No hay una solicitud activa.</p>
          <button onClick={() => navigate('/')} className="confirm-empty-link">Volver al inicio</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="confirm-page"
      style={{
        background: 'linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.5)), url(https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1600) center/cover no-repeat',
      }}
    >
      <div className="confirm-card">
        <div className="confirm-icon">✓</div>

        <h1 className="confirm-title">¡Solicitud enviada!</h1>
        <p className="confirm-subtitle">Hemos recibido tu solicitud de devolución.</p>

        <div className="confirm-summary">
          <div className="confirm-summary-row">
            <span className="confirm-summary-label">Número de ticket</span>
            <span className="confirm-summary-value">{ticketNumber}</span>
          </div>
          <div className="confirm-summary-row">
            <span className="confirm-summary-label">Total a reembolsar</span>
            <span className="confirm-summary-value confirm-summary-value--normal">
              ${totalRefund.toLocaleString('es-CO')}
            </span>
          </div>
          {confirmationEmail && (
            <div className="confirm-summary-row">
              <span className="confirm-summary-label">Confirmación a</span>
              <span className="confirm-summary-value confirm-summary-value--light">{confirmationEmail}</span>
            </div>
          )}
        </div>

        <p className="confirm-note">
          Nuestro equipo revisará tu solicitud en los próximos 3 días hábiles y recibirás una notificación por correo.
        </p>

        <div className="confirm-actions">
          {returnId && (
            <button onClick={handleViewStatus} className="confirm-btn-primary">
              Ver estado de mi devolución →
            </button>
          )}
          <button onClick={handleNewReturn} className="confirm-btn-secondary">
            Iniciar otra devolución
          </button>
        </div>
      </div>
    </div>
  );
}
