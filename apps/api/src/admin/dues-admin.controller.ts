import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { sql } from 'kysely';
import { RequirePermission } from '../authz/authorization.decorators.js';
import { DatabaseService } from '../database/database.service.js';
import { DomainException } from '../http/domain-exception.js';

const STATUS_LABELS: Record<string, string> = {
  unpaid: 'غير مسدَّد',
  partially_paid: 'مسدَّد جزئياً',
  paid: 'مسدَّد',
  cancelled: 'ملغى',
};

/**
 * قراءة المستحقات للوحة الإدارة.
 *
 * الكتابة (التسجيل والتعديل) تبقى في `DuesPaymentsController` حيث قواعد
 * العمل ومسار التدقيق؛ هذه النقاط للعرض وحده.
 */
@Controller('api/v1/admin/dues')
export class DuesAdminController {
  constructor(private readonly db: DatabaseService) {}

  private ensureDatabase(): void {
    if (!this.db.isInitialized) {
      throw DomainException.unavailable('قاعدة البيانات غير متاحة');
    }
  }

  /**
   * سجل المستحقات مع أسماء المكلفين.
   *
   * الربط بالمكلف مباشر عبر `taxpayer_id` لا عبر الطلب: المستحق المُقيَّد
   * ابتداءً — ربطٌ سنوي أو متأخرات — لا طلب له، وكان يظهر بلا اسم.
   */
  @Get()
  @RequirePermission('due.register')
  async list(
    @Query('status') status?: string,
    @Query('taxpayerId') taxpayerId?: string,
    @Query('search') search?: string,
  ) {
    this.ensureDatabase();

    const statusFilter = (status ?? '').trim();
    const taxpayerFilter = (taxpayerId ?? '').trim();
    const term = (search ?? '').trim();

    const result = await sql<{
      id: string;
      public_ref: string | null;
      amount: string;
      currency_code: string;
      status_code: string;
      assessed_at: Date | null;
      created_at: Date;
      updated_at: Date | null;
      taxpayer_id: string;
      taxpayer_name: string | null;
      taxpayer_ref: string | null;
      request_ref: string | null;
      basis_type_code: string | null;
      document_reference: string | null;
      paid_amount: string;
    }>`
      select d.id,
             d.public_ref,
             d.amount,
             d.currency_code,
             d.status_code,
             d.assessed_at,
             d.created_at,
             d.updated_at,
             d.taxpayer_id,
             tp.display_name as taxpayer_name,
             tp.public_ref as taxpayer_ref,
             sr.public_ref as request_ref,
             (select r.basis_type_code
                from dues.due_basis_document_references r
               where r.payment_due_id = d.id
               order by r.created_at
               limit 1) as basis_type_code,
             (select r.document_reference
                from dues.due_basis_document_references r
               where r.payment_due_id = d.id
               order by r.created_at
               limit 1) as document_reference,
             -- المسدَّد هو ما أُكِّد قبضه، لا ما رُفع إيصاله: الإيصال دعوى
             -- حتى يعتمدها موظف الصندوق.
             coalesce((select sum(rc.amount)
                         from dues.payment_receipts rc
                        where rc.payment_due_id = d.id
                          and upper(rc.acceptance_status_code)
                              in ('VERIFIED', 'APPROVED')), 0)
               as paid_amount
      from dues.payment_dues d
      join registry.taxpayers tp on tp.id = d.taxpayer_id
      left join requests.service_requests sr on sr.id = d.service_request_id
      where d.archived_at is null
        and (${statusFilter} = '' or d.status_code = ${statusFilter})
        and (${taxpayerFilter} = ''
             or d.taxpayer_id = nullif(${taxpayerFilter}, '')::uuid)
        and (${term} = ''
             or tp.display_name ilike ${'%' + term + '%'}
             or coalesce(tp.public_ref, '') ilike ${'%' + term + '%'}
             or coalesce(d.public_ref, '') ilike ${'%' + term + '%'})
      order by
        -- غير المسدَّد أولاً: هو ما يستدعي إجراءً.
        case when d.status_code = 'paid' then 1 else 0 end,
        d.created_at desc
      limit 200
    `.execute(this.db.db);

    return result.rows.map((row) => {
      const amount = Number(row.amount);
      const paid = Number(row.paid_amount);
      return {
        id: row.id,
        publicRef: row.public_ref,
        amount,
        paidAmount: paid,
        remainingAmount: Math.max(0, Math.round((amount - paid) * 100) / 100),
        currencyCode: row.currency_code,
        statusCode: row.status_code,
        statusLabel: STATUS_LABELS[row.status_code] ?? row.status_code,
        assessedAt: row.assessed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        taxpayerId: row.taxpayer_id,
        taxpayerName: row.taxpayer_name,
        taxpayerRef: row.taxpayer_ref,
        requestRef: row.request_ref,
        basisTypeCode: row.basis_type_code,
        documentReference: row.document_reference,
        // التعديل ممكن ما دام المبلغ لم يُسدَّد بالكامل ولم يُلغَ.
        editable: row.status_code === 'unpaid' || row.status_code === 'partially_paid',
      };
    });
  }

  /** سجل تعديلات مستحق واحد — من غيّر المبلغ ومتى ولماذا. */
  @Get(':id/corrections')
  @RequirePermission('due.register')
  async corrections(@Param('id', new ParseUUIDPipe()) id: string) {
    this.ensureDatabase();

    const result = await sql<{
      prior_amount: string;
      new_amount: string;
      currency_code: string;
      reason: string;
      corrected_at: Date;
      officer_name: string | null;
    }>`
      select c.prior_amount,
             c.new_amount,
             c.currency_code,
             c.reason,
             c.corrected_at,
             up.display_name as officer_name
      from dues.due_corrections c
      left join identity.staff_profiles sp
        on sp.id = c.corrected_by_staff_profile_id
      left join identity.user_profiles up on up.id = sp.user_profile_id
      where c.payment_due_id = ${id}::uuid
      order by c.corrected_at desc
      limit 50
    `.execute(this.db.db);

    return result.rows.map((row) => ({
      priorAmount: Number(row.prior_amount),
      newAmount: Number(row.new_amount),
      currencyCode: row.currency_code,
      reason: row.reason,
      correctedAt: row.corrected_at,
      officerName: row.officer_name,
    }));
  }
}
