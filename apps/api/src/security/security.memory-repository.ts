import { Injectable } from '@nestjs/common';
import {
  type SecurityRepository,
  type StoredSecurityEvent,
} from './security.repository.js';

@Injectable()
export class SecurityMemoryRepository implements SecurityRepository {
  private readonly events: StoredSecurityEvent[] = [];

  async recordSecurityEvent(
    event: Omit<StoredSecurityEvent, 'recordedAt'>,
  ): Promise<StoredSecurityEvent> {
    await Promise.resolve();
    const record: StoredSecurityEvent = {
      ...event,
      recordedAt: new Date(),
    };
    this.events.push(record);
    return record;
  }

  // Helper for testing
  getEvents(): readonly StoredSecurityEvent[] {
    return this.events;
  }
}
