import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import type {
  NotificationsRepository,
  StoredNotificationTemplate,
  StoredNotificationChannelConfiguration,
  StoredNotificationMessage,
  StoredDeliveryAttempt,
  StoredNotificationReadState,
  StoredNotificationOutboxMessage,
  StoredDeviceToken,
} from './notifications.repository.js';

@Injectable()
export class NotificationsKyselyRepository implements NotificationsRepository {
  // In-memory fallback
  private readonly deviceTokens = new Map<string, StoredDeviceToken>();
  private readonly templates = new Map<string, StoredNotificationTemplate>();
  private readonly channelConfigs = new Map<string, StoredNotificationChannelConfiguration>();
  private readonly messages = new Map<string, StoredNotificationMessage>();
  private readonly deliveryAttempts: StoredDeliveryAttempt[] = [];
  private readonly readStates = new Map<string, StoredNotificationReadState>();
  private readonly outbox = new Map<string, StoredNotificationOutboxMessage>();

  constructor(private readonly dbService: DatabaseService) {}

  async findMessageById(id: string): Promise<StoredNotificationMessage | null> {
    if (this.dbService.isInitialized) {
      const row = await this.dbService.db
        .selectFrom('notify.notification_messages')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
      if (!row) return null;
      return {
        id: row.id,
        serviceRequestId: row.service_request_id,
        balaghId: row.balagh_id,
        paymentNoticeId: row.payment_notice_id,
        templateId: row.template_id,
        channelConfigId: row.channel_config_id,
        deliveryStatusCode: row.delivery_status_code,
        recipientProfileId: row.recipient_profile_id!,
        createdAt: row.created_at,
        idempotencyKey: row.idempotency_key,
      };
    }
    return this.messages.get(id) ?? null;
  }

  async createMessage(message: StoredNotificationMessage): Promise<StoredNotificationMessage> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .insertInto('notify.notification_messages')
        .values({
          id: message.id,
          service_request_id: message.serviceRequestId,
          balagh_id: message.balaghId,
          payment_notice_id: message.paymentNoticeId,
          template_id: message.templateId,
          channel_config_id: message.channelConfigId,
          delivery_status_code: message.deliveryStatusCode,
          recipient_profile_id: message.recipientProfileId,
          created_at: message.createdAt,
          created_by_profile_id: null,
          correlation_id: null,
          idempotency_key: message.idempotencyKey,
        })
        .execute();
      return message;
    }
    this.messages.set(message.id, message);
    return message;
  }

  async updateMessageStatus(id: string, status: string): Promise<StoredNotificationMessage> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .updateTable('notify.notification_messages')
        .set({ delivery_status_code: status })
        .where('id', '=', id)
        .execute();
      const updated = await this.findMessageById(id);
      if (!updated) throw new Error('Message not found after update.');
      return updated;
    }
    const existing = this.messages.get(id);
    if (!existing) throw new Error('Message not found.');
    const updated = { ...existing, deliveryStatusCode: status };
    this.messages.set(id, updated);
    return updated;
  }

  async createTemplate(template: StoredNotificationTemplate): Promise<StoredNotificationTemplate> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .insertInto('notify.notification_templates')
        .values({
          id: template.id,
          code: template.code,
          name: template.name,
          channel_code: template.channelCode,
          is_active: template.isActive,
          created_at: new Date(),
          created_by_profile_id: null,
          updated_at: null,
          updated_by_profile_id: null,
        })
        .execute();
      return template;
    }
    this.templates.set(template.code, template);
    return template;
  }

  async findTemplateByCode(code: string): Promise<StoredNotificationTemplate | null> {
    if (this.dbService.isInitialized) {
      const row = await this.dbService.db
        .selectFrom('notify.notification_templates')
        .selectAll()
        .where('code', '=', code)
        .executeTakeFirst();
      if (!row) return null;
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        channelCode: row.channel_code,
        isActive: row.is_active,
      };
    }
    return this.templates.get(code) ?? null;
  }

  async createChannelConfig(
    config: StoredNotificationChannelConfiguration,
  ): Promise<StoredNotificationChannelConfiguration> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .insertInto('notify.notification_channel_configurations')
        .values({
          id: config.id,
          channel_code: config.channelCode,
          is_enabled: config.isEnabled,
          config_label: config.configLabel,
          created_at: new Date(),
          created_by_profile_id: null,
          updated_at: null,
          updated_by_profile_id: null,
        })
        .execute();
      return config;
    }
    this.channelConfigs.set(config.channelCode, config);
    return config;
  }

  async findChannelConfigByCode(
    channelCode: string,
  ): Promise<StoredNotificationChannelConfiguration | null> {
    if (this.dbService.isInitialized) {
      const row = await this.dbService.db
        .selectFrom('notify.notification_channel_configurations')
        .selectAll()
        .where('channel_code', '=', channelCode)
        .executeTakeFirst();
      if (!row) return null;
      return {
        id: row.id,
        channelCode: row.channel_code,
        isEnabled: row.is_enabled,
        configLabel: row.config_label,
      };
    }
    return this.channelConfigs.get(channelCode) ?? null;
  }

  async createDeliveryAttempt(attempt: StoredDeliveryAttempt): Promise<StoredDeliveryAttempt> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .insertInto('notify.delivery_attempts')
        .values({
          id: attempt.id,
          notification_message_id: attempt.notificationMessageId,
          attempt_number: attempt.attemptNumber,
          attempt_status_code: attempt.attemptStatusCode,
          provider_reference: attempt.providerReference,
          failure_reason_safe: attempt.failureReasonSafe,
          attempted_at: attempt.attemptedAt,
          correlation_id: null,
          created_at: new Date(),
        })
        .execute();
      return attempt;
    }
    this.deliveryAttempts.push(attempt);
    return attempt;
  }

  async listAttemptsForMessage(messageId: string): Promise<StoredDeliveryAttempt[]> {
    if (this.dbService.isInitialized) {
      const rows = await this.dbService.db
        .selectFrom('notify.delivery_attempts')
        .selectAll()
        .where('notification_message_id', '=', messageId)
        .execute();
      return rows.map((row) => ({
        id: row.id,
        notificationMessageId: row.notification_message_id,
        attemptNumber: row.attempt_number,
        attemptStatusCode: row.attempt_status_code,
        providerReference: row.provider_reference,
        failureReasonSafe: row.failure_reason_safe,
        attemptedAt: row.attempted_at,
      }));
    }
    return this.deliveryAttempts.filter((a) => a.notificationMessageId === messageId);
  }

  async findReadState(
    messageId: string,
    recipientId: string,
  ): Promise<StoredNotificationReadState | null> {
    if (this.dbService.isInitialized) {
      const row = await this.dbService.db
        .selectFrom('notify.notification_read_states')
        .selectAll()
        .where('notification_message_id', '=', messageId)
        .where('recipient_profile_id', '=', recipientId)
        .executeTakeFirst();
      if (!row) return null;
      return {
        id: row.id,
        notificationMessageId: row.notification_message_id,
        recipientProfileId: row.recipient_profile_id,
        readStatusCode: row.read_status_code,
        firstReadAt: row.first_read_at,
        latestAcknowledgedAt: row.latest_acknowledged_at,
        readSourceChannelCode: row.read_source_channel_code,
      };
    }
    return this.readStates.get(`${messageId}:${recipientId}`) ?? null;
  }

  async createReadState(state: StoredNotificationReadState): Promise<StoredNotificationReadState> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .insertInto('notify.notification_read_states')
        .values({
          id: state.id,
          notification_message_id: state.notificationMessageId,
          recipient_profile_id: state.recipientProfileId,
          read_status_code: state.readStatusCode,
          first_read_at: state.firstReadAt,
          latest_acknowledged_at: state.latestAcknowledgedAt,
          read_source_channel_code: state.readSourceChannelCode,
          created_at: new Date(),
          updated_at: null,
        })
        .execute();
      return state;
    }
    this.readStates.set(`${state.notificationMessageId}:${state.recipientProfileId}`, state);
    return state;
  }

  async updateReadState(
    id: string,
    updates: Partial<StoredNotificationReadState>,
  ): Promise<StoredNotificationReadState> {
    if (this.dbService.isInitialized) {
      const dbUpdates: {
        read_status_code?: string;
        first_read_at?: Date | null;
        latest_acknowledged_at?: Date | null;
        read_source_channel_code?: string | null;
      } = {};
      if (updates.readStatusCode !== undefined) dbUpdates.read_status_code = updates.readStatusCode;
      if (updates.firstReadAt !== undefined) dbUpdates.first_read_at = updates.firstReadAt;
      if (updates.latestAcknowledgedAt !== undefined)
        dbUpdates.latest_acknowledged_at = updates.latestAcknowledgedAt;
      if (updates.readSourceChannelCode !== undefined)
        dbUpdates.read_source_channel_code = updates.readSourceChannelCode;

      await this.dbService.db
        .updateTable('notify.notification_read_states')
        .set(dbUpdates)
        .where('id', '=', id)
        .execute();

      // Find by ID is not a direct repository method but we can query it
      const row = await this.dbService.db
        .selectFrom('notify.notification_read_states')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
      if (!row) throw new Error('Read state not found after update.');
      return {
        id: row.id,
        notificationMessageId: row.notification_message_id,
        recipientProfileId: row.recipient_profile_id,
        readStatusCode: row.read_status_code,
        firstReadAt: row.first_read_at,
        latestAcknowledgedAt: row.latest_acknowledged_at,
        readSourceChannelCode: row.read_source_channel_code,
      };
    }

    let foundKey: string | null = null;
    let foundState: StoredNotificationReadState | null = null;
    for (const [key, state] of this.readStates.entries()) {
      if (state.id === id) {
        foundKey = key;
        foundState = state;
        break;
      }
    }
    if (!foundState || !foundKey) throw new Error('Read state not found.');
    const updated = { ...foundState, ...updates };
    this.readStates.set(foundKey, updated);
    return updated;
  }

  async listMessagesForRecipient(recipientId: string): Promise<StoredNotificationMessage[]> {
    if (this.dbService.isInitialized) {
      const rows = await this.dbService.db
        .selectFrom('notify.notification_messages')
        .selectAll()
        .where('recipient_profile_id', '=', recipientId)
        .execute();
      return rows.map((row) => ({
        id: row.id,
        serviceRequestId: row.service_request_id,
        balaghId: row.balagh_id,
        paymentNoticeId: row.payment_notice_id,
        templateId: row.template_id,
        channelConfigId: row.channel_config_id,
        deliveryStatusCode: row.delivery_status_code,
        recipientProfileId: row.recipient_profile_id!,
        createdAt: row.created_at,
        idempotencyKey: row.idempotency_key,
      }));
    }
    return [...this.messages.values()].filter((m) => m.recipientProfileId === recipientId);
  }

  async listReadStatesForRecipient(recipientId: string): Promise<StoredNotificationReadState[]> {
    if (this.dbService.isInitialized) {
      const rows = await this.dbService.db
        .selectFrom('notify.notification_read_states')
        .selectAll()
        .where('recipient_profile_id', '=', recipientId)
        .execute();
      return rows.map((row) => ({
        id: row.id,
        notificationMessageId: row.notification_message_id,
        recipientProfileId: row.recipient_profile_id,
        readStatusCode: row.read_status_code,
        firstReadAt: row.first_read_at,
        latestAcknowledgedAt: row.latest_acknowledged_at,
        readSourceChannelCode: row.read_source_channel_code,
      }));
    }
    return [...this.readStates.values()].filter((s) => s.recipientProfileId === recipientId);
  }

  async createOutboxMessage(
    outboxMsg: StoredNotificationOutboxMessage,
  ): Promise<StoredNotificationOutboxMessage> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .insertInto('notify.notification_outbox_messages')
        .values({
          id: outboxMsg.id,
          notification_message_id: outboxMsg.notificationMessageId,
          payload_ref: outboxMsg.payloadRef,
          publication_state: outboxMsg.publicationState,
          attempt_count: outboxMsg.attemptCount,
          last_error: outboxMsg.lastError,
          next_attempt_at: outboxMsg.nextAttemptAt,
          published_at: null,
          idempotency_key: null,
          created_at: new Date(),
          correlation_id: null,
        })
        .execute();
      return outboxMsg;
    }
    this.outbox.set(outboxMsg.id, outboxMsg);
    return outboxMsg;
  }

  async listPendingOutboxMessages(): Promise<StoredNotificationOutboxMessage[]> {
    if (this.dbService.isInitialized) {
      const rows = await this.dbService.db
        .selectFrom('notify.notification_outbox_messages')
        .selectAll()
        .where('publication_state', 'in', ['pending', 'retry'])
        .execute();
      return rows.map((row) => ({
        id: row.id,
        notificationMessageId: row.notification_message_id,
        payloadRef: row.payload_ref,
        publicationState: row.publication_state,
        attemptCount: row.attempt_count,
        lastError: row.last_error,
        nextAttemptAt: row.next_attempt_at,
      }));
    }
    return [...this.outbox.values()].filter((o) => ['pending', 'retry'].includes(o.publicationState));
  }

  async updateOutboxMessage(
    id: string,
    updates: Partial<StoredNotificationOutboxMessage>,
  ): Promise<StoredNotificationOutboxMessage> {
    if (this.dbService.isInitialized) {
      const dbUpdates: {
        publication_state?: string;
        attempt_count?: number;
        last_error?: string | null;
        next_attempt_at?: Date | null;
      } = {};
      if (updates.publicationState !== undefined)
        dbUpdates.publication_state = updates.publicationState;
      if (updates.attemptCount !== undefined) dbUpdates.attempt_count = updates.attemptCount;
      if (updates.lastError !== undefined) dbUpdates.last_error = updates.lastError;
      if (updates.nextAttemptAt !== undefined) dbUpdates.next_attempt_at = updates.nextAttemptAt;

      await this.dbService.db
        .updateTable('notify.notification_outbox_messages')
        .set(dbUpdates)
        .where('id', '=', id)
        .execute();

      const row = await this.dbService.db
        .selectFrom('notify.notification_outbox_messages')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
      if (!row) throw new Error('Outbox message not found after update.');
      return {
        id: row.id,
        notificationMessageId: row.notification_message_id,
        payloadRef: row.payload_ref,
        publicationState: row.publication_state,
        attemptCount: row.attempt_count,
        lastError: row.last_error,
        nextAttemptAt: row.next_attempt_at,
      };
    }

    const existing = this.outbox.get(id);
    if (!existing) throw new Error('Outbox message not found.');
    const updated = { ...existing, ...updates };
    this.outbox.set(id, updated);
    return updated;
  }

  async registerDeviceToken(token: StoredDeviceToken): Promise<StoredDeviceToken> {
    if (this.dbService.isInitialized) {
      const existing = await this.dbService.db
        .selectFrom('notify.device_tokens')
        .selectAll()
        .where('device_token', '=', token.deviceToken)
        .executeTakeFirst();

      if (existing) {
        await this.dbService.db
          .updateTable('notify.device_tokens')
          .set({
            user_profile_id: token.userProfileId,
            device_type: token.deviceType,
            is_active: token.isActive,
            updated_at: new Date(),
          })
          .where('device_token', '=', token.deviceToken)
          .execute();
      } else {
        await this.dbService.db
          .insertInto('notify.device_tokens')
          .values({
            id: token.id,
            user_profile_id: token.userProfileId,
            device_token: token.deviceToken,
            device_type: token.deviceType,
            is_active: token.isActive,
            created_at: token.createdAt,
            updated_at: token.updatedAt,
          })
          .execute();
      }
      return token;
    }

    this.deviceTokens.set(token.deviceToken, token);
    return token;
  }

  async listDeviceTokensForUser(userProfileId: string): Promise<StoredDeviceToken[]> {
    if (this.dbService.isInitialized) {
      const rows = await this.dbService.db
        .selectFrom('notify.device_tokens')
        .selectAll()
        .where('user_profile_id', '=', userProfileId)
        .where('is_active', '=', true)
        .execute();

      return rows.map((row) => ({
        id: row.id,
        userProfileId: row.user_profile_id,
        deviceToken: row.device_token,
        deviceType: row.device_type,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    }

    return [...this.deviceTokens.values()].filter(
      (t) => t.userProfileId === userProfileId && t.isActive,
    );
  }

  async unregisterDeviceToken(deviceToken: string): Promise<void> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .updateTable('notify.device_tokens')
        .set({
          is_active: false,
          updated_at: new Date(),
        })
        .where('device_token', '=', deviceToken)
        .execute();
      return;
    }

    const existing = this.deviceTokens.get(deviceToken);
    if (existing) {
      this.deviceTokens.set(deviceToken, {
        ...existing,
        isActive: false,
        updatedAt: new Date(),
      });
    }
  }
}
