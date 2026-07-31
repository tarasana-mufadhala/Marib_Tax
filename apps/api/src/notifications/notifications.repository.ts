export interface StoredNotificationTemplate {
  id: string;
  code: string;
  name: string;
  channelCode: string;
  isActive: boolean;
}

export interface StoredNotificationChannelConfiguration {
  id: string;
  channelCode: string;
  isEnabled: boolean;
  configLabel: string | null;
}

export interface StoredNotificationMessage {
  id: string;
  serviceRequestId: string | null;
  balaghId: string | null;
  paymentNoticeId: string | null;
  templateId: string | null;
  channelConfigId: string | null;
  deliveryStatusCode: string; // pending, sent, failed
  recipientProfileId: string;
  createdAt: Date;
  idempotencyKey: string | null;
}

export interface StoredDeliveryAttempt {
  id: string;
  notificationMessageId: string;
  attemptNumber: number;
  attemptStatusCode: string; // success, failure
  providerReference: string | null;
  failureReasonSafe: string | null;
  attemptedAt: Date;
}

export interface StoredNotificationReadState {
  id: string;
  notificationMessageId: string;
  recipientProfileId: string;
  readStatusCode: string; // unread, read
  firstReadAt: Date | null;
  latestAcknowledgedAt: Date | null;
  readSourceChannelCode: string | null;
}

export interface StoredNotificationOutboxMessage {
  id: string;
  notificationMessageId: string | null;
  payloadRef: string | null;
  publicationState: string; // pending, processed, failed
  attemptCount: number;
  lastError: string | null;
  nextAttemptAt: Date | null;
}

export const NOTIFICATIONS_REPOSITORY = Symbol('NOTIFICATIONS_REPOSITORY');

export interface NotificationsRepository {
  findMessageById(id: string): Promise<StoredNotificationMessage | null>;
  createMessage(
    message: StoredNotificationMessage,
  ): Promise<StoredNotificationMessage>;
  updateMessageStatus(
    id: string,
    status: string,
  ): Promise<StoredNotificationMessage>;

  createTemplate(
    template: StoredNotificationTemplate,
  ): Promise<StoredNotificationTemplate>;
  findTemplateByCode(code: string): Promise<StoredNotificationTemplate | null>;

  createChannelConfig(
    config: StoredNotificationChannelConfiguration,
  ): Promise<StoredNotificationChannelConfiguration>;
  findChannelConfigByCode(
    channelCode: string,
  ): Promise<StoredNotificationChannelConfiguration | null>;

  createDeliveryAttempt(
    attempt: StoredDeliveryAttempt,
  ): Promise<StoredDeliveryAttempt>;
  listAttemptsForMessage(messageId: string): Promise<StoredDeliveryAttempt[]>;

  findReadState(
    messageId: string,
    recipientId: string,
  ): Promise<StoredNotificationReadState | null>;
  createReadState(
    state: StoredNotificationReadState,
  ): Promise<StoredNotificationReadState>;
  updateReadState(
    id: string,
    updates: Partial<StoredNotificationReadState>,
  ): Promise<StoredNotificationReadState>;

  listMessagesForRecipient(
    recipientId: string,
  ): Promise<StoredNotificationMessage[]>;
  listReadStatesForRecipient(
    recipientId: string,
  ): Promise<StoredNotificationReadState[]>;

  createOutboxMessage(
    outbox: StoredNotificationOutboxMessage,
  ): Promise<StoredNotificationOutboxMessage>;
  listPendingOutboxMessages(): Promise<StoredNotificationOutboxMessage[]>;
  updateOutboxMessage(
    id: string,
    updates: Partial<StoredNotificationOutboxMessage>,
  ): Promise<StoredNotificationOutboxMessage>;
}
