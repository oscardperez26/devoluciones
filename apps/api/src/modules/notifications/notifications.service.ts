import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  bonoEmitidoTemplate,
  returnConfirmedTemplate,
  statusUpdatedTemplate,
} from './email.templates';
import type { EmailPayloadMap, EmailType } from './email.types';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resend: Resend;
  private readonly from: string;

  constructor(config: ConfigService) {
    this.resend = new Resend(config.getOrThrow<string>('RESEND_API_KEY'));
    this.from = config.getOrThrow<string>('EMAIL_FROM');
  }

  send<T extends EmailType>(type: T, payload: EmailPayloadMap[T]): void {
    const { subject, html } = this.buildTemplate(type, payload);
    this.resend.emails
      .send({ from: this.from, to: payload.email, subject, html })
      .then(({ error }) => {
        if (error) this.logger.error(`Error enviando email [${type}]: ${error.message}`);
        else this.logger.log(`Email [${type}] enviado a ${payload.email}`);
      })
      .catch((err: unknown) => {
        this.logger.error(`Fallo al enviar email [${type}]: ${String(err)}`);
      });
  }

  private buildTemplate(type: EmailType, payload: EmailPayloadMap[EmailType]) {
    switch (type) {
      case 'RETURN_CONFIRMED':
        return returnConfirmedTemplate(payload as EmailPayloadMap['RETURN_CONFIRMED']);
      case 'STATUS_UPDATED':
        return statusUpdatedTemplate(payload as EmailPayloadMap['STATUS_UPDATED']);
      case 'BONO_EMITIDO':
        return bonoEmitidoTemplate(payload as EmailPayloadMap['BONO_EMITIDO']);
    }
  }
}
