import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  NOTIFICATIONS_REPOSITORY,
  type NotificationsRepository,
  type StoredNotificationMessage,
  type StoredNotificationOutboxMessage,
  type StoredDeliveryAttempt,
  type StoredNotificationReadState,
  type StoredDeviceToken,
} from './notifications.repository.js';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(NOTIFICATIONS_REPOSITORY)
    private readonly repository: NotificationsRepository,
  ) {}

  async enqueueNotification(input: {
    serviceRequestId: string | null;
    balaghId: string | null;
    paymentNoticeId: string | null;
    recipientProfileId: string;
    templateCode: string;
    payloadRef: string | null;
    idempotencyKey: string | null;
  }): Promise<StoredNotificationMessage> {
    const template = await this.repository.findTemplateByCode(
      input.templateCode,
    );
    if (!template) {
      throw new NotFoundException(
        `Notification template "${input.templateCode}" not found.`,
      );
    }

    if (!template.isActive) {
      throw new BadRequestException(
        `Notification template "${input.templateCode}" is inactive.`,
      );
    }

    const messageId = randomUUID();
    const message: StoredNotificationMessage = {
      id: messageId,
      serviceRequestId: input.serviceRequestId,
      balaghId: input.balaghId,
      paymentNoticeId: input.paymentNoticeId,
      templateId: template.id,
      channelConfigId: null,
      deliveryStatusCode: 'pending',
      recipientProfileId: input.recipientProfileId,
      createdAt: new Date(),
      idempotencyKey: input.idempotencyKey,
    };

    const createdMessage = await this.repository.createMessage(message);

    // Enqueue in outbox queue
    const outbox: StoredNotificationOutboxMessage = {
      id: randomUUID(),
      notificationMessageId: messageId,
      payloadRef: input.payloadRef,
      publicationState: 'pending',
      attemptCount: 0,
      lastError: null,
      nextAttemptAt: new Date(),
    };
    await this.repository.createOutboxMessage(outbox);

    return createdMessage;
  }

  async listNotificationsForRecipient(recipientProfileId: string): Promise<
    Array<{
      message: StoredNotificationMessage;
      readState: StoredNotificationReadState | null;
    }>
  > {
    const messages =
      await this.repository.listMessagesForRecipient(recipientProfileId);
    const result: Array<{
      message: StoredNotificationMessage;
      readState: StoredNotificationReadState | null;
    }> = [];

    for (const msg of messages) {
      const readState = await this.repository.findReadState(
        msg.id,
        recipientProfileId,
      );
      result.push({ message: msg, readState });
    }

    // Sort by newest first
    return result.sort(
      (a, b) => b.message.createdAt.getTime() - a.message.createdAt.getTime(),
    );
  }

  async markAsRead(
    messageId: string,
    recipientProfileId: string,
    channelCode: string | null = 'in_app',
  ): Promise<StoredNotificationReadState> {
    const message = await this.repository.findMessageById(messageId);
    if (!message) {
      throw new NotFoundException('Notification message not found.');
    }

    if (message.recipientProfileId !== recipientProfileId) {
      throw new BadRequestException('Recipient profile ID mismatch.');
    }

    const existing = await this.repository.findReadState(
      messageId,
      recipientProfileId,
    );
    if (existing) {
      return this.repository.updateReadState(existing.id, {
        readStatusCode: 'read',
        latestAcknowledgedAt: new Date(),
        readSourceChannelCode: channelCode,
      });
    }

    const now = new Date();
    const newState: StoredNotificationReadState = {
      id: randomUUID(),
      notificationMessageId: messageId,
      recipientProfileId,
      readStatusCode: 'read',
      firstReadAt: now,
      latestAcknowledgedAt: now,
      readSourceChannelCode: channelCode,
    };

    return this.repository.createReadState(newState);
  }

  async processOutboxDelivery(
    outboxId: string,
    success: boolean,
    details: { error?: string | null; providerRef?: string | null } = {},
  ): Promise<StoredNotificationOutboxMessage> {
    const pendingList = await this.repository.listPendingOutboxMessages();
    const outbox = pendingList.find((o) => o.id === outboxId);
    if (!outbox) {
      throw new NotFoundException('Pending outbox message not found.');
    }

    const attemptNumber = outbox.attemptCount + 1;
    const attemptStatus = success ? 'success' : 'failure';

    // Record delivery attempt evidence
    if (outbox.notificationMessageId) {
      const attempt: StoredDeliveryAttempt = {
        id: randomUUID(),
        notificationMessageId: outbox.notificationMessageId,
        attemptNumber,
        attemptStatusCode: attemptStatus,
        providerReference: details.providerRef ?? null,
        failureReasonSafe: details.error ?? null,
        attemptedAt: new Date(),
      };
      await this.repository.createDeliveryAttempt(attempt);
    }

    if (success) {
      if (outbox.notificationMessageId) {
        await this.repository.updateMessageStatus(
          outbox.notificationMessageId,
          'sent',
        );
      }
      return this.repository.updateOutboxMessage(outboxId, {
        publicationState: 'processed',
        attemptCount: attemptNumber,
        lastError: null,
        nextAttemptAt: null,
      });
    } else {
      const isFailedPermanently = attemptNumber >= 3; // Max 3 attempts
      const nextState = isFailedPermanently ? 'failed' : 'pending';
      const nextAttemptTime = isFailedPermanently
        ? null
        : new Date(Date.now() + 60000); // retry in 1 min

      if (isFailedPermanently && outbox.notificationMessageId) {
        await this.repository.updateMessageStatus(
          outbox.notificationMessageId,
          'failed',
        );
      }

      return this.repository.updateOutboxMessage(outboxId, {
        publicationState: nextState,
        attemptCount: attemptNumber,
        lastError: details.error ?? 'Unknown error',
        nextAttemptAt: nextAttemptTime,
      });
    }
  }

  async registerDeviceToken(input: {
    userProfileId: string;
    deviceToken: string;
    deviceType: string;
  }): Promise<StoredDeviceToken> {
    if (!['ios', 'android', 'web'].includes(input.deviceType)) {
      throw new BadRequestException('Invalid device type. Must be ios, android, or web.');
    }
    const token: StoredDeviceToken = {
      id: randomUUID(),
      userProfileId: input.userProfileId,
      deviceToken: input.deviceToken,
      deviceType: input.deviceType,
      isActive: true,
      createdAt: new Date(),
      updatedAt: null,
    };
    return this.repository.registerDeviceToken(token);
  }

  async unregisterDeviceToken(deviceToken: string): Promise<void> {
    return this.repository.unregisterDeviceToken(deviceToken);
  }
}
