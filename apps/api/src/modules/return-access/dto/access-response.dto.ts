export interface AccessResponseDto {
  sessionToken: string;
  expiresAt: string;
  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    deliveredAt: string | null;
  };
}
