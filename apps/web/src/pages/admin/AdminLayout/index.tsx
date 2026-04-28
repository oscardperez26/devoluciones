import './AdminLayout.css';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

export default function AdminLayout() {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  }

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('admin_user') ?? '{}') as { nombre?: string; rol?: string }; }
    catch { return {}; }
  })();

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <p className="sidebar-brand">Panel Admin</p>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/admin/devoluciones" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            📋 Devoluciones
          </NavLink>
          <NavLink to="/admin/reglas" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            ⚙️ Reglas
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <p className="sidebar-user-name">{user.nombre ?? 'Admin'}</p>
          <p className="sidebar-user-role">{user.rol ?? ''}</p>
          <button onClick={logout} className="logout-btn">
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
