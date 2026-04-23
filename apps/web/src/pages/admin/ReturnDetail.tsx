import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { changeStatus, getReturnDetail, getTimeline } from '@/api/admin.api';
import StatusBadge from '@/components/admin/StatusBadge';
import StatusTimeline from '@/components/admin/StatusTimeline';

const TRANSITIONS: Record<string, string[]> = {
  ENVIADA: ['EN_REVISION'],
  EN_REVISION: ['APROBADA', 'RECHAZADA'],
  APROBADA: ['PRODUCTO_RECIBIDO'],
  PRODUCTO_RECIBIDO: ['REEMBOLSO_EN_PROCESO'],
  REEMBOLSO_EN_PROCESO: ['COMPLETADA'],
};
const STATUS_LABELS: Record<string, string> = {
  EN_REVISION: 'En revisión', APROBADA: 'Aprobada', RECHAZADA: 'Rechazada',
  PRODUCTO_RECIBIDO: 'Producto recibido', REEMBOLSO_EN_PROCESO: 'Reembolso en proceso', COMPLETADA: 'Completada',
};

export default function ReturnDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-return', id],
    queryFn: () => getReturnDetail(id!),
    enabled: !!id,
  });

  const { data: timeline } = useQuery({
    queryKey: ['admin-timeline', id],
    queryFn: () => getTimeline(id!),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: () => changeStatus(id!, newStatus, notes || undefined),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-return', id] });
      void qc.invalidateQueries({ queryKey: ['admin-timeline', id] });
      void qc.invalidateQueries({ queryKey: ['admin-returns'] });
      setNewStatus('');
      setNotes('');
    },
  });

  if (isLoading || !data) {
    return <div className="p-6 text-gray-400 text-sm">{isLoading ? 'Cargando...' : 'No encontrada.'}</div>;
  }

  const availableTransitions = TRANSITIONS[data.estado] ?? [];

  return (
    <div className="p-6 max-w-4xl">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
      >
        ← Volver
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">{data.numeroTicket ?? 'Sin ticket'}</h1>
          <p className="text-sm text-gray-500">{data.pedido.nombreCliente} · Pedido {data.pedido.numeroPedido}</p>
        </div>
        <StatusBadge status={data.estado} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: items + info */}
        <div className="lg:col-span-2 space-y-4">

          {/* Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-sm text-gray-700 mb-3">Información general</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-gray-500">Total</dt>
              <dd className="font-medium">${data.totalReembolso.toLocaleString('es-CO')}</dd>
              <dt className="text-gray-500">Entrega</dt>
              <dd>{data.metodoEntrega ?? '—'}</dd>
              <dt className="text-gray-500">Reembolso</dt>
              <dd>{data.metodoReembolso ?? '—'}</dd>
              <dt className="text-gray-500">Creado</dt>
              <dd>{new Date(data.creadoEn).toLocaleString('es-CO')}</dd>
              {data.enviadaEn && (
                <>
                  <dt className="text-gray-500">Enviado</dt>
                  <dd>{new Date(data.enviadaEn).toLocaleString('es-CO')}</dd>
                </>
              )}
            </dl>
            {data.notas && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Notas</p>
                <p className="text-sm text-gray-700">{data.notas}</p>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-sm text-gray-700 mb-3">Productos ({data.items.length})</h2>
            <div className="space-y-3">
              {data.items.map((item) => (
                <div key={item.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{item.pedidoItem.nombreProducto}</p>
                      <p className="text-xs text-gray-500">{item.pedidoItem.sku}{item.pedidoItem.talla && ` · T. ${item.pedidoItem.talla}`}{item.pedidoItem.color && ` · ${item.pedidoItem.color}`}</p>
                    </div>
                    <span className="text-sm font-semibold">${Number(item.valorUnitario).toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.causales.map((c) => (
                      <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c}</span>
                    ))}
                  </div>
                  {item.evidencias.length > 0 && (
                    <p className="text-xs text-blue-600 mt-1">📷 {item.evidencias.length} evidencia(s)</p>
                  )}
                  {item.comentarios && (
                    <p className="text-xs text-gray-500 mt-1 italic">"{item.comentarios}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: actions + timeline */}
        <div className="space-y-4">
          {/* Change status */}
          {availableTransitions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h2 className="font-semibold text-sm text-gray-700 mb-3">Cambiar estado</h2>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#111827]"
              >
                <option value="">Selecciona nuevo estado</option>
                {availableTransitions.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
                ))}
              </select>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas (opcional)"
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#111827] resize-none"
              />
              <button
                onClick={() => mutation.mutate()}
                disabled={!newStatus || mutation.isPending}
                className="w-full bg-[#111827] hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg py-2.5 transition-colors"
              >
                {mutation.isPending ? 'Guardando...' : 'Actualizar estado'}
              </button>
              {mutation.isError && (
                <p className="text-xs text-red-600 mt-2">Error al actualizar. Intenta de nuevo.</p>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-sm text-gray-700 mb-3">Historial</h2>
            {timeline?.length ? (
              <StatusTimeline entries={timeline} />
            ) : (
              <p className="text-xs text-gray-400">Sin historial aún.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
