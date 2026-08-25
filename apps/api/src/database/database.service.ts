import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import type { DatabaseSchemas } from './database.contracts.js';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private dbInstance: Kysely<DatabaseSchemas> | null = null;
  private poolInstance: pg.Pool | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      this.logger.warn(
        'DATABASE_URL is not set. Database client will not be initialized.',
      );
      return;
    }

    try {
      this.poolInstance = new pg.Pool({
        connectionString: databaseUrl,
        max: 10,
        idleTimeoutMillis: 30000,
        // الوصلة إلى القاعدة السحابية بطيئة في بيئة التشغيل الحالية، وخمس
        // ثوانٍ كانت تُسقط الطلبات تحت أي ضغط (ظهر أثناء استيراد دفعة
        // مستندات: عشرات الطلبات فشلت بـ «انتهت مهلة الاتصال» لا لخلل فيها).
        connectionTimeoutMillis: 30000,
        // مهلة استعلام أوسع للسبب نفسه، مع بقاء حدٍّ يقطع ما علِق فعلاً.
        statement_timeout: 60000,
        query_timeout: 60000,
      });

      this.dbInstance = new Kysely<DatabaseSchemas>({
        dialect: new PostgresDialect({
          pool: this.poolInstance,
        }),
      });

      this.logger.log('Database client successfully initialized.');
    } catch (err) {
      this.logger.error('Failed to initialize database client', err);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.dbInstance) {
      await this.dbInstance.destroy();
      this.logger.log('Database client closed.');
    }
  }

  get db(): Kysely<DatabaseSchemas> {
    if (!this.dbInstance) {
      throw new Error(
        'Database client not initialized. Check your DATABASE_URL environment variable.',
      );
    }
    return this.dbInstance;
  }

  get isInitialized(): boolean {
    return this.dbInstance !== null;
  }
}
