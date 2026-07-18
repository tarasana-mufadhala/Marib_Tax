import { createWorkerPlan } from './worker-plan.js';

const plan = createWorkerPlan(process.env);
process.stdout.write(`marib-tax-worker:${plan.state}\n`);
