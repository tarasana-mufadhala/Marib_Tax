import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import type { Selectable } from 'kysely';
import { PublicEndpoint } from '../authz/authorization.decorators.js';
import type {
  ContentAnnouncementsTable,
  ContentContentPagesTable,
  ContentFaqsTable,
  ContentLibraryDocumentsTable,
  ServiceTypesTable,
} from '../database/database.contracts.js';
import { DatabaseService } from '../database/database.service.js';
import { StorageService } from './storage.service.js';

type AnnouncementRow = Selectable<ContentAnnouncementsTable>;
type ContentPageRow = Selectable<ContentContentPagesTable>;
type FaqRow = Selectable<ContentFaqsTable>;
type ServiceTypeRow = Selectable<ServiceTypesTable>;
type PublicLibraryDocumentRow = Pick<
  Selectable<ContentLibraryDocumentsTable>,
  | 'id'
  | 'title'
  | 'category_code'
  | 'version_label'
  | 'file_size_bytes'
  | 'mime_type'
  | 'published_at'
  | 'topic_code'
>;

interface PublicLegalEntity {
  id: string;
  legalName: string;
}

interface PublicStats {
  taxpayersCount: number;
  servicesCount: number;
  documentsCount: number;
}

type ContactMessageResult =
  | { error: string }
  | { success: true; id: string | undefined };

type PageViewResult = { error: string } | { success: boolean };

@Controller('api/v1/public')
@PublicEndpoint()
export class PublicContentController {
  constructor(
    private readonly db: DatabaseService,
    private readonly storage: StorageService,
  ) {}

  @Get('announcements')
  async getAnnouncements(): Promise<AnnouncementRow[]> {
    if (!this.db.isInitialized) return [];
    try {
      const now = new Date();
      const rows = await this.db.db
        .selectFrom('content.announcements')
        .selectAll()
        .where('is_active', '=', true)
        .orderBy('priority', 'desc')
        .orderBy('created_at', 'desc')
        .limit(20)
        .execute();
      return rows.filter((r) => {
        const starts = r.starts_at ? new Date(r.starts_at) : null;
        const ends = r.ends_at ? new Date(r.ends_at) : null;
        if (starts && starts > now) return false;
        if (ends && ends < now) return false;
        return true;
      });
    } catch {
      return [];
    }
  }

  @Get('legal-entities')
  async getLegalEntities(): Promise<PublicLegalEntity[]> {
    if (!this.db.isInitialized) return [];
    try {
      const rows = await this.db.db
        .selectFrom('legal.legal_entities')
        .select(['id', 'legal_name'])
        .where('is_active', '=', true)
        .where('archived_at', 'is', null)
        .orderBy('legal_name', 'asc')
        .limit(200)
        .execute();
      return rows.map((r) => ({ id: r.id, legalName: r.legal_name }));
    } catch {
      return [];
    }
  }

  @Get('services')
  async getServices(): Promise<ServiceTypeRow[]> {
    if (!this.db.isInitialized) return [];
    try {
      return await this.db.db
        .selectFrom('requests.service_types')
        .selectAll()
        .where('is_active', '=', true)
        .orderBy('created_at', 'asc')
        .limit(50)
        .execute();
    } catch {
      return [];
    }
  }

  @Get('content-pages/:key')
  async getContentPage(
    @Param('key') key: string,
  ): Promise<ContentPageRow | null> {
    if (!this.db.isInitialized) return null;
    try {
      const page = await this.db.db
        .selectFrom('content.content_pages')
        .selectAll()
        .where('key', '=', key)
        .where('status', '=', 'published')
        .executeTakeFirst();
      return page ?? null;
    } catch {
      return null;
    }
  }

  @Get('library-documents')
  async getLibraryDocuments(
    @Query('category') category?: string,
    @Query('topic') topic?: string,
  ): Promise<PublicLibraryDocumentRow[]> {
    if (!this.db.isInitialized) return [];
    try {
      let query = this.db.db
        .selectFrom('content.library_documents')
        .select([
          'id',
          'title',
          'category_code',
          'version_label',
          'file_size_bytes',
          'mime_type',
          'published_at',
          'topic_code',
        ])
        .where('status', '=', 'published')
        .orderBy('published_at', 'desc')
        .limit(100);
      if (category) {
        query = query.where('category_code', '=', category);
      }
      if (topic) {
        query = query.where('topic_code', '=', topic);
      }
      return await query.execute();
    } catch {
      return [];
    }
  }

  @Get('library-documents/:id/file')
  async downloadLibraryDocument(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!this.db.isInitialized || !this.storage.enabled) {
      res.status(503).json({ error: 'الخدمة غير متاحة' });
      return;
    }
    try {
      const doc = await this.db.db
        .selectFrom('content.library_documents')
        .select(['file_path', 'title', 'mime_type', 'status'])
        .where('id', '=', id)
        .executeTakeFirst();
      if (!doc?.file_path || doc.status !== 'published') {
        res.status(404).json({ error: 'المستند غير موجود أو غير منشور' });
        return;
      }
      const [bucket, ...rest] = doc.file_path.split('/');
      const file = await this.storage.download(bucket ?? '', rest.join('/'));
      if (!file) {
        res.status(404).json({ error: 'تعذر جلب الملف من التخزين' });
        return;
      }
      res.setHeader('Content-Type', doc.mime_type ?? file.contentType);
      res.setHeader(
        'Content-Disposition',
        `inline; filename*=UTF-8''${encodeURIComponent(doc.title ?? 'document')}`,
      );
      res.send(file.buffer);
    } catch {
      res.status(500).json({ error: 'تعذر تحميل المستند' });
    }
  }

  @Get('faqs')
  async getFaqs(): Promise<FaqRow[]> {
    if (!this.db.isInitialized) return [];
    try {
      return await this.db.db
        .selectFrom('content.faqs')
        .selectAll()
        .where('is_active', '=', true)
        .orderBy('display_order', 'asc')
        .limit(50)
        .execute();
    } catch {
      return [];
    }
  }

  @Get('stats')
  async getPublicStats(): Promise<PublicStats> {
    if (!this.db.isInitialized) {
      return { taxpayersCount: 0, servicesCount: 0, documentsCount: 0 };
    }
    try {
      const [taxpayers, services, documents] = await Promise.all([
        this.db.db
          .selectFrom('registry.taxpayers')
          .select((eb) => eb.fn.countAll().as('count'))
          .where('archived_at', 'is', null)
          .executeTakeFirst(),
        this.db.db
          .selectFrom('requests.service_types')
          .select((eb) => eb.fn.countAll().as('count'))
          .where('is_active', '=', true)
          .executeTakeFirst(),
        this.db.db
          .selectFrom('content.library_documents')
          .select((eb) => eb.fn.countAll().as('count'))
          .where('status', '=', 'published')
          .executeTakeFirst(),
      ]);
      return {
        taxpayersCount: Number(taxpayers?.count ?? 0),
        servicesCount: Number(services?.count ?? 0),
        documentsCount: Number(documents?.count ?? 0),
      };
    } catch {
      return { taxpayersCount: 0, servicesCount: 0, documentsCount: 0 };
    }
  }

  @Post('contact-messages')
  async submitContactMessage(
    @Body()
    body: {
      fullName?: string;
      phone?: string;
      email?: string;
      message?: string;
    },
  ): Promise<ContactMessageResult> {
    const fullName = String(body?.fullName ?? '').trim();
    const phone = String(body?.phone ?? '').trim();
    const email = String(body?.email ?? '').trim();
    const message = String(body?.message ?? '').trim();
    if (!fullName || !phone || !message) {
      return { error: 'الاسم ورقم الهاتف ونص الرسالة حقول إلزامية' };
    }
    if (
      fullName.length > 150 ||
      phone.length > 30 ||
      email.length > 150 ||
      message.length > 4000
    ) {
      return { error: 'تجاوز الحد المسموح لطول البيانات' };
    }
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    try {
      const row = await this.db.db
        .insertInto('content.contact_messages')
        .values({
          id: crypto.randomUUID(),
          full_name: fullName,
          phone,
          email: email || null,
          message,
          status: 'new',
          created_at: new Date(),
        })
        .returning(['id', 'created_at'])
        .executeTakeFirst();
      return { success: true, id: row?.id };
    } catch {
      return { error: 'تعذر استلام الرسالة، يرجى المحاولة لاحقاً' };
    }
  }

  @Post('page-views')
  async trackPageView(
    @Body() body: { path?: string; referrer?: string },
  ): Promise<PageViewResult> {
    const path = String(body?.path ?? '')
      .trim()
      .slice(0, 200);
    if (!path || !path.startsWith('/')) return { error: 'مسار غير صالح' };
    const referrer =
      String(body?.referrer ?? '')
        .trim()
        .slice(0, 300) || null;
    if (!this.db.isInitialized) return { success: false };
    try {
      await this.db.db
        .insertInto('content.page_views')
        .values({
          id: crypto.randomUUID(),
          page_path: path,
          referrer,
          created_at: new Date(),
        })
        .execute();
      return { success: true };
    } catch {
      return { success: false };
    }
  }
}
