export interface DisabledWorkerPlan {
  readonly state: 'disabled';
  readonly reason: 'NOT_CONFIGURED';
}

export function createWorkerPlan(
  environment: Readonly<Record<string, string | undefined>>,
): DisabledWorkerPlan {
  if (environment.WORKER_ENABLED === 'true') {
    throw new Error('Worker adapters are not configured.');
  }
  return Object.freeze({ state: 'disabled', reason: 'NOT_CONFIGURED' });
}
