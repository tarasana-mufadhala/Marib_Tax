import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { RequirePermission } from '../authz/authorization.decorators.js';
import { DatabaseService } from '../database/database.service.js';
import { StorageService } from './storage.service.js';

const BUCKET = 'admin-attachments';
const LIBRARY_BUCKET = 'public-forms';

const LIBRARY_MIME = new Set(['application/pdf', 'image/png', 'image/jpeg']);

const LIBRARY_CATEGORIES = new Set(['form', 'law', 'guide', 'decision']);

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const ALLOWED_CATEGORIES = new Set(['attachment', 'approval_form', 'rejection_form']);

function mediaClass(mime: string): string {
  if (mime.startsWith('image/')) return 'image';
  return 'document';
}

@Controller('api/v1/admin')
export class AttachmentsController {
  constructor(
    private readonly db: DatabaseService,
    private readonly storage: StorageService,
  ) {}

  @RequirePermission('attachment.upload')
  @Post('requests/:id/attachments')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadRequestAttachment(
    @Param('id') requestId: string,
    @UploadedFile() file: { originalname?: string; mimetype?: string; size?: number; buffer?: Buffer },
    @Body() body: { category?: string },
  ) {
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    if (!this.storage.enabled) return { error: 'خدمة التخزين غير مهيأة' };
    if (!file?.buffer) return { error: 'لم يتم استلام أي ملف' };

    const mime = file.mimetype ?? 'application/octet-stream';
    if (!ALLOWED_MIME.has(mime)) {
      return { error: 'نوع الملف غير مسموح — المسموح: PDF، صور PNG/JPEG، Word (docx)، Excel (xlsx)، CSV' };
    }
    const category = ALLOWED_CATEGORIES.has(body?.category ?? '') ? (body!.category as string) : 'attachment';

    try {
      const request = await this.db.db
        .selectFrom('requests.service_requests' as any)
        .select(['id'] as any)
        .where('id' as any, '=', requestId)
        .executeTakeFirst();
      if (!request) return { error: 'الطلب غير موجود' };

      const attachmentId = crypto.randomUUID();
      const ext = (file.originalname ?? '').split('.').pop()?.toLowerCase() ?? 'bin';
      const objectPath = `requests/${requestId}/${attachmentId}.${ext}`;

      const uploaded = await this.storage.upload(BUCKET, objectPath, file.buffer, mime);
      if (!uploaded) return { error: 'تعذر رفع الملف إلى التخزين' };

      await this.db.db
        .insertInto('files.attachments' as any)
        .values({
          id: attachmentId,
          logical_file_size_bytes: file.size ?? file.buffer.length,
          media_content_class_code: mediaClass(mime),
          access_classification_code: 'internal',
          original_filename: file.originalname ?? `file.${ext}`,
          mime_type: mime,
          document_category_code: category,
          storage_accounting_category_code: 'primary',
          storage_object_path: `${BUCKET}/${objectPath}`,
          version_number: 1,
          is_current_version: true,
          storage_status_code: 'stored',
          deletion_retention_status_code: 'retained',
        } as any)
        .execute();

      await this.db.db
        .insertInto('files.attachment_links' as any)
        .values({
          id: crypto.randomUUID(),
          attachment_id: attachmentId,
          owner_type: 'service_request',
          owner_id: requestId,
          link_role_code: category,
          linked_at: new Date(),
        } as any)
        .execute();

      await this.db.db
        .insertInto('audit.audit_logs' as any)
        .values({
          id: crypto.randomUUID(),
          action: 'attachment.uploaded',
          entity_type: 'service_request',
          entity_id: requestId,
          metadata: JSON.stringify({ attachmentId, category, filename: file.originalname }),
        } as any)
        .execute()
        .catch(() => undefined);

      return { success: true, attachmentId };
    } catch {
      return { error: 'تعذر حفظ المرفق' };
    }
  }

  @RequirePermission('attachment.read')
  @Get('requests/:id/attachments')
  async getRequestAttachments(@Param('id') requestId: string) {
    if (!this.db.isInitialized) return [];
    try {
      const rows = await (this.db.db
        .selectFrom('files.attachment_links' as any) as any)
        .innerJoin('files.attachments', 'files.attachments.id', 'files.attachment_links.attachment_id')
        .select([
          'files.attachments.id as id',
          'files.attachments.original_filename as original_filename',
          'files.attachments.mime_type as mime_type',
          'files.attachments.logical_file_size_bytes as logical_file_size_bytes',
          'files.attachments.document_category_code as document_category_code',
          'files.attachment_links.linked_at as linked_at',
        ])
        .where('files.attachment_links.owner_type', '=', 'service_request')
        .where('files.attachment_links.owner_id', '=', requestId)
        .where('files.attachment_links.unlinked_at', 'is', null)
        .orderBy('files.attachment_links.linked_at', 'desc')
        .limit(50)
        .execute();
      return rows;
    } catch {
      return [];
    }
  }

  @RequirePermission('attachment.read')
  @Get('attachments/:id/file')
  async downloadAttachment(@Param('id') id: string, @Res() res: Response) {
    if (!this.db.isInitialized || !this.storage.enabled) {
      res.status(503).json({ error: 'الخدمة غير متاحة' });
      return;
    }
    try {
      const attachment = (await this.db.db
        .selectFrom('files.attachments' as any)
        .select(['storage_object_path', 'original_filename', 'mime_type'] as any)
        .where('id' as any, '=', id)
        .executeTakeFirst()) as any;
      if (!attachment?.storage_object_path) {
        res.status(404).json({ error: 'المرفق غير موجود' });
        return;
      }
      const [bucket, ...rest] = attachment.storage_object_path.split('/');
      const file = await this.storage.download(bucket, rest.join('/'));
      if (!file) {
        res.status(404).json({ error: 'تعذر جلب الملف من التخزين' });
        return;
      }
      res.setHeader('Content-Type', attachment.mime_type ?? file.contentType);
      res.setHeader(
        'Content-Disposition',
        `inline; filename*=UTF-8''${encodeURIComponent(attachment.original_filename ?? 'file')}`,
      );
      res.send(file.buffer);
    } catch {
      res.status(500).json({ error: 'تعذر تحميل المرفق' });
    }
  }

  @RequirePermission('content.publish')
  @Get('library-documents')
  async getLibraryDocuments() {
    if (!this.db.isInitialized) return [];
    try {
      return await this.db.db
        .selectFrom('content.library_documents' as any)
        .selectAll()
        .orderBy('created_at' as any, 'desc')
        .limit(100)
        .execute();
    } catch {
      return [];
    }
  }

  @RequirePermission('content.publish')
  @Post('library-documents')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadLibraryDocument(
    @UploadedFile() file: { originalname?: string; mimetype?: string; size?: number; buffer?: Buffer },
    @Body() body: { title?: string; category?: string; version?: string },
  ) {
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    if (!this.storage.enabled) return { error: 'خدمة التخزين غير مهيأة' };
    if (!file?.buffer) return { error: 'لم يتم استلام أي ملف' };
    if (!body?.title?.trim()) return { error: 'عنوان المستند مطلوب' };

    const mime = file.mimetype ?? 'application/octet-stream';
    if (!LIBRARY_MIME.has(mime)) {
      return { error: 'نوع الملف غير مسموح في المكتبة — المسموح: PDF، صور PNG/JPEG' };
    }
    const category = LIBRARY_CATEGORIES.has(body?.category ?? '') ? (body!.category as string) : 'form';

    try {
      const docId = crypto.randomUUID();
      const ext = (file.originalname ?? '').split('.').pop()?.toLowerCase() ?? 'bin';
      const objectPath = `library/${docId}.${ext}`;

      const uploaded = await this.storage.upload(LIBRARY_BUCKET, objectPath, file.buffer, mime);
      if (!uploaded) return { error: 'تعذر رفع الملف إلى التخزين' };

      await this.db.db
        .insertInto('content.library_documents' as any)
        .values({
          id: docId,
          title: body.title.trim(),
          category_code: category,
          file_path: `${LIBRARY_BUCKET}/${objectPath}`,
          file_size_bytes: file.size ?? file.buffer.length,
          mime_type: mime,
          status: 'draft',
          version_label: body?.version?.trim() || '1.0',
        } as any)
        .execute();

      await this.db.db
        .insertInto('audit.audit_logs' as any)
        .values({
          id: crypto.randomUUID(),
          action: 'library.uploaded',
          entity_type: 'library_document',
          entity_id: docId,
          metadata: JSON.stringify({ title: body.title.trim(), category, filename: file.originalname }),
        } as any)
        .execute()
        .catch(() => undefined);

      return { success: true, documentId: docId };
    } catch {
      return { error: 'تعذر حفظ المستند' };
    }
  }

  @RequirePermission('content.withdraw')
  @Patch('library-documents/:id/toggle')
  async toggleLibraryDocument(@Param('id') id: string) {
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    try {
      const current = (await this.db.db
        .selectFrom('content.library_documents' as any)
        .select(['status'] as any)
        .where('id' as any, '=', id)
        .executeTakeFirst()) as any;
      if (!current) return { error: 'المستند غير موجود' };
      const publishing = current.status !== 'published';
      const result = await this.db.db
        .updateTable('content.library_documents' as any)
        .set({
          status: publishing ? 'published' : 'draft',
          published_at: publishing ? new Date() : null,
          updated_at: new Date(),
        } as any)
        .where('id' as any, '=', id)
        .returningAll()
        .executeTakeFirst();
      await this.db.db
        .insertInto('audit.audit_logs' as any)
        .values({
          id: crypto.randomUUID(),
          action: publishing ? 'library.published' : 'library.unpublished',
          entity_type: 'library_document',
          entity_id: id,
        } as any)
        .execute()
        .catch(() => undefined);
      return result;
    } catch {
      return { error: 'تعذر تحديث حالة المستند' };
    }
  }

  @RequirePermission('content.publish')
  @Get('library-documents/:id/file')
  async downloadLibraryDocument(@Param('id') id: string, @Res() res: Response) {
    if (!this.db.isInitialized || !this.storage.enabled) {
      res.status(503).json({ error: 'الخدمة غير متاحة' });
      return;
    }
    try {
      const doc = (await this.db.db
        .selectFrom('content.library_documents' as any)
        .select(['file_path', 'title', 'mime_type'] as any)
        .where('id' as any, '=', id)
        .executeTakeFirst()) as any;
      if (!doc?.file_path) {
        res.status(404).json({ error: 'المستند غير موجود' });
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
}
