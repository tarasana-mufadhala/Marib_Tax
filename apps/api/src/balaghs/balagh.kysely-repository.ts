import { Injectable, PreconditionFailedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { sql } from 'kysely';
import type { BalaghType } from '@marib-tax/contracts';
import { DatabaseService } from '../database/database.service.js';
import {
  type BalaghListItem,
  type BalaghRepository,
  type StoredBalagh,
} from './balagh.repository.js';

interface BalaghRow {
  id: string;
  public_ref: string | null;
  balagh_type_code: string;
  status_code: string;
  filer_profile_id: string;
  created_at: Date;
  updated_at: Date | null;
  submitted_at: Date | null;
  payload: unknown;
  schema_version: string | null;
}

/**
 * تخزين البلاغات (FR-201..206) في مخطط `balaghat`.
 *
 * بيانات النموذج تُحفظ كلقطة JSON مُصدَّرة (`balagh_form_snapshot_payloads`)
 * لأن لكل نوع بلاغ حقولاً مختلفة، وكل تغيّر حالة يُسجَّل في
 * `balagh_status_histories` ليكون مسار المعاملة قابلاً للتدقيق.
 */
@Injectable()
export class BalaghKyselyRepository implements BalaghRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(balagh: StoredBalagh): Promise<void> {
    const taxpayerId = await this.taxpayerIdOf(balagh.ownerActorId);

    await this.db.db.transaction().execute(async (trx) => {
      await sql`
        insert into balaghat.balaghs
          (id, public_ref, balagh_type_code, filer_profile_id, taxpayer_id,
           status_code, created_at, created_by_profile_id, updated_at,
           updated_by_profile_id)
        values (${balagh.id}::uuid, ${publicRefFor(balagh.id)},
                ${balagh.balaghType}, ${balagh.ownerActorId}::uuid,
                ${taxpayerId}::uuid, ${balagh.status},
                ${balagh.createdAt}::timestamptz, ${balagh.ownerActorId}::uuid,
                ${balagh.updatedAt}::timestamptz, ${balagh.ownerActorId}::uuid)
      `.execute(trx);

      await this.writeSnapshot(trx, balagh, 1);
      await this.writeHistory(trx, balagh, null, balagh.status);
      await this.linkSelectedActivities(trx, balagh);
    });
  }

  async findById(id: string): Promise<StoredBalagh | null> {
    const result = await sql<BalaghRow>`
      select b.id,
             b.public_ref,
             b.balagh_type_code,
             b.status_code,
             b.filer_profile_id,
             b.created_at,
             b.updated_at,
             b.submitted_at,
             p.payload,
             p.schema_version
      from balaghat.balaghs b
      left join lateral (
        select pl.payload, pl.schema_version
        from balaghat.balagh_form_snapshots s
        join balaghat.balagh_form_snapshot_payloads pl
          on pl.balagh_form_snapshot_id = s.id
        where s.balagh_id = b.id
        order by s.snapshot_version desc
        limit 1
      ) p on true
      where b.id = ${id}::uuid and b.archived_at is null
      limit 1
    `.execute(this.db.db);

    const row = result.rows[0];
    return row ? toStored(row) : null;
  }

  async save(balagh: StoredBalagh): Promise<void> {
    const previous = await this.findById(balagh.id);

    await this.db.db.transaction().execute(async (trx) => {
      await sql`
        update balaghat.balaghs
        set status_code = ${balagh.status},
            updated_at = ${balagh.updatedAt}::timestamptz,
            updated_by_profile_id = ${balagh.ownerActorId}::uuid,
            submitted_at = ${balagh.submittedAt ?? null}::timestamptz
        where id = ${balagh.id}::uuid
      `.execute(trx);

      const next = await sql<{ next: number }>`
        select coalesce(max(snapshot_version), 0) + 1 as next
        from balaghat.balagh_form_snapshots
        where balagh_id = ${balagh.id}::uuid
      `.execute(trx);
      await this.writeSnapshot(trx, balagh, next.rows[0]?.next ?? 1);

      if (previous !== null && previous.status !== balagh.status) {
        await this.writeHistory(trx, balagh, previous.status, balagh.status);
      }
    });
  }

  async list(
    ownerActorId: string | undefined,
    limit: number,
  ): Promise<BalaghListItem[]> {
    const result =
      ownerActorId === undefined
        ? await sql<BalaghRow>`
            select id, public_ref, balagh_type_code, status_code,
                   filer_profile_id, created_at, updated_at, submitted_at,
                   null as payload, null as schema_version
            from balaghat.balaghs
            where archived_at is null
            order by created_at desc
            limit ${limit}
          `.execute(this.db.db)
        : await sql<BalaghRow>`
            select id, public_ref, balagh_type_code, status_code,
                   filer_profile_id, created_at, updated_at, submitted_at,
                   null as payload, null as schema_version
            from balaghat.balaghs
            where archived_at is null and filer_profile_id = ${ownerActorId}::uuid
            order by created_at desc
            limit ${limit}
          `.execute(this.db.db);

    return result.rows.map((row) => ({
      id: row.id,
      publicRef: row.public_ref,
      balaghType: row.balagh_type_code as BalaghType,
      status: row.status_code,
      createdAt: row.created_at.toISOString(),
      submittedAt: row.submitted_at?.toISOString() ?? null,
    }));
  }

  // ---- أدوات داخلية ----

  private async writeSnapshot(
    trx: unknown,
    balagh: StoredBalagh,
    version: number,
  ): Promise<void> {
    const snapshotId = randomUUID();
    await sql`
      insert into balaghat.balagh_form_snapshots
        (id, balagh_id, snapshot_version, captured_at, captured_by_profile_id,
         schema_version, created_at)
      values (${snapshotId}::uuid, ${balagh.id}::uuid, ${version}, now(),
              ${balagh.ownerActorId}::uuid, ${balagh.schemaVersion}, now())
    `.execute(trx as never);

    await sql`
      insert into balaghat.balagh_form_snapshot_payloads
        (id, balagh_form_snapshot_id, schema_version, payload, created_at)
      values (${randomUUID()}::uuid, ${snapshotId}::uuid, ${balagh.schemaVersion},
              ${JSON.stringify(balagh.formData)}::jsonb, now())
    `.execute(trx as never);
  }

  private async writeHistory(
    trx: unknown,
    balagh: StoredBalagh,
    from: string | null,
    to: string,
  ): Promise<void> {
    await sql`
      insert into balaghat.balagh_status_histories
        (id, balagh_id, changed_at, changed_by_profile_id,
         from_status_code, to_status_code, created_at)
      values (${randomUUID()}::uuid, ${balagh.id}::uuid, now(),
              ${balagh.ownerActorId}::uuid, ${from}, ${to}, now())
    `.execute(trx as never);
  }

  /**
   * FR-201 و FR-206 يختار فيهما المكلف أنشطته المستهدفة؛ نثبّت الاختيار
   * وقت التقديم حتى لا يتغيّر معناه إن عُدّل النشاط لاحقاً.
   */
  private async linkSelectedActivities(
    trx: unknown,
    balagh: StoredBalagh,
  ): Promise<void> {
    const data = balagh.formData as { activityIds?: unknown; activityId?: unknown };
    const ids = Array.isArray(data?.activityIds)
      ? data.activityIds.filter((v): v is string => typeof v === 'string')
      : typeof data?.activityId === 'string'
        ? [data.activityId]
        : [];

    for (const activityId of ids) {
      await sql`
        insert into balaghat.balagh_selected_activities
          (id, balagh_id, commercial_activity_id, created_at, created_by_profile_id)
        values (${randomUUID()}::uuid, ${balagh.id}::uuid, ${activityId}::uuid,
                now(), ${balagh.ownerActorId}::uuid)
        on conflict do nothing
      `.execute(trx as never);
    }
  }

  /** `balaghs.taxpayer_id` إلزامي: من لم يُكمل بياناته لا يستطيع فتح بلاغ. */
  private async taxpayerIdOf(userProfileId: string): Promise<string> {
    const result = await sql<{ taxpayer_id: string }>`
      select taxpayer_id from registry.taxpayer_account_links
      where user_profile_id = ${userProfileId}::uuid and active_state_code = 'active'
      order by created_at desc
      limit 1
    `.execute(this.db.db);

    const taxpayerId = result.rows[0]?.taxpayer_id;
    if (!taxpayerId) {
      throw new PreconditionFailedException(
        'يجب إكمال بيانات المكلف قبل فتح أي بلاغ',
      );
    }
    return taxpayerId;
  }
}

function publicRefFor(id: string): string {
  return `BLG-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

function toStored(row: BalaghRow): StoredBalagh {
  return {
    id: row.id,
    publicRef: row.public_ref,
    balaghType: row.balagh_type_code as BalaghType,
    status: row.status_code as StoredBalagh['status'],
    schemaVersion: (row.schema_version ?? '1.0.0') as '1.0.0',
    formData: parsePayload(row.payload),
    ownerActorId: row.filer_profile_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: (row.updated_at ?? row.created_at).toISOString(),
    submittedAt: row.submitted_at?.toISOString() ?? null,
  };
}

function parsePayload(payload: unknown): unknown {
  if (typeof payload !== 'string') return payload ?? {};
  try {
    return JSON.parse(payload);
  } catch {
    return {};
  }
}
