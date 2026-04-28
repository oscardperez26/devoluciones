import './AdminLogin.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '@/api/admin.api';
import { AdminButton, AdminInput } from '@/components/admin/ui';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await adminLogin(email, password);
      localStorage.setItem('admin_access_token', res.accessToken);
      localStorage.setItem('admin_user', JSON.stringify(res.user));
      navigate('/admin/devoluciones');
    } catch {
      setError('Credenciales inválidas. Verifica tu correo y contraseña.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Panel de Operaciones</h1>
        <p className="login-subtitle">Ingresa tus credenciales para acceder.</p>

        <form onSubmit={(e) => { void handleSubmit(e); }} className="login-form">
          <AdminInput label="Correo" type="email" value={email} onChange={setEmail} required />
          <AdminInput label="Contraseña" type="password" value={password} onChange={setPassword} required />
          {error && <p className="login-error">{error}</p>}
          <AdminButton type="submit" disabled={loading} className="btn-full btn-lg">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </AdminButton>
        </form>
      </div>
    </div>
  );
}
