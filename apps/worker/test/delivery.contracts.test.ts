import { describe, expect, it } from 'vitest';
import { DisabledNotificationProvider } from '../src/delivery.contracts.js';

describe('notification provider port', () => {
  it('exposes a disabled provider that never sends', async () => {
    const provider = new DisabledNotificationProvider();
    expect(provider.providerKey).toBe('disabled');
    await expect(
      provider.deliver({
        id: 'msg-1',
        notificationMessageId: 'notif-1',
        recipientProfileId: null,
        idempotencyKey: 'idem-1',
        channel: 'sms',
        payloadReference: 'payload-ref',
        targetPhoneNumber: null,
        targetDeviceTokens: [],
      }),
    ).rejects.toThrow('NOTIFICATION_DELIVERY_DISABLED');
  });

  it('does not accept Twilio credentials as an implicit enablement path', () => {
    const provider = new DisabledNotificationProvider();
    expect(provider.providerKey).not.toBe('twilio');
  });
});
