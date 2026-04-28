import './Step1Entry.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startSession } from '@/api/access.api';
import { useWizardStore } from '@/store/wizard.store';

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
    <div
      className="entry-page"
      style={{
        background: 'linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.5)), url(https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1600) center/cover no-repeat',
      }}
    >
      <div className="entry-card">
        <h1 className="entry-title">Devoluciones</h1>
        <p className="entry-subtitle">Ingresa tu número de pedido y correo para continuar.</p>

        <form onSubmit={(e) => { void handleSubmit(e); }} className="entry-form">
          <div className="entry-field">
            <label className="entry-label">Número de pedido</label>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Ej. PM-2024-001"
              className="entry-input"
            />
          </div>
          <div className="entry-field">
            <label className="entry-label">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="entry-input"
            />
          </div>
          {error && <p className="entry-error">{error}</p>}
          <button type="submit" disabled={loading} className="entry-btn">
            {loading ? 'Verificando...' : 'Continuar'}
          </button>
        </form>
      </div>
    </div>
  );
}
