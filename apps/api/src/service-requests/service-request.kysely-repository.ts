import { Injectable, PreconditionFailedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { sql } from 'kysely';
import {
  serviceCatalog,
  type ServiceCode,
  type ServiceRequestListItem,
  type ServiceRequestStatus,
} from '@marib-tax/contracts';
import { DatabaseService } from '../database/database.service.js';
import {
  type ServiceRequestRepository,
  type StoredServiceRequest,
} from './service-request.repository.js';

interface RequestRow {
  id: string;
  public_ref: string | null;
  service_code: string;
  status_code: string;
  created_by_profile_id: string | null;
  created_at: Date;
  updated_at: Date | null;
  submitted_at: Date | null;
  payload: unknown;
  schema_version: string | null;
}

/**
 * تخزين خدمات القسم 4.3 (FR-101..105) في `requests.service_requests`.
 *
 * رمز الخدمة يُمثَّل بصف في `requests.service_types` يُنشأ عند أول استعمال
 * من كتالوج العقود، فلا تعتمد النقاط على بذر مسبق للقاعدة.
 */
@Injectable()
export class ServiceRequestKyselyRepository implements ServiceRequestRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(request: StoredServiceRequest): Promise<void> {
    const serviceTypeId = await this.serviceTypeId(request.serviceCode);
    const taxpayerId = await this.taxpayerIdOf(request.ownerActorId);

    await this.db.db.transaction().execute(async (trx) => {
      await sql`
        insert into requests.service_requests
          (id, public_ref, service_type_id, taxpayer_id, status_code,
           created_at, created_by_profile_id, updated_at, updated_by_profile_id)
        values (${request.id}::uuid, ${publicRefFor(request.id)},
                ${serviceTypeId}::uuid, ${taxpayerId}::uuid, ${request.status},
                ${request.createdAt}::timestamptz, ${request.ownerActorId}::uuid,
                ${request.updatedAt}::timestamptz, ${request.ownerActorId}::uuid)
      `.execute(trx);

      await this.writeSnapshot(trx, request, 1);
      await this.writeHistory(trx, request, null, request.status);
    });
  }

  async findById(id: string): Promise<StoredServiceRequest | null> {
    const result = await sql<RequestRow>`
      select r.id,
             r.public_ref,
             st.code as service_code,
             r.status_code,
             r.created_by_profile_id,
             r.created_at,
             r.updated_at,
             r.submitted_at,
             p.payload,
             p.schema_version
      from requests.service_requests r
      join requests.service_types st on st.id = r.service_type_id
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
    if (!isServiceCode(row.service_code)) return null;
    return toStored(row, row.service_code);
  }

  async save(request: StoredServiceRequest): Promise<void> {
    const previous = await this.findById(request.id);

    await this.db.db.transaction().execute(async (trx) => {
      await sql`
        update requests.service_requests
        set status_code = ${request.status},
            updated_at = ${request.updatedAt}::timestamptz,
            updated_by_profile_id = ${request.ownerActorId}::uuid,
            submitted_at = ${request.submittedAt ?? null}::timestamptz
        where id = ${request.id}::uuid
      `.execute(trx);

      const next = await sql<{ next: number }>`
        select coalesce(max(snapshot_version), 0) + 1 as next
        from requests.request_form_snapshots
        where service_request_id = ${request.id}::uuid
      `.execute(trx);
      await this.writeSnapshot(trx, request, next.rows[0]?.next ?? 1);

      if (previous !== null && previous.status !== request.status) {
        await this.writeHistory(trx, request, previous.status, request.status);
      }
    });
  }

  async list(
    ownerActorId: string | undefined,
    limit: number,
  ): Promise<ServiceRequestListItem[]> {
    const codes = Object.keys(serviceCatalog);
    const result =
      ownerActorId === undefined
        ? await sql<RequestRow>`
            select r.id, r.public_ref, st.code as service_code, r.status_code,
                   r.created_by_profile_id, r.created_at, r.updated_at,
                   r.submitted_at, null as payload, null as schema_version
            from requests.service_requests r
            join requests.service_types st on st.id = r.service_type_id
            where r.archived_at is null and st.code = any(${codes})
            order by r.created_at desc
            limit ${limit}
          `.execute(this.db.db)
        : await sql<RequestRow>`
            select r.id, r.public_ref, st.code as service_code, r.status_code,
                   r.created_by_profile_id, r.created_at, r.updated_at,
                   r.submitted_at, null as payload, null as schema_version
            from requests.service_requests r
            join requests.service_types st on st.id = r.service_type_id
            where r.archived_at is null
              and st.code = any(${codes})
              and r.created_by_profile_id = ${ownerActorId}::uuid
            order by r.created_at desc
            limit ${limit}
          `.execute(this.db.db);

    return result.rows.filter((row) => isServiceCode(row.service_code)).map((row) => {
      const code = row.service_code as ServiceCode;
      return {
        id: row.id,
        publicRef: row.public_ref,
        serviceCode: code,
        serviceTitle: serviceCatalog[code].title,
        status: row.status_code as ServiceRequestStatus,
        createdAt: row.created_at.toISOString(),
        submittedAt: row.submitted_at?.toISOString() ?? null,
      };
    });
  }

  async attachedDocumentCodes(requestId: string): Promise<string[]> {
    const result = await sql<{ link_role_code: string | null }>`
      select l.link_role_code
      from files.attachment_links l
      where l.owner_type = 'service_request'
        and l.owner_id = ${requestId}::uuid
        and l.unlinked_at is null
    `.execute(this.db.db);

    return result.rows
      .map((row) => row.link_role_code)
      .filter((code): code is string => typeof code === 'string' && code.length > 0);
  }

  async isCompanyTaxpayer(ownerActorId: string): Promise<boolean> {
    const result = await sql<{ classification_code: string | null }>`
      select le.classification_code
      from registry.taxpayer_account_links tal
      join registry.taxpayer_legal_entity_associations tlea
        on tlea.taxpayer_id = tal.taxpayer_id
      join legal.legal_entities le on le.id = tlea.legal_entity_id
      where tal.user_profile_id = ${ownerActorId}::uuid
        and tal.active_state_code = 'active'
      limit 1
    `.execute(this.db.db);

    const code = result.rows[0]?.classification_code ?? '';
    // كل ما ليس مؤسسة فردية يُعامَل شركةً لأغراض المستندات المطلوبة.
    return code !== '' && code !== 'sole_proprietorship';
  }

  /**
   * هل يملك المكلف رقماً ضريبياً رسمياً؟
   *
   * المصدر هو جهة اتصال من نوع `tax_number` لا `taxpayers.public_ref`:
   * الأخير مرجع داخلي يُولَّد لكل مكلف عند تسجيله، فلو قيس عليه لظهر أن
   * الجميع يملكون رقماً ضريبياً، وحُجبت خدمة «استخراج رقم ضريبي» عمّن
   * وُجدت أصلاً من أجلهم.
   */
  async hasTaxNumber(ownerActorId: string): Promise<boolean> {
    const result = await sql<{ count: number }>`
      select count(*)::int as count
      from registry.taxpayer_account_links tal
      join registry.taxpayer_contacts tc on tc.taxpayer_id = tal.taxpayer_id
      where tal.user_profile_id = ${ownerActorId}::uuid
        and tal.active_state_code = 'active'
        and tc.contact_type_code = 'tax_number'
        and tc.is_active
        and btrim(tc.contact_value) <> ''
    `.execute(this.db.db);

    return (result.rows[0]?.count ?? 0) > 0;
  }

  async serviceCodeOf(requestId: string): Promise<ServiceCode | null> {
    const result = await sql<{ code: string }>`
      select st.code
      from requests.service_requests r
      join requests.service_types st on st.id = r.service_type_id
      where r.id = ${requestId}::uuid
      limit 1
    `.execute(this.db.db);

    const code = result.rows[0]?.code;
    return code !== undefined && isServiceCode(code) ? code : null;
  }

  // ---- أدوات داخلية ----

  private async writeSnapshot(
    trx: unknown,
    request: StoredServiceRequest,
    version: number,
  ): Promise<void> {
    const snapshotId = randomUUID();
    await sql`
      insert into requests.request_form_snapshots
        (id, service_request_id, snapshot_version, captured_at,
         captured_by_profile_id, schema_version, created_at)
      values (${snapshotId}::uuid, ${request.id}::uuid, ${version}, now(),
              ${request.ownerActorId}::uuid, ${request.schemaVersion}, now())
    `.execute(trx as never);

    await sql`
      insert into requests.request_form_snapshot_payloads
        (id, request_form_snapshot_id, schema_version, payload, created_at)
      values (${randomUUID()}::uuid, ${snapshotId}::uuid, ${request.schemaVersion},
              ${JSON.stringify(request.form)}::jsonb, now())
    `.execute(trx as never);
  }

  private async writeHistory(
    trx: unknown,
    request: StoredServiceRequest,
    from: string | null,
    to: string,
  ): Promise<void> {
    await sql`
      insert into requests.request_status_histories
        (id, service_request_id, changed_at, changed_by_profile_id,
         from_status_code, to_status_code, created_at)
      values (${randomUUID()}::uuid, ${request.id}::uuid, now(),
              ${request.ownerActorId}::uuid, ${from}, ${to}, now())
    `.execute(trx as never);
  }

  /** صف نوع الخدمة يُنشأ من الكتالوج عند أول استعمال. */
  private async serviceTypeId(code: ServiceCode): Promise<string> {
    const existing = await sql<{ id: string }>`
      select id from requests.service_types where code = ${code} limit 1
    `.execute(this.db.db);
    if (existing.rows[0]) return existing.rows[0].id;

    await sql`
      insert into requests.service_types (id, code, name, is_active, created_at)
      values (${randomUUID()}::uuid, ${code}, ${serviceCatalog[code].title}, true, now())
      on conflict (code) do nothing
    `.execute(this.db.db);

    const after = await sql<{ id: string }>`
      select id from requests.service_types where code = ${code} limit 1
    `.execute(this.db.db);
    const id = after.rows[0]?.id;
    if (!id) throw new Error(`تعذّر تهيئة نوع الخدمة ${code}`);
    return id;
  }

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
        'يجب إكمال بيانات المكلف قبل تقديم أي طلب',
      );
    }
    return taxpayerId;
  }
}

function isServiceCode(value: string): value is ServiceCode {
  return Object.prototype.hasOwnProperty.call(serviceCatalog, value);
}

function publicRefFor(id: string): string {
  return `REQ-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

function toStored(row: RequestRow, code: ServiceCode): StoredServiceRequest {
  return {
    id: row.id,
    publicRef: row.public_ref,
    serviceCode: code,
    schemaVersion: (row.schema_version ?? '1.0.0') as '1.0.0',
    status: row.status_code as ServiceRequestStatus,
    form: parsePayload(row.payload),
    ownerActorId: row.created_by_profile_id ?? '',
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
