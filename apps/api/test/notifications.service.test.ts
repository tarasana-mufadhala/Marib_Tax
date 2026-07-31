import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { NotificationsMemoryRepository } from '../src/notifications/notifications.memory-repository.js';
import { NotificationsService } from '../src/notifications/notifications.service.js';

describe('NotificationsService', () => {
  it('manages enqueuing templates, checking inboxes, read states, and delivery attempts', async () => {
    const repository = new NotificationsMemoryRepository();
    const service = new NotificationsService(repository);

    const recipientProfileId = randomUUID();
    const serviceRequestId = randomUUID();

    // Setup active template
    await repository.createTemplate({
      id: randomUUID(),
      code: 'REQ_SUBMITTED',
      name: 'معاملة مقدمة للمراجعة',
      channelCode: 'in_app',
      isActive: true,
    });

    // 1. Enqueue notification
    const msg = await service.enqueueNotification({
      serviceRequestId,
      balaghId: null,
      paymentNoticeId: null,
      recipientProfileId,
      templateCode: 'REQ_SUBMITTED',
      payloadRef: 'payload-ref-123',
      idempotencyKey: 'idemp-key-123',
    });

    expect(msg.deliveryStatusCode).toBe('pending');
    expect(msg.recipientProfileId).toBe(recipientProfileId);

    // Verify outbox exists
    const pendingList = await repository.listPendingOutboxMessages();
    expect(pendingList).toHaveLength(1);
    const outboxMsg = pendingList[0]!;
    expect(outboxMsg.notificationMessageId).toBe(msg.id);

    // 2. Deliver outbox message (failure first, then success)
    const outboxAfterFail = await service.processOutboxDelivery(
      outboxMsg.id,
      false,
      {
        error: 'مزود خدمة SMS غير متاح حالياً',
      },
    );
    expect(outboxAfterFail.attemptCount).toBe(1);
    expect(outboxAfterFail.publicationState).toBe('pending'); // schedules retry

    // Mark successful on retry
    const outboxAfterSuccess = await service.processOutboxDelivery(
      outboxMsg.id,
      true,
      {
        providerRef: 'sms-provider-id-9988',
      },
    );
    expect(outboxAfterSuccess.attemptCount).toBe(2);
    expect(outboxAfterSuccess.publicationState).toBe('processed');

    // Root message should be sent
    const updatedMsg = await repository.findMessageById(msg.id);
    expect(updatedMsg?.deliveryStatusCode).toBe('sent');

    // 3. List recipient notifications (inbox)
    const inbox =
      await service.listNotificationsForRecipient(recipientProfileId);
    expect(inbox).toHaveLength(1);
    expect(inbox[0]?.message.id).toBe(msg.id);
    expect(inbox[0]?.readState).toBeNull(); // unread

    // 4. Mark as read
    const readState = await service.markAsRead(
      msg.id,
      recipientProfileId,
      'in_app',
    );
    expect(readState.readStatusCode).toBe('read');
    expect(readState.firstReadAt).toBeDefined();

    const inboxAfterRead =
      await service.listNotificationsForRecipient(recipientProfileId);
    expect(inboxAfterRead[0]?.readState?.readStatusCode).toBe('read');
  });
});
