import { createWorkerPlan } from './worker-plan.js';

const plan = createWorkerPlan(process.env);
process.stdout.write(`marib-tax-worker:${plan.state}\n`);

if (plan.state === 'enabled') {
  plan.workerService.start();
  process.stdout.write(`[Worker] Started outbox processing queue...\n`);
}
