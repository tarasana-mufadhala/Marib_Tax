import type { DatabaseService } from '../database/database.service.js';

/**
 * سجل أحداث المصادقة (identity.auth_events) — مصدر تقريري REP-18 و REP-27.
 * التسجيل best-effort: لا يُفشل مسار المصادقة إن تعذّرت الكتابة.
 */
export function recordAuthEvent(
  db: DatabaseService | undefined,
  eventType: string,
  identifier: string,
  detail?: string,
  channel = 'sms',
): void {
  if (!db?.isInitialized) return;
  db.db
    .insertInto('identity.auth_events' as any)
    .values({
      id: crypto.randomUUID(),
      event_type: eventType,
      identifier,
      channel,
      detail: detail ?? null,
      created_at: new Date(),
    } as any)
    .execute()
    .catch(() => undefined);
}
