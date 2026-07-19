export interface ClaimedOutboxMessage {
  readonly id: string;
  readonly idempotencyKey: string;
  readonly channel: 'sms' | 'push' | 'in_app' | 'whatsapp';
  readonly payloadReference: string;
}

export interface OutboxRepository {
  claimNext(): Promise<ClaimedOutboxMessage | null>;
  recordSucceeded(messageId: string): Promise<void>;
  recordFailed(messageId: string, safeReasonCode: string): Promise<void>;
}

/**
 * Provider port for outbound notification delivery (ADR-007 / ADR-015).
 * Build/test intent may use a Twilio adapter later; a local provider or WhatsApp API
 * must be swappable without changing outbox/domain contracts.
 * No real external send is authorized until a separate production communication approval.
 */
export interface NotificationProviderPort {
  readonly providerKey: 'disabled' | 'twilio' | 'local' | 'whatsapp_api';
  deliver(message: ClaimedOutboxMessage): Promise<void>;
}

/** @deprecated Prefer NotificationProviderPort; retained as a compatible alias. */
export type NotificationDeliveryAdapter = NotificationProviderPort;

export class DisabledNotificationProvider implements NotificationProviderPort {
  readonly providerKey = 'disabled' as const;

  deliver(message: ClaimedOutboxMessage): Promise<void> {
    void message;
    return Promise.reject(new Error('NOTIFICATION_DELIVERY_DISABLED'));
  }
}
