import './Step1Entry.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startSession } from '@/api/access.api';
import { useWizardStore } from '@/store/wizard.store';

const BG_IMAGE =
  'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1600';

function IconBox({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}

function IconCheck({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconLock({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function IconMail({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

function IconDoc({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function IconHeadset({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </svg>
  );
}

function IconMenu({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

export default function Step1Entry() {
  const navigate = useNavigate();
  const setSession = useWizardStore((s) => s.setSession);
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!orderNumber.trim() || !email.trim()) {
      setError('Completa todos los campos.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await startSession(orderNumber.trim(), email.trim().toLowerCase());
      setSession(res.sessionToken, res.expiresAt, res.order.id);
      navigate('/paso-2');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string }; message?: string } } })
          ?.response?.data?.error?.message ??
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'No encontramos un pedido con ese número y correo.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="e-root">
      {/* ── Mobile top bar ── */}
      <header className="e-mobile-bar">
        <span className="e-logo-text">KOAJ</span>
        <button className="e-menu-btn" aria-label="Menú">
          <IconMenu className="e-menu-icon" />
        </button>
      </header>

      <div className="e-layout">
        {/* ── LEFT PANEL ── */}
        <div
          className="e-left"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)), url(${BG_IMAGE})`,
          }}
        >
          <div className="e-left-inner">
            <div className="e-brand">
              <span className="e-logo-text">KOAJ</span>
              <span className="e-brand-bar" />
            </div>

            <div className="e-hero">
              <h1 className="e-hero-title">
                Devoluciones<br />
                <span className="e-hero-accent">fáciles y rápidas</span>
              </h1>
              <p className="e-hero-desc">
                Ingresa tu número de pedido y correo
                electrónico para continuar con tu proceso
                de devolución.
              </p>
            </div>

            <ul className="e-features">
              <li className="e-feature">
                <span className="e-feature-icon"><IconBox className="e-feat-svg" /></span>
                <div>
                  <p className="e-feature-title">Proceso sencillo</p>
                  <p className="e-feature-sub">Completa el formulario y sigue los pasos.</p>
                </div>
              </li>
              <li className="e-feature">
                <span className="e-feature-icon"><IconCheck className="e-feat-svg" /></span>
                <div>
                  <p className="e-feature-title">Seguimiento en línea</p>
                  <p className="e-feature-sub">Conoce el estado de tu devolución.</p>
                </div>
              </li>
              <li className="e-feature">
                <span className="e-feature-icon"><IconLock className="e-feat-svg" /></span>
                <div>
                  <p className="e-feature-title">Información segura</p>
                  <p className="e-feature-sub">Tus datos están protegidos.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="e-right">
          <div className="e-right-inner">
            {/* Form card */}
            <div className="e-card">
              <div className="e-card-icon-wrap">
                <IconBox className="e-card-icon" />
              </div>
              <h2 className="e-card-title">Inicia tu devolución</h2>
              <p className="e-card-subtitle">
                Ingresa los datos de tu pedido para validar
                tu compra y continuar.
              </p>

              <form onSubmit={(e) => { void handleSubmit(e); }} className="e-form">
                <div className="e-field">
                  <label className="e-label">Número de pedido</label>
                  <div className="e-input-wrap">
                    <IconDoc className="e-input-icon" />
                    <input
                      type="text"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="Ej. PM-2024-001"
                      className="e-input"
                    />
                  </div>
                </div>

                <div className="e-field">
                  <label className="e-label">Correo electrónico</label>
                  <div className="e-input-wrap">
                    <IconMail className="e-input-icon" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="e-input"
                    />
                  </div>
                </div>

                {error && <p className="e-error">{error}</p>}

                <button type="submit" disabled={loading} className="e-btn">
                  {loading ? 'Verificando...' : 'Continuar'}
                </button>
              </form>

              <p className="e-secure">
                <IconLock className="e-secure-icon" />
                Tu información está protegida
              </p>
            </div>

            {/* Help banner */}
            <div className="e-help">
              <IconHeadset className="e-help-icon" />
              <div>
                <p className="e-help-title">¿Necesitas ayuda?</p>
                <p className="e-help-sub">
                  Escríbenos a{' '}
                  <a href="mailto:servicioalcliente@koaj.co" className="e-help-link">
                    servicioalcliente@koaj.co
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="e-footer">
            <span className="e-footer-logo">KOAJ</span>
            <span className="e-footer-copy">© 2024 KOAJ. Todos los derechos reservados.</span>
            <div className="e-footer-links">
              <a href="#" className="e-footer-link">Términos y condiciones</a>
              <span className="e-footer-sep">|</span>
              <a href="#" className="e-footer-link">Política de privacidad</a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
