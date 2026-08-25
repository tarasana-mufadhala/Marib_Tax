import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  MessagingProvider,
  MessagingResult,
  OutboundMessage,
} from './messaging.contracts.js';

/**
 * مزود رسائل ميتا (WhatsApp Cloud API).
 *
 * غير مهيأ بعد: المشروع ينتظر بيانات الاعتماد. حتى ذلك الحين يرد
 * `accepted: false` بسبب واضح — ولا يدّعي نجاحاً لم يحدث.
 *
 * المتغيرات المطلوبة لتفعيله:
 *   META_WHATSAPP_PHONE_NUMBER_ID
 *   META_WHATSAPP_ACCESS_TOKEN
 */
@Injectable()
export class MetaMessagingProvider implements MessagingProvider {
  readonly name = 'meta-whatsapp';

  private readonly logger = new Logger(MetaMessagingProvider.name);

  constructor(private readonly config: ConfigService) {}

  private get phoneNumberId(): string {
    return this.config.get<string>('META_WHATSAPP_PHONE_NUMBER_ID') ?? '';
  }

  private get accessToken(): string {
    return this.config.get<string>('META_WHATSAPP_ACCESS_TOKEN') ?? '';
  }

  get enabled(): boolean {
    return this.phoneNumberId !== '' && this.accessToken !== '';
  }

  async send(message: OutboundMessage): Promise<MessagingResult> {
    if (!this.enabled) {
      return {
        accepted: false,
        reason: 'خدمة الرسائل غير مُفعّلة بعد',
      };
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: message.to.replace(/^\+/, ''),
            type: 'text',
            text: { body: message.body },
          }),
        },
      );

      if (!response.ok) {
        // نص الرد قد يحوي صدى للرسالة، فلا يُسجَّل حين تحمل سراً.
        const detail = message.containsSecret
          ? `HTTP ${response.status}`
          : `HTTP ${response.status} ${(await response.text()).slice(0, 200)}`;
        this.logger.error(`فشل إرسال رسالة إلى ${maskPhone(message.to)}: ${detail}`);
        return { accepted: false, reason: 'تعذّر إرسال الرسالة، حاول لاحقاً' };
      }

      const data = (await response.json()) as {
        messages?: { id?: string }[];
      };
      const reference = data.messages?.[0]?.id;
      this.logger.log(
        `أُرسلت رسالة إلى ${maskPhone(message.to)}${reference ? ` (${reference})` : ''}`,
      );
      return {
        accepted: true,
        ...(reference === undefined ? {} : { providerReference: reference }),
      };
    } catch (error) {
      this.logger.error(
        `تعذّر الاتصال بمزود الرسائل لإرسال رسالة إلى ${maskPhone(message.to)}`,
        error instanceof Error ? error.stack : String(error),
      );
      return { accepted: false, reason: 'تعذّر الاتصال بخدمة الرسائل' };
    }
  }
}

/** لا يُسجَّل رقم كامل في السجلات. */
export function maskPhone(phone: string): string {
  if (phone.length <= 7) return '***';
  return `${phone.slice(0, 5)}****${phone.slice(-2)}`;
}
