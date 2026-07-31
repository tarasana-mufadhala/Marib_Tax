import { Injectable } from '@nestjs/common';
import {
  type WorkflowRepository,
  type StoredWorkflowRequest,
  type StoredStatusHistory,
  type StoredWorkflowAuditLog,
  type StoredNotificationOutbox,
} from './workflow.repository.js';

@Injectable()
export class WorkflowMemoryRepository implements WorkflowRepository {
  private readonly requests = new Map<string, StoredWorkflowRequest>();
  private readonly histories: StoredStatusHistory[] = [];
  private readonly auditLogs: StoredWorkflowAuditLog[] = [];
  private readonly notifications: StoredNotificationOutbox[] = [];

  async findRequestById(id: string): Promise<StoredWorkflowRequest | null> {
    await Promise.resolve();
    return this.requests.get(id) ?? null;
  }

  async updateRequestStatus(id: string, status: string): Promise<void> {
    await Promise.resolve();
    const req = this.requests.get(id);
    if (req) {
      req.statusCode = status;
      req.updatedAt = new Date().toISOString();
      if (status === 'submitted') {
        req.submittedAt = new Date().toISOString();
      }
      if (status === 'archived') {
        req.archivedAt = new Date().toISOString();
      }
      this.requests.set(id, req);
    }
  }

  async appendStatusHistory(history: StoredStatusHistory): Promise<void> {
    await Promise.resolve();
    this.histories.push(history);
  }

  async appendAuditLog(log: StoredWorkflowAuditLog): Promise<void> {
    await Promise.resolve();
    this.auditLogs.push(log);
  }

  async enqueueNotification(
    notification: StoredNotificationOutbox,
  ): Promise<void> {
    await Promise.resolve();
    this.notifications.push(notification);
  }

  async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    // Memory repository has transactional bounds implicitly for in-process execution.
    return work();
  }

  // Helpers for testing
  addRequest(req: StoredWorkflowRequest): void {
    this.requests.set(req.id, req);
  }

  getHistories(): readonly StoredStatusHistory[] {
    return this.histories;
  }

  getAuditLogs(): readonly StoredWorkflowAuditLog[] {
    return this.auditLogs;
  }

  getNotifications(): readonly StoredNotificationOutbox[] {
    return this.notifications;
  }
}
