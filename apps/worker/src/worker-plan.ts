import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import {
  KyselyOutboxRepository,
  WorkerService,
  type WorkerDatabaseSchemas,
} from './outbox-processor.js';
import {
  LocalNotificationProvider,
  TwilioNotificationProvider,
  FcmNotificationProvider,
  CompositeNotificationProvider,
} from './delivery.contracts.js';

export interface EnabledWorkerPlan {
  readonly state: 'enabled';
  readonly databaseUrl: string;
  readonly providerKey: 'composite';
  readonly db: Kysely<WorkerDatabaseSchemas>;
  readonly workerService: WorkerService;
}

export interface DisabledWorkerPlan {
  readonly state: 'disabled';
  readonly reason: 'NOT_CONFIGURED';
}

export type WorkerPlan = EnabledWorkerPlan | DisabledWorkerPlan;

export function createWorkerPlan(
  environment: Readonly<Record<string, string | undefined>>,
): WorkerPlan {
  if (environment.WORKER_ENABLED === 'true') {
    const databaseUrl = environment.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('Worker adapters are not configured.');
    }

    const pool = new pg.Pool({
      connectionString: databaseUrl,
      max: 5,
    });

    const db = new Kysely<WorkerDatabaseSchemas>({
      dialect: new PostgresDialect({
        pool,
      }),
    });

    const repository = new KyselyOutboxRepository(db);

    const twilioProvider = new TwilioNotificationProvider(
      environment.TWILIO_ACCOUNT_SID,
      environment.TWILIO_AUTH_TOKEN,
      environment.TWILIO_PHONE_NUMBER,
    );

    const fcmProvider = new FcmNotificationProvider(
      environment.FIREBASE_PROJECT_ID,
      environment.FIREBASE_CLIENT_EMAIL,
      environment.FIREBASE_PRIVATE_KEY,
    );

    const localProvider = new LocalNotificationProvider();

    const provider = new CompositeNotificationProvider(
      twilioProvider,
      fcmProvider,
      localProvider,
    );

    const workerService = new WorkerService(repository, provider);

    return Object.freeze({
      state: 'enabled' as const,
      databaseUrl,
      providerKey: 'composite' as const,
      db,
      workerService,
    });
  }
  return Object.freeze({
    state: 'disabled' as const,
    reason: 'NOT_CONFIGURED' as const,
  });
}
