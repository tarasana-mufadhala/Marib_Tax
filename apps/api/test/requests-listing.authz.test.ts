import { describe, expect, it } from 'vitest';
import type { PermissionCode } from '@marib-tax/contracts';
import {
  RequestsQueryService,
  type ServiceRequestListItem,
} from '../src/requests/requests-query.service.js';
import { RequestDraftController } from '../src/requests/request-draft.controller.js';
import { VERIFIED_ACTOR } from '../src/authn/bearer-actor-context.resolver.js';

/**
 * سرد الطلبات يجب أن يقتصر على طلبات المكلف نفسه.
 * بلا هذا التقييد يستطيع أي مكلف — و`request.read` ممنوحة لكل مكلف افتراضياً —
 * تعداد طلبات الآخرين بأسمائهم وأرقامهم الضريبية.
 */

const TAXPAYER_PERMISSIONS: PermissionCode[] = [
  'taxpayer.profile.read',
  'request.read',
  'request.draft.create',
  'request.submit',
  'notification.read',
];

const STAFF_PERMISSIONS: PermissionCode[] = [
  'request.read',
  'request.review',
  'taxpayer.profile.read',
];

/** يسجّل وسيط الملكية الذي وصل إلى طبقة الاستعلام. */
function buildController(permissions: PermissionCode[], actorId: string) {
  const calls: Array<{ limit?: number; ownerProfileId?: string }> = [];

  const queryService = {
    listRequests: async (limit?: number, ownerProfileId?: string) => {
      calls.push({ limit, ownerProfileId });
      return [] as ServiceRequestListItem[];
    },
  } as unknown as RequestsQueryService;

  const controller = new RequestDraftController(
    {} as never,
    queryService,
    { requireActorId: () => actorId },
  );

  const request = {
    [VERIFIED_ACTOR]: {
      actorId,
      permissions,
      roleActive: true,
      assignmentActive: true,
    },
  } as never;

  return { controller, request, calls };
}

describe('GET /api/v1/requests — تقييد السرد بالملكية', () => {
  it('المكلف يرى طلباته فقط: يُمرَّر معرّفه كقيد ملكية', async () => {
    const { controller, request, calls } = buildController(
      TAXPAYER_PERMISSIONS,
      'taxpayer-profile-1',
    );

    await controller.list(request);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.ownerProfileId).toBe('taxpayer-profile-1');
  });

  it('الموظف صاحب request.review يرى الجميع: بلا قيد ملكية', async () => {
    const { controller, request, calls } = buildController(
      STAFF_PERMISSIONS,
      'staff-profile-1',
    );

    await controller.list(request);

    expect(calls[0]?.ownerProfileId).toBeUndefined();
  });

  it('طلب بلا سياق فاعل يُعامَل كغير موظف فيُقيَّد', async () => {
    const { controller, calls } = buildController(
      TAXPAYER_PERMISSIONS,
      'taxpayer-profile-2',
    );

    await controller.list({} as never);

    expect(calls[0]?.ownerProfileId).toBe('taxpayer-profile-2');
  });

  it('حد النتائج يُمرَّر كما هو مع بقاء قيد الملكية', async () => {
    const { controller, request, calls } = buildController(
      TAXPAYER_PERMISSIONS,
      'taxpayer-profile-3',
    );

    await controller.list(request, '25');

    expect(calls[0]?.limit).toBe(25);
    expect(calls[0]?.ownerProfileId).toBe('taxpayer-profile-3');
  });
});
