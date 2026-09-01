import { Controller, ForbiddenException, Get, Inject, Param } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { RequirePermission } from '../authz/authorization.decorators.js';
import {
  VERIFIED_ACTOR,
  type AuthenticatedRequest,
} from '../authn/bearer-actor-context.resolver.js';
import { DatabaseService } from '../database/database.service.js';
import { sql } from 'kysely';

interface ReportResult {
  available: boolean;
  headers: string[];
  rows: string[][];
}

const UNAVAILABLE: ReportResult = { available: false, headers: [], rows: [] };

/**
 * تقارير تكشف بيانات رقابية/أمنية حساسة، فتتطلب `audit.sensitive.view`
 * فوق `report.view` — مطابقةً لـ allowedRoles في reports-catalog.ts
 * (REP-25/26/27 مقصورة على ADMIN و AUDITOR).
 */
const SENSITIVE_REPORTS = new Set(['rep-25', 'rep-26', 'rep-27']);

@Controller('api/v1/reports')
@RequirePermission('report.view')
export class ReportsController {
  constructor(
    private readonly db: DatabaseService,
    @Inject(REQUEST) private readonly request: AuthenticatedRequest,
  ) {}

  private assertMayRead(reportId: string): void {
    if (!SENSITIVE_REPORTS.has(reportId)) return;
    const permissions = this.request[VERIFIED_ACTOR]?.permissions ?? [];
    if (!permissions.includes('audit.sensitive.view')) {
      throw new ForbiddenException(
        'This report requires the audit.sensitive.view permission.',
      );
    }
  }

  @Get('executive-summary')
  async getExecutiveSummary() {
    const empty = {
      totalCollections: 0,
      registeredTaxpayers: 0,
      pendingRequests: 0,
      fieldVisitsCount: 0,
      complianceRate: 100,
    };
    if (!this.db.isInitialized) return empty;

    try {
      const count = async (table: string, extra?: (q: any) => any) => {
        let q = this.db.db
          .selectFrom(table as any)
          .select(({ fn }: any) => [fn.countAll().as('count')]);
        if (extra) q = extra(q);
        const row = await q.executeTakeFirst().catch(() => ({ count: 0 }));
        return Number((row as any)?.count ?? 0);
      };

      const [registeredTaxpayers, pendingRequests, fieldVisitsCount, totalDues, paidDues] =
        await Promise.all([
          count('registry.taxpayers'),
          count('requests.service_requests', (q) =>
            q
              .where('archived_at' as any, 'is', null)
              .where('status_code' as any, 'not in', ['completed', 'rejected', 'closed']),
          ),
          count('visits.field_visits', (q) => q.where('archived_at' as any, 'is', null)),
          count('dues.payment_dues', (q) => q.where('archived_at' as any, 'is', null)),
          count('dues.payment_dues', (q) =>
            q
              .where('archived_at' as any, 'is', null)
              .where('status_code' as any, '=', 'paid'),
          ),
        ]);

      const collectionsRow = await this.db.db
        .selectFrom('dues.payment_confirmations' as any)
        .select(({ fn }: any) => [fn.sum('amount_confirmed').as('total')])
        .where('outcome_code' as any, '=', 'confirmed')
        .executeTakeFirst()
        .catch(() => ({ total: 0 }));

      return {
        totalCollections: Number((collectionsRow as any)?.total ?? 0),
        registeredTaxpayers,
        pendingRequests,
        fieldVisitsCount,
        complianceRate:
          totalDues === 0 ? 100 : Math.round((paidDues / totalDues) * 100),
      };
    } catch {
      return empty;
    }
  }

  @Get(':reportId')
  async getReport(@Param('reportId') reportId: string): Promise<ReportResult> {
    this.assertMayRead(reportId);
    if (!this.db.isInitialized) return UNAVAILABLE;
    const builder = this.reportBuilders[reportId];
    if (!builder) return UNAVAILABLE;
    try {
      return await builder();
    } catch {
      return UNAVAILABLE;
    }
  }

  private async query(sqlText: string): Promise<any[]> {
    const result = await sql.raw(sqlText).execute(this.db.db);
    return result.rows as any[];
  }

  private get reportBuilders(): Record<string, () => Promise<ReportResult>> {
    return {
      // 1. تقرير الطلبات حسب الخدمة
      'rep-01': async () => ({
        available: true,
        headers: ['الخدمة', 'المستلمة', 'المكتملة', 'المرفوضة', 'بانتظار السداد', 'نسبة الإنجاز'],
        rows: (await this.query(`
          select coalesce(st.name, '—') as service,
                 count(*)::int as total,
                 count(*) filter (where r.status_code = 'completed')::int as completed,
                 count(*) filter (where r.status_code in ('rejected','cancelled'))::int as rejected,
                 count(*) filter (where r.status_code = 'payment_required')::int as payment
          from requests.service_requests r
          left join requests.service_types st on st.id = r.service_type_id
          where r.archived_at is null
          group by 1 order by 2 desc`)).map((r) => [
          r.service, String(r.total), String(r.completed), String(r.rejected), String(r.payment),
          r.total > 0 ? `${Math.round((r.completed / r.total) * 100)}%` : '0%',
        ]),
      }),

      // 2. تقرير حالات الطلبات
      'rep-02': async () => ({
        available: true,
        headers: ['الحالة', 'عدد الطلبات'],
        rows: (await this.query(`
          select status_code, count(*)::int as n
          from requests.service_requests
          where archived_at is null
          group by 1 order by 2 desc`)).map((r) => [String(r.status_code), String(r.n)]),
      }),

      // 3. تقرير أعمار المعاملات
      'rep-03': async () => ({
        available: true,
        headers: ['عمر المعاملة', 'التصنيف', 'العدد'],
        rows: (await this.query(`
          select case
                   when age_days <= 2 then '0–2 يوم'
                   when age_days <= 7 then '3–7 أيام'
                   when age_days <= 15 then '8–15 يومًا'
                   when age_days <= 30 then 'أكثر من 15 يومًا'
                   else 'أكثر من 30 يومًا'
                 end as bucket,
                 case
                   when age_days <= 2 then 'جديدة'
                   when age_days <= 7 then 'تحت المتابعة'
                   when age_days <= 15 then 'متأخرة نسبيًا'
                   when age_days <= 30 then 'متأخرة'
                   else 'حرجة'
                 end as label,
                 count(*)::int as n
          from (
            select extract(day from now() - created_at)::int as age_days
            from requests.service_requests
            where archived_at is null and status_code not in ('completed','rejected','cancelled','closed')
          ) t
          group by 1, 2 order by min(age_days)`)).map((r) => [r.bucket, r.label, String(r.n)]),
      }),

      // 4. الطلبات المرفوضة والملغاة
      'rep-04': async () => ({
        available: true,
        headers: ['رقم الطلب', 'المكلف', 'الخدمة', 'الحالة', 'سبب/ملخص القرار', 'تاريخ القرار'],
        rows: (await this.query(`
          select r.public_ref, coalesce(tp.display_name,'—') as taxpayer,
                 coalesce(st.name,'—') as service, r.status_code,
                 coalesce(d.decision_summary,'—') as reason,
                 coalesce(to_char(d.decided_at,'YYYY-MM-DD'), to_char(r.updated_at,'YYYY-MM-DD'), '—') as decided
          from requests.service_requests r
          left join registry.taxpayers tp on tp.id = r.taxpayer_id
          left join requests.service_types st on st.id = r.service_type_id
          left join requests.request_decision_records d on d.service_request_id = r.id
          where r.archived_at is null and r.status_code in ('rejected','cancelled')
          order by r.updated_at desc nulls last limit 100`)).map((r) => [
          r.public_ref ?? '—', r.taxpayer, r.service,
          r.status_code === 'rejected' ? 'مرفوض' : 'ملغي', r.reason, r.decided,
        ]),
      }),

      // 5. طلبات استكمال النواقص
      'rep-05': async () => ({
        available: true,
        headers: ['رقم الطلب', 'المكلف', 'تاريخ طلب الاستكمال', 'حالة الاستجابة'],
        rows: (await this.query(`
          select r.public_ref, coalesce(tp.display_name,'—') as taxpayer,
                 to_char(c.requested_at,'YYYY-MM-DD') as requested,
                 case when resp.id is not null then 'تمت الاستجابة' else 'بانتظار المكلف' end as response
          from requests.request_completion_requests c
          join requests.service_requests r on r.id = c.service_request_id
          left join registry.taxpayers tp on tp.id = r.taxpayer_id
          left join requests.request_completion_responses resp on resp.completion_request_id = c.id
          order by c.requested_at desc limit 100`)).map((r) => [
          r.public_ref ?? '—', r.taxpayer, r.requested ?? '—', r.response,
        ]),
      }),

      // 6. البلاغات حسب النوع
      'rep-06': async () => ({
        available: true,
        headers: ['نوع البلاغ', 'الإجمالي', 'المفتوحة', 'المغلقة'],
        rows: (await this.query(`
          select coalesce(balagh_type_code,'—') as type,
                 count(*)::int as total,
                 count(*) filter (where status_code not in ('completed','closed','rejected'))::int as open,
                 count(*) filter (where status_code in ('completed','closed'))::int as closed
          from balaghat.balaghs
          group by 1 order by 2 desc`)).map((r) => [r.type, String(r.total), String(r.open), String(r.closed)]),
      }),

      // 7. نتائج البلاغات
      'rep-07': async () => ({
        available: true,
        headers: ['النتيجة', 'العدد'],
        rows: (await this.query(`
          select coalesce(outcome_code,'بدون قرار بعد') as outcome, count(*)::int as n
          from balaghat.balagh_decision_records
          group by 1 order by 2 desc`)).map((r) => [r.outcome, String(r.n)]),
      }),

      // 8. الأنشطة الموقوفة والمفعلة
      'rep-08': async () => ({
        available: true,
        headers: ['النشاط', 'المكلف', 'الحالة', 'آخر تغيير للحالة'],
        rows: (await this.query(`
          select coalesce(a.name,'—') as activity, coalesce(tp.display_name,'—') as taxpayer,
                 coalesce(a.status_code,'—') as status,
                 coalesce(to_char(h.changed_at,'YYYY-MM-DD'),'—') as changed
          from masterdata.commercial_activities a
          left join registry.taxpayers tp on tp.id = a.taxpayer_id
          left join lateral (
            select changed_at from masterdata.activity_status_histories h
            where h.commercial_activity_id = a.id order by changed_at desc limit 1
          ) h on true
          order by a.created_at desc limit 100`)).map((r) => [r.activity, r.taxpayer, r.status, r.changed]),
      }),

      // 9. مواعيد النزول الميداني
      'rep-09': async () => ({
        available: true,
        headers: ['رقم الزيارة', 'المكلف', 'الحالة', 'تاريخ الإنشاء'],
        rows: (await this.query(`
          select v.public_ref, coalesce(tp.display_name,'—') as taxpayer,
                 v.status_code, to_char(v.created_at,'YYYY-MM-DD') as created
          from visits.field_visits v
          left join requests.service_requests r on r.id = v.service_request_id
          left join registry.taxpayers tp on tp.id = r.taxpayer_id
          where v.archived_at is null
          order by v.created_at desc limit 100`)).map((r) => [
          r.public_ref ?? '—', r.taxpayer, r.status_code ?? '—', r.created ?? '—',
        ]),
      }),

      // 10. نتائج الزيارات
      'rep-10': async () => ({
        available: true,
        headers: ['رقم الزيارة', 'النتيجة', 'الملاحظات', 'التاريخ'],
        rows: (await this.query(`
          select v.public_ref, coalesce(res.result_code,'—') as outcome,
                 coalesce(res.result_summary,'—') as notes, to_char(res.recorded_at,'YYYY-MM-DD') as created
          from visits.visit_results res
          join visits.field_visits v on v.id = res.field_visit_id
          order by res.recorded_at desc limit 100`)).map((r) => [
          r.public_ref ?? '—', r.outcome, r.notes, r.created ?? '—',
        ]),
      }),

      // 11. أداء النزول الميداني
      'rep-11': async () => ({
        available: true,
        headers: ['الموظف', 'عدد الزيارات', 'المكتملة', 'نسبة الإنجاز'],
        rows: (await this.query(`
          select coalesce(up.display_name, v.created_by_staff_profile_id::text) as staff,
                 count(*)::int as total,
                 count(*) filter (where v.status_code = 'completed')::int as done
          from visits.field_visits v
          left join identity.staff_profiles sp on sp.id = v.created_by_staff_profile_id
          left join identity.user_profiles up on up.id = sp.user_profile_id
          where v.archived_at is null
          group by 1 order by 2 desc`)).map((r) => [
          r.staff, String(r.total), String(r.done),
          r.total > 0 ? `${Math.round((r.done / r.total) * 100)}%` : '0%',
        ]),
      }),

      // 12. المكلفون الجدد
      'rep-12': async () => ({
        available: true,
        headers: ['الرقم الضريبي', 'اسم المكلف', 'تاريخ التسجيل', 'الحالة'],
        rows: (await this.query(`
          select coalesce(public_ref,'—') as ref, coalesce(display_name,'—') as name,
                 to_char(created_at,'YYYY-MM-DD') as registered, coalesce(status_code,'—') as status
          from registry.taxpayers
          order by created_at desc limit 100`)).map((r) => [r.ref, r.name, r.registered ?? '—', r.status]),
      }),

      // 13. قاعدة المكلفين
      'rep-13': async () => ({
        available: true,
        headers: ['المؤشر', 'العدد'],
        rows: (await this.query(`
          select 'إجمالي المكلفين' as label, count(*)::int as n from registry.taxpayers
          union all
          select 'النشطون', count(*)::int from registry.taxpayers where status_code = 'active'
          union all
          select 'من لديهم معاملات مفتوحة', count(distinct taxpayer_id)::int from requests.service_requests
            where archived_at is null and status_code not in ('completed','rejected','cancelled','closed')
          union all
          select 'من لديهم مستحقات مسجلة', count(distinct r.taxpayer_id)::int from dues.payment_dues d
            join requests.service_requests r on r.id = d.service_request_id
            where d.archived_at is null`)).map((r) => [r.label, String(r.n)]),
      }),

      // 14. الأنشطة التجارية
      'rep-14': async () => ({
        available: true,
        headers: ['الحالة', 'عدد الأنشطة'],
        rows: (await this.query(`
          select coalesce(status_code,'—') as status, count(*)::int as n
          from masterdata.commercial_activities
          group by 1 order by 2 desc`)).map((r) => [r.status, String(r.n)]),
      }),

      // 15. الكيانات القانونية
      'rep-15': async () => ({
        available: true,
        headers: ['الكيان القانوني', 'عدد المكلفين المرتبطين', 'مفعّل'],
        rows: (await this.query(`
          select coalesce(le.legal_name, '—') as entity,
                 count(tla.id)::int as taxpayers,
                 case when le.is_active then 'نعم' else 'لا' end as active
          from legal.legal_entities le
          left join registry.taxpayer_legal_entity_associations tla on tla.legal_entity_id = le.id
          where le.archived_at is null
          group by 1, le.is_active order by 2 desc`)).map((r) => [r.entity, String(r.taxpayers), r.active]),
      }),

      // 16. المعاملات المتوقفة بسبب السداد
      'rep-16': async () => ({
        available: true,
        headers: ['رقم الطلب', 'المكلف', 'المبلغ (ر.ي)', 'تاريخ إشعار السداد', 'أيام منذ الإشعار', 'حالة السداد'],
        rows: (await this.query(`
          select r.public_ref, coalesce(tp.display_name,'—') as taxpayer,
                 d.amount::text, to_char(coalesce(d.assessed_at, d.created_at),'YYYY-MM-DD') as notified,
                 extract(day from now() - coalesce(d.assessed_at, d.created_at))::int as days,
                 d.status_code
          from dues.payment_dues d
          left join requests.service_requests r on r.id = d.service_request_id
          left join registry.taxpayers tp on tp.id = r.taxpayer_id
          where d.archived_at is null
          order by days desc limit 100`)).map((r) => [
          r.public_ref ?? '—', r.taxpayer, r.amount ?? '0', r.notified ?? '—', String(r.days ?? 0),
          r.status_code === 'paid' ? 'مسدد' : 'غير مسدد',
        ]),
      }),

      // 17. رسائل SMS وواتساب
      'rep-17': async () => ({
        available: true,
        headers: ['حالة التسليم', 'عدد الرسائل', 'محاولات فاشلة'],
        rows: (await this.query(`
          select coalesce(m.delivery_status_code,'—') as status,
                 count(distinct m.id)::int as messages,
                 count(a.id) filter (where a.attempt_status_code in ('failed','error'))::int as failed
          from notify.notification_messages m
          left join notify.delivery_attempts a on a.notification_message_id = m.id
          group by 1 order by 2 desc`)).map((r) => [r.status, String(r.messages), String(r.failed)]),
      }),

      // 18. رموز التحقق OTP
      'rep-18': async () => {
        const labels: Record<string, string> = {
          otp_requested: 'رموز مُرسلة',
          otp_verified: 'عمليات تحقق ناجحة',
          otp_failed: 'محاولات فاشلة',
          otp_expired: 'رموز منتهية الصلاحية',
          otp_rate_limited: 'تجاوز حد المعدل (5/دقيقة)',
        };
        return {
          available: true,
          headers: ['الحدث', 'العدد', 'آخر حدوث'],
          rows: (await this.query(`
            select event_type, count(*)::int as n,
                   to_char(max(created_at),'YYYY-MM-DD HH24:MI') as last
            from identity.auth_events
            where event_type like 'otp%'
            group by 1 order by 2 desc`)).map((r) => [
            labels[r.event_type] ?? r.event_type, String(r.n), r.last ?? '—',
          ]),
        };
      },

      // 19. الإشعارات غير المقروءة
      'rep-19': async () => ({
        available: true,
        headers: ['حالة القراءة', 'عدد الإشعارات', 'أقدم إشعار (أيام)'],
        rows: (await this.query(`
          select coalesce(rs.read_status_code,'غير مقروء') as status, count(*)::int as unread,
                 coalesce(extract(day from now() - min(rs.created_at))::int, 0) as oldest
          from notify.notification_read_states rs
          group by 1 order by 2 desc`)).map((r) => [r.status, String(r.unread), String(r.oldest)]),
      }),

      // 20. المستندات الناقصة أو المرفوضة
      'rep-20': async () => ({
        available: true,
        headers: ['الفئة', 'التفصيل', 'العدد'],
        rows: (await this.query(`
          select 'طلبات استكمال النواقص حسب الخدمة' as cat, coalesce(st.name,'—') as detail, count(*)::int as n
          from requests.request_completion_requests c
          join requests.service_requests r on r.id = c.service_request_id
          left join requests.service_types st on st.id = r.service_type_id
          group by 1, 2
          union all
          select 'طلبات نواقص بانتظار المكلف', 'لم تُرفع الاستجابة بعد', count(*)::int
          from requests.request_completion_requests c
          left join requests.request_completion_responses resp on resp.completion_request_id = c.id
          where resp.id is null
          union all
          select 'نماذج الرفض المرفوعة', 'مرفقات مصنفة «نموذج رفض»', count(*)::int
          from files.attachments
          where document_category_code = 'rejection_form'
          order by 3 desc`)).map((r) => [r.cat, r.detail, String(r.n)]),
      }),

      // 21. التخزين والمرفقات
      'rep-21': async () => ({
        available: true,
        headers: ['المؤشر', 'القيمة'],
        rows: (await this.query(`
          select 'إجمالي الملفات' as label, count(*)::text as value from files.attachments
          union all
          select 'إجمالي الحجم (MB)', coalesce(round(sum(logical_file_size_bytes) / 1048576.0, 2), 0)::text from files.attachments
          union all
          select 'الملفات المرتبطة بسجلات', count(*)::text from files.attachment_links`)).map((r) => [r.label, r.value]),
      }),

      // 22. عمليات الاستيراد
      'rep-22': async () => ({
        available: true,
        headers: ['المرجع', 'المصدر', 'الحالة', 'التاريخ'],
        rows: (await this.query(`
          select coalesce(public_ref,'—') as ref, coalesce(source_label,'—') as source,
                 coalesce(status_code,'—') as status, to_char(created_at,'YYYY-MM-DD HH24:MI') as created
          from imports.import_jobs
          order by created_at desc limit 100`)).map((r) => [r.ref, r.source, r.status, r.created ?? '—']),
      }),

      // 23. أخطاء الاستيراد
      'rep-23': async () => ({
        available: true,
        headers: ['رقم الصف', 'الحقل', 'السبب', 'عملية الاستيراد'],
        rows: (await this.query(`
          select coalesce(rw.row_number::text,'—') as row, coalesce(e.field_name,'—') as field,
                 coalesce(e.error_message, e.error_code, '—') as reason,
                 coalesce(j.public_ref,'—') as job
          from imports.import_errors e
          left join imports.import_rows rw on rw.id = e.import_row_id
          left join imports.import_jobs j on j.id = e.import_job_id
          order by e.created_at desc limit 100`)).map((r) => [r.row, r.field, r.reason, r.job]),
      }),

      // 24. جودة البيانات
      'rep-24': async () => ({
        available: true,
        headers: ['التصنيف', 'الخلل', 'العدد'],
        rows: (await this.query(`
          select 'تكرار' as cat, 'أرقام هواتف مشتركة بين أكثر من مكلف' as issue, count(*)::int as n
          from (select contact_value from registry.taxpayer_contacts
                where contact_type_code = 'phone' and is_active
                group by 1 having count(distinct taxpayer_id) > 1) t
          union all
          select 'تكرار', 'أرقام ضريبية مكررة', count(*)::int
          from (select contact_value from registry.taxpayer_contacts
                where contact_type_code = 'tax_number' and is_active
                group by 1 having count(distinct taxpayer_id) > 1) t
          union all
          select 'تكرار', 'أسماء مكلفين مكررة', count(*)::int
          from (select display_name from registry.taxpayers
                where display_name is not null and archived_at is null
                group by 1 having count(*) > 1) t
          union all
          select 'سجلات يتيمة', 'طلبات بلا مكلف مرتبط', count(*)::int
          from requests.service_requests r
          left join registry.taxpayers tp on tp.id = r.taxpayer_id
          where r.archived_at is null and tp.id is null
          union all
          select 'سجلات يتيمة', 'مستحقات بلا طلب أو بلاغ', count(*)::int
          from dues.payment_dues
          where archived_at is null and service_request_id is null and balagh_id is null
          union all
          select 'سجلات يتيمة', 'مرفقات غير مرتبطة بأي سجل', count(*)::int
          from files.attachments a
          left join files.attachment_links l on l.attachment_id = a.id and l.unlinked_at is null
          where l.id is null
          union all
          select 'سجلات يتيمة', 'زيارات ميدانية بلا طلب أو بلاغ', count(*)::int
          from visits.field_visits
          where archived_at is null and service_request_id is null and balagh_id is null
          union all
          select 'حالات غير منطقية', 'طلبات مكتملة ولها مستحقات غير مسددة', count(distinct r.id)::int
          from requests.service_requests r
          join dues.payment_dues d on d.service_request_id = r.id and d.archived_at is null
          where r.archived_at is null and r.status_code = 'completed' and d.status_code <> 'paid'
          union all
          select 'حالات غير منطقية', 'زيارات مكتملة بلا نتيجة مسجلة', count(*)::int
          from visits.field_visits v
          left join visits.visit_results res on res.field_visit_id = v.id
          where v.archived_at is null and v.status_code = 'completed' and res.id is null
          union all
          select 'حالات غير منطقية', 'طلبات مُقدَّمة بلا تاريخ تقديم', count(*)::int
          from requests.service_requests
          where archived_at is null and status_code <> 'draft' and submitted_at is null
          union all
          select 'حالات غير منطقية', 'مستحقات مسددة بلا إيصال سداد', count(*)::int
          from dues.payment_dues d
          left join dues.payment_receipts pr on pr.payment_due_id = d.id
          where d.archived_at is null and d.status_code = 'paid' and pr.id is null
          order by 1, 3 desc`)).map((r) => [r.cat, r.issue, String(r.n)]),
      }),

      // 25. سجل التدقيق
      'rep-25': async () => ({
        available: true,
        headers: ['الإجراء', 'الكيان/السجل', 'المنفذ', 'التاريخ والوقت'],
        rows: (await this.query(`
          select coalesce(action,'—') as action,
                 coalesce(entity_type,'') || coalesce('/' || entity_id::text,'') as target,
                 coalesce(actor_profile_id::text,'النظام') as actor,
                 to_char(created_at,'YYYY-MM-DD HH24:MI') as at
          from audit.audit_logs
          order by created_at desc limit 200`)).map((r) => [r.action, r.target || '—', r.actor, r.at ?? '—']),
      }),

      // 26. العمليات الحساسة
      'rep-26': async () => ({
        available: true,
        headers: ['العملية', 'التصنيف', 'الكيان/السجل', 'المنفذ', 'التاريخ والوقت'],
        rows: (await this.query(`
          select op, cat, target, actor, at from (
            select l.created_at as ts,
                   coalesce(l.action,'—') as op,
                   case
                     when l.action ~* 'delete|remove|purge' then 'حذف سجل'
                     when l.action ~* 'reject' then 'رفض معاملة'
                     when l.action ~* 'role|permission|grant|revoke' then 'تغيير صلاحيات'
                     when l.action ~* 'unpublish|archive' then 'إيقاف أو أرشفة محتوى'
                     else 'عملية إدارية حساسة'
                   end as cat,
                   coalesce(l.entity_type,'—') || coalesce(' / ' || l.entity_id::text,'') as target,
                   coalesce(up.display_name, l.actor_profile_id::text, 'النظام') as actor,
                   to_char(l.created_at,'YYYY-MM-DD HH24:MI') as at
            from audit.audit_logs l
            left join identity.user_profiles up on up.id = l.actor_profile_id
            where l.action ~* 'delete|remove|purge|reject|role|permission|grant|revoke|unpublish|archive'

            union all

            select d.decided_at,
                   'رفض الطلب ' || coalesce(r.public_ref, r.id::text),
                   'رفض معاملة',
                   'service_request / ' || coalesce(r.public_ref, r.id::text),
                   coalesce(up.display_name,'—'),
                   to_char(d.decided_at,'YYYY-MM-DD HH24:MI')
            from requests.request_decision_records d
            join requests.service_requests r on r.id = d.service_request_id
            left join identity.staff_profiles sp on sp.id = d.decided_by_staff_profile_id
            left join identity.user_profiles up on up.id = sp.user_profile_id
            where d.outcome_code ~* 'reject'

            union all

            select coalesce(ra.revoked_at, ra.assigned_at),
                   case when ra.revoked_at is not null then 'سحب دور ' else 'إسناد دور ' end
                     || coalesce(ro.name_ar, ro.code, '—'),
                   'تغيير صلاحيات',
                   'staff_profile / ' || coalesce(target_up.display_name, ra.staff_profile_id::text),
                   coalesce(actor_up.display_name,'—'),
                   to_char(coalesce(ra.revoked_at, ra.assigned_at),'YYYY-MM-DD HH24:MI')
            from identity.staff_role_assignments ra
            left join identity.roles ro on ro.id = ra.role_id
            left join identity.staff_profiles target_sp on target_sp.id = ra.staff_profile_id
            left join identity.user_profiles target_up on target_up.id = target_sp.user_profile_id
            left join identity.user_profiles actor_up
              on actor_up.id = coalesce(ra.revoked_by_profile_id, ra.assigned_by_profile_id)
          ) t
          order by ts desc nulls last limit 200`)).map((r) => [
          r.op, r.cat, r.target, r.actor, r.at ?? '—',
        ]),
      }),

      // 27. الدخول والأمان
      'rep-27': async () => ({
        available: true,
        headers: ['المؤشر', 'التفصيل', 'العدد', 'آخر حدوث'],
        rows: (await this.query(`
          with masked as (
            select event_type, created_at,
                   case when length(identifier) > 7
                        then left(identifier,5) || '****' || right(identifier,2)
                        else identifier end as who
            from identity.auth_events
          )
          select ord, label, detail, n, last from (
            select 1 as ord, 'عمليات دخول ناجحة' as label, 'مصادقة بكلمة المرور' as detail,
                   count(*)::int as n, to_char(max(created_at),'YYYY-MM-DD HH24:MI') as last
            from masked where event_type = 'login_success'
            union all
            select 2, 'محاولات دخول فاشلة', 'رقم أو كلمة مرور غير صحيحة', count(*)::int,
                   to_char(max(created_at),'YYYY-MM-DD HH24:MI') from masked where event_type = 'login_failed'
            union all
            select 3, 'حسابات مقفلة', 'قفل 15 دقيقة بعد 5 محاولات فاشلة', count(*)::int,
                   to_char(max(created_at),'YYYY-MM-DD HH24:MI') from masked where event_type = 'login_locked'
            union all
            select 4, 'محاولات دخول أثناء القفل', 'رُفضت قبل الوصول لمزود الهوية', count(*)::int,
                   to_char(max(created_at),'YYYY-MM-DD HH24:MI') from masked where event_type = 'login_blocked'
            union all
            select 5, 'محاولات OTP فاشلة', 'رمز تحقق غير صحيح', count(*)::int,
                   to_char(max(created_at),'YYYY-MM-DD HH24:MI') from masked where event_type = 'otp_failed'
            union all
            select 6, 'تجاوز حد إرسال OTP', 'أكثر من 5 رسائل في الدقيقة', count(*)::int,
                   to_char(max(created_at),'YYYY-MM-DD HH24:MI') from masked where event_type = 'otp_rate_limited'
            union all
            select 7, 'رقم بمحاولات فاشلة متكررة', who, count(*)::int,
                   to_char(max(created_at),'YYYY-MM-DD HH24:MI')
            from masked where event_type in ('login_failed','otp_failed')
            group by who having count(*) >= 3
          ) t
          order by ord, n desc`)).map((r) => [
          r.label, r.detail, String(r.n), r.last ?? '—',
        ]),
      }),

      // 28. المحتوى المنشور
      'rep-28': async () => ({
        available: true,
        headers: ['النوع', 'العنوان', 'الحالة', 'آخر تحديث'],
        rows: (await this.query(`
          select 'إعلان' as type, title, case when is_active then 'منشور' else 'موقوف' end as status,
                 to_char(coalesce(updated_at, created_at),'YYYY-MM-DD') as updated
          from content.announcements
          union all
          select 'صفحة محتوى', coalesce(title, key), coalesce(status,'—'),
                 to_char(coalesce(updated_at, created_at),'YYYY-MM-DD')
          from content.content_pages
          union all
          select 'وثيقة/نموذج', title, coalesce(status,'—'),
                 to_char(coalesce(updated_at, created_at),'YYYY-MM-DD')
          from content.library_documents
          order by 4 desc nulls last limit 200`)).map((r) => [r.type, r.title ?? '—', r.status, r.updated ?? '—']),
      }),

      // 29. استخدام الموقع
      'rep-29': async () => {
        const rows = await this.query(`
          select page_path,
                 count(*)::int as total,
                 count(*) filter (where created_at > now() - interval '7 days')::int as week,
                 to_char(max(created_at),'YYYY-MM-DD HH24:MI') as last
          from content.page_views
          group by 1 order by 2 desc limit 100`);
        const totals = rows.reduce(
          (acc, r) => ({ total: acc.total + Number(r.total), week: acc.week + Number(r.week) }),
          { total: 0, week: 0 },
        );
        return {
          available: true,
          headers: ['الصفحة', 'إجمالي المشاهدات', 'مشاهدات آخر 7 أيام', 'آخر مشاهدة'],
          rows: [
            ['— الإجمالي —', String(totals.total), String(totals.week), '—'],
            ...rows.map((r) => [r.page_path, String(r.total), String(r.week), r.last ?? '—']),
          ],
        };
      },
    };
  }
}
