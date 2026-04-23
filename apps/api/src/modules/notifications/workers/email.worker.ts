import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { Resend } from 'resend';
import {
  bonoEmitidoTemplate,
  returnConfirmedTemplate,
  statusUpdatedTemplate,
} from '../email.templates';
import type { EmailJob, EmailPayloadMap, EmailType } from '../email.types';

export const EMAIL_QUEUE = 'email-queue';

@Processor(EMAIL_QUEUE)
export class EmailWorker extends WorkerHost {
  private readonly logger = new Logger(EmailWorker.name);
  private readonly resend: Resend;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    super();
    this.resend = new Resend(config.getOrThrow<string>('RESEND_API_KEY'));
    this.from = config.getOrThrow<string>('EMAIL_FROM');
  }

  async process(job: Job<EmailJob>): Promise<void> {
    const { type, payload } = job.data;
    const { subject, html } = this.buildTemplate(type, payload);

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: payload.email,
      subject,
      html,
    });

    if (error) {
      this.logger.error(
        `Error enviando email [${type}] a ${payload.email}: ${error.message}`,
      );
      throw new Error(error.message);
    }

    this.logger.log(`Email [${type}] enviado a ${payload.email}`);
  }

  private buildTemplate(type: EmailType, payload: EmailPayloadMap[EmailType]) {
    switch (type) {
      case 'RETURN_CONFIRMED':
        return returnConfirmedTemplate(
          payload as EmailPayloadMap['RETURN_CONFIRMED'],
        );
      case 'STATUS_UPDATED':
        return statusUpdatedTemplate(
          payload as EmailPayloadMap['STATUS_UPDATED'],
        );
      case 'BONO_EMITIDO':
        return bonoEmitidoTemplate(
          payload as EmailPayloadMap['BONO_EMITIDO'],
        );
    }
  }
}
