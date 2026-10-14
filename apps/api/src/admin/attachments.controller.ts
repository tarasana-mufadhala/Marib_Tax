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
import type { Selectable } from 'kysely';
import { RequirePermission } from '../authz/authorization.decorators.js';
import type { ContentLibraryDocumentsTable } from '../database/database.contracts.js';
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

const ALLOWED_CATEGORIES = new Set([
  'attachment',
  'approval_form',
  'rejection_form',
]);

/** الحقول المستعملة فعلاً من ملف Multer المرفوع. */
interface UploadedFilePayload {
  originalname?: string;
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
}

interface ErrorResult {
  error: string;
}

interface RequestAttachmentRow {
  id: string;
  original_filename: string;
  mime_type: string;
  logical_file_size_bytes: string;
  document_category_code: string;
  linked_at: Date;
}

type LibraryDocumentRow = Selectable<ContentLibraryDocumentsTable>;

interface TopicAssignment {
  id: string;
  topicCode: string;
}

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
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  async uploadRequestAttachment(
    @Param('id') requestId: string,
    @UploadedFile() file: UploadedFilePayload | undefined,
    @Body() body: { category?: string } | undefined,
  ): Promise<ErrorResult | { success: true; attachmentId: string }> {
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    if (!this.storage.enabled) return { error: 'خدمة التخزين غير مهيأة' };
    if (!file?.buffer) return { error: 'لم يتم استلام أي ملف' };
    const buffer = file.buffer;

    const mime = file.mimetype ?? 'application/octet-stream';
    if (!ALLOWED_MIME.has(mime)) {
      return {
        error:
          'نوع الملف غير مسموح — المسموح: PDF، صور PNG/JPEG، Word (docx)، Excel (xlsx)، CSV',
      };
    }
    const requestedCategory = body?.category;
    const category =
      requestedCategory !== undefined &&
      ALLOWED_CATEGORIES.has(requestedCategory)
        ? requestedCategory
        : 'attachment';

    try {
      const request = await this.db.db
        .selectFrom('requests.service_requests')
        .select(['id'])
        .where('id', '=', requestId)
        .executeTakeFirst();
      if (!request) return { error: 'الطلب غير موجود' };

      const attachmentId = crypto.randomUUID();
      const ext =
        (file.originalname ?? '').split('.').pop()?.toLowerCase() ?? 'bin';
      const objectPath = `requests/${requestId}/${attachmentId}.${ext}`;

      const uploaded = await this.storage.upload(
        BUCKET,
        objectPath,
        buffer,
        mime,
      );
      if (!uploaded) return { error: 'تعذر رفع الملف إلى التخزين' };

      await this.db.db
        .insertInto('files.attachments')
        .values({
          id: attachmentId,
          // int8 مكتوب كنص في المخطط؛ القيمة المرسلة إلى PostgreSQL هي الرقم ذاته.
          logical_file_size_bytes: String(file.size ?? buffer.length),
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
        })
        .execute();

      await this.db.db
        .insertInto('files.attachment_links')
        .values({
          id: crypto.randomUUID(),
          attachment_id: attachmentId,
          owner_type: 'service_request',
          owner_id: requestId,
          link_role_code: category,
          linked_at: new Date(),
        })
        .execute();

      await this.db.db
        .insertInto('audit.audit_logs')
        .values({
          id: crypto.randomUUID(),
          action: 'attachment.uploaded',
          entity_type: 'service_request',
          entity_id: requestId,
          metadata: JSON.stringify({
            attachmentId,
            category,
            filename: file.originalname,
          }),
        })
        .execute()
        .catch(() => undefined);

      return { success: true, attachmentId };
    } catch {
      return { error: 'تعذر حفظ المرفق' };
    }
  }

  @RequirePermission('attachment.read')
  @Get('requests/:id/attachments')
  async getRequestAttachments(
    @Param('id') requestId: string,
  ): Promise<RequestAttachmentRow[]> {
    if (!this.db.isInitialized) return [];
    try {
      const rows = await this.db.db
        .selectFrom('files.attachment_links')
        .innerJoin(
          'files.attachments',
          'files.attachments.id',
          'files.attachment_links.attachment_id',
        )
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
  async downloadAttachment(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!this.db.isInitialized || !this.storage.enabled) {
      res.status(503).json({ error: 'الخدمة غير متاحة' });
      return;
    }
    try {
      const attachment = await this.db.db
        .selectFrom('files.attachments')
        .select(['storage_object_path', 'original_filename', 'mime_type'])
        .where('id', '=', id)
        .executeTakeFirst();
      if (!attachment?.storage_object_path) {
        res.status(404).json({ error: 'المرفق غير موجود' });
        return;
      }
      // split() يعيد عنصراً واحداً على الأقل، فلا تكون bucket غير معرّفة فعلياً.
      const [bucket, ...rest] = attachment.storage_object_path.split('/');
      const file = await this.storage.download(bucket ?? '', rest.join('/'));
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
  async getLibraryDocuments(): Promise<LibraryDocumentRow[]> {
    if (!this.db.isInitialized) return [];
    try {
      return await this.db.db
        .selectFrom('content.library_documents')
        .selectAll()
        .orderBy('created_at', 'desc')
        .limit(100)
        .execute();
    } catch {
      return [];
    }
  }

  /**
   * إسناد نوع الضريبة لمجموعة مستندات دفعةً واحدة.
   *
   * الموقع العام يعرض المستندات بنوع الضريبة (دخل/مبيعات) كما كان موقع
   * المصلحة القديم، وهو المحور الذي يبحث به المكلف.
   */
  @RequirePermission('content.publish')
  @Patch('library-documents/topics')
  async assignLibraryTopics(
    @Body()
    body: { assignments?: { id?: string; topicCode?: string }[] } | undefined,
  ): Promise<ErrorResult | { success: true; updated: number }> {
    if (!this.db.isInitialized) {
      return { error: 'قاعدة البيانات غير متاحة' };
    }
    const allowed = new Set(['income_tax', 'sales_tax', 'general']);
    const assignments = (body?.assignments ?? []).filter(
      (a): a is TopicAssignment =>
        typeof a.id === 'string' && allowed.has(a.topicCode ?? ''),
    );
    if (assignments.length === 0) {
      return { error: 'لا توجد إسنادات صالحة' };
    }

    let updated = 0;
    for (const assignment of assignments) {
      const result = await this.db.db
        .updateTable('content.library_documents')
        .set({ topic_code: assignment.topicCode, updated_at: new Date() })
        .where('id', '=', assignment.id)
        .executeTakeFirst()
        .catch(() => null);
      if (result) updated += Number(result.numUpdatedRows);
    }

    return { success: true, updated };
  }

  @RequirePermission('content.publish')
  @Post('library-documents')
  // 50 ميغابايت مطابقةً لحد السلة: مستندات المصلحة الرسمية فيها مسوحات
  // ضوئية كبيرة، وحدٌّ أدنى منها كان يستبعدها بصمت.
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }),
  )
  async uploadLibraryDocument(
    @UploadedFile() file: UploadedFilePayload | undefined,
    @Body()
    body: { title?: string; category?: string; version?: string } | undefined,
  ): Promise<ErrorResult | { success: true; documentId: string }> {
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    if (!this.storage.enabled) return { error: 'خدمة التخزين غير مهيأة' };
    if (!file?.buffer) return { error: 'لم يتم استلام أي ملف' };
    const buffer = file.buffer;
    const title = body?.title?.trim();
    if (!title) return { error: 'عنوان المستند مطلوب' };

    const mime = file.mimetype ?? 'application/octet-stream';
    if (!LIBRARY_MIME.has(mime)) {
      return {
        error: 'نوع الملف غير مسموح في المكتبة — المسموح: PDF، صور PNG/JPEG',
      };
    }
    const requestedCategory = body?.category;
    const category =
      requestedCategory !== undefined &&
      LIBRARY_CATEGORIES.has(requestedCategory)
        ? requestedCategory
        : 'form';

    try {
      const docId = crypto.randomUUID();
      const ext =
        (file.originalname ?? '').split('.').pop()?.toLowerCase() ?? 'bin';
      const objectPath = `library/${docId}.${ext}`;

      const uploaded = await this.storage.upload(
        LIBRARY_BUCKET,
        objectPath,
        buffer,
        mime,
      );
      if (!uploaded) return { error: 'تعذر رفع الملف إلى التخزين' };

      await this.db.db
        .insertInto('content.library_documents')
        .values({
          id: docId,
          title,
          category_code: category,
          file_path: `${LIBRARY_BUCKET}/${objectPath}`,
          // int8 مكتوب كنص في المخطط؛ القيمة المرسلة إلى PostgreSQL هي الرقم ذاته.
          file_size_bytes: String(file.size ?? buffer.length),
          mime_type: mime,
          status: 'draft',
          version_label: body?.version?.trim() || '1.0',
        })
        .execute();

      await this.db.db
        .insertInto('audit.audit_logs')
        .values({
          id: crypto.randomUUID(),
          action: 'library.uploaded',
          entity_type: 'library_document',
          entity_id: docId,
          metadata: JSON.stringify({
            title,
            category,
            filename: file.originalname,
          }),
        })
        .execute()
        .catch(() => undefined);

      return { success: true, documentId: docId };
    } catch {
      return { error: 'تعذر حفظ المستند' };
    }
  }

  @RequirePermission('content.withdraw')
  @Patch('library-documents/:id/toggle')
  async toggleLibraryDocument(
    @Param('id') id: string,
  ): Promise<ErrorResult | LibraryDocumentRow | undefined> {
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    try {
      const current = await this.db.db
        .selectFrom('content.library_documents')
        .select(['status'])
        .where('id', '=', id)
        .executeTakeFirst();
      if (!current) return { error: 'المستند غير موجود' };
      const publishing = current.status !== 'published';
      const result = await this.db.db
        .updateTable('content.library_documents')
        .set({
          status: publishing ? 'published' : 'draft',
          published_at: publishing ? new Date() : null,
          updated_at: new Date(),
        })
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
      await this.db.db
        .insertInto('audit.audit_logs')
        .values({
          id: crypto.randomUUID(),
          action: publishing ? 'library.published' : 'library.unpublished',
          entity_type: 'library_document',
          entity_id: id,
        })
        .execute()
        .catch(() => undefined);
      return result;
    } catch {
      return { error: 'تعذر تحديث حالة المستند' };
    }
  }

  @RequirePermission('content.publish')
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
        .select(['file_path', 'title', 'mime_type'])
        .where('id', '=', id)
        .executeTakeFirst();
      if (!doc?.file_path) {
        res.status(404).json({ error: 'المستند غير موجود' });
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
}
