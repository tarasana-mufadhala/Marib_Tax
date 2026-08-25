import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PublicEndpoint } from '../authz/authorization.decorators.js';
import { DatabaseService } from '../database/database.service.js';
import { StorageService } from './storage.service.js';

@Controller('api/v1/public')
@PublicEndpoint()
export class PublicContentController {
  constructor(
    private readonly db: DatabaseService,
    private readonly storage: StorageService,
  ) {}

  @Get('announcements')
  async getAnnouncements() {
    if (!this.db.isInitialized) return [];
    try {
      const now = new Date();
      const rows = (await this.db.db
        .selectFrom('content.announcements' as any)
        .selectAll()
        .where('is_active' as any, '=', true)
        .orderBy('priority' as any, 'desc')
        .orderBy('created_at' as any, 'desc')
        .limit(20)
        .execute()) as any[];
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
  async getLegalEntities() {
    if (!this.db.isInitialized) return [];
    try {
      const rows = (await this.db.db
        .selectFrom('legal.legal_entities' as any)
        .select(['id', 'legal_name'] as any)
        .where('is_active' as any, '=', true)
        .where('archived_at' as any, 'is', null)
        .orderBy('legal_name' as any, 'asc')
        .limit(200)
        .execute()) as any[];
      return rows.map((r) => ({ id: r.id, legalName: r.legal_name }));
    } catch {
      return [];
    }
  }

  @Get('services')
  async getServices() {
    if (!this.db.isInitialized) return [];
    try {
      return await this.db.db
        .selectFrom('requests.service_types' as any)
        .selectAll()
        .where('is_active' as any, '=', true)
        .orderBy('created_at' as any, 'asc')
        .limit(50)
        .execute();
    } catch {
      return [];
    }
  }

  @Get('content-pages/:key')
  async getContentPage(@Param('key') key: string) {
    if (!this.db.isInitialized) return null;
    try {
      const page = await this.db.db
        .selectFrom('content.content_pages' as any)
        .selectAll()
        .where('key' as any, '=', key)
        .where('status' as any, '=', 'published')
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
  ) {
    if (!this.db.isInitialized) return [];
    try {
      let query = this.db.db
        .selectFrom('content.library_documents' as any)
        .select([
          'id',
          'title',
          'category_code',
          'version_label',
          'file_size_bytes',
          'mime_type',
          'published_at',
          'topic_code',
        ] as any)
        .where('status' as any, '=', 'published')
        .orderBy('published_at' as any, 'desc')
        .limit(100);
      if (category) {
        query = (query as any).where('category_code' as any, '=', category);
      }
      if (topic) {
        query = (query as any).where('topic_code' as any, '=', topic);
      }
      return await query.execute();
    } catch {
      return [];
    }
  }

  @Get('library-documents/:id/file')
  async downloadLibraryDocument(@Param('id') id: string, @Res() res: Response) {
    if (!this.db.isInitialized || !this.storage.enabled) {
      res.status(503).json({ error: 'الخدمة غير متاحة' });
      return;
    }
    try {
      const doc = (await this.db.db
        .selectFrom('content.library_documents' as any)
        .select(['file_path', 'title', 'mime_type', 'status'] as any)
        .where('id' as any, '=', id)
        .executeTakeFirst()) as any;
      if (!doc?.file_path || doc.status !== 'published') {
        res.status(404).json({ error: 'المستند غير موجود أو غير منشور' });
        return;
      }
      const [bucket, ...rest] = String(doc.file_path).split('/');
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
  async getFaqs() {
    if (!this.db.isInitialized) return [];
    try {
      return await this.db.db
        .selectFrom('content.faqs' as any)
        .selectAll()
        .where('is_active' as any, '=', true)
        .orderBy('display_order' as any, 'asc')
        .limit(50)
        .execute();
    } catch {
      return [];
    }
  }

  @Get('stats')
  async getPublicStats() {
    if (!this.db.isInitialized) {
      return { taxpayersCount: 0, servicesCount: 0, documentsCount: 0 };
    }
    try {
      const [taxpayers, services, documents] = await Promise.all([
        this.db.db
          .selectFrom('registry.taxpayers' as any)
          .select((eb: any) => eb.fn.countAll().as('count'))
          .where('archived_at' as any, 'is', null)
          .executeTakeFirst(),
        this.db.db
          .selectFrom('requests.service_types' as any)
          .select((eb: any) => eb.fn.countAll().as('count'))
          .where('is_active' as any, '=', true)
          .executeTakeFirst(),
        this.db.db
          .selectFrom('content.library_documents' as any)
          .select((eb: any) => eb.fn.countAll().as('count'))
          .where('status' as any, '=', 'published')
          .executeTakeFirst(),
      ]);
      return {
        taxpayersCount: Number((taxpayers as any)?.count ?? 0),
        servicesCount: Number((services as any)?.count ?? 0),
        documentsCount: Number((documents as any)?.count ?? 0),
      };
    } catch {
      return { taxpayersCount: 0, servicesCount: 0, documentsCount: 0 };
    }
  }

  @Post('contact-messages')
  async submitContactMessage(
    @Body() body: { fullName?: string; phone?: string; email?: string; message?: string },
  ) {
    const fullName = String(body?.fullName ?? '').trim();
    const phone = String(body?.phone ?? '').trim();
    const email = String(body?.email ?? '').trim();
    const message = String(body?.message ?? '').trim();
    if (!fullName || !phone || !message) {
      return { error: 'الاسم ورقم الهاتف ونص الرسالة حقول إلزامية' };
    }
    if (fullName.length > 150 || phone.length > 30 || email.length > 150 || message.length > 4000) {
      return { error: 'تجاوز الحد المسموح لطول البيانات' };
    }
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    try {
      const row = await this.db.db
        .insertInto('content.contact_messages' as any)
        .values({
          id: crypto.randomUUID(),
          full_name: fullName,
          phone,
          email: email || null,
          message,
          status: 'new',
          created_at: new Date(),
        } as any)
        .returning(['id', 'created_at'] as any)
        .executeTakeFirst();
      return { success: true, id: (row as any)?.id };
    } catch {
      return { error: 'تعذر استلام الرسالة، يرجى المحاولة لاحقاً' };
    }
  }

  @Post('page-views')
  async trackPageView(@Body() body: { path?: string; referrer?: string }) {
    const path = String(body?.path ?? '').trim().slice(0, 200);
    if (!path || !path.startsWith('/')) return { error: 'مسار غير صالح' };
    const referrer = String(body?.referrer ?? '').trim().slice(0, 300) || null;
    if (!this.db.isInitialized) return { success: false };
    try {
      await this.db.db
        .insertInto('content.page_views' as any)
        .values({
          id: crypto.randomUUID(),
          page_path: path,
          referrer,
          created_at: new Date(),
        } as any)
        .execute();
      return { success: true };
    } catch {
      return { success: false };
    }
  }
}
