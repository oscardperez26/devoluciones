import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { listReturns } from '@/api/admin.api';
import StatusBadge from '@/components/admin/StatusBadge';
import { useAdminStore } from '@/store/admin.store';

const STATUSES = ['', 'ENVIADA', 'EN_REVISION', 'APROBADA', 'RECHAZADA', 'PRODUCTO_RECIBIDO', 'REEMBOLSO_EN_PROCESO', 'COMPLETADA'];
const STATUS_LABELS: Record<string, string> = {
  '': 'Todos', ENVIADA: 'Enviada', EN_REVISION: 'En revisión', APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada', PRODUCTO_RECIBIDO: 'Producto recibido',
  REEMBOLSO_EN_PROCESO: 'Reembolso en proceso', COMPLETADA: 'Completada',
};

export default function ReturnsList() {
  const navigate = useNavigate();
  const { filters, setFilter, resetFilters } = useAdminStore();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-returns', filters],
    queryFn: () => listReturns({
      page: filters.page,
      limit: filters.limit,
      status: filters.status || undefined,
      search: filters.search || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
    }),
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#111827]">Devoluciones</h1>
        {data?.pagination && (
          <p className="text-sm text-gray-500">{data.pagination.total} total</p>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar por ticket o cliente..."
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827] min-w-48"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilter('dateFrom', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]"
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilter('dateTo', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]"
        />
        <button
          onClick={resetFilters}
          className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Limpiar
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
        ) : !data?.returns.length ? (
          <div className="p-8 text-center text-gray-400 text-sm">No hay devoluciones con los filtros actuales.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ticket</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ítems</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.returns.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => navigate(`/admin/devoluciones/${r.id}`)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs font-medium">{r.numeroTicket ?? '—'}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.pedido.nombreCliente}</p>
                    <p className="text-xs text-gray-500">{r.pedido.numeroPedido}</p>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={r.estado} /></td>
                  <td className="px-4 py-3 text-gray-600">{r.itemCount}</td>
                  <td className="px-4 py-3 text-right font-medium">${r.totalReembolso.toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(r.creadoEn).toLocaleDateString('es-CO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Página {filters.page} de {data.pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('page', filters.page - 1)}
              disabled={filters.page <= 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setFilter('page', filters.page + 1)}
              disabled={filters.page >= data.pagination.totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
