import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { DecisionsController } from '../src/decisions/decisions.controller.js';
import { FieldVisitsController } from '../src/field-visits/field-visits.controller.js';

const USER = randomUUID();
const STAFF = randomUUID();
const REQUEST = randomUUID();

const actors = { requireActorId: (): string => USER };
const staffUsers = {
  findStaffByUserProfileId: (): Promise<{ id: string; isActive: boolean }> =>
    Promise.resolve({ id: STAFF, isActive: true }),
};
const citizenUsers = {
  findStaffByUserProfileId: (): Promise<never> =>
    Promise.reject(new Error('Staff profile not found')),
};
const inactiveUsers = {
  findStaffByUserProfileId: (): Promise<{ id: string; isActive: boolean }> =>
    Promise.resolve({ id: STAFF, isActive: false }),
};

const visitBody = {
  serviceRequestId: REQUEST,
  scheduledStartAt: '2026-10-20T08:00:00Z',
  scheduledEndAt: '2026-10-20T10:00:00Z',
  teamMemberStaffIds: [STAFF],
};
const decisionBody = { serviceRequestId: REQUEST, outcomeCode: 'approved' };

describe('field visits: staff profile id, not user profile id', () => {
  it('passes the staff profile id as the creating staff', async () => {
    let seen: unknown[] = [];
    const service = {
      scheduleVisit: (...args: unknown[]): Promise<unknown> => {
        seen = args;
        return Promise.resolve({});
      },
    };
    const c = new FieldVisitsController(
      service as never,
      staffUsers as never,
      actors,
    );
    await c.schedule(visitBody);
    expect(seen[1]).toBe(STAFF);
    expect(seen[2]).toBe(USER);
  });

  it.each([
    ['a citizen without a staff profile', citizenUsers],
    ['an inactive staff profile', inactiveUsers],
  ])('403 for %s', async (_name, users) => {
    const service = { scheduleVisit: (): Promise<never> => Promise.reject(new Error('must not run')) };
    const c = new FieldVisitsController(service as never, users as never, actors);
    await expect(c.schedule(visitBody)).rejects.toMatchObject({ status: 403 });
  });
});

describe('decisions: staff profile id, not user profile id', () => {
  it('passes the staff profile id as the deciding staff', async () => {
    let seen: unknown[] = [];
    const service = {
      recordDecision: (...args: unknown[]): Promise<unknown> => {
        seen = args;
        return Promise.resolve({});
      },
    };
    const c = new DecisionsController(service as never, staffUsers as never, actors);
    await c.record(decisionBody);
    expect(seen[1]).toBe(STAFF);
    expect(seen[2]).toBe(USER);
  });

  it('403 for a citizen without a staff profile', async () => {
    const service = { recordDecision: (): Promise<never> => Promise.reject(new Error('must not run')) };
    const c = new DecisionsController(service as never, citizenUsers as never, actors);
    await expect(c.record(decisionBody)).rejects.toMatchObject({ status: 403 });
  });
});
