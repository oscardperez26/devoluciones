import type {
  ReturnConfirmedPayload,
  StatusUpdatedPayload,
} from './email.types';

const STATUS_LABELS: Record<string, string> = {
  EN_REVISION: 'En revisión',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  PRODUCTO_RECIBIDO: 'Producto recibido',
  REEMBOLSO_EN_PROCESO: 'Reembolso en proceso',
  COMPLETADA: 'Completada',
};

const wrap = (content: string) => `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Inter,Arial,sans-serif;background:#F9FAFB;margin:0;padding:32px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;box-shadow:0 4px 12px rgba(0,0,0,0.08)">
    ${content}
    <hr style="border:none;border-top:1px solid #E5E7EB;margin:32px 0">
    <p style="color:#9CA3AF;font-size:12px;margin:0">
      Este correo fue enviado automáticamente. No respondas a este mensaje.
    </p>
  </div>
</body>
</html>`;

export function returnConfirmedTemplate(p: ReturnConfirmedPayload): {
  subject: string;
  html: string;
} {
  return {
    subject: `Devolución recibida — Ticket ${p.ticketNumber}`,
    html: wrap(`
      <h2 style="color:#111827;margin:0 0 8px">Tu solicitud fue recibida ✓</h2>
      <p style="color:#6B7280;margin:0 0 24px">Hemos registrado tu solicitud de devolución exitosamente.</p>
      <div style="background:#F3F4F6;border-radius:8px;padding:20px;margin:0 0 24px">
        <p style="margin:0 0 8px;color:#374151"><strong>Número de ticket:</strong> ${p.ticketNumber}</p>
        <p style="margin:0;color:#374151"><strong>Total a reembolsar:</strong> $${p.totalRefund.toLocaleString('es-CO')}</p>
      </div>
      <p style="color:#6B7280;margin:0">Nuestro equipo revisará tu solicitud en los próximos 3 días hábiles y te notificaremos por correo sobre cualquier cambio.</p>
    `),
  };
}

export function statusUpdatedTemplate(p: StatusUpdatedPayload): {
  subject: string;
  html: string;
} {
  const label = STATUS_LABELS[p.newStatus] ?? p.newStatus;
  return {
    subject: `Tu devolución cambió a: ${label}`,
    html: wrap(`
      <h2 style="color:#111827;margin:0 0 8px">Estado actualizado</h2>
      <p style="color:#6B7280;margin:0 0 24px">El estado de tu solicitud de devolución ha cambiado.</p>
      <div style="background:#F3F4F6;border-radius:8px;padding:20px;margin:0 0 24px">
        <p style="margin:0;color:#374151">
          <strong>Nuevo estado:</strong>
          <span style="display:inline-block;margin-left:8px;padding:4px 12px;background:#111827;color:#fff;border-radius:9999px;font-size:14px">${label}</span>
        </p>
      </div>
      <p style="color:#6B7280;margin:0">Si tienes dudas, comunícate con nuestro equipo de servicio al cliente.</p>
    `),
  };
}
