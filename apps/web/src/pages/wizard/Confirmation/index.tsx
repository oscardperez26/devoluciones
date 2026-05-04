import './Confirmation.css';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '@/store/wizard.store';

const BG = 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1600';

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" className="cf-check-svg">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconTicket() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 5v2M15 11v2M15 17v2M5 5h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4V7a2 2 0 012-2z"/>
    </svg>
  );
}

function IconMoney() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  );
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" className="cf-note-ico">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

function IconArrow() {
  return (
    <svg viewBox="0 0 20 20" fill="none" width="18" height="18" style={{ flexShrink: 0 }}>
      <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function Confirmation() {
  const navigate = useNavigate();
  const { ticketNumber, totalRefund, confirmationEmail, returnId, resetReturn } = useWizardStore();

  function handleViewStatus() { navigate('/estado'); }
  function handleNewReturn()  { resetReturn(); navigate('/paso-2'); }

  if (!ticketNumber) {
    return (
      <div className="cf-empty">
        <div className="cf-empty-inner">
          <p className="cf-empty-text">No hay una solicitud activa.</p>
          <button onClick={() => navigate('/')} className="cf-empty-link">Volver al inicio</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="cf-page"
      style={{
        background: `linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.5)), url(${BG}) center/cover no-repeat`,
      }}
    >
      <div className="cf-card">

        {/* ── Hero ── */}
        <div className="cf-hero">
          <div className="cf-check-ring">
            <div className="cf-check-circle">
              <IconCheck />
            </div>
          </div>
          <h1 className="cf-hero-title">¡Solicitud enviada!</h1>
          <p className="cf-hero-sub">Hemos recibido tu solicitud de devolución y la estamos procesando.</p>
        </div>

        {/* ── Cuerpo ticket ── */}
        <div className="cf-body">

          {/* Borde perforado superior */}
          <div className="cf-ticket-edge">
            <div className="cf-ticket-circle" />
            <div className="cf-ticket-dash" />
            <div className="cf-ticket-circle" />
          </div>

          {/* Filas de datos */}
          <div className="cf-rows">
            <div className="cf-row">
              <div className="cf-row-icon cf-row-icon--purple"><IconTicket /></div>
              <div className="cf-row-info">
                <span className="cf-row-label">Número de ticket</span>
                <span className="cf-ticket-badge">{ticketNumber}</span>
              </div>
            </div>

            <div className="cf-row">
              <div className="cf-row-icon cf-row-icon--green"><IconMoney /></div>
              <div className="cf-row-info">
                <span className="cf-row-label">Total a reembolsar</span>
                <span className="cf-row-value cf-row-value--green">
                  ${totalRefund.toLocaleString('es-CO')}
                </span>
              </div>
            </div>

            {confirmationEmail && (
              <div className="cf-row">
                <div className="cf-row-icon cf-row-icon--blue"><IconMail /></div>
                <div className="cf-row-info">
                  <span className="cf-row-label">Confirmación enviada a</span>
                  <span className="cf-row-value">{confirmationEmail}</span>
                </div>
              </div>
            )}
          </div>

          {/* Nota de tiempo */}
          <div className="cf-note-box">
            <IconClock />
            <p className="cf-note-text">
              Nuestro equipo revisará tu solicitud en los próximos <strong>3 días hábiles</strong> y recibirás una notificación por correo.
            </p>
          </div>

          {/* Pasos siguientes */}
          <div className="cf-steps">
            <div className="cf-step">
              <div className="cf-step-left">
                <div className="cf-step-dot">1</div>
                <div className="cf-step-line" />
              </div>
              <div className="cf-step-content">
                <p className="cf-step-name">Revisión del equipo</p>
                <p className="cf-step-desc">Validamos los productos y documentos adjuntos.</p>
              </div>
            </div>
            <div className="cf-step">
              <div className="cf-step-left">
                <div className="cf-step-dot">2</div>
                <div className="cf-step-line" />
              </div>
              <div className="cf-step-content">
                <p className="cf-step-name">Aprobación y reembolso</p>
                <p className="cf-step-desc">Una vez aprobado se procesa el reembolso al método elegido.</p>
              </div>
            </div>
            <div className="cf-step">
              <div className="cf-step-left">
                <div className="cf-step-dot">3</div>
                <div className="cf-step-line" />
              </div>
              <div className="cf-step-content">
                <p className="cf-step-name">Notificación final</p>
                <p className="cf-step-desc">Te avisamos por correo cuando todo esté listo.</p>
              </div>
            </div>
          </div>

        </div>

        {/* ── Acciones ── */}
        <div className="cf-actions">
          {returnId && (
            <button onClick={handleViewStatus} className="cf-btn-primary">
              Ver estado de mi devolución <IconArrow />
            </button>
          )}
          <button onClick={handleNewReturn} className="cf-btn-secondary">
            Iniciar otra devolución
          </button>
        </div>

      </div>
    </div>
  );
}
