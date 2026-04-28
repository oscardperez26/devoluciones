import './StatusBadge.css';

const CONFIG: Record<string, { label: string; className: string }> = {
  BORRADOR:              { label: 'Borrador',             className: 'status-badge--borrador' },
  ENVIADA:               { label: 'Enviada',              className: 'status-badge--enviada' },
  EN_REVISION:           { label: 'En revisión',          className: 'status-badge--en-revision' },
  APROBADA:              { label: 'Aprobada',             className: 'status-badge--aprobada' },
  RECHAZADA:             { label: 'Rechazada',            className: 'status-badge--rechazada' },
  PRODUCTO_RECIBIDO:     { label: 'Producto recibido',    className: 'status-badge--producto-recibido' },
  REEMBOLSO_EN_PROCESO:  { label: 'Reembolso en proceso', className: 'status-badge--reembolso-en-proceso' },
  COMPLETADA:            { label: 'Completada',           className: 'status-badge--completada' },
};

export default function StatusBadge({ status }: { status: string }) {
  const cfg = CONFIG[status] ?? { label: status, className: 'status-badge--default' };
  return (
    <span className={`status-badge ${cfg.className}`}>{cfg.label}</span>
  );
}
