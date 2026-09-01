import { describe, expect, it } from 'vitest';
import type { PermissionCode } from '@marib-tax/contracts';
import {
  VERIFIED_ACTOR,
  type AuthenticatedRequest,
} from '../src/authn/bearer-actor-context.resolver.js';
import {
  ActivityOwnershipService,
  type ActivityOwnershipLookup,
} from '../src/activities-branches/activity-ownership.service.js';

/**
 * نقاط نهاية الأنشطة والفروع تستقبل معرّف المكلف أو النشاط في المسار، وتكتفي
 * بصلاحية `taxpayer.profile.read` — وهي ممنوحة لكل مكلف. فبلا تقييد بالملكية
 * يقرأ أي مكلف أنشطة غيره، ويضيف نشاطاً أو عنواناً تحت سجل غيره، بمجرد معرفة
 * المعرّف. هذه الاختبارات تحرس ذلك التقييد.
 */

const TAXPAYER_PERMISSIONS: PermissionCode[] = [
  'taxpayer.profile.read',
  'taxpayer.profile.update',
  'request.read',
  'balagh.read',
  'balagh.create',
];

const STAFF_PERMISSIONS: PermissionCode[] = [
  'taxpayer.profile.read',
  'request.review',
  'balagh.review',
];

const OWN_TAXPAYER = 'taxpayer-own';
const OTHER_TAXPAYER = 'taxpayer-other';
const OWN_ACTIVITY = 'activity-own';
const OTHER_ACTIVITY = 'activity-other';
const OWN_BRANCH = 'branch-own';
const OTHER_BRANCH = 'branch-other';

function buildService(): {
  service: ActivityOwnershipService;
  calls: string[];
} {
  const calls: string[] = [];

  const lookup: ActivityOwnershipLookup = {
    linkedTaxpayerIds(actorId) {
      calls.push(`linked:${actorId}`);
      return Promise.resolve([OWN_TAXPAYER]);
    },
    taxpayerIdOfActivity(activityId) {
      calls.push(`activity:${activityId}`);
      if (activityId === OWN_ACTIVITY) return Promise.resolve(OWN_TAXPAYER);
      if (activityId === OTHER_ACTIVITY) return Promise.resolve(OTHER_TAXPAYER);
      return Promise.resolve(null);
    },
    activityIdOfBranch(branchId) {
      calls.push(`branch:${branchId}`);
      if (branchId === OWN_BRANCH) return Promise.resolve(OWN_ACTIVITY);
      if (branchId === OTHER_BRANCH) return Promise.resolve(OTHER_ACTIVITY);
      return Promise.resolve(null);
    },
  };

  return { service: new ActivityOwnershipService(lookup), calls };
}

function actorRequest(permissions: PermissionCode[]): AuthenticatedRequest {
  return {
    [VERIFIED_ACTOR]: {
      actorId: 'actor-1',
      permissions,
      roleActive: true,
      assignmentActive: true,
    },
  } as unknown as AuthenticatedRequest;
}

describe('ActivityOwnershipService — تقييد الأنشطة بالملكية', () => {
  it('المكلف يصل إلى سجله', async () => {
    const { service } = buildService();
    await expect(
      service.assertMayAccessTaxpayer(
        actorRequest(TAXPAYER_PERMISSIONS),
        OWN_TAXPAYER,
      ),
    ).resolves.toBeUndefined();
  });

  it('المكلف يُمنع من سجل مكلف آخر', async () => {
    const { service } = buildService();
    await expect(
      service.assertMayAccessTaxpayer(
        actorRequest(TAXPAYER_PERMISSIONS),
        OTHER_TAXPAYER,
      ),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('المكلف يُمنع من نشاط مكلف آخر', async () => {
    const { service } = buildService();
    await expect(
      service.assertMayAccessActivity(
        actorRequest(TAXPAYER_PERMISSIONS),
        OTHER_ACTIVITY,
      ),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('المكلف يصل إلى نشاطه', async () => {
    const { service } = buildService();
    await expect(
      service.assertMayAccessActivity(
        actorRequest(TAXPAYER_PERMISSIONS),
        OWN_ACTIVITY,
      ),
    ).resolves.toBeUndefined();
  });

  it('المكلف يُمنع من فرع تابع لنشاط مكلف آخر', async () => {
    const { service } = buildService();
    await expect(
      service.assertMayAccessBranch(
        actorRequest(TAXPAYER_PERMISSIONS),
        OTHER_BRANCH,
      ),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('المكلف يصل إلى فرع نشاطه', async () => {
    const { service } = buildService();
    await expect(
      service.assertMayAccessBranch(
        actorRequest(TAXPAYER_PERMISSIONS),
        OWN_BRANCH,
      ),
    ).resolves.toBeUndefined();
  });

  it('سجل غير موجود يُرد بـ«غير موجود» لا بخطأ داخلي', async () => {
    const { service } = buildService();
    await expect(
      service.assertMayAccessActivity(
        actorRequest(TAXPAYER_PERMISSIONS),
        'activity-missing',
      ),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('الموظف المخوّل بالمراجعة يمر بلا استعلام ملكية', async () => {
    const { service, calls } = buildService();
    await expect(
      service.assertMayAccessTaxpayer(
        actorRequest(STAFF_PERMISSIONS),
        OTHER_TAXPAYER,
      ),
    ).resolves.toBeUndefined();
    await expect(
      service.assertMayAccessActivity(
        actorRequest(STAFF_PERMISSIONS),
        OTHER_ACTIVITY,
      ),
    ).resolves.toBeUndefined();
    await expect(
      service.assertMayAccessBranch(
        actorRequest(STAFF_PERMISSIONS),
        OTHER_BRANCH,
      ),
    ).resolves.toBeUndefined();
    expect(calls).toEqual([]);
  });

  it('طلب بلا سياق فاعل يُرفض', async () => {
    const { service } = buildService();
    await expect(
      service.assertMayAccessTaxpayer(
        {} as unknown as AuthenticatedRequest,
        OWN_TAXPAYER,
      ),
    ).rejects.toMatchObject({ status: 403 });
  });
});
