import { importPKCS8, SignJWT } from 'jose';

export interface ClaimedOutboxMessage {
  readonly id: string;
  readonly notificationMessageId: string;
  readonly recipientProfileId: string | null;
  readonly idempotencyKey: string;
  readonly channel: 'sms' | 'push' | 'in_app' | 'whatsapp';
  readonly payloadReference: string;
  readonly targetPhoneNumber: string | null;
  readonly targetDeviceTokens: string[];
}

export interface OutboxRepository {
  claimNext(): Promise<ClaimedOutboxMessage | null>;
  recordSucceeded(
    messageId: string,
    notificationMessageId: string,
    providerReference?: string,
  ): Promise<void>;
  recordFailed(
    messageId: string,
    notificationMessageId: string,
    safeReasonCode: string,
  ): Promise<void>;
}

export interface NotificationProviderPort {
  readonly providerKey: 'disabled' | 'twilio' | 'fcm' | 'local' | 'composite';
  deliver(message: ClaimedOutboxMessage): Promise<{ providerReference?: string } | void>;
}

export class DisabledNotificationProvider implements NotificationProviderPort {
  readonly providerKey = 'disabled' as const;

  deliver(message: ClaimedOutboxMessage): Promise<void> {
    void message;
    return Promise.reject(new Error('NOTIFICATION_DELIVERY_DISABLED'));
  }
}

export class LocalNotificationProvider implements NotificationProviderPort {
  readonly providerKey = 'local' as const;

  deliver(message: ClaimedOutboxMessage): Promise<void> {
    console.log(
      `[Worker Local Mock] Delivered message ${message.id} on channel ${message.channel}: ${message.payloadReference}`,
    );
    return Promise.resolve();
  }
}

export class TwilioNotificationProvider implements NotificationProviderPort {
  readonly providerKey = 'twilio' as const;

  constructor(
    private readonly accountSid?: string,
    private readonly authToken?: string,
    private readonly fromNumber?: string,
  ) {}

  async deliver(message: ClaimedOutboxMessage): Promise<{ providerReference?: string } | void> {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      console.log(
        `[Twilio SMS Mock] Send SMS to ${message.targetPhoneNumber || 'N/A'}: ${message.payloadReference}`,
      );
      return { providerReference: 'mock-twilio-sid-123' };
    }

    const toPhone = message.targetPhoneNumber;
    if (!toPhone) {
      throw new Error('NO_TARGET_PHONE_NUMBER');
    }

    const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
    const params = new URLSearchParams({
      To: toPhone,
      From: this.fromNumber,
      Body: message.payloadReference,
    });

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Twilio SMS send failed: ${res.status} - ${errText}`);
    }

    const json = (await res.json()) as { sid: string };
    return { providerReference: json.sid };
  }
}

export class FcmNotificationProvider implements NotificationProviderPort {
  readonly providerKey = 'fcm' as const;

  constructor(
    private readonly projectId?: string,
    private readonly clientEmail?: string,
    private readonly privateKey?: string,
  ) {}

  async deliver(message: ClaimedOutboxMessage): Promise<{ providerReference?: string } | void> {
    if (!this.projectId || !this.clientEmail || !this.privateKey) {
      console.log(
        `[FCM Push Mock] Send Push to tokens [${(message.targetDeviceTokens || []).join(', ')}]: ${message.payloadReference}`,
      );
      return { providerReference: 'mock-fcm-message-id-123' };
    }

    const tokens = message.targetDeviceTokens;
    if (!tokens || tokens.length === 0) {
      console.log(`[FCM] No active device tokens found for user ${message.recipientProfileId || 'N/A'}. Skipped.`);
      return;
    }

    // Get Google OAuth2 access token
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const pk = await importPKCS8(this.privateKey, 'RS256');
    const now = Math.floor(Date.now() / 1000);
    const jwt = await new SignJWT({
      iss: this.clientEmail,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: tokenUrl,
      exp: now + 3600,
      iat: now,
    })
      .setProtectedHeader({ alg: 'RS256' })
      .sign(pk);

    const tokenParams = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    });

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`FCM Google OAuth authentication failed: ${tokenRes.status} - ${errText}`);
    }

    const tokenData = (await tokenRes.json()) as { access_token: string };
    const accessToken = tokenData.access_token;

    // Send push to each device token
    const errors: string[] = [];
    let lastSid = '';

    for (const deviceToken of tokens) {
      try {
        const sendRes = await fetch(
          `https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: {
                token: deviceToken,
                notification: {
                  title: 'إشعار ضريبي',
                  body: message.payloadReference,
                },
              },
            }),
          },
        );

        if (!sendRes.ok) {
          const errText = await sendRes.text();
          errors.push(`FCM device send error: ${sendRes.status} - ${errText}`);
        } else {
          const resData = (await sendRes.json()) as { name: string };
          lastSid = resData.name;
        }
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
      }
    }

    if (errors.length > 0 && lastSid === '') {
      throw new Error(`FCM send failed: ${errors.join('; ')}`);
    }

    return { providerReference: lastSid || 'partial-success' };
  }
}

export class CompositeNotificationProvider implements NotificationProviderPort {
  readonly providerKey = 'composite' as const;

  constructor(
    private readonly smsProvider: NotificationProviderPort,
    private readonly pushProvider: NotificationProviderPort,
    private readonly localProvider: NotificationProviderPort,
  ) {}

  async deliver(message: ClaimedOutboxMessage): Promise<{ providerReference?: string } | void> {
    if (message.channel === 'sms') {
      return this.smsProvider.deliver(message);
    } else if (message.channel === 'push') {
      return this.pushProvider.deliver(message);
    } else {
      return this.localProvider.deliver(message);
    }
  }
}
