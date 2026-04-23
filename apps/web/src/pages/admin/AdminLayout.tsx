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

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
      isActive ? 'bg-[#111827] text-white' : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <div className="min-h-screen flex bg-[#F9FAFB]">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <p className="font-bold text-sm text-[#111827]">Panel Admin</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <NavLink to="/admin/devoluciones" className={navLinkClass}>
            📋 Devoluciones
          </NavLink>
        </nav>

        <div className="p-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 truncate">{user.nombre ?? 'Admin'}</p>
          <p className="text-xs text-gray-400 mb-2">{user.rol ?? ''}</p>
          <button
            onClick={logout}
            className="w-full text-left text-xs text-gray-500 hover:text-red-600 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
