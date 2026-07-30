import { Injectable } from '@nestjs/common';
import {
  type NotificationsRepository,
  type StoredNotificationMessage,
  type StoredNotificationTemplate,
  type StoredNotificationChannelConfiguration,
  type StoredDeliveryAttempt,
  type StoredNotificationReadState,
  type StoredNotificationOutboxMessage,
} from './notifications.repository.js';

@Injectable()
export class NotificationsMemoryRepository implements NotificationsRepository {
  private readonly messages = new Map<string, StoredNotificationMessage>();
  private readonly templates = new Map<string, StoredNotificationTemplate>();
  private readonly configs = new Map<
    string,
    StoredNotificationChannelConfiguration
  >();
  private readonly attempts: StoredDeliveryAttempt[] = [];
  private readonly readStates = new Map<string, StoredNotificationReadState>();
  private readonly outboxMessages = new Map<
    string,
    StoredNotificationOutboxMessage
  >();

  async findMessageById(id: string): Promise<StoredNotificationMessage | null> {
    await Promise.resolve();
    return this.messages.get(id) ?? null;
  }

  async createMessage(
    message: StoredNotificationMessage,
  ): Promise<StoredNotificationMessage> {
    await Promise.resolve();
    this.messages.set(message.id, message);
    return message;
  }

  async updateMessageStatus(
    id: string,
    status: string,
  ): Promise<StoredNotificationMessage> {
    await Promise.resolve();
    const existing = this.messages.get(id);
    if (!existing) throw new Error('Notification message not found.');
    const updated = { ...existing, deliveryStatusCode: status };
    this.messages.set(id, updated);
    return updated;
  }

  async createTemplate(
    template: StoredNotificationTemplate,
  ): Promise<StoredNotificationTemplate> {
    await Promise.resolve();
    this.templates.set(template.code, template);
    return template;
  }

  async findTemplateByCode(
    code: string,
  ): Promise<StoredNotificationTemplate | null> {
    await Promise.resolve();
    return this.templates.get(code) ?? null;
  }

  async createChannelConfig(
    config: StoredNotificationChannelConfiguration,
  ): Promise<StoredNotificationChannelConfiguration> {
    await Promise.resolve();
    this.configs.set(config.channelCode, config);
    return config;
  }

  async findChannelConfigByCode(
    channelCode: string,
  ): Promise<StoredNotificationChannelConfiguration | null> {
    await Promise.resolve();
    return this.configs.get(channelCode) ?? null;
  }

  async createDeliveryAttempt(
    attempt: StoredDeliveryAttempt,
  ): Promise<StoredDeliveryAttempt> {
    await Promise.resolve();
    this.attempts.push(attempt);
    return attempt;
  }

  async listAttemptsForMessage(
    messageId: string,
  ): Promise<StoredDeliveryAttempt[]> {
    await Promise.resolve();
    return this.attempts.filter((a) => a.notificationMessageId === messageId);
  }

  async findReadState(
    messageId: string,
    recipientId: string,
  ): Promise<StoredNotificationReadState | null> {
    await Promise.resolve();
    return (
      [...this.readStates.values()].find(
        (r) =>
          r.notificationMessageId === messageId &&
          r.recipientProfileId === recipientId,
      ) ?? null
    );
  }

  async createReadState(
    state: StoredNotificationReadState,
  ): Promise<StoredNotificationReadState> {
    await Promise.resolve();
    this.readStates.set(state.id, state);
    return state;
  }

  async updateReadState(
    id: string,
    updates: Partial<StoredNotificationReadState>,
  ): Promise<StoredNotificationReadState> {
    await Promise.resolve();
    const existing = this.readStates.get(id);
    if (!existing) throw new Error('Read state not found.');
    const updated = { ...existing, ...updates };
    this.readStates.set(id, updated);
    return updated;
  }

  async listMessagesForRecipient(
    recipientId: string,
  ): Promise<StoredNotificationMessage[]> {
    await Promise.resolve();
    return [...this.messages.values()].filter(
      (m) => m.recipientProfileId === recipientId,
    );
  }

  async listReadStatesForRecipient(
    recipientId: string,
  ): Promise<StoredNotificationReadState[]> {
    await Promise.resolve();
    return [...this.readStates.values()].filter(
      (r) => r.recipientProfileId === recipientId,
    );
  }

  async createOutboxMessage(
    outbox: StoredNotificationOutboxMessage,
  ): Promise<StoredNotificationOutboxMessage> {
    await Promise.resolve();
    this.outboxMessages.set(outbox.id, outbox);
    return outbox;
  }

  async listPendingOutboxMessages(): Promise<
    StoredNotificationOutboxMessage[]
  > {
    await Promise.resolve();
    return [...this.outboxMessages.values()].filter(
      (o) => o.publicationState === 'pending',
    );
  }

  async updateOutboxMessage(
    id: string,
    updates: Partial<StoredNotificationOutboxMessage>,
  ): Promise<StoredNotificationOutboxMessage> {
    await Promise.resolve();
    const existing = this.outboxMessages.get(id);
    if (!existing) throw new Error('Outbox message not found.');
    const updated = { ...existing, ...updates };
    this.outboxMessages.set(id, updated);
    return updated;
  }
}
