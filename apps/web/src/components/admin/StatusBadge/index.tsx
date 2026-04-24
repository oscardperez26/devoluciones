const CONFIG: Record<string, { label: string; classes: string }> = {
  BORRADOR:              { label: 'Borrador',            classes: 'bg-gray-100 text-gray-600' },
  ENVIADA:               { label: 'Enviada',             classes: 'bg-blue-100 text-blue-700' },
  EN_REVISION:           { label: 'En revisión',         classes: 'bg-yellow-100 text-yellow-700' },
  APROBADA:              { label: 'Aprobada',            classes: 'bg-green-100 text-green-700' },
  RECHAZADA:             { label: 'Rechazada',           classes: 'bg-red-100 text-red-700' },
  PRODUCTO_RECIBIDO:     { label: 'Producto recibido',   classes: 'bg-purple-100 text-purple-700' },
  REEMBOLSO_EN_PROCESO:  { label: 'Reembolso en proceso', classes: 'bg-orange-100 text-orange-700' },
  COMPLETADA:            { label: 'Completada',          classes: 'bg-emerald-100 text-emerald-700' },
};

export default function StatusBadge({ status }: { status: string }) {
  const cfg = CONFIG[status] ?? { label: status, classes: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}
