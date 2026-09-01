import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  ServiceUnavailableException,
  UnprocessableEntityException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import { sql } from 'kysely';
import type { Response } from 'express';
import { serviceCatalog } from '@marib-tax/contracts';
import { RequirePermission } from '../authz/authorization.decorators.js';
import { CURRENT_ACTOR } from '../authn/authentication.contracts.js';
import type { CurrentActorPort } from '../requests/request-draft.controller.js';
import { DatabaseService } from '../database/database.service.js';
import { StorageService } from '../admin/storage.service.js';

// السلة ومحدداتها معرّفة في هجرة الدفعة 17: خاصة، 5MB، PDF/PNG/JPEG فقط،
// وسياستها تشترط أن يبدأ مسار الملف بمعرّف المكلف.
const BUCKET = 'taxpayer-documents';
const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
]);

/** الحالات التي يُسمح فيها للمكلف برفع مستند. */
const UPLOADABLE_STATUSES = new Set(['draft', 'need_more_info']);

interface UploadedFileLike {
  originalname?: string;
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
}

/**
 * مرفقات المكلف على طلباته هو (FR-101..105).
 *
 * كل نقطة تتحقق من ملكية الطلب أولاً: بلا ذلك يستطيع أي مكلف رفع مستند
 * على طلب غيره أو قراءة مستنداته.
 */
@Controller('api/v1/service-requests/:id/attachments')
export class ServiceRequestAttachmentsController {
  constructor(
    private readonly db: DatabaseService,
    private readonly storage: StorageService,
    @Inject(CURRENT_ACTOR)
    private readonly actors: CurrentActorPort,
  ) {}

  @Post()
  @RequirePermission('attachment.upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  async upload(
    @Param('id', new ParseUUIDPipe()) requestId: string,
    @UploadedFile() file: UploadedFileLike,
    @Body('documentCode') documentCodeInput: string,
  ) {
    this.assertReady();
    const { status, serviceCode, taxpayerId } = await this.ownedRequest(requestId);

    if (!UPLOADABLE_STATUSES.has(status)) {
      throw new ConflictException(
        'لا يمكن إرفاق مستندات على طلب بعد تقديمه، إلا إذا طُلب منك استكمال نواقص',
      );
    }
    if (!file?.buffer) throw new BadRequestException('لم يصل أي ملف');

    const mime = file.mimetype ?? 'application/octet-stream';
    if (!ALLOWED_MIME.has(mime)) {
      throw new UnprocessableEntityException(
        'نوع الملف غير مسموح — المسموح: PDF أو صورة PNG/JPEG',
      );
    }

    // رمز المستند يجب أن يكون من مستندات هذه الخدمة تحديداً.
    const documentCode = this.documentCodeOf(documentCodeInput, serviceCode);

    const attachmentId = randomUUID();
    const extension = extensionOf(file.originalname, mime);
    // المسار يبدأ بمعرّف المكلف لتوافق سياسة السلة.
    const objectPath = `${taxpayerId}/service-requests/${requestId}/${attachmentId}.${extension}`;

    const uploaded = await this.storage.upload(BUCKET, objectPath, file.buffer, mime);
    if (!uploaded) {
      throw new ServiceUnavailableException('تعذّر رفع الملف إلى التخزين');
    }

    await this.db.db.transaction().execute(async (trx) => {
      await sql`
        insert into files.attachments
          (id, logical_file_size_bytes, media_content_class_code,
           access_classification_code, original_filename, mime_type,
           document_category_code, storage_accounting_category_code,
           storage_object_path, version_number, is_current_version,
           storage_status_code, deletion_retention_status_code,
           created_at, created_by_profile_id)
        values (${attachmentId}::uuid, ${file.size ?? file.buffer!.length},
                ${mime.startsWith('image/') ? 'image' : 'document'},
                'confidential', ${file.originalname ?? `file.${extension}`}, ${mime},
                ${documentCode}, 'primary', ${`${BUCKET}/${objectPath}`}, 1, true,
                'stored', 'retained', now(), ${this.actors.requireActorId()}::uuid)
      `.execute(trx);

      await sql`
        insert into files.attachment_links
          (id, attachment_id, owner_type, owner_id, link_role_code, linked_at,
           created_at, created_by_profile_id)
        values (${randomUUID()}::uuid, ${attachmentId}::uuid, 'service_request',
                ${requestId}::uuid, ${documentCode}, now(), now(),
                ${this.actors.requireActorId()}::uuid)
      `.execute(trx);
    });

    return { attachmentId, documentCode };
  }

  @Get()
  @RequirePermission('attachment.read')
  async list(@Param('id', new ParseUUIDPipe()) requestId: string) {
    this.assertReady();
    await this.ownedRequest(requestId);

    const result = await sql<{
      id: string;
      original_filename: string | null;
      mime_type: string | null;
      logical_file_size_bytes: string | number | null;
      document_category_code: string | null;
      linked_at: Date | null;
    }>`
      select a.id, a.original_filename, a.mime_type, a.logical_file_size_bytes,
             a.document_category_code, l.linked_at
      from files.attachment_links l
      join files.attachments a on a.id = l.attachment_id
      where l.owner_type = 'service_request'
        and l.owner_id = ${requestId}::uuid
        and l.unlinked_at is null
      order by l.linked_at desc
      limit 100
    `.execute(this.db.db);

    return result.rows.map((row) => ({
      id: row.id,
      fileName: row.original_filename,
      mimeType: row.mime_type,
      sizeBytes: Number(row.logical_file_size_bytes ?? 0),
      documentCode: row.document_category_code,
      uploadedAt: row.linked_at?.toISOString() ?? null,
    }));
  }

  @Get(':attachmentId/file')
  @RequirePermission('attachment.read')
  async download(
    @Param('id', new ParseUUIDPipe()) requestId: string,
    @Param('attachmentId', new ParseUUIDPipe()) attachmentId: string,
    @Res() res: Response,
  ): Promise<void> {
    this.assertReady();
    await this.ownedRequest(requestId);

    // المرفق يجب أن يكون مربوطاً بهذا الطلب تحديداً، لا بأي طلب آخر.
    const result = await sql<{
      storage_object_path: string | null;
      original_filename: string | null;
      mime_type: string | null;
    }>`
      select a.storage_object_path, a.original_filename, a.mime_type
      from files.attachment_links l
      join files.attachments a on a.id = l.attachment_id
      where l.owner_type = 'service_request'
        and l.owner_id = ${requestId}::uuid
        and l.unlinked_at is null
        and a.id = ${attachmentId}::uuid
      limit 1
    `.execute(this.db.db);

    const attachment = result.rows[0];
    if (!attachment?.storage_object_path) {
      throw new NotFoundException('المرفق غير موجود');
    }

    const [bucket, ...rest] = attachment.storage_object_path.split('/');
    const file = await this.storage.download(bucket!, rest.join('/'));
    if (!file) throw new NotFoundException('تعذّر جلب الملف من التخزين');

    res.setHeader('Content-Type', attachment.mime_type ?? file.contentType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename*=UTF-8''${encodeURIComponent(attachment.original_filename ?? 'file')}`,
    );
    res.send(file.buffer);
  }

  // ---- أدوات داخلية ----

  private assertReady(): void {
    if (!this.db.isInitialized) {
      throw new ServiceUnavailableException('قاعدة البيانات غير متاحة');
    }
    if (!this.storage.enabled) {
      throw new ServiceUnavailableException('خدمة التخزين غير مهيأة');
    }
  }

  /** يتحقق من وجود الطلب وملكيته للمستخدم الحالي. */
  private async ownedRequest(
    requestId: string,
  ): Promise<{ status: string; serviceCode: string; taxpayerId: string }> {
    const result = await sql<{
      status_code: string;
      created_by_profile_id: string | null;
      taxpayer_id: string;
      code: string;
    }>`
      select r.status_code, r.created_by_profile_id, r.taxpayer_id, st.code
      from requests.service_requests r
      join requests.service_types st on st.id = r.service_type_id
      where r.id = ${requestId}::uuid and r.archived_at is null
      limit 1
    `.execute(this.db.db);

    const row = result.rows[0];
    if (!row) throw new NotFoundException('الطلب غير موجود');
    if (row.created_by_profile_id !== this.actors.requireActorId()) {
      throw new ForbiddenException();
    }
    return {
      status: row.status_code,
      serviceCode: row.code,
      taxpayerId: row.taxpayer_id,
    };
  }

  /**
   * رمز المستند يصل في اسم الحقل `documentCode` ضمن النموذج متعدد الأجزاء.
   * نتحقق أنه من مستندات هذه الخدمة، وإلا صار بالإمكان رفع ملفات برموز
   * لا معنى لها فتُحسب زوراً ضمن قاعدة القبول.
   */
  private documentCodeOf(raw: string | undefined, serviceCode: string): string {
    const code = (raw ?? '').trim();
    if (code === '') {
      throw new BadRequestException('رمز المستند مطلوب مع الملف');
    }
    const definition = serviceCatalog[serviceCode as keyof typeof serviceCatalog];
    if (!definition) throw new BadRequestException('خدمة غير معروفة');
    if (!definition.documents.some((document) => document.code === code)) {
      throw new UnprocessableEntityException(
        `المستند «${code}» ليس من مستندات هذه الخدمة`,
      );
    }
    return code;
  }
}

/** امتداد الملف من اسمه، وإلا من نوعه. */
function extensionOf(filename: string | undefined, mime: string): string {
  const fromName = (filename ?? '').split('.').pop()?.toLowerCase() ?? '';
  if (/^[a-z0-9]{1,5}$/.test(fromName)) return fromName;
  if (mime === 'application/pdf') return 'pdf';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/jpeg') return 'jpg';
  return 'bin';
}
