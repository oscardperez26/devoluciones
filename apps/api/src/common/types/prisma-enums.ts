export const RolAdmin = { AGENTE: 'AGENTE', SUPERVISOR: 'SUPERVISOR', ADMIN: 'ADMIN' } as const;
export type RolAdmin = (typeof RolAdmin)[keyof typeof RolAdmin];

export const EstadoPedido = {
  PENDIENTE: 'PENDIENTE', CONFIRMADO: 'CONFIRMADO', ENVIADO: 'ENVIADO',
  ENTREGADO: 'ENTREGADO', CANCELADO: 'CANCELADO',
} as const;
export type EstadoPedido = (typeof EstadoPedido)[keyof typeof EstadoPedido];

export const EstadoDevolucion = {
  BORRADOR: 'BORRADOR', ENVIADA: 'ENVIADA', EN_REVISION: 'EN_REVISION',
  APROBADA: 'APROBADA', PRODUCTO_RECIBIDO: 'PRODUCTO_RECIBIDO',
  REEMBOLSO_EN_PROCESO: 'REEMBOLSO_EN_PROCESO', COMPLETADA: 'COMPLETADA', RECHAZADA: 'RECHAZADA',
} as const;
export type EstadoDevolucion = (typeof EstadoDevolucion)[keyof typeof EstadoDevolucion];

export const TipoEntrega = { TIENDA: 'TIENDA', TRANSPORTADORA: 'TRANSPORTADORA' } as const;
export type TipoEntrega = (typeof TipoEntrega)[keyof typeof TipoEntrega];

export const TipoReembolso = {
  TARJETA_REGALO: 'TARJETA_REGALO', MERCADOPAGO: 'MERCADOPAGO', MEDIO_ORIGINAL: 'MEDIO_ORIGINAL',
} as const;
export type TipoReembolso = (typeof TipoReembolso)[keyof typeof TipoReembolso];
