import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { PermissionCode } from '@marib-tax/contracts';
import type { ActorAuthorizationContext } from '../authz/authorization.contracts.js';
import {
  WORKFLOW_REPOSITORY,
  type WorkflowRepository,
  type StoredWorkflowRequest,
} from './workflow.repository.js';

@Injectable()
export class WorkflowService {
  constructor(
    @Inject(WORKFLOW_REPOSITORY)
    private readonly repository: WorkflowRepository,
  ) {}

  async transition(
    requestId: string,
    targetState: string,
    actor: ActorAuthorizationContext,
    payload: { reason?: string; [key: string]: unknown } = {},
  ): Promise<StoredWorkflowRequest> {
    const request = await this.repository.findRequestById(requestId);
    if (!request) {
      throw new NotFoundException('Service request not found.');
    }

    const currentState = request.statusCode;

    // 1. Validate allowed transition
    const allowedTransitions: Record<string, string[]> = {
      draft: ['submitted'],
      submitted: ['under_review'],
      under_review: [
        'need_more_info',
        'field_visit_scheduled',
        'payment_required',
        'approved',
        'rejected',
      ],
      need_more_info: ['under_review'],
      field_visit_scheduled: ['field_visit_completed'],
      field_visit_completed: ['under_review'],
      payment_required: ['under_review'],
      approved: ['ready_for_pickup'],
      ready_for_pickup: ['completed'],
      completed: ['archived'],
      archived: ['reopened'],
      rejected: ['reopened'],
      reopened: ['under_review'],
    };

    const allowed = allowedTransitions[currentState]?.includes(targetState);
    if (!allowed) {
      throw new ConflictException(
        `Invalid transition from status "${currentState}" to "${targetState}".`,
      );
    }

    // 2. Authorize actor and map required permission
    const requiredPermission = this.getRequiredPermission(targetState);
    const isOwner = request.ownerActorId === actor.actorId;

    if (this.isTaxpayerTransition(targetState)) {
      if (!isOwner) {
        throw new ForbiddenException(
          'Only the request owner can perform this transition.',
        );
      }
    } else {
      const hasPerm = actor.permissions.includes(requiredPermission);
      if (!hasPerm) {
        throw new ForbiddenException(
          `Missing required permission "${requiredPermission}" to perform transition.`,
        );
      }
    }

    // 3. Validate required fields/documents (DR-007 / DR-008 constraints)
    this.validateFieldsAndDocuments(currentState, targetState, payload);

    // 4. Run transition steps within a single transaction COMMIT
    return this.repository.runInTransaction(async () => {
      // Update request status in DB
      await this.repository.updateRequestStatus(requestId, targetState);

      // Append status history record
      await this.repository.appendStatusHistory({
        id: randomUUID(),
        serviceRequestId: requestId,
        changedAt: new Date(),
        changedByProfileId: actor.actorId,
        fromStatusCode: currentState,
        toStatusCode: targetState,
        reason: payload.reason ?? null,
      });

      // Append security/audit log
      await this.repository.appendAuditLog({
        id: randomUUID(),
        actorId: actor.actorId,
        action: `WORKFLOW_TRANSITION_${currentState}_TO_${targetState}`,
        resourceType: 'service_request',
        resourceId: requestId,
        timestamp: new Date(),
        metadata: { reason: payload.reason ?? '', details: payload },
      });

      // Enqueue notification outbox
      if (this.shouldNotify(targetState)) {
        await this.repository.enqueueNotification({
          id: randomUUID(),
          recipientProfileId: request.ownerActorId,
          channel: 'in_app',
          title: 'تحديث معاملة ضريبية',
          body: `تم نقل معاملتكم الرقمية بنجاح إلى مرحلة: ${this.getStateLabelAr(targetState)}`,
          status: 'pending',
          createdAt: new Date(),
        });
      }

      // Return the updated request representation
      return {
        ...request,
        statusCode: targetState,
        submittedAt:
          targetState === 'submitted'
            ? new Date().toISOString()
            : request.submittedAt,
        archivedAt:
          targetState === 'archived'
            ? new Date().toISOString()
            : request.archivedAt,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  private isTaxpayerTransition(targetState: string): boolean {
    return ['submitted', 'reopened'].includes(targetState);
  }

  private getRequiredPermission(targetState: string): PermissionCode {
    const permMap: Record<string, PermissionCode> = {
      submitted: 'request.submit',
      under_review: 'request.review',
      need_more_info: 'request.review',
      field_visit_scheduled: 'field_visit.schedule',
      field_visit_completed: 'field_visit.result.record',
      payment_required: 'due.register',
      approved: 'request.decision.final',
      rejected: 'request.decision.final',
      reopened: 'request.admin.close',
      ready_for_pickup: 'request.review',
      completed: 'request.admin.close',
      archived: 'request.archive',
    };
    return permMap[targetState] ?? 'request.review';
  }

  private validateFieldsAndDocuments(
    from: string,
    to: string,
    payload: Record<string, unknown>,
  ): void {
    // If archiving or rejecting, a reason is mandatory
    if (to === 'archived' && !payload.reason) {
      throw new ConflictException('A reason is mandatory to archive requests.');
    }
    if (to === 'rejected' && !payload.reason) {
      throw new ConflictException('A reason is mandatory to reject requests.');
    }
    // If requesting information, a details/nawaqis field is mandatory
    if (to === 'need_more_info' && !payload.reason) {
      throw new ConflictException(
        'Must specify the required items or documents missing.',
      );
    }
  }

  private shouldNotify(targetState: string): boolean {
    // Do not notify on archived to keep noise minimal (Matrix says: archived notify NO)
    return targetState !== 'archived';
  }

  private getStateLabelAr(state: string): string {
    const labels: Record<string, string> = {
      draft: 'مسودة',
      submitted: 'مقدمة المراجعة',
      under_review: 'قيد الدراسة الفنية',
      need_more_info: 'بحاجة لمستندات إضافية',
      field_visit_scheduled: 'مجدولة للنزول الميداني',
      field_visit_completed: 'مكتملة النزول الميداني',
      payment_required: 'مطلوب سداد الرسوم',
      approved: 'معتمدة ومقبولة',
      rejected: 'مرفوضة بقرار مسبب',
      ready_for_pickup: 'جاهزة للاستلام',
      completed: 'مكتملة ومستلمة',
      archived: 'مؤرشفة تاريخياً',
    };
    return labels[state] ?? state;
  }
}
