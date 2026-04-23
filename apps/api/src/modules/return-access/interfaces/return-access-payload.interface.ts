export interface ReturnAccessPayload {
  iss: string;
  sub: string;
  iat: number;
  exp: number;
  jti: string;
  orderId: string;
  emailHash: string;
  scope: string;
  returnId: string | null;
}
