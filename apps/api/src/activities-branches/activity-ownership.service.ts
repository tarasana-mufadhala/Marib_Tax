import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { DatabaseService } from '../database/database.service.js';
import { DomainException } from '../http/domain-exception.js';
import {
  VERIFIED_ACTOR,
  type AuthenticatedRequest,
} from '../authn/bearer-actor-context.resolver.js';

/** استعلامات الملكية، مفصولة عن قرارها ليبقى القرار قابلاً للاختبار. */
export interface ActivityOwnershipLookup {
  /** معرّفات المكلفين المرتبطة بحساب المستخدم. */
  linkedTaxpayerIds(actorId: string): Promise<string[]>;
  taxpayerIdOfActivity(activityId: string): Promise<string | null>;
  activityIdOfBranch(branchId: string): Promise<string | null>;
}

export const ACTIVITY_OWNERSHIP_LOOKUP = Symbol(
  'marib-tax:activity-ownership-lookup',
);

@Injectable()
export class ActivityOwnershipKyselyLookup implements ActivityOwnershipLookup {
  constructor(private readonly db: DatabaseService) {}

  async linkedTaxpayerIds(actorId: string): Promise<string[]> {
    const result = await sql<{ taxpayer_id: string }>`
      select taxpayer_id
      from registry.taxpayer_account_links
      where user_profile_id = ${actorId}::uuid
        and active_state_code = 'active'
    `.execute(this.db.db);
    return result.rows.map((row) => row.taxpayer_id);
  }

  async taxpayerIdOfActivity(activityId: string): Promise<string | null> {
    const result = await sql<{ taxpayer_id: string }>`
      select taxpayer_id from masterdata.commercial_activities
      where id = ${activityId}::uuid
    `.execute(this.db.db);
    return result.rows[0]?.taxpayer_id ?? null;
  }

  async activityIdOfBranch(branchId: string): Promise<string | null> {
    const result = await sql<{ commercial_activity_id: string }>`
      select commercial_activity_id from masterdata.branches
      where id = ${branchId}::uuid
    `.execute(this.db.db);
    return result.rows[0]?.commercial_activity_id ?? null;
  }
}

/**
 * تقييد الوصول إلى الأنشطة والفروع والعناوين بملكيتها.
 *
 * صلاحيتا `taxpayer.profile.read/update` يملكهما كل مكلف، فلا تصلحان وحدهما
 * لحماية نقاط نهاية تستقبل معرّف مكلف أو نشاط في المسار: بدون هذا التقييد
 * يقرأ أي مكلف أنشطة غيره — بل ويضيف نشاطاً أو يغيّر عنواناً تحت سجل غيره —
 * بمجرد معرفة المعرّف.
 *
 * الموظف المخوّل بالمراجعة يمر بلا تقييد لأن عمله يقتضي الاطلاع على الجميع.
 */
@Injectable()
export class ActivityOwnershipService {
  constructor(
    @Inject(ACTIVITY_OWNERSHIP_LOOKUP)
    private readonly lookup: ActivityOwnershipLookup,
  ) {}

  /** الصلاحيات التي لا يحملها المكلف، وتميّز موظف المكتب. */
  private static readonly STAFF_MARKERS = [
    'request.review',
    'balagh.review',
    'masterdata.manage',
  ];

  private isStaff(request: AuthenticatedRequest): boolean {
    const permissions = request[VERIFIED_ACTOR]?.permissions ?? [];
    return ActivityOwnershipService.STAFF_MARKERS.some((marker) =>
      (permissions as readonly string[]).includes(marker),
    );
  }

  private actorId(request: AuthenticatedRequest): string {
    const actorId = request[VERIFIED_ACTOR]?.actorId;
    if (!actorId) throw DomainException.forbidden('تعذّر التحقق من هويتك');
    return actorId;
  }

  async assertMayAccessTaxpayer(
    request: AuthenticatedRequest,
    taxpayerId: string,
  ): Promise<void> {
    if (this.isStaff(request)) return;
    const linked = await this.lookup.linkedTaxpayerIds(this.actorId(request));
    if (!linked.includes(taxpayerId)) {
      // «غير موجود» لا «ممنوع»: الفرق بينهما يكشف أي المعرّفات حقيقية.
      throw DomainException.notFound('السجل المطلوب غير موجود');
    }
  }

  async assertMayAccessActivity(
    request: AuthenticatedRequest,
    activityId: string,
  ): Promise<void> {
    if (this.isStaff(request)) return;
    const taxpayerId = await this.lookup.taxpayerIdOfActivity(activityId);
    if (!taxpayerId) throw DomainException.notFound('السجل المطلوب غير موجود');
    await this.assertMayAccessTaxpayer(request, taxpayerId);
  }

  async assertMayAccessBranch(
    request: AuthenticatedRequest,
    branchId: string,
  ): Promise<void> {
    if (this.isStaff(request)) return;
    const activityId = await this.lookup.activityIdOfBranch(branchId);
    if (!activityId) throw DomainException.notFound('السجل المطلوب غير موجود');
    await this.assertMayAccessActivity(request, activityId);
  }
}
