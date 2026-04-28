import './ReturnDetail.css';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { changeStatus, fetchEvidenceBlob, getReturnDetail, getTimeline } from '@/api/admin.api';
import { AdminButton, AdminCard, AdminSectionTitle, AdminSelect } from '@/components/admin/ui';
import StatusBadge from '@/components/admin/StatusBadge';
import StatusTimeline from '@/components/admin/StatusTimeline';
import type { AdminEvidence } from '@/types';

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

function EvidenceModal({ blobUrl, onClose }: { blobUrl: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="evidence-modal" onClick={onClose}>
      <div className="evidence-modal__inner" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="evidence-modal__close">✕</button>
        <img src={blobUrl} alt="Evidencia" className="evidence-modal__img" />
      </div>
    </div>
  );
}

function EvidenceThumb({ returnId, evidence }: { returnId: string; evidence: AdminEvidence }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let url = '';
    fetchEvidenceBlob(returnId, evidence.id)
      .then((u) => { url = u; setBlobUrl(u); })
      .catch(() => setLoadError(true));
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [returnId, evidence.id]);

  function handleDownload() {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `evidencia-${evidence.id.slice(0, 8)}.${evidence.tipoMime.split('/')[1] ?? 'jpg'}`;
    a.click();
  }

  if (loadError) return <div className="evidence-error">No disponible</div>;
  if (!blobUrl)   return <div className="evidence-skeleton" />;

  return (
    <>
      {showModal && <EvidenceModal blobUrl={blobUrl} onClose={() => setShowModal(false)} />}
      <div className="evidence-thumb">
        <img
          src={blobUrl}
          alt="Evidencia"
          className="evidence-img"
          onClick={() => setShowModal(true)}
        />
        <div className="evidence-overlay">
          <button onClick={() => setShowModal(true)} className="evidence-action-btn">🔍 Ver imagen</button>
          <button onClick={handleDownload} className="evidence-action-btn">↓ Descargar</button>
        </div>
      </div>
    </>
  );
}

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
    return <div className="detail-page">{isLoading ? 'Cargando...' : 'No encontrada.'}</div>;
  }

  const availableTransitions = TRANSITIONS[data.estado] ?? [];

  return (
    <div className="detail-page">
      <button onClick={() => navigate(-1)} className="back-btn">← Volver</button>

      <div className="detail-header">
        <div>
          <h1 className="detail-title">{data.numeroTicket ?? 'Sin ticket'}</h1>
          <p className="detail-subtitle">{data.pedido.nombreCliente} · Pedido {data.pedido.numeroPedido}</p>
        </div>
        <StatusBadge status={data.estado} />
      </div>

      <div className="detail-grid">
        <div className="col-main">

          {/* Información general */}
          <AdminCard>
            <AdminSectionTitle>Información general</AdminSectionTitle>
            <dl className="info-grid">
              <dt>Total</dt>
              <dd>${data.totalReembolso.toLocaleString('es-CO')}</dd>
              <dt>Entrega</dt>
              <dd>{data.metodoEntrega ?? '—'}</dd>
              <dt>Reembolso</dt>
              <dd>{data.metodoReembolso ?? '—'}</dd>
              <dt>Creado</dt>
              <dd>{new Date(data.creadoEn).toLocaleString('es-CO')}</dd>
              {data.enviadaEn && (
                <>
                  <dt>Enviado</dt>
                  <dd>{new Date(data.enviadaEn).toLocaleString('es-CO')}</dd>
                </>
              )}
            </dl>
            {data.notas && (
              <div className="info-notes">
                <p className="info-notes-label">Notas</p>
                <p className="info-notes-text">{data.notas}</p>
              </div>
            )}
          </AdminCard>

          {/* Bono Ogloba */}
          {data.codigoBono && (
            <div className="bono-card">
              <div className="bono-header">
                <span>🎁</span>
                <h2 className="bono-title">Bono Ogloba emitido</h2>
              </div>
              <p className="bono-subtitle">Este código fue enviado al correo del cliente.</p>
              <div className="bono-code-box">
                <p className="bono-code">{data.codigoBono}</p>
              </div>
            </div>
          )}

          {/* Productos */}
          <AdminCard>
            <AdminSectionTitle>Productos ({data.items.length})</AdminSectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.items.map((item) => (
                <div key={item.id} className="item-card">
                  <div className="item-header">
                    <div>
                      <p className="item-name">{item.pedidoItem.nombreProducto}</p>
                      <p className="item-sku">
                        {item.pedidoItem.sku}
                        {item.pedidoItem.talla && ` · T. ${item.pedidoItem.talla}`}
                        {item.pedidoItem.color && ` · ${item.pedidoItem.color}`}
                      </p>
                    </div>
                    <span className="item-price">${Number(item.valorUnitario).toLocaleString('es-CO')}</span>
                  </div>
                  <div className="item-causales">
                    {item.causales.map((c) => (
                      <span key={c} className="causal-tag">{c}</span>
                    ))}
                  </div>
                  {item.comentarios && (
                    <p className="item-comments">"{item.comentarios}"</p>
                  )}
                  {item.evidencias.length > 0 && (
                    <div className="evidences-section">
                      <p className="evidences-label">📷 Evidencias ({item.evidencias.length})</p>
                      <div className="evidences-grid">
                        {item.evidencias.map((ev) => (
                          <EvidenceThumb key={ev.id} returnId={data.id} evidence={ev} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </AdminCard>
        </div>

        <div className="col-side">
          {/* Cambiar estado */}
          {availableTransitions.length > 0 && (
            <AdminCard>
              <AdminSectionTitle>Cambiar estado</AdminSectionTitle>
              <AdminSelect value={newStatus} onChange={setNewStatus} className="status-select">
                <option value="">Selecciona nuevo estado</option>
                {availableTransitions.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
                ))}
              </AdminSelect>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas (opcional)"
                rows={2}
                className="status-notes"
              />
              <AdminButton
                onClick={() => mutation.mutate()}
                disabled={!newStatus || mutation.isPending}
                className="btn-full btn-lg"
              >
                {mutation.isPending ? 'Guardando...' : 'Actualizar estado'}
              </AdminButton>
              {mutation.isError && (
                <p className="status-error">Error al actualizar. Intenta de nuevo.</p>
              )}
            </AdminCard>
          )}

          {/* Historial */}
          <AdminCard>
            <AdminSectionTitle>Historial</AdminSectionTitle>
            {timeline?.length ? (
              <StatusTimeline entries={timeline} />
            ) : (
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>Sin historial aún.</p>
            )}
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
