import './ReturnsList.css';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { listReturns } from '@/api/admin.api';
import { AdminCard } from '@/components/admin/ui';
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

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin-returns', filters],
    queryFn: () => listReturns({
      page: filters.page,
      limit: filters.limit,
      status: filters.status || undefined,
      search: filters.search || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
    }),
    staleTime: 30_000,
    retry: 2,
  });

  return (
    <div className="returns-page">
      <div className="page-header">
        <h1 className="page-title">Devoluciones</h1>
        {data?.pagination && (
          <span className="page-count">{data.pagination.total} total</span>
        )}
      </div>

      {/* Filtros */}
      <AdminCard className="filter-bar">
        <input
          type="text"
          placeholder="Buscar por ticket o cliente..."
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          className="filter-input filter-input--wide"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value)}
          className="filter-input"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilter('dateFrom', e.target.value)}
          className="filter-input"
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilter('dateTo', e.target.value)}
          className="filter-input"
        />
        <button onClick={resetFilters} className="filter-clear">
          Limpiar
        </button>
      </AdminCard>

      {/* Tabla */}
      <AdminCard noPadding>
        {isError ? (
          <div className="table-error">
            <p className="table-error-msg">No se pudo cargar la lista. Verifica que el servidor esté activo.</p>
            <button onClick={() => void refetch()} className="table-retry-btn">
              Reintentar
            </button>
          </div>
        ) : isLoading || isFetching ? (
          <div className="table-empty">Cargando...</div>
        ) : !data?.returns.length ? (
          <div className="table-empty">No hay devoluciones con los filtros actuales.</div>
        ) : (
          <table className="returns-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Ítems</th>
                <th className="col-right">Total</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {data.returns.map((r) => (
                <tr key={r.id} onClick={() => navigate(`/admin/devoluciones/${r.id}`)}>
                  <td className="cell-ticket">{r.numeroTicket ?? '—'}</td>
                  <td>
                    <p className="cell-client-name">{r.pedido.nombreCliente}</p>
                    <p className="cell-client-order">{r.pedido.numeroPedido}</p>
                  </td>
                  <td><StatusBadge status={r.estado} /></td>
                  <td>{r.itemCount}</td>
                  <td className="col-right">${r.totalReembolso.toLocaleString('es-CO')}</td>
                  <td className="cell-date">{new Date(r.creadoEn).toLocaleDateString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AdminCard>

      {/* Paginación */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="pagination">
          <span className="pagination-info">
            Página {filters.page} de {data.pagination.totalPages}
          </span>
          <div className="pagination-controls">
            <button
              onClick={() => setFilter('page', filters.page - 1)}
              disabled={filters.page <= 1}
              className="pagination-btn"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setFilter('page', filters.page + 1)}
              disabled={filters.page >= data.pagination.totalPages}
              className="pagination-btn"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
