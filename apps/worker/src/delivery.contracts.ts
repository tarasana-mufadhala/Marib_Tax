export interface ClaimedOutboxMessage {
  readonly id: string;
  readonly idempotencyKey: string;
  readonly channel: 'sms' | 'push' | 'in_app';
  readonly payloadReference: string;
}

export interface OutboxRepository {
  claimNext(): Promise<ClaimedOutboxMessage | null>;
  recordSucceeded(messageId: string): Promise<void>;
  recordFailed(messageId: string, safeReasonCode: string): Promise<void>;
}

export interface NotificationDeliveryAdapter {
  deliver(message: ClaimedOutboxMessage): Promise<void>;
}
