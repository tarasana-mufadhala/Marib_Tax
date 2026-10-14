/** قناة الإرسال. الرسائل الحساسة تُرسل على قناة واحدة لا تُبث. */
export type MessagingChannel = 'sms' | 'whatsapp';

export interface OutboundMessage {
  /** رقم المستلم بصيغة E.164. */
  to: string;
  /** نص الرسالة. */
  body: string;
  channel: MessagingChannel;
  /**
   * الرسالة تحمل سراً (كلمة مرور مثلاً).
   * المزود ملزَم بألا يُسجّل نصها في أي سجل.
   */
  containsSecret?: boolean;
}

export interface MessagingResult {
  /** الرسالة سُلّمت للمزود فعلاً. */
  accepted: boolean;
  /** مرجع المزود إن وُجد، للتتبع. */
  providerReference?: string;
  /** سبب الرفض — آمن للعرض، بلا محتوى الرسالة. */
  reason?: string;
}

export interface MessagingProvider {
  /** اسم المزود للسجلات. */
  readonly name: string;
  /** هل المزود مهيأ وجاهز للإرسال؟ */
  readonly enabled: boolean;
  send(message: OutboundMessage): Promise<MessagingResult>;
}

export const MESSAGING_PROVIDER = Symbol('MESSAGING_PROVIDER');
