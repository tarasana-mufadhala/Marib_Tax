import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { sql } from 'kysely';
import type { Selectable, Transaction } from 'kysely';
import * as XLSX from 'xlsx';
import { RequirePermission } from '../authz/authorization.decorators.js';
import type {
  DatabaseSchemas,
  ImportsImportJobsTable,
  JsonValue,
} from '../database/database.contracts.js';
import { DatabaseService } from '../database/database.service.js';
import { StorageService } from './storage.service.js';
import { TaxpayerCredentialsService } from '../messaging/taxpayer-credentials.service.js';

type ImportType = 'taxpayers' | 'activities' | 'dues';

interface ParsedRow {
  rowNumber: number;
  raw: Record<string, string>;
}

interface NormalizedRow {
  name?: string;
  phone?: string;
  taxNumber?: string;
  address?: string;
  activityName?: string;
  requestRef?: string;
  currency?: string;
  amount?: number;
}

interface RowError {
  code: string;
  message: string;
  field?: string;
}

interface ValidatedRow {
  rowNumber: number;
  raw: Record<string, string>;
  normalized: NormalizedRow;
  errors: RowError[];
}

interface ImportErrorResponse {
  error: string;
}

interface UploadImportResponse {
  jobId: string;
  total: number;
  valid: number;
  rejected: number;
  errors: { row: number; field: string; message: string }[];
}

interface ImportJobErrorItem {
  id: string;
  row_number: number | null;
  field_name: string | null;
  error_message: string;
}

interface ImportJobDetailResponse {
  job: Selectable<ImportsImportJobsTable>;
  total: number;
  valid: number;
  rejected: number;
  importType: JsonValue;
  errors: ImportJobErrorItem[];
}

interface ApproveImportResponse {
  success: boolean;
  inserted: number;
  skipped: number;
  accountsCreated?: number;
  accountIssues?: string[];
}

interface RejectImportResponse {
  success: boolean;
}

type AuditMetadata = Record<string, string | number>;

interface ContactRow {
  contact_type_code: string;
  contact_value: string;
}

const NAME_HEADERS = ['الاسم', 'الاسم الكامل', 'اسم المكلف', 'name', 'display_name', 'full_name', 'fullname'];
const PHONE_HEADERS = ['الهاتف', 'رقم الهاتف', 'هاتف', 'الجوال', 'رقم الجوال', 'phone', 'mobile', 'phone_number'];
const TAX_HEADERS = ['الرقم الضريبي', 'رقم ضريبي', 'tax_number', 'tin', 'tax_no', 'taxnumber'];
const ADDRESS_HEADERS = ['العنوان', 'address', 'المديرية', 'المنطقة'];
const ACTIVITY_NAME_HEADERS = ['اسم النشاط', 'النشاط', 'activity_name', 'activity', 'اسم المنشأة', 'اسم المحل'];
const REQUEST_REF_HEADERS = ['مرجع الطلب', 'رقم الطلب', 'رقم مرجع الطلب', 'request_ref', 'request', 'request_number'];
const AMOUNT_HEADERS = ['المبلغ', 'مبلغ المستحق', 'المستحق', 'amount', 'due_amount', 'total'];
const CURRENCY_HEADERS = ['العملة', 'currency', 'currency_code'];

function normalizeDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
}

function normalizePhone(value: string): string {
  let digits = normalizeDigits(value).replace(/\D/g, '');
  if (digits.startsWith('00967')) digits = digits.slice(5);
  else if (digits.startsWith('967') && digits.length > 9) digits = digits.slice(3);
  return digits;
}

function pickField(raw: Record<string, string>, candidates: string[]): string {
  for (const key of Object.keys(raw)) {
    const norm = key.trim().toLowerCase().replace(/\s+/g, ' ');
    if (candidates.includes(norm)) return (raw[key] ?? '').trim();
  }
  return '';
}

function randomRef(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()}`;
}

/** يعيد قيمة jsonb ككائن، أو كائناً فارغاً إن لم تكن كائناً. */
function asRecord(value: JsonValue | null | undefined): Record<string, JsonValue> {
  if (value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  return {};
}

/** مكافئ String(value ?? fallback) لقيم jsonb النصية والعددية. */
function jsonText(value: JsonValue | undefined, fallback: string): string {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

/** مراجع الربط بالمكلف (الهاتف/الرقم الضريبي) غير الفارغة. */
function contactRefs(data: Record<string, JsonValue>): string[] {
  return [data.phone, data.taxNumber].filter(
    (v): v is string => typeof v === 'string' && v !== '',
  );
}

@Controller('api/v1/admin')
export class ImportsController {
  constructor(
    private readonly db: DatabaseService,
    private readonly storage: StorageService,
    private readonly credentials: TaxpayerCredentialsService,
  ) {}

  @RequirePermission('import.preview')
  @Post('imports/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadImport(
    @UploadedFile() file: { originalname?: string; mimetype?: string; size?: number; buffer?: Buffer },
    @Body() body: { importType?: string },
  ): Promise<ImportErrorResponse | UploadImportResponse> {
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    const importType = (body?.importType ?? '') as ImportType;
    if (!['taxpayers', 'activities', 'dues'].includes(importType)) {
      return { error: 'نوع الاستيراد غير معروف — اختر: مكلفون أو أنشطة تجارية أو مستحقات' };
    }
    if (!file?.buffer) return { error: 'لم يتم استلام أي ملف' };

    const fileName = file.originalname ?? 'import';
    const ext = fileName.toLowerCase().split('.').pop() ?? '';
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      return { error: 'صيغة الملف غير مدعومة — المسموح: .xlsx أو .xls أو .csv' };
    }

    let rows: ParsedRow[];
    try {
      rows = this.parseFile(file.buffer, ext);
    } catch {
      return { error: 'تعذرت قراءة الملف — تأكد من أنه ملف Excel أو CSV سليم' };
    }
    if (rows.length === 0) return { error: 'الملف لا يحتوي أي صفوف بيانات' };
    if (rows.length > 5000) return { error: 'الحد الأقصى 5000 صف في العملية الواحدة' };

    const validated = await this.validateRows(rows, importType);
    const validCount = validated.filter((r) => r.errors.length === 0).length;
    const rejectedCount = validated.length - validCount;

    try {
      const jobId = crypto.randomUUID();
      const typeLabel =
        importType === 'taxpayers' ? 'مكلفون' : importType === 'activities' ? 'أنشطة تجارية' : 'مستحقات';

      await this.db.db
        .insertInto('imports.import_jobs')
        .values({
          id: jobId,
          public_ref: randomRef('IMP'),
          status_code: 'pending_review',
          source_label: `${typeLabel} — ${fileName}`,
        })
        .execute();

      let storagePath = `inline://${fileName}`;
      if (this.storage.enabled) {
        const objectPath = `imports/${jobId}/${crypto.randomUUID()}.${ext}`;
        const uploaded = await this.storage.upload(
          'admin-attachments',
          objectPath,
          file.buffer,
          file.mimetype ?? 'application/octet-stream',
        );
        if (uploaded) storagePath = `admin-attachments/${objectPath}`;
      }

      await this.db.db
        .insertInto('imports.import_files')
        .values({
          id: crypto.randomUUID(),
          import_job_id: jobId,
          file_name: fileName,
          // int8 مُنمَّط نصاً؛ node-postgres يرسل الأرقام نصاً على أي حال
          file_size_bytes: String(file.size ?? file.buffer.length),
          mime_type: file.mimetype ?? 'application/octet-stream',
          storage_path: storagePath,
        })
        .execute();

      for (const row of validated) {
        const rowId = crypto.randomUUID();
        await this.db.db
          .insertInto('imports.import_rows')
          .values({
            id: rowId,
            import_job_id: jobId,
            row_number: row.rowNumber,
            raw_data: JSON.stringify(row.raw),
            normalized_data: JSON.stringify({ import_type: importType, ...row.normalized }),
            validation_status: row.errors.length === 0 ? 'valid' : 'rejected',
          })
          .execute();

        for (const err of row.errors) {
          await this.db.db
            .insertInto('imports.import_errors')
            .values({
              id: crypto.randomUUID(),
              import_job_id: jobId,
              import_row_id: rowId,
              severity: 'error',
              error_code: err.code,
              error_message: err.message,
              field_name: err.field ?? null,
            })
            .execute();
        }
      }

      await this.audit('import.uploaded', jobId, {
        importType,
        fileName,
        total: validated.length,
        valid: validCount,
        rejected: rejectedCount,
      });

      return {
        jobId,
        total: validated.length,
        valid: validCount,
        rejected: rejectedCount,
        errors: validated
          .flatMap((r) => r.errors.map((e) => ({ row: r.rowNumber, field: e.field ?? '', message: e.message })))
          .slice(0, 50),
      };
    } catch {
      return { error: 'تعذر حفظ عملية الاستيراد في قاعدة البيانات' };
    }
  }

  @RequirePermission('import.validate')
  @Get('imports/:id')
  async getImportJob(@Param('id') id: string): Promise<ImportJobDetailResponse | null> {
    if (!this.db.isInitialized) return null;
    try {
      const job = await this.db.db
        .selectFrom('imports.import_jobs')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
      if (!job) return null;

      const counts = await sql<{
        total: string;
        valid: string;
        rejected: string;
      }>`select
          count(*) as total,
          count(*) filter (where validation_status = 'valid') as valid,
          count(*) filter (where validation_status = 'rejected') as rejected
        from imports.import_rows where import_job_id = ${id}`.execute(this.db.db);

      const errors: ImportJobErrorItem[] = await this.db.db
        .selectFrom('imports.import_errors')
        .leftJoin('imports.import_rows', 'imports.import_rows.id', 'imports.import_errors.import_row_id')
        .select([
          'imports.import_errors.id as id',
          'imports.import_rows.row_number as row_number',
          'imports.import_errors.field_name as field_name',
          'imports.import_errors.error_message as error_message',
        ])
        .where('imports.import_errors.import_job_id', '=', id)
        .orderBy('imports.import_rows.row_number', 'asc')
        .limit(200)
        .execute()
        .catch((): ImportJobErrorItem[] => []);

      const firstRow = await this.db.db
        .selectFrom('imports.import_rows')
        .select(['normalized_data'])
        .where('import_job_id', '=', id)
        .limit(1)
        .executeTakeFirst()
        .catch(() => null);

      const c = counts.rows[0] ?? { total: '0', valid: '0', rejected: '0' };
      return {
        job,
        total: Number(c.total),
        valid: Number(c.valid),
        rejected: Number(c.rejected),
        importType: asRecord(firstRow?.normalized_data).import_type ?? null,
        errors,
      };
    } catch {
      return null;
    }
  }

  @RequirePermission('import.approve')
  @Post('imports/:id/approve')
  async approveImport(@Param('id') id: string): Promise<ImportErrorResponse | ApproveImportResponse> {
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    try {
      const job = await this.db.db
        .selectFrom('imports.import_jobs')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
      if (!job) return { error: 'عملية الاستيراد غير موجودة' };
      if (job.status_code !== 'pending_review') {
        return { error: 'لا يمكن الاعتماد — العملية ليست في حالة «بانتظار الاعتماد»' };
      }

      const validRows = await this.db.db
        .selectFrom('imports.import_rows')
        .select(['id', 'row_number', 'normalized_data'])
        .where('import_job_id', '=', id)
        .where('validation_status', '=', 'valid')
        .orderBy('row_number', 'asc')
        .execute();

      if (validRows.length === 0) return { error: 'لا توجد صفوف صحيحة للترحيل' };

      const importType = asRecord(validRows[0]?.normalized_data).import_type;
      let inserted = 0;
      let skipped = 0;
      // تُجمع هنا ليُنشأ لها حسابات **بعد** نجاح المعاملة: إنشاء الهوية
      // نداء خارجي لا يتراجع مع تراجع المعاملة.
      const provisioned: { taxpayerId: string; phone: string; name: string }[] = [];

      await this.db.db.transaction().execute(async (trx) => {
        for (const row of validRows) {
          const data = asRecord(row.normalized_data);
          try {
            if (importType === 'taxpayers') {
              const taxpayerId = await this.commitTaxpayerRow(trx, data);
              if (taxpayerId !== null) {
                inserted++;
                provisioned.push({
                  taxpayerId,
                  phone: jsonText(data.phone, ''),
                  name: jsonText(data.name, 'مكلف'),
                });
              } else {
                skipped++;
              }
            } else if (importType === 'activities') {
              const done = await this.commitActivityRow(trx, data);
              if (done) inserted++;
              else skipped++;
            } else if (importType === 'dues') {
              const done = await this.commitDueRow(trx, data);
              if (done) inserted++;
              else skipped++;
            }
          } catch {
            skipped++;
          }
        }

        await trx
          .updateTable('imports.import_jobs')
          .set({ status_code: 'imported', updated_at: new Date() })
          .where('id', '=', id)
          .execute();
      });

      // إنشاء حسابات المكلفين المستورَدين. الفشل هنا لا يُبطل الاستيراد:
      // بيانات المكلف مُرحَّلة، والحساب يمكن استكماله لاحقاً.
      let accountsCreated = 0;
      const accountIssues: string[] = [];
      for (const entry of provisioned) {
        const result = await this.credentials.provisionImportedTaxpayer({
          taxpayerId: entry.taxpayerId,
          phone: entry.phone,
          displayName: entry.name,
        });
        if (result.created) accountsCreated++;
        else if (result.reason) accountIssues.push(`${entry.name}: ${result.reason}`);
      }

      await this.audit('import.approved', id, { inserted, skipped, accountsCreated });

      const response: ApproveImportResponse = { success: true, inserted, skipped };
      if (provisioned.length > 0) {
        response.accountsCreated = accountsCreated;
        response.accountIssues = accountIssues.slice(0, 10);
      }
      return response;
    } catch (e: unknown) {
      console.error('approveImport failed:', e);
      return { error: 'تعذر اعتماد وترحيل البيانات' };
    }
  }

  @RequirePermission('import.reject')
  @Post('imports/:id/reject')
  async rejectImport(@Param('id') id: string): Promise<ImportErrorResponse | RejectImportResponse> {
    if (!this.db.isInitialized) return { error: 'قاعدة البيانات غير متاحة' };
    try {
      const result = await this.db.db
        .updateTable('imports.import_jobs')
        .set({ status_code: 'rejected', updated_at: new Date() })
        .where('id', '=', id)
        .where('status_code', '=', 'pending_review')
        .returningAll()
        .executeTakeFirst();
      if (!result) return { error: 'العملية غير موجودة أو سبق معالجتها' };
      await this.audit('import.rejected', id, {});
      return { success: true };
    } catch {
      return { error: 'تعذر رفض عملية الاستيراد' };
    }
  }

  @RequirePermission('import.validate')
  @Get('imports/:id/file')
  async downloadImportFile(@Param('id') id: string, @Res() res: Response): Promise<void> {
    if (!this.db.isInitialized || !this.storage.enabled) {
      res.status(503).json({ error: 'الخدمة غير متاحة' });
      return;
    }
    try {
      const fileRow = await this.db.db
        .selectFrom('imports.import_files')
        .select(['storage_path', 'file_name', 'mime_type'])
        .where('import_job_id', '=', id)
        .executeTakeFirst();
      if (!fileRow?.storage_path || fileRow.storage_path.startsWith('inline://')) {
        res.status(404).json({ error: 'لا يوجد ملف محفوظ لهذه العملية' });
        return;
      }
      const [bucket, ...rest] = fileRow.storage_path.split('/');
      const file = await this.storage.download(bucket ?? '', rest.join('/'));
      if (!file) {
        res.status(404).json({ error: 'تعذر جلب الملف من التخزين' });
        return;
      }
      res.setHeader('Content-Type', fileRow.mime_type ?? file.contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename*=UTF-8''${encodeURIComponent(fileRow.file_name ?? 'import')}`,
      );
      res.send(file.buffer);
    } catch {
      res.status(500).json({ error: 'تعذر تحميل الملف' });
    }
  }

  private parseFile(buffer: Buffer, ext: string): ParsedRow[] {
    const workbook =
      ext === 'csv'
        ? XLSX.read(buffer.toString('utf8').replace(/^\uFEFF/, ''), { type: 'string' })
        : XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
    if (!sheet) return [];
    const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });
    if (matrix.length < 2) return [];

    const headerRow = matrix[0] ?? [];
    const headers = headerRow.map((h) => String(h ?? '').trim());
    const rows: ParsedRow[] = [];
    for (let i = 1; i < matrix.length; i++) {
      const cells = matrix[i] ?? [];
      const raw: Record<string, string> = {};
      let hasValue = false;
      headers.forEach((h, idx) => {
        const v = String(cells[idx] ?? '').trim();
        if (h) raw[h] = v;
        if (v) hasValue = true;
      });
      if (hasValue) rows.push({ rowNumber: i + 1, raw });
    }
    return rows;
  }

  private async validateRows(rows: ParsedRow[], importType: ImportType): Promise<ValidatedRow[]> {
    const validated: ValidatedRow[] = rows.map((r) => {
      const normalized: NormalizedRow = {};
      const errors: RowError[] = [];

      if (importType === 'taxpayers') {
        const name = pickField(r.raw, NAME_HEADERS);
        const phone = normalizePhone(pickField(r.raw, PHONE_HEADERS));
        normalized.name = name;
        normalized.phone = phone;
        normalized.taxNumber = normalizeDigits(pickField(r.raw, TAX_HEADERS)).replace(/\s/g, '');
        normalized.address = pickField(r.raw, ADDRESS_HEADERS);

        if (!name) errors.push({ code: 'MISSING_NAME', message: 'الاسم مطلوب', field: 'الاسم' });
        if (!phone) {
          errors.push({ code: 'MISSING_PHONE', message: 'رقم الهاتف مطلوب', field: 'الهاتف' });
        } else if (phone.length < 7 || phone.length > 15) {
          errors.push({ code: 'INVALID_PHONE', message: `صيغة الهاتف غير صحيحة (${phone})`, field: 'الهاتف' });
        }
      } else if (importType === 'activities') {
        const phone = normalizePhone(pickField(r.raw, PHONE_HEADERS));
        const taxNumber = normalizeDigits(pickField(r.raw, TAX_HEADERS)).replace(/\s/g, '');
        const activityName = pickField(r.raw, ACTIVITY_NAME_HEADERS);
        normalized.phone = phone;
        normalized.taxNumber = taxNumber;
        normalized.activityName = activityName;

        if (!phone && !taxNumber) {
          errors.push({ code: 'MISSING_TAXPAYER_REF', message: 'يجب تحديد هاتف المكلف أو رقمه الضريبي', field: 'المكلف' });
        }
        if (!activityName) {
          errors.push({ code: 'MISSING_ACTIVITY', message: 'اسم النشاط مطلوب', field: 'النشاط' });
        }
      } else {
        // مستحقات: مرجع طلب أو مرجع مكلف + مبلغ إلزامي
        const phone = normalizePhone(pickField(r.raw, PHONE_HEADERS));
        const taxNumber = normalizeDigits(pickField(r.raw, TAX_HEADERS)).replace(/\s/g, '');
        const requestRef = normalizeDigits(pickField(r.raw, REQUEST_REF_HEADERS)).replace(/\s/g, '').toUpperCase();
        normalized.phone = phone;
        normalized.taxNumber = taxNumber;
        normalized.requestRef = requestRef;
        normalized.currency = (pickField(r.raw, CURRENCY_HEADERS) || 'YER').toUpperCase();
        const amountRaw = normalizeDigits(pickField(r.raw, AMOUNT_HEADERS)).replace(/[,\s]/g, '');
        const amount = Number(amountRaw);

        if (!requestRef && !phone && !taxNumber) {
          errors.push({
            code: 'MISSING_LINK_REF',
            message: 'يجب تحديد مرجع الطلب أو هاتف المكلف أو رقمه الضريبي',
            field: 'الربط',
          });
        }
        if (!amountRaw) {
          errors.push({ code: 'MISSING_AMOUNT', message: 'المبلغ مطلوب', field: 'المبلغ' });
        } else if (!Number.isFinite(amount) || amount <= 0) {
          errors.push({ code: 'INVALID_AMOUNT', message: `المبلغ غير صالح (${amountRaw})`, field: 'المبلغ' });
        } else if (amount > 1_000_000_000_000) {
          errors.push({ code: 'AMOUNT_TOO_LARGE', message: 'المبلغ يتجاوز الحد المسموح', field: 'المبلغ' });
        } else {
          normalized.amount = amount;
        }
      }

      return { rowNumber: r.rowNumber, raw: r.raw, normalized, errors };
    });

    // منع التكرار داخل الملف نفسه (المكلفون والأنشطة فقط — للمستحقات يجوز تعدد المستحقات للمكلف الواحد)
    const seenPhones = new Set<string>();
    const seenTax = new Set<string>();
    if (importType !== 'dues') {
      for (const row of validated) {
        const phone = row.normalized.phone;
        const tax = row.normalized.taxNumber;
        if (phone) {
          if (seenPhones.has(phone)) {
            row.errors.push({ code: 'DUPLICATE_PHONE_FILE', message: `الهاتف ${phone} مكرر داخل الملف`, field: 'الهاتف' });
          } else seenPhones.add(phone);
        }
        if (tax) {
          if (seenTax.has(tax)) {
            row.errors.push({ code: 'DUPLICATE_TAX_FILE', message: `الرقم الضريبي ${tax} مكرر داخل الملف`, field: 'الرقم الضريبي' });
          } else seenTax.add(tax);
        }
      }
    } else {
      for (const row of validated) {
        if (row.normalized.phone) seenPhones.add(row.normalized.phone);
        if (row.normalized.taxNumber) seenTax.add(row.normalized.taxNumber);
      }
    }

    // منع التكرار مقابل قاعدة البيانات
    const phones = [...seenPhones];
    const taxes = [...seenTax];
    const contactValues = [...phones, ...taxes];
    let existing: ContactRow[] = [];
    if (contactValues.length > 0) {
      existing = await this.db.db
        .selectFrom('registry.taxpayer_contacts')
        .select(['contact_type_code', 'contact_value'])
        .where('contact_value', 'in', contactValues)
        .where('is_active', '=', true)
        .execute()
        .catch((): ContactRow[] => []);
    }
    const existingPhones = new Set(existing.filter((e) => e.contact_type_code === 'phone').map((e) => e.contact_value));
    const existingTax = new Set(existing.filter((e) => e.contact_type_code === 'tax_number').map((e) => e.contact_value));

    for (const row of validated) {
      const phone = row.normalized.phone;
      const tax = row.normalized.taxNumber;
      if (importType === 'taxpayers') {
        if (phone && existingPhones.has(phone)) {
          row.errors.push({ code: 'DUPLICATE_PHONE_DB', message: `الهاتف ${phone} مسجل مسبقاً في القاعدة`, field: 'الهاتف' });
        }
        if (tax && existingTax.has(tax)) {
          row.errors.push({ code: 'DUPLICATE_TAX_DB', message: `الرقم الضريبي ${tax} مسجل مسبقاً في القاعدة`, field: 'الرقم الضريبي' });
        }
      } else {
        // استيراد الأنشطة والمستحقات: المكلف يجب أن يكون موجوداً
        const found = (phone && existingPhones.has(phone)) || (tax && existingTax.has(tax));
        if ((phone || tax) && !found) {
          row.errors.push({
            code: 'TAXPAYER_NOT_FOUND',
            message: 'المكلف غير موجود في القاعدة — استورد المكلفين أولاً',
            field: 'المكلف',
          });
        }
      }
    }

    // المستحقات: مرجع الطلب (إن حُدد) يجب أن يكون موجوداً
    if (importType === 'dues') {
      const refs = [
        ...new Set(
          validated
            .map((r) => r.normalized.requestRef)
            .filter((ref): ref is string => Boolean(ref)),
        ),
      ];
      let existingRefs = new Set<string>();
      if (refs.length > 0) {
        const reqRows = await this.db.db
          .selectFrom('requests.service_requests')
          .select(['public_ref'])
          .where('public_ref', 'in', refs)
          .where('archived_at', 'is', null)
          .execute()
          .catch((): { public_ref: string | null }[] => []);
        existingRefs = new Set(reqRows.map((r) => String(r.public_ref)));
      }
      for (const row of validated) {
        const ref = row.normalized.requestRef;
        if (ref && !existingRefs.has(ref)) {
          row.errors.push({
            code: 'REQUEST_NOT_FOUND',
            message: `مرجع الطلب ${ref} غير موجود في القاعدة`,
            field: 'مرجع الطلب',
          });
        }
      }
    }

    return validated;
  }

  /** يعيد معرّف المكلف المُنشأ، أو null إن تُخطّي الصف. */
  private async commitTaxpayerRow(
    trx: Transaction<DatabaseSchemas>,
    data: Record<string, JsonValue>,
  ): Promise<string | null> {
    // فحص التكرار لحظة الترحيل (قد يكون سُجل بعد المعاينة)
    const values = contactRefs(data);
    if (values.length > 0) {
      const dup = await trx
        .selectFrom('registry.taxpayer_contacts')
        .select(['id'])
        .where('contact_value', 'in', values)
        .where('is_active', '=', true)
        .executeTakeFirst()
        .catch(() => null);
      if (dup) return null;
    }

    // الصفوف الصحيحة تحمل الاسم والهاتف نصاً دائماً (تحقق validateRows)
    const name = data.name;
    const phone = data.phone;
    if (typeof name !== 'string' || typeof phone !== 'string') return null;

    const taxpayerId = crypto.randomUUID();
    await trx
      .insertInto('registry.taxpayers')
      .values({
        id: taxpayerId,
        public_ref: randomRef('TIN'),
        display_name: name,
        status_code: 'active',
      })
      .execute();

    await trx
      .insertInto('registry.taxpayer_contacts')
      .values({
        id: crypto.randomUUID(),
        taxpayer_id: taxpayerId,
        contact_type_code: 'phone',
        contact_value: phone,
        is_primary: true,
        is_active: true,
        effective_from: new Date(),
      })
      .execute();

    const taxNumber = data.taxNumber;
    if (typeof taxNumber === 'string' && taxNumber) {
      await trx
        .insertInto('registry.taxpayer_contacts')
        .values({
          id: crypto.randomUUID(),
          taxpayer_id: taxpayerId,
          contact_type_code: 'tax_number',
          contact_value: taxNumber,
          is_primary: false,
          is_active: true,
          effective_from: new Date(),
        })
        .execute();
    }
    return taxpayerId;
  }

  private async commitActivityRow(
    trx: Transaction<DatabaseSchemas>,
    data: Record<string, JsonValue>,
  ): Promise<boolean> {
    const values = contactRefs(data);
    const contact = await trx
      .selectFrom('registry.taxpayer_contacts')
      .select(['taxpayer_id'])
      .where('contact_value', 'in', values)
      .where('is_active', '=', true)
      .executeTakeFirst()
      .catch(() => null);
    if (!contact) return false;

    // الصفوف الصحيحة تحمل اسم النشاط نصاً دائماً (تحقق validateRows)
    const activityName = data.activityName;
    if (typeof activityName !== 'string') return false;

    await trx
      .insertInto('masterdata.commercial_activities')
      .values({
        id: crypto.randomUUID(),
        public_ref: randomRef('ACT'),
        taxpayer_id: contact.taxpayer_id,
        name: activityName,
        status_code: 'active',
      })
      .execute();
    return true;
  }

  private async commitDueRow(
    trx: Transaction<DatabaseSchemas>,
    data: Record<string, JsonValue>,
  ): Promise<boolean> {
    // الربط: مرجع الطلب إن حُدد، وإلا أحدث طلب للمكلف — المستحق لا يُنشأ بلا طلب حفاظاً على التتبع
    let requestId: string | null = null;
    // dues.payment_dues.taxpayer_id إلزامي (NOT NULL): يؤخذ من مكلف الطلب نفسه
    let taxpayerId: string | null = null;

    const requestRef = data.requestRef;
    if (typeof requestRef === 'string' && requestRef) {
      const req = await trx
        .selectFrom('requests.service_requests')
        .select(['id', 'taxpayer_id'])
        .where('public_ref', '=', requestRef)
        .where('archived_at', 'is', null)
        .executeTakeFirst()
        .catch(() => null);
      requestId = req?.id ?? null;
      taxpayerId = req?.taxpayer_id ?? null;
    } else {
      const values = contactRefs(data);
      const contact = await trx
        .selectFrom('registry.taxpayer_contacts')
        .select(['taxpayer_id'])
        .where('contact_value', 'in', values)
        .where('is_active', '=', true)
        .executeTakeFirst()
        .catch(() => null);
      if (!contact) return false;
      const req = await trx
        .selectFrom('requests.service_requests')
        .select(['id', 'taxpayer_id'])
        .where('taxpayer_id', '=', contact.taxpayer_id)
        .where('archived_at', 'is', null)
        .orderBy('created_at', 'desc')
        .limit(1)
        .executeTakeFirst()
        .catch(() => null);
      requestId = req?.id ?? null;
      taxpayerId = req?.taxpayer_id ?? null;
    }

    if (!requestId || !taxpayerId) return false;

    // الصفوف الصحيحة تحمل المبلغ رقماً دائماً (تحقق validateRows)
    const amount = data.amount;
    if (typeof amount !== 'number') return false;
    const currency = data.currency;

    await trx
      .insertInto('dues.payment_dues')
      .values({
        id: crypto.randomUUID(),
        public_ref: randomRef('DUE'),
        taxpayer_id: taxpayerId,
        service_request_id: requestId,
        amount,
        currency_code: typeof currency === 'string' && currency ? currency : 'YER',
        status_code: 'unpaid',
        assessed_at: new Date(),
        created_at: new Date(),
      })
      .execute();
    return true;
  }

  private async audit(action: string, jobId: string, metadata: AuditMetadata): Promise<void> {
    await this.db.db
      .insertInto('audit.audit_logs')
      .values({
        id: crypto.randomUUID(),
        action,
        entity_type: 'import_job',
        entity_id: jobId,
        metadata: JSON.stringify(metadata),
      })
      .execute()
      .catch(() => undefined);
  }
}
