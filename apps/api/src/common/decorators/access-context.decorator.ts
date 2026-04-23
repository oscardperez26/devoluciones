import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface AccessContext {
  orderId: string;
  emailHash: string;
  returnId: string | null;
}

export const AccessContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AccessContext => {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { accessContext: AccessContext }>();
    return req.accessContext;
  },
);
