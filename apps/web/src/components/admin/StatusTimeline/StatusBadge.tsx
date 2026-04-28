const CONFIG: Record<string, { label: string; className: string }> = {
  BORRADOR:             { label: 'Borrador',             className: 'bg-gray-100 text-gray-600' },
  ENVIADA:              { label: 'Enviada',               className: 'bg-blue-100 text-blue-700' },
  EN_REVISION:          { label: 'En revisión',           className: 'bg-yellow-100 text-yellow-700' },
  APROBADA:             { label: 'Aprobada',              className: 'bg-green-100 text-green-700' },
  PRODUCTO_RECIBIDO:    { label: 'Producto recibido',     className: 'bg-teal-100 text-teal-700' },
  REEMBOLSO_EN_PROCESO: { label: 'Reembolso en proceso', className: 'bg-purple-100 text-purple-700' },
  COMPLETADA:           { label: 'Completada',            className: 'bg-emerald-100 text-emerald-700' },
  RECHAZADA:            { label: 'Rechazada',             className: 'bg-red-100 text-red-700' },
};

export default function StatusBadge({ status }: { status: string }) {
  const { label, className } = CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-500' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
