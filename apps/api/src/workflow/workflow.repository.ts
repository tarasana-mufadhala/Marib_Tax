export interface StoredWorkflowRequest {
  id: string;
  statusCode: string;
  serviceTypeId: string;
  taxpayerId: string;
  ownerActorId: string;
  submittedAt: string | null;
  archivedAt: string | null;
  updatedAt: string;
}

export interface StoredStatusHistory {
  id: string;
  serviceRequestId: string;
  changedAt: Date;
  changedByProfileId: string;
  fromStatusCode: string | null;
  toStatusCode: string;
  reason: string | null;
}

export interface StoredWorkflowAuditLog {
  id: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

export interface StoredNotificationOutbox {
  id: string;
  recipientProfileId: string;
  channel: 'sms' | 'push' | 'in_app';
  title: string;
  body: string;
  status: 'pending' | 'sent' | 'failed';
  createdAt: Date;
}

export const WORKFLOW_REPOSITORY = Symbol('WORKFLOW_REPOSITORY');

export interface WorkflowRepository {
  findRequestById(id: string): Promise<StoredWorkflowRequest | null>;
  updateRequestStatus(id: string, status: string): Promise<void>;
  appendStatusHistory(history: StoredStatusHistory): Promise<void>;
  appendAuditLog(log: StoredWorkflowAuditLog): Promise<void>;
  enqueueNotification(notification: StoredNotificationOutbox): Promise<void>;
  runInTransaction<T>(work: () => Promise<T>): Promise<T>;
}
