import {
  Injectable,
  Logger,
  PreconditionFailedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { sql } from 'kysely';
import type { ActivityAddressChangeTarget } from '@marib-tax/contracts';
import { DatabaseService } from '../database/database.service.js';
import {
  type RequestDraftRepository,
  type StoredRequestDraft,
} from './request-draft.repository.js';

const SERVICE_TYPE_CODE = 'ACTIVITY_ADDRESS_CHANGE';

interface RequestRow {
  id: string;
  status_code: string;
  created_at: Date;
  updated_at: Date | null;
  submitted_at: Date | null;
  created_by_profile_id: string | null;
  payload: unknown;
  schema_version: string | null;
}

/**
 * حفظ طلبات المكلف في القاعدة بدل الذاكرة.
 *
 * قبل هذا المستودع كانت الطلبات تُنشأ في الذاكرة فقط: تضيع بإعادة تشغيل
 * الخادم، ولا تظهر في سرد الموظفين (الذي يقرأ من القاعدة)، ولا يمكن ربط
 * مرفق بها. بيانات النموذج تُحفظ كلقطة JSON في
 * `requests.request_form_snapshot_payloads`، وكل تغيّر حالة يُسجَّل في
 * `requests.request_status_histories`.
 */
@Injectable()
export class RequestDraftKyselyRepository implements RequestDraftRepository {
  private readonly logger = new Logger(RequestDraftKyselyRepository.name);

  constructor(private readonly db: DatabaseService) {}

  async create(draft: StoredRequestDraft): Promise<void> {
    const serviceTypeId = await this.serviceTypeId();
    const taxpayerId = await this.taxpayerIdOf(draft.ownerActorId);

    await this.db.db.transaction().execute(async (trx) => {
      await sql`
        insert into requests.service_requests
          (id, public_ref, service_type_id, taxpayer_id, status_code,
           created_at, created_by_profile_id, updated_at, updated_by_profile_id)
        values (${draft.id}::uuid, ${publicRefFor(draft.id)}, ${serviceTypeId}::uuid,
                ${taxpayerId}::uuid, ${draft.status},
                ${draft.createdAt}::timestamptz, ${draft.ownerActorId}::uuid,
                ${draft.updatedAt}::timestamptz, ${draft.ownerActorId}::uuid)
      `.execute(trx);

      await this.writeSnapshot(trx, draft, 1);
      await this.writeHistory(trx, draft, null, draft.status);
    });
  }

  async findById(id: string): Promise<StoredRequestDraft | null> {
    const result = await sql<RequestRow>`
      select r.id,
             r.status_code,
             r.created_at,
             r.updated_at,
             r.submitted_at,
             r.created_by_profile_id,
             p.payload,
             p.schema_version
      from requests.service_requests r
      left join lateral (
        select pl.payload, pl.schema_version
        from requests.request_form_snapshots s
        join requests.request_form_snapshot_payloads pl
          on pl.request_form_snapshot_id = s.id
        where s.service_request_id = r.id
        order by s.snapshot_version desc
        limit 1
      ) p on true
      where r.id = ${id}::uuid and r.archived_at is null
      limit 1
    `.execute(this.db.db);

    const row = result.rows[0];
    if (!row) return null;
    return this.toDraft(row);
  }

  async save(draft: StoredRequestDraft): Promise<void> {
    const previous = await this.findById(draft.id);

    await this.db.db.transaction().execute(async (trx) => {
      await sql`
        update requests.service_requests
        set status_code = ${draft.status},
            updated_at = ${draft.updatedAt}::timestamptz,
            updated_by_profile_id = ${draft.ownerActorId}::uuid,
            submitted_at = ${draft.submittedAt ?? null}::timestamptz
        where id = ${draft.id}::uuid
      `.execute(trx);

      const versions = await sql<{ next: number }>`
        select coalesce(max(snapshot_version), 0) + 1 as next
        from requests.request_form_snapshots
        where service_request_id = ${draft.id}::uuid
      `.execute(trx);
      await this.writeSnapshot(trx, draft, versions.rows[0]?.next ?? 1);

      if (previous !== null && previous.status !== draft.status) {
        await this.writeHistory(trx, draft, previous.status, draft.status);
      }
    });
  }

  // ---- أدوات داخلية ----

  private async writeSnapshot(
    trx: unknown,
    draft: StoredRequestDraft,
    version: number,
  ): Promise<void> {
    const snapshotId = randomUUID();
    await sql`
      insert into requests.request_form_snapshots
        (id, service_request_id, snapshot_version, captured_at,
         captured_by_profile_id, schema_version, created_at)
      values (${snapshotId}::uuid, ${draft.id}::uuid, ${version}, now(),
              ${draft.ownerActorId}::uuid, ${draft.form.schemaVersion}, now())
    `.execute(trx as never);

    await sql`
      insert into requests.request_form_snapshot_payloads
        (id, request_form_snapshot_id, schema_version, payload, created_at)
      values (${randomUUID()}::uuid, ${snapshotId}::uuid,
              ${draft.form.schemaVersion},
              ${JSON.stringify(draft.form.data)}::jsonb, now())
    `.execute(trx as never);
  }

  private async writeHistory(
    trx: unknown,
    draft: StoredRequestDraft,
    from: string | null,
    to: string,
  ): Promise<void> {
    await sql`
      insert into requests.request_status_histories
        (id, service_request_id, changed_at, changed_by_profile_id,
         from_status_code, to_status_code, created_at)
      values (${randomUUID()}::uuid, ${draft.id}::uuid, now(),
              ${draft.ownerActorId}::uuid, ${from}, ${to}, now())
    `.execute(trx as never);
  }

  private toDraft(row: RequestRow): StoredRequestDraft {
    const targets = extractTargets(row.payload);
    const createdAt = row.created_at.toISOString();
    const updatedAt = (row.updated_at ?? row.created_at).toISOString();

    return {
      id: row.id,
      ownerActorId: row.created_by_profile_id ?? '',
      status: row.status_code as StoredRequestDraft['status'],
      form: {
        serviceType: 'activity_address_change',
        schemaVersion: (row.schema_version ??
          '1.0.0') as StoredRequestDraft['form']['schemaVersion'],
        data: { targets },
      },
      createdAt,
      updatedAt,
      ...(row.submitted_at === null
        ? {}
        : { submittedAt: row.submitted_at.toISOString() }),
    };
  }

  /** نوع الخدمة يُنشأ عند أول استعمال حتى لا يفشل الطلب على بيئة غير مبذورة. */
  private async serviceTypeId(): Promise<string> {
    const existing = await sql<{ id: string }>`
      select id from requests.service_types where code = ${SERVICE_TYPE_CODE} limit 1
    `.execute(this.db.db);
    if (existing.rows[0]) return existing.rows[0].id;

    const id = randomUUID();
    await sql`
      insert into requests.service_types (id, code, name, is_active, created_at)
      values (${id}::uuid, ${SERVICE_TYPE_CODE}, 'إخطار تغيير عنوان النشاط', true, now())
      on conflict (code) do nothing
    `.execute(this.db.db);

    const after = await sql<{ id: string }>`
      select id from requests.service_types where code = ${SERVICE_TYPE_CODE} limit 1
    `.execute(this.db.db);
    return after.rows[0]?.id ?? id;
  }

  /**
   * المكلف المرتبط بحساب المستخدم. `service_requests.taxpayer_id` إلزامي،
   * فمن لم يُكمل بياناته بعد لا يستطيع إنشاء طلب — وهو السلوك الصحيح.
   */
  private async taxpayerIdOf(userProfileId: string): Promise<string> {
    const result = await sql<{ taxpayer_id: string }>`
      select taxpayer_id from registry.taxpayer_account_links
      where user_profile_id = ${userProfileId}::uuid and active_state_code = 'active'
      order by created_at desc
      limit 1
    `.execute(this.db.db);

    const taxpayerId = result.rows[0]?.taxpayer_id;
    if (!taxpayerId) {
      // شرط عمل لا عطل خادم: يجب أن يصل المستخدم رسالة تقول له ما ينقصه.
      throw new PreconditionFailedException(
        'يجب إكمال بيانات المكلف قبل تقديم أي طلب',
      );
    }
    return taxpayerId;
  }
}

function publicRefFor(id: string): string {
  return `REQ-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

function extractTargets(payload: unknown): ActivityAddressChangeTarget[] {
  if (payload === null || payload === undefined) return [];
  const parsed = typeof payload === 'string' ? safeParse(payload) : payload;
  if (
    typeof parsed === 'object' &&
    parsed !== null &&
    Array.isArray((parsed as { targets?: unknown }).targets)
  ) {
    return (parsed as { targets: ActivityAddressChangeTarget[] }).targets;
  }
  return [];
}

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
