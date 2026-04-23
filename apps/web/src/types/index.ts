export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  purchasedAt: string;
  deliveredAt: string | null;
}

export interface EligibleReason {
  code: string;
  label: string;
  requiresEvidence: boolean;
  daysLeft: number;
}

export interface OrderItem {
  id: string;
  sku: string;
  productName: string;
  size: string | null;
  color: string | null;
  unitPrice: number;
  imageUrl: string | null;
  isReturnable: boolean;
  returnStatus: string | null;
  eligibleReasons: EligibleReason[];
  blockedReason: string | null;
}

export interface OrderWithItems {
  order: Order;
  items: OrderItem[];
}

export interface DraftItem {
  orderItemId: string;
  reasonCodes: string[];
  comments: string;
  quantity: number;
}

export interface ReturnItem {
  id: string;
  requiresEvidence: boolean;
  unitRefund: number;
}

export interface ReturnDraft {
  returnId: string;
  status: string;
  totalRefund: number;
  items: ReturnItem[];
}

export interface SubmittedReturn {
  ticketNumber: string;
  status: string;
  totalRefund: number;
  confirmationEmail: string;
  estimatedReviewDays: number;
}

export interface CarrierAddress {
  fullName: string;
  address: string;
  city: string;
  department: string;
  phone: string;
  documentId: string;
}

export interface Store {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  telefono: string | null;
  horario: string | null;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Admin types
export interface AdminReturn {
  id: string;
  numeroTicket: string | null;
  estado: string;
  totalReembolso: number;
  metodoEntrega: string | null;
  metodoReembolso: string | null;
  creadoEn: string;
  enviadaEn: string | null;
  itemCount: number;
  pedido: { numeroPedido: string; nombreCliente: string };
}

export interface AdminEvidence {
  id: string;
  claveArchivo: string;
  tipoMime: string;
  tamanioBytes: number;
}

export interface AdminReturnItem {
  id: string;
  causales: string[];
  comentarios: string | null;
  cantidad: number;
  valorUnitario: number;
  pedidoItem: { sku: string; nombreProducto: string; talla: string | null; color: string | null };
  evidencias: AdminEvidence[];
}

export interface StatusHistory {
  id: string;
  estadoAnterior: string | null;
  estadoNuevo: string;
  cambiadoPor: string;
  notas: string | null;
  creadoEn: string;
}

export interface AdminReturnDetail extends AdminReturn {
  items: AdminReturnItem[];
  historial: StatusHistory[];
  notas: string | null;
  codigoBono: string | null;
}
