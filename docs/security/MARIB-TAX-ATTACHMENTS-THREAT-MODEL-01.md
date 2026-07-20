# نموذج تهديد المرفقات 01

**الحالة:** Foundation / source-only

**الأصول:** metadata، المحتوى الثنائي الخاص، سياق المالك، التصنيف، checksum، storage key، سجل الإصدارات والأرشفة، وأثر التدقيق.

## حدود الثقة وتدفق الطلب

1. العميل غير موثوق ولا يصل إلى قاعدة البيانات أو التخزين مباشرة.
2. API يحل actor من هوية موثقة ثم يفوض العملية على مستوى التطبيق.
3. المستودع لا يمنح صلاحية لمجرد وجود attachment link.
4. مزود التخزين منفذ خاص؛ لا يصدر رابطًا مؤقتًا إلا بعد قرار تنزيل مستقل.
5. worker هو actor مقيد بمهمة، وليس service-role bypass عامًا.

## التهديدات والضوابط

| التهديد | مثال إساءة | الضابط المطلوب | دليل الاختبار |
|---|---|---|---|
| IDOR / تبديل المالك | تغيير attachment أو owner id | تحقق actor + owner context في الخدمة | unrelated taxpayer وunauthorized staff = deny |
| خلط metadata والتنزيل | رؤية اسم الملف ثم طلب المحتوى | permission مستقل لـdownload | metadata allowed، download denied |
| رفع امتياز بالربط | إنشاء link لكيان مسموح | link ليس authorization؛ تحقق نوع المالك والصلاحية | owner-link-only = deny |
| تجاوز إداري | دور admin بلا permission | لا admin bypass عام | admin دون permission = deny |
| كشف شديد الحساسية | موظف مكلّف دون clearance | classification clearance صريح | assigned staff دون clearance = deny |
| كشف مسار التخزين | رسالة خطأ أو DTO يعيد key | أخطاء آمنة وDTO allowlist | لا URL/key/checksum في error |
| رابط دائم/عام | تخزين URL قابل للمشاركة | download intent قصير ومقيد بعد التفويض | mock provider فقط؛ لا URL في fixture |
| استبدال الأدلة | الكتابة فوق version قديم | append-only lineage وإصدار مصحح جديد | historical mutation = deny |
| حذف الأرشيف | hard delete لسجل دائم | state transition فقط + retention guard | permanent archive unlink/delete = deny |
| spoofing لاكتمال الرفع | تسجيل object غير موجود/غير مطابق | تحقق intent، checksum، MIME والحجم عبر adapter | adapter contract لاحقًا |
| worker واسع الصلاحية | استخدام service actor خارج المهمة | purpose/task/operation binding | wrong purpose أو task = deny |
| تجاوز UI | استدعاء service/repository مباشرة | التفويض أسفل controller/UI | direct invocation matrix |
| enumeration | اختلاف أخطاء يكشف الوجود | استجابة خارجية موحدة | denied/missing لا يكشفان التخزين |
| replay/race | إعادة استخدام intent أو تصحيح متزامن | nonce/expiry/idempotency/version precondition | اختبار تكاملي بعد تثبيت العقود |

## افتراضات ممنوعة

- وجود object في التخزين أو metadata في DB لا يثبت الإذن.
- امتلاك المرفق لا يمنح عمليات الموظف الداخلية.
- role name وحده لا يكفي؛ القرار يتطلب permission وسياقًا وتصنيفًا.
- لا RLS أو UI أو signed URL منفردًا بديل عن تفويض التطبيق.
- لا تُسجّل filename أو storage key أو checksum في رسائل الخطأ العامة.

## مخاطر مؤجلة وبوابات الدمج

- أسماء permissions وowner families النهائية تتبع عقد Track B وقرار التصميم المعتمد؛ الاختبار الحالي يستخدم أسماء دلالية ولا يفرض API.
- اختبارات adapter وHTTP تتحول من scaffold إلى contract tests بعد توفر منافذ Track B، دون أي اتصال حقيقي.
- قبل الإنتاج يلزم إثبات expiry/single-use intent، فحص MIME بالحقيقة لا بالامتداد، حدود الحجم، مكافحة البرمجيات الخبيثة، retention، audit redaction، وسلوك التزامن.
- لا يصرح هذا المستند بإنشاء bucket أو migration أو SQL أو deployment. `PROD-DB-08 = CLOSED`.
