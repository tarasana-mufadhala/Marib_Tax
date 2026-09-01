export interface ReportDefinition {
  id: string;
  code: string;
  title: string;
  category: string;
  description: string;
  allowedRoles: string[];
}

// الكتالوج الرسمي: التقارير 1–3 من تحليل.md (6.7) والتقارير 4–29 من مستند التقارير الإدارية والتشغيلية
export const REPORTS_CATALOG: ReportDefinition[] = [
  { id: 'rep-01', code: 'REP-01', title: 'تقرير الطلبات حسب الخدمة', category: 'تقارير الطلبات', description: 'عدد الطلبات المستلمة والمكتملة والمرفوضة وبانتظار السداد ونسبة الإنجاز لكل خدمة', allowedRoles: ['ADMIN', 'EMPLOYEE', 'AUDITOR'] },
  { id: 'rep-02', code: 'REP-02', title: 'تقرير حالات الطلبات', category: 'تقارير الطلبات', description: 'عدد الطلبات في كل حالة من حالات سير العمل', allowedRoles: ['ADMIN', 'EMPLOYEE', 'AUDITOR'] },
  { id: 'rep-03', code: 'REP-03', title: 'تقرير أعمار المعاملات', category: 'تقارير الطلبات', description: 'تقسيم الطلبات المفتوحة حسب عمر المعاملة: جديدة، تحت المتابعة، متأخرة، حرجة', allowedRoles: ['ADMIN', 'EMPLOYEE'] },
  { id: 'rep-04', code: 'REP-04', title: 'الطلبات المرفوضة والملغاة', category: 'تقارير الطلبات', description: 'الطلبات المرفوضة والملغاة مع سبب الرفض والموظف ومدة المعالجة', allowedRoles: ['ADMIN', 'EMPLOYEE'] },
  { id: 'rep-05', code: 'REP-05', title: 'طلبات استكمال النواقص', category: 'تقارير الطلبات', description: 'الطلبات المعادة للمكلف والمستندات الناقصة وعدد مرات الإعادة واستجابة المكلف', allowedRoles: ['ADMIN', 'EMPLOYEE'] },
  { id: 'rep-06', code: 'REP-06', title: 'البلاغات حسب النوع', category: 'تقارير البلاغات', description: 'عدد البلاغات لكل نوع (إيقاف نشاط، خروج مستأجر، خروج عامل...) المفتوح والمغلق', allowedRoles: ['ADMIN', 'EMPLOYEE'] },
  { id: 'rep-07', code: 'REP-07', title: 'نتائج البلاغات', category: 'تقارير البلاغات', description: 'توزيع البلاغات حسب النتيجة: موافق، مرفوض، يحتاج استكمال...', allowedRoles: ['ADMIN', 'EMPLOYEE'] },
  { id: 'rep-08', code: 'REP-08', title: 'الأنشطة الموقوفة والمفعلة', category: 'تقارير البلاغات', description: 'بيانات النشاط والمكلف وتاريخ وسبب الإيقاف وإعادة التفعيل', allowedRoles: ['ADMIN', 'EMPLOYEE'] },
  { id: 'rep-09', code: 'REP-09', title: 'مواعيد النزول الميداني', category: 'تقارير النزول الميداني', description: 'زيارات اليوم والأسبوع والمتأخرة والملغاة والفريق المسؤول', allowedRoles: ['ADMIN', 'EMPLOYEE', 'INSPECTOR'] },
  { id: 'rep-10', code: 'REP-10', title: 'نتائج الزيارات', category: 'تقارير النزول الميداني', description: 'نتائج المعاينات: تمت، تعذر الوصول، موافقة، توصية بالرفض...', allowedRoles: ['ADMIN', 'EMPLOYEE', 'INSPECTOR'] },
  { id: 'rep-11', code: 'REP-11', title: 'أداء النزول الميداني', category: 'تقارير النزول الميداني', description: 'عدد الزيارات لكل موظف ونسبة الإنجاز في الموعد ومتوسط التأخير', allowedRoles: ['ADMIN'] },
  { id: 'rep-12', code: 'REP-12', title: 'المكلفون الجدد', category: 'تقارير المكلفين والأنشطة', description: 'المسجلون خلال الفترة والتوزيع حسب الكيان القانوني ونوع النشاط', allowedRoles: ['ADMIN', 'EMPLOYEE'] },
  { id: 'rep-13', code: 'REP-13', title: 'قاعدة المكلفين', category: 'تقارير المكلفين والأنشطة', description: 'إجمالي المكلفين والنشطون وأصحاب المعاملات المفتوحة والمستحقات', allowedRoles: ['ADMIN', 'AUDITOR'] },
  { id: 'rep-14', code: 'REP-14', title: 'الأنشطة التجارية', category: 'تقارير المكلفين والأنشطة', description: 'عدد الأنشطة حسب النوع والحالة: النشطة والموقوفة والمعاد تفعيلها', allowedRoles: ['ADMIN', 'EMPLOYEE'] },
  { id: 'rep-15', code: 'REP-15', title: 'الكيانات القانونية', category: 'تقارير المكلفين والأنشطة', description: 'توزيع المكلفين والمعاملات حسب الكيان القانوني: فردي، شركة، بنك...', allowedRoles: ['ADMIN', 'AUDITOR'] },
  { id: 'rep-16', code: 'REP-16', title: 'المعاملات المتوقفة بسبب السداد', category: 'تقارير المستحقات والسداد', description: 'رقم الطلب والمكلف والمبلغ وتاريخ إشعار السداد وعدد الأيام وحالة السداد', allowedRoles: ['ADMIN'] },
  { id: 'rep-17', code: 'REP-17', title: 'رسائل SMS وواتساب', category: 'تقارير الإشعارات', description: 'الرسائل المرسلة والناجحة والفاشلة والمعلقة حسب القناة والفترة', allowedRoles: ['ADMIN'] },
  { id: 'rep-18', code: 'REP-18', title: 'رموز التحقق OTP', category: 'تقارير الإشعارات', description: 'الرموز المرسلة وعمليات التحقق الناجحة والمنتهية والمحاولات الفاشلة', allowedRoles: ['ADMIN'] },
  { id: 'rep-19', code: 'REP-19', title: 'الإشعارات غير المقروءة', category: 'تقارير الإشعارات', description: 'عدد الإشعارات غير المقروءة داخل التطبيق وعمر الإشعار ونوعه', allowedRoles: ['ADMIN'] },
  { id: 'rep-20', code: 'REP-20', title: 'المستندات الناقصة أو المرفوضة', category: 'تقارير المستندات', description: 'أكثر المستندات تكراراً في النقص أو الرفض مع الأسباب', allowedRoles: ['ADMIN', 'EMPLOYEE'] },
  { id: 'rep-21', code: 'REP-21', title: 'التخزين والمرفقات', category: 'تقارير المستندات', description: 'إجمالي الملفات وحجم التخزين والملفات غير المرتبطة', allowedRoles: ['ADMIN'] },
  { id: 'rep-22', code: 'REP-22', title: 'عمليات الاستيراد', category: 'تقارير الاستيراد', description: 'اسم الملف والتاريخ والمستخدم وإجمالي الصفوف والمقبول والمرفوض وحالة الاعتماد', allowedRoles: ['ADMIN'] },
  { id: 'rep-23', code: 'REP-23', title: 'أخطاء الاستيراد', category: 'تقارير الاستيراد', description: 'رقم الصف والحقل والقيمة الخاطئة وسبب الرفض والتصحيح المقترح', allowedRoles: ['ADMIN'] },
  { id: 'rep-24', code: 'REP-24', title: 'جودة البيانات', category: 'تقارير الاستيراد', description: 'التكرارات والسجلات اليتيمة والحالات غير المنطقية', allowedRoles: ['ADMIN'] },
  { id: 'rep-25', code: 'REP-25', title: 'سجل التدقيق', category: 'التقارير الرقابية والأمنية', description: 'المستخدم المنفذ ونوع العملية والسجل المتأثر والقيم السابقة والجديدة', allowedRoles: ['ADMIN', 'AUDITOR'] },
  { id: 'rep-26', code: 'REP-26', title: 'العمليات الحساسة', category: 'التقارير الرقابية والأمنية', description: 'رفض المعاملات وحذف السجلات وتعديل الأرقام الضريبية وتغيير الصلاحيات', allowedRoles: ['ADMIN', 'AUDITOR'] },
  { id: 'rep-27', code: 'REP-27', title: 'الدخول والأمان', category: 'التقارير الرقابية والأمنية', description: 'محاولات الدخول الناجحة والفاشلة والحسابات المقفلة ومحاولات OTP المتكررة', allowedRoles: ['ADMIN', 'AUDITOR'] },
  { id: 'rep-28', code: 'REP-28', title: 'المحتوى المنشور', category: 'تقارير الموقع والمحتوى', description: 'القوانين والنماذج المعتمدة والمسودات والإعلانات الفعالة والمنتهية', allowedRoles: ['ADMIN', 'CONTENT'] },
  { id: 'rep-29', code: 'REP-29', title: 'استخدام الموقع', category: 'تقارير الموقع والمحتوى', description: 'عدد الزوار والصفحات الأكثر مشاهدة (عند ربط أداة تحليلات)', allowedRoles: ['ADMIN'] },
];

export interface ReportData {
  headers: string[];
  rows: string[][];
}

export async function getReportData(reportId: string): Promise<ReportData | null> {
  const { api } = await import('./api-client');
  const result = await api.reports.getReport(reportId);
  if (!result?.available) return null; // تقرير قيد التطوير — لا بيانات وهمية
  return { headers: result.headers, rows: result.rows };
}
