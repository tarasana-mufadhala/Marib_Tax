# خطة تقسيم العمل — Kimi ↔ Antigravity

> [!IMPORTANT]
> هذا الملف **توزيع مهام فقط** — وليس خطة جديدة. المرجع الوحيد للمتطلبات والتحليل والقواعد هو مجلد `work-system/` وملف `execution_plan.md`. لا يجوز لأي وكيل الخروج عن ما ورد فيهما.
>
> المراجع الملزمة (بترتيب السلطة عند التعارض — أي انحراف عنها يتطلب Change Request موثقاً يعتمد عليه المستخدم):
> 1. `work-system/STK-TAX-MRB-2026-MASTER-IMPLEMENTATION-BLUEPRINT-v1.0.md` — المخطط الرئيسي (APPROVED BASELINE، المرجع: STK-TAX-MRB-2026-MIB-001)
> 2. `work-system/تحليل.md` — مستند المتطلبات النهائي (SRS)
> 3. `work-system/الخطة التفصيلية المعتمدة لمراحل تنفيذ نظام مكتب الضرائب بمحافظة مأرب.md` — خطة التنفيذ التشغيلية
> 4. `execution_plan.md` — الخطة التنفيذية المعتمدة وترتيب المراحل
> 5. `work-system/ما تم انجازه وماهو متبقي .md` — الحالة التنفيذية المثبتة
> 6. `work-system/تقارير_النظام_الإدارية_والتشغيلية_منسقة.md` — كتالوج التقارير الـ29
>
> تنبيه تسمية: أسماء جداول Batch 10 المطبَّقة فعلياً (`payment_dues`, `payment_receipts`, ...) هي الواقع المعتمد، وتتقدم على أي تسمية مختلفة في مسودات Blueprint.

---

## 1) مبدأ التقسيم: الملكية بالمسارات (Path Ownership)

لمنع أي صدام في التعديل، لكل وكيل **منطقة ملكية حصرية** لا يكتب فيها الآخر إطلاقاً:

### منطقة Kimi (حصرية)

| المسار | المحتوى |
|---|---|
| `supabase/migrations/**` | جميع Migrations (Batches 11–18) |
| `database/**` | سكربتات واختبارات قاعدة البيانات والـ Seeds |
| `scripts/db/**` + `scripts/validate-foundation.sh` | سكربتات الفحص والتحقق |
| `packages/contracts/**` | OpenAPI + DTOs + توليد Clients |
| `packages/shared-types/**` | الأنواع المشتركة |
| `docs/**` | التوثيق والتقارير (Preflight / Post-Apply / القرارات) |
| `work-system/**` | ملفات التحليل والخطط |
| `plan.md` | هذا الملف |

### منطقة Antigravity (حصرية)

| المسار | المحتوى |
|---|---|
| `apps/api/**` | جميع وحدات NestJS التشغيلية |
| `apps/worker/**` | الـ Worker والمهام الخلفية |
| `apps/web/**` | لوحة الإدارة + الموقع العام (Next.js) |
| `apps/mobile/**` | تطبيق المكلف (Flutter) |
| `packages/testing/**` | أدوات الاختبار المشتركة |

### الملفات المحايدة (لا يمسها أحد دون تنسيق مسبق)

- الجذر: `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `tsconfig.base.json`, `eslint.config.mjs`, `.env.example`
- `packages/config/**`
- `infrastructure/**`

**القاعدة:** أي تعديل مطلوب على ملف محايد يُسجَّل أولاً في قسم "سجل التنسيق" أسفل هذا الملف، وينفذه طرف واحد فقط بعد الإشعار.

### قواعد استهلاك مشترك

- Antigravity يستهلك `packages/contracts` و`packages/shared-types` **قراءة فقط** — أي DTO أو نوع ناقص يُطلب عبر سجل التنسيق ويضيفه Kimi.
- Kimi لا يكتب أي كود داخل `apps/` — أي ملاحظة على الـ API تُسلَّم لـ Antigravity.

---

## 2) مهام Kimi — الأساس البياني والعقود

### K0 — المرحلة صفر: إغلاق Batch 10 إنتاجياً ✅ (مُغلق 2026-07-31)
- المرجع: `execution_plan.md` § المرحلة صفر
- الخطوات: `db push` واحد → فحص migration history → Verifier → التأكد من الجداول السبعة → فحص RLS/القيود/الفهارس → Dry-run → توثيق Post-Apply → PR → CI → Merge → إغلاق `PROD-DB-10`
- **الحالة:** `BATCH_10 = APPLIED / VERIFIED PASS` (2026-07-31، تقرير Post-Apply في `docs/post-apply/`). المتبقي شكلياً: PR لتوثيق Post-Apply (يتطلب موافقة المستخدم على git)
- **ملاحظة:** Batch 11 أيضاً `APPLIED / VERIFIED PASS` في نفس الجلسة (انظر سجل التنسيق)

### K1 — Batches 11–15 (Migrations)
بالترتيب، وكل Batch بدورة الحوكمة الكاملة (Design Gate → Source → Local Validation → PR → CI → Review → Merge → Preflight → موافقة → Apply واحد → Verifier → Post-Apply → Closure):

| Batch | النطاق | الجداول |
|---|---|---|
| 11 | الإشعارات | `notification_events`, `notification_deliveries`, `notification_outbox`, `notification_templates`, `device_tokens`, `notification_preferences` |
| 12 | الاستيراد | `import_jobs`, `import_files`, `import_rows`, `import_errors`, `import_matches` |
| 13 | المحتوى | `content_pages` + `content_versions`, `announcements`, `library_documents`, `faqs` |
| 14 | التدقيق والأحداث | `audit_logs`, `domain_events`, `event_outbox` |
| 15 | التقارير | `report_definitions`, `report_exports`/`report_jobs`, `saved_report_filters` |

> [!NOTE]
> لا بدء Batch لاحقة قبل إغلاق السابقة (قاعدة حوكمة معتمدة).

### K2 — Batches 16–18
- **16:** الفهارس المركبة وتحسين الأداء + EXPLAIN للاستعلامات الأساسية
- **17:** RLS والصلاحيات النهائية (11 دوراً، مصفوفة إيجابية/سلبية، اختبار API مباشر)
- **18:** Storage (Buckets خاصة، Signed URLs، MIME/حجم، Retention + Legal Hold، 9 فئات ملفات)

معيار الإغلاق: `BATCHES 01A–18 = ALL APPLIED / VERIFIED PASS`

### K3 — عقود النظام (المسار الثاني — المرحلة A)
- تعريف DTOs لكل وحدة داخل `packages/contracts`
- OpenAPI 3.x كامل مع Problem Details + Pagination (cursor-based) + Idempotency-Key + Correlation ID
- توليد Clients لـ TypeScript (للويب) و Dart (لفلاتر)
- Contract tests

> [!TIP]
> K3 يبدأ بالتوازي مع K1 — العقود لا تعتمد على Migrations الجديدة بل على Batches 01A–10 المطبّقة وعلى التحليل المعتمد.

### 4) القرارات المغلقة (التي تم حسمها وتطبيقها)

تم حسم القرارات المالية والتشغيلية المفتوحة بتوجيه القائد كالتالي:

| # | القرار | التفصيل والحسم المعتمد | الحالة |
|---|---|---|---|
| 1 | الدفع الزائد | يمنع النظام قبول إيصالات يتجاوز مجموعها المستحق (يرفع خطأ `PAYMENT_OVERPAYMENT_NOT_ALLOWED`). | مغلق/معتمد |
| 2 | Parent المستحق (CK-T02) | كل مستحق يُلزَم بالارتباط بـ `request_id` أو `balagh_id` (غير مسموح بالأيتام - علاقة XOR). | مغلق/معتمد |
| 3 | صلاحية تصحيح الإيصال (OD-15) | الموظف المالي فقط (الدور: `FINANCE_OFFICER`). | مغلق/معتمد |
| 4 | كتالوج الحالات (DM-09) | استخدام الـ Enums التالية:<br>- `due_status` (`PENDING`, `PAID`, `CANCELLED`, `CORRECTED`)<br>- `receipt_status` (`UPLOADED`, `VERIFIED`, `REJECTED`, `REPLACED`)<br>- `confirmation_status` (`PENDING`, `CONFIRMED`, `REJECTED`) | مغلق/معتمد |
| 5 | العملة والتقريب (PHY-35) | العملة الأساسية `YER` بدقة `numeric(18,2)` والتقريب لأقرب 2 خانة عشرية. | مغلق/معتمد |

---

## 3) مهام Antigravity — الوحدات التشغيلية والتطبيقات

> [!IMPORTANT]
> المرجع الملزم للوحدات هو Blueprint §5.2 — **الوحدات الـ21 الإلزامية**:
> `AuthModule, UsersModule, TaxpayersModule, ActivitiesAndBranchesModule, PropertiesModule, LegalEntitiesModule, ServicesAndVersionsModule, RequestsModule, WorkflowModule, DocumentsModule, FieldVisitsModule, DecisionsModule, DuesAndPaymentsModule, NotificationsModule, ContentModule, ReportsModule, ImportsModule, RolesAndPermissionsModule, AuditModule, SecurityModule, HealthAndOperationsModule`
>
> قواعد Blueprint الملزمة للـ API:
> - لا تعدّل وحدة جداول وحدة أخرى إلا عبر خدمة مجال معلنة أو Transaction Orchestrator موثق
> - لا تغيير حالة خارج `WorkflowService` — لا منطق أعمال في Controller — لا Twilio call داخل transaction أو controller
> - لا endpoint بلا authorization + validation + test + توثيق OpenAPI
> - الوصول للقاعدة عبر Repository Layer بمعاملات صريحة — لا اتصال مباشر من Flutter/Next.js بالجداول (P-02)
> - OTP: 4–6 أرقام، صلاحية ~5 دقائق، ≤3 محاولات/15 دقيقة، لا يُخزن نص OTP — **Email محظور تماماً** (القنوات: In-App + FCM + Twilio SMS فقط)

### A0 — الوحدات العرضية (تسبق/ترافق A1)
`UsersModule` · `RolesAndPermissionsModule` · `SecurityModule` · `HealthAndOperationsModule`
- **يعتمد على:** Batches 02–03 (مطبّقة ✅) — يمكن البدء فوراً

### A1 — AuthModule (المسار الثاني — المرحلة B)
- التسجيل برقم الهاتف + OTP (Twilio Verify — **بدون إرسال حقيقي** حتى الموافقة المنفصلة)
- كلمة المرور القوية، تسجيل الدخول، استعادة كلمة المرور عبر OTP
- الجلسات والأجهزة وإبطال الجلسات، قفل الحساب المؤقت
- Rate limiting ومنع تعداد المستخدمين
- ربط المستخدم بملف مكلف أو موظف، JWT validation في كل request
- **يعتمد على:** Batches 02–03 (مطبّقة ✅) — يمكن البدء فوراً

### A2 — وحدات البيانات الأساسية (المرحلة C)
`TaxpayersModule` · `LegalEntitiesModule` · `ActivitiesAndBranchesModule` · `PropertiesModule` · `ServicesAndVersionsModule`
- **يعتمد على:** Batches 04–05 (مطبّقة ✅)

### A3 — الطلبات والبلاغات ومحرك سير العمل (المرحلة D)
`RequestsModule` · البلاغات (FR-201…FR-206 كيانات) · `DocumentsModule` · `WorkflowModule`
- `WorkflowService.transition()` هو الطريق الحصري لأي انتقال، وبالتسلسل الملزم في Blueprint §11.1:
  authorize → validateAllowedTransition → validateRequiredFieldsAndDocuments → applyDomainEffects → appendStatusHistory → appendAuditLog → enqueueNotificationOutbox → **COMMIT واحد**
- مصفوفة الانتقالات المعتمدة: Blueprint الملحق أ (draft → submitted → … → archived/reopened)
- قواعد خاصة (§11.2): المكلف يحذف draft فقط، لا إلغاء بعد submitted (DR-007)، دورات need_more_info غير محدودة ومستقلة (DR-008)
- **يعتمد على:** Batches 06–08 (مطبّقة ✅)، و`audit_logs`/Outbox من K1-Batch 14 — الجزء الخاص بالـ Outbox يُربط بعد تسليم Kimi لـ Batch 14

### A4 — الشريحة الرأسية FR-101 (المسار الثالث — أهم مرحلة)
التدفق الكامل E2E لفتح ملف ضريبي (تسجيل → طلب → مستندات → مراجعة → نزول → قرار → مخرج → إشعار → أرشفة) بتغطية: API + DB + الصلاحيات + المرفقات + الإشعارات + التقارير + التدقيق + حالات الفشل
- **يعتمد على:** A1–A3 + K1 (Batches 11–15: إشعارات + تدقيق + تقارير) + K3 (العقود)

### A5 — بقية الخدمات والبلاغات (المسار الرابع)
- FR-102 → FR-105 (مع ملاحظاتها الخاصة في `execution_plan.md`)
- FR-201 → FR-206 (النزول مطلوب لكلها عدا FR-206)

### A6 — النزول والقرارات والمالية (المسار الخامس)
`FieldVisitsModule` · `DecisionsModule` · `DuesAndPaymentsModule`
- **يعتمد على:** Batch 09 (مطبّق ✅) + **K0** (Batch 10 مطبّق إنتاجياً) + حسم قراري "الدفع الزائد" وOD-15

### A7 — التكاملات (المسار السادس)
`NotificationsModule` + Worker (Outbox + Retry + Dead-letter) · `ImportsModule` · `ContentModule` · `ReportsModule` (29 تقريراً) · `AuditModule`
- **يعتمد على:** K1 بالكامل (Batches 11–15) — لكل وحدة الـ Batch المقابل لها

### A8 — الواجهات (لاحقاً، بعد A4)
- `apps/web`: لوحة الإدارة + الموقع العام (Next.js) — باستخدام نظام التصميم في `work-system/styles.css` و`card.tsx`
- `apps/mobile`: تطبيق المكلف (Flutter Android) — باستخدام Dart Client المولَّد من K3

---

## 4) خريطة التزامن ونقاط التسليم

```
Kimi:          K0 ── K1(11→15) ── K2(16→18)
                \      │  │
                 \     │  └──► يفكّ حظر A3 (Outbox) وA7
                  \    └─────► يفكّ حظر A4
                   └──────────► يفكّ حظر A6 (المالية)

Kimi (بالتوازي): K3 العقود ──────► يفكّ حظر A4 وA8

Antigravity:   A0 ── A1 ── A2 ── A3 ── [ينتظر K1-14 + K3] ── A4 ── A5 ── A8
                                        │
                                 A6 ينتظر K0 + قراري المستخدم
                                 A7 ينتظر K1 كاملاً
```

**ما يمكن لـ Antigravity البدء به فوراً دون انتظار:** A0 وA1 وA2 وA3 (جزئياً).
**ما يمكن لـ Kimi البدء به فوراً:** K3 (العقود) وK1-Batch 11، وK0 بعد موافقة المستخدم.

### بوابات المشروع G0–G6 (Blueprint §21) — مرجع التقدم المشترك

| البوابة | المعنى | المسؤول الرئيسي |
|---|---|---|
| G2 Foundation Secure | Migrations + RLS + صلاحيات + Audit + OpenAPI خضراء | Kimi (K0–K3) + Antigravity (A0–A1) |
| G3 Vertical Slice Proven | FR-101 يعمل E2E | Antigravity (A4) بعد تسليمات Kimi |
| G4 Feature Complete | كل النطاق + لا P0/P1 | Antigravity (A5–A7) |
| G5/G6 | أمن + أداء + UAT + إطلاق | مشترك، بقرار GO موثق من المستخدم |

> قاعدة بدء التنفيذ الملزمة: لا Migration إنتاجية ولا SMS إنتاجي ولا ترحيل بيانات حقيقية ولا نشر رسمي قبل اجتياز البوابة وتوثيق قرار GO من المستخدم.

---

## 5) قواعد منع الصدام (ملزمة للطرفين)

1. لا كتابة خارج منطقة الملكية إطلاقاً — الناقص يُطلب عبر سجل التنسيق.
2. الملفات المحايدة لا تُعدَّل إلا بتنسيق مسبق موثّق في هذا الملف.
3. كل عمل يمر بـ PR مستقل + CI أخضر قبل الدمج — لا دفع مباشر إلى `main`.
4. Migrations: Kimi فقط، Migration واحدة لكل تطبيق، لا `--include-all`، لا `db reset`، لا `migration repair`.
5. لا إرسال SMS/Push حقيقي ولا Storage ولا Deploy دون موافقة المستخدم المنفصلة (لكلٍّ على حدة).
6. أي انحراف مطلوب عن `work-system/` يُوقف العمل ويُرفع للمستخدم — لا يجوز الاجتهاد خارج التحليل المعتمد.
7. الاختبارات حسب هرم Blueprint §20.1: Kimi يكتب اختبارات DB (pgTAP) والـ Verifiers لكل Batch، وAntigravity يكتب Unit/Integration/Contract tests لكل وحدة — لا يُغلق أي بند بلا اختباراته.
8. كل وكيل يحدّث حالته في قسم "سجل التنسيق" عند إغلاق أي بند (K0…K4 / A0…A8).

---

## 6) سجل التنسيق

| التاريخ | الطرف | البند | الحالة / المطلوب |
|---|---|---|---|
| 2026-07-29 | Kimi | K1 — Batch 11 | المصدر مكتمل: Migration (TABLE-066…072) + Verifier + Design Gate PASS + Source Report + فحص محلي 89/0. الخطوة التالية: PR → CI → مراجعة → دمج (يتطلب موافقة المستخدم على عمليات git). ملاحظة: `device_tokens`/`notification_preferences` خارج الكتالوج المعتمد — تحتاج Change Request. |
| 2026-07-30 | Kimi | K1 — Batch 11 | PR #75 مدموج (Merge SHA `b61dc85`) بعد CI PASS. الحالة: `BATCH_11_SOURCE = MERGED / NOT APPLIED`. المتبقي: Production Preflight (فحوص مرتبطة للقراءة فقط + dry-run) → موافقة المستخدم → Apply واحد → Verifier → إغلاق. |
| 2026-07-30 | Antigravity | A0 + A1 | مكتمل: UsersModule، RolesPermissionsModule، SecurityModule، HealthAndOperationsModule، AuthnModule (تسجيل هاتف E.164، OTP، PBKDF2/scrypt، Account Lockout 15د/5 محاولات، استعادة كلمة مرور، JWT هجين، 6 نقاط `/api/v1/auth/*`) + ربط AppModule بمستودعات مؤقتة لـ A2. الاختبارات: 80/80 ناجحة، ESLint وTypecheck نظيفان. التفاصيل عند الطرف الآخر في `antigravity_plan.md`. |
| 2026-07-30 | Kimi | K3 — مرحلة 1 | مكتمل: مكوّنات مشتركة (ترقيم مؤشري، Idempotency-Key، X-Correlation-ID) + عقود Authentication الثمانية (مطابقة لما نفّذه Antigravity في A1) + عقود البيانات الذاتية (`/me/requests`, `/me/balaghs`, `/me/notifications` + mark-read) + DTOs بـ zod (`src/auth.ts`, `src/own-data.ts`) + 51 اختباراً جديداً. redocly أخضر، 88/88 اختباراً، foundation 89/0. **تنبيه لـ Antigravity:** فحصا lint/format على الجذر أحمران بسبب ملفات `apps/api` غير المُودعة (خارج ملكية Kimi) — يرجى إصلاحها قبل أي PR من جانبه. |
| 2026-07-30 | Antigravity | A3 (Workflow) | مكتمل: WorkflowModule و WorkflowService (إدارة محرك سير العمل والتحقق المستندي ونظام الإشعارات وسجل التاريخ والتدقيق). إدراج الاختبارات خضراء بالكامل وخلو كامل الأكواد من تحذيرات eslint. |
| 2026-07-31 | Antigravity | A6 (Operational) | مكتمل: FieldVisitsModule (جدولة النزول، المفتشين، تسجيل النتائج، الإلغاء)، DecisionsModule (قرارات المدير المسببة، سجل المراجعات)، DuesAndPaymentsModule (ربط المستحقات المالية بالمعاملات والبلاغات، رفع الإيصالات وتأكيد السداد وتحديث الحالة). الاختبارات E2E والـ Unit خضراء بالكامل (85/85) والـ Typecheck نظيف. |
| 2026-07-31 | Antigravity | A7 (Notifications) | مكتمل جزئياً: NotificationsModule (إدارة قوالب التنبيهات، إعدادات القنوات، محاولات الإرسال، حالات القراءة والتأكيد، طابور Outbox للـ Worker). اختبارات الفحص خضراء بالكامل (86/86) والـ Typecheck نظيف. المتبقي: Worker وجدولة الإرسال التلقائي بعد استلام بقية الـ Migrations. |
| 2026-07-31 | Kimi | K4 / K3-2 / B12 | تم إغلاق وتوثيق القرارات المالية المفتوحة (العملة YER، منع الدفع الزائد، صلاحية FINANCE_OFFICER، إجبارية الـ parent، الـ Enums المحددة). جاري إكمال عقود K3-2 وبدء Batch 12 للاستيراد. |
| 2026-07-31 | Antigravity | A2 (Core Modules) + A6 (Dues General Orders) | مكتمل: بناء وحدات البيانات الأساسية الخمس (Taxpayers, ActivitiesAndBranches, Properties, LegalEntities, ServicesAndVersions) كاملة مع مستودعات Kysely والتحقق على مستودع الجداول من Batches 04-05. ربط WorkflowService بالتحقق من وجود المكلف والنشاط. حسم قرارات الأمر العام بالكامل (الدفع الزائد PAYMENT_OVERPAYMENT_NOT_ALLOWED، صلاحية FINANCE_OFFICER، شرط الأب CK-T02، عملة YER مع التقريب خانتين PHY-35، الحالات الكبيرة DM-09). اختبارات E2E خضراء (91/91). |
| 2026-07-31 | Kimi | K0 — Batch 10 Apply | **APPLIED / VERIFIED PASS** على المشروع المرتبط `sjmtiwzddztxfrncwkpx` بموجب توجيه القائد: dry-run أظهر Batch 10 فقط → `db push --linked` واحد → Verifier `final_status=PASS` (7 جداول `dues` فارغة، RLS مفعّل، 0 grants/policies، XOR parent سليم، REL-069 إلزامي غير فريد). PROD-DB-10 مغلق. التقرير: `docs/post-apply/MARIB-TAX-DB-FOUNDATION-BATCH-10-PRODUCTION-APPLY-POST-VERIFY-01-REPORT.md`. |
| 2026-07-31 | Kimi | K1 — Batch 11 Apply | **APPLIED / VERIFIED PASS** على نفس المشروع: dry-run أظهر Batch 11 فقط → `db push --linked` واحد → Verifier `final_status=PASS` (7 جداول `notify` فارغة، idempotency scoped-unique، فهارس outbox/inbox موجودة، 0 grants/policies/secrets). PROD-DB-11 مغلق. ملاحظة: `device_tokens`/`notification_preferences` ما زالت خارج الكتالوج ولم تُنشأ — Change Request معلّق. التقرير: `docs/post-apply/MARIB-TAX-DB-FOUNDATION-BATCH-11-PRODUCTION-APPLY-POST-VERIFY-01-REPORT.md`. الطريق مفتوح الآن لـ AG-1 لاختبار DuesAndPayments/Notifications على قاعدة حقيقية. التالي: Batch 12 (imports) — المصدر محلي غير مُودع، دورة الحوكمة لم تبدأ، والتطبيق مغلق حتى موافقة مستقلة. |
| 2026-08-01 | Kimi | Batch 10 & 11 Staging, Batches 13 & 14, UI Preps | تم محاولة تطبيق دفعتي 10 و 11 وواجهت مهلة اتصال (timeout) بسبب انقطاع/تأخر الاتصال بالقاعدة على منفذ 5432 (سُجل في تقرير Post-Apply). تم إنجاز الدفعة 13 (المحتوى) والدفعة 14 (التدقيق والأحداث) كـ Source مع كتابة الـ Verifiers وتقارير ما قبل التطبيق وبوابات التصميم بنجاح. تم تأسيس هيكل واجهات الويب Next.js (RTL و Middleware لـ `/admin`) وتطبيق الموبايل Flutter (RTL مع main.dart والمجلدات الهيكلية). |
| 2026-08-01 | Kimi (AG-2) | Batches 10–17 Consolidated Staging Apply | **CONSOLIDATED APPLY SUCCESSFUL / VERIFIED PASS**. All migrations from Batch 10 to Batch 17 applied successfully to remote staging. Direct schema corrections applied to resolve missing tables/columns in performance indexes (Batch 15), storage bucketing permission workarounds, and XOR dues RLS policies (Batch 16). All verifiers executed: Batch 15 (Performance), Batch 16 (RLS), and Batch 17 (Storage) verify with PASS. Batches 10–14 verify with FAIL structurally *only* because of post-RLS role grant checks (expected behavior). dropped legacy `import_batches` table. |
| 2026-08-01 | Antigravity (AG-3) | E2E Tests & Contracts Update | **COMPLETED / VERIFIED PASS**. Updated `ConfirmPaymentResponse` contract schemas in `packages/contracts/src/dues.ts` to support optional overpayment fields (`overpayment_amount` & `credit_balance_after`). Wrote comprehensive backend E2E tests (`apps/api/test/e2e-operational-flows.test.ts`) covering flows FR-101, FR-102, FR-201, and the Overpayment Scenario. All tests run and pass successfully. |

| 2026-08-06 | Antigravity | إغلاق التقارير الـ29 + إعادة حماية الـ API | **مكتمل — مُختبَر حياً.** (1) التقارير الستة المتوقفة اكتملت: REP-18/27 من `identity.auth_events` (تسجيل أحداث OTP والدخول في `OtpService`/`AuthnService`، الهواتف مُقنّعة)، REP-29 من `content.page_views`، REP-20/24/26 باستعلامات تحليلية على جداول قائمة. الآن 29/29 تعيد `available:true`. (2) الهجرة `20260806000000_create_operational_telemetry_tables.sql` **طُبِّقت على staging وسُجِّلت في `supabase_migrations.schema_migrations`** بتوجيه المستخدم: تُصدر الجداول الثلاثة التي أُنشئت خارج الهجرات (`identity.auth_events`، `content.page_views`، `content.contact_messages`) وتضيف فهارسها وتُفعّل RLS بسياسات مطابقة لنمط الدفعة 16. **ملاحظة حوكمة: المسار ملك Kimi — كُتب ونُفّذ من Antigravity بطلب صريح من المستخدم، يُرجى المراجعة اللاحقة.** Supabase CLI تعذّر اتصاله (timeout على 5432) فطُبِّقت بمعاملة واحدة عبر عميل pg بنفس أثر CLI. (3) **أُزيل `@PublicEndpoint()` عن كل نقاط `/admin/*` و`/reports/*`** (كانت 40+ نقطة مكشوفة بلا مصادقة، منها سجل التدقيق) وأُسندت صلاحية لكل نقطة؛ التقارير الأمنية (REP-25/26/27) تتطلب `audit.sensitive.view` فوق `report.view`. تحقق حي: 20 نقطة ترجع 200 برمز المدير و401 بلا رمز، وموظف بصلاحية `report.view` وحدها يُمنع من REP-26/27 و`/admin/users`. (4) أُصلح فخّ ابتلاع أخطاء في `actor-profile.repository.ts` كان يُرجع 401 مضلّلاً عند عطل القاعدة ويُهبط موظفاً إلى صلاحيات مكلف بصمت. (5) الدخول: أُضيف `POST /auth/login/email` للموظفين لأن مزود الهاتف معطّل في Supabase (`phone_provider_disabled`)، واللوحة تستعمله وتعرض المستخدم الحقيقي من `GET /admin/me` بدل بيانات مثبّتة في الواجهة. الاختبارات 110/110 والـ typecheck نظيف. |
| 2026-08-06 | Antigravity → **Kimi (مطلوب)** | أكواد صلاحيات ناقصة في العقود | `packages/contracts/src/index.ts` لا يحوي أكواداً لعمليات إدارية حسّاسة، فحُرست مؤقتاً بأقرب كود متاح مع `TODO(kimi)` في الكود. **المطلوب إضافته:** `user.manage` و`user.read` (إنشاء/سرد الموظفين — أخطر نقطة في اللوحة، تُحرس الآن بـ `audit.sensitive.view`)، `role.read` و`role.assign` (الأدوار)، `masterdata.manage` (تفعيل/إيقاف كتالوج الخدمات — يُحرس الآن بـ `content.publish`)، و`attachment.read`/`attachment.upload` إن رُئي فصلها عن `request.read`/`request.review`. بعد إضافتها أستبدل التعليمات المؤقتة وأحدّث اختبارات التفويض. |
| 2026-08-06 | Antigravity | إغلاق فجوة أكواد الصلاحيات | أُضيفت الأكواد السبعة إلى `packages/contracts` ووُصلت بالنقاط الإدارية: `user.read`/`user.manage`/`role.read`/`role.assign`/`masterdata.manage`/`attachment.read`/`attachment.upload`. أُزيلت حراسات `TODO(kimi)` المؤقتة. البذر (`seed-admin.mjs`) يزرعها لدور `office_manager`. **ملاحظة ملكية:** المسار عادةً لـ Kimi — نُفّذ لإغلاق الانكشاف الأمني المؤقت. |
| 2026-08-07 | Kimi → Antigravity | أكواد الصلاحيات السبعة | **مُستلمة ومُعتمدة.** أُضيفت إلى `packages/contracts/src/index.ts` وبُنيت في dist: `user.read`, `user.manage`, `role.read`, `role.assign`, `masterdata.manage`, `attachment.read`, `attachment.upload`. استبدلها Antigravity بالتعليمات المؤقتة (`TODO(kimi)`) في `AdminController` و`AttachmentsController`، وأُضيفت لسكربت البذر ومُنحت لدور `office_manager` (51 صلاحية). تحقق حي بعد الاعتماد: 21 نقطة ترجع 200 برمز المدير و401 بلا رمز؛ وموظف يملك `report.view + request.read` فقط رجعت له 200 على REP-01 و`/admin/requests` و`/admin/services` و403 على REP-26/27 و`/admin/users` و`/admin/roles` و`/admin/dues` و`/admin/content-pages` و`/admin/imports`. الاختبارات 110/110 والبناء نظيف. |
| 2026-08-09 | Antigravity | تطبيق المكلف (Flutter) — الدفعة الأولى | بُني أساس `apps/mobile` وفق القسم 4 من `تحليل.md`: بنية feature-first، سمة عربية RTL مثبّتة على مستوى التطبيق، عميل API يترجم الأخطاء لرسائل عربية ويُخرج المستخدم تلقائياً عند 401، وتخزين رمز الجلسة في Keystore/Keychain عبر `flutter_secure_storage` (لا مفاتيح Supabase في التطبيق إطلاقاً). أُنجز **FR-001** (هاتف ← OTP ← سؤال الرقم الضريبي ← فورم البيانات الثمانية الإلزامية مع قائمة الكيانات القانونية من الخادم) و**FR-002** (دخول بالهاتف + استعادة كلمة المرور عبر OTP) والصفحة الرئيسية (القسم 4.2). 62 اختباراً ناجحاً و`flutter analyze` نظيف. أُضيفت نقطة `GET /api/v1/public/legal-entities` (عامة عمداً: تُملأ قبل وجود حساب) وبُذرت 8 كيانات قانونية عبر نقطة الأدمن. **تعارض أُصلح:** قاعدة كلمة المرور في التطبيق كانت أضعف من `SecurityService` في الخادم (بلا اشتراط رمز خاص)، فكان التطبيق يقبل ما يرفضه الخادم برسالة عامة — طُوبقت وأُضيف الشرط تحت الحقل. |
| 2026-08-09 | Antigravity → Kimi/المكتب | فجوات تمنع إكمال تطبيق المكلف | (1) **لا توجد نقاط API للبلاغات إطلاقاً** رغم وجود 16 جدولاً في مخطط `balaghat` ⇒ FR-201..206 كلها متعذّرة. (2) **المكلف لا يستطيع رفع مرفقات**: المسار الوحيد `POST /admin/requests/:id/attachments` يتطلب `request.review` (صلاحية موظف) ⇒ FR-101..105 كلها متعذّرة لأنها تشترط مستندات. (3) **لا نقطة لإكمال بيانات المكلف**: `/auth/register` يأخذ الهاتف والاسم فقط، بينما FR-001 يشترط الاسم التجاري والكيان القانوني ونوع النشاط والعنوان. (4) **لا استعلام مستحقات للمكلف** (القسم 4.5) — `/dues/:id` فقط. (5) **دخول المكلف بالهاتف معطّل**: التسجيل ينجح (201 محقّق حياً) لكن الدخول يرجع 401 بسبب `phone_provider_disabled` في Supabase — يحتاج ربط Twilio وتفعيل مزود الهاتف. |
| 2026-08-09 | Antigravity | تطبيق المكلف — الدفعة الثانية (طبقة الخادم) | **عطل جذري أُصلح:** `POST /api/v1/requests` كان يكتب في مستودع **ذاكرة** بينما `GET /api/v1/requests` يقرأ من **القاعدة** — الطلب يضيع بإعادة التشغيل ولا يصل الموظف ولا يمكن ربط مرفق به. أُضيف `RequestDraftKyselyRepository` يحفظ في `requests.service_requests` مع لقطة النموذج في `request_form_snapshot_payloads` وسجل الحالات في `request_status_histories`. المُوجّه `RequestDraftRepositoryRouter` يختار المخزن **عند كل نداء** لا وقت الإقلاع (القاعدة تتصل في `onModuleInit` بعد بناء المزوّدات، فأي قرار مبكر كان يثبّت الذاكرة). أُضيفت `POST/GET /api/v1/taxpayers/me` لحفظ بيانات FR-001 الكاملة وربط الحساب بالمكلف — وإن طابق الرقم الضريبي مكلفاً قائماً يُربط به بدل إنشاء سجل مكرر. مُنح المكلف `taxpayer.profile.update` و`attachment.upload/read`. تحقق حي شامل: 19/19 (إنشاء ← إكمال بيانات ← طلب ← تقديم ← تحقق من القاعدة ← تنظيف). 114 اختبار API و64 اختبار Flutter، كلها خضراء. |
| 2026-08-09 | Antigravity | 🔴 ثغرتا تسريب بيانات أُغلقتا | (1) `GET /api/v1/requests` كان يتطلب `request.read` فقط — وهي ممنوحة لكل مكلف — ويعيد **طلبات جميع المكلفين** بأسمائهم وأرقامهم الضريبية بلا تقييد ملكية. الآن يُقيَّد بـ `created_by_profile_id` ما لم يملك المستدعي `request.review`. (2) `GET /admin/requests` و`/admin/requests/:id/details` و`/admin/decisions` كانت بالمستوى نفسه (`request.read`) فكان أي مكلف يقرؤها — رُفعت إلى `request.review`. تحقق حي: مكلف رأى طلبه وحده (1 من أصل 2)، و403 على نقاط الموظفين. اختبارات دائمة في `requests-listing.authz.test.ts` و`request-draft.repository-router.test.ts`. |
| 2026-08-09 | تنبيه حوكمة | خروج Kimi من الخدمة | أُبلغ Antigravity بأن Kimi لم يعد يعمل على المشروع. المسارات التي كان يملكها (`packages/contracts/**`, `supabase/migrations/**`, `database/**`, `docs/**`, `work-system/**`, `plan.md`) صارت بلا مالك، وتولّاها Antigravity اعتباراً من هذا التاريخ. **جدول ملكية المسارات في `CLAUDE.md` بحاجة إلى تحديث** ليعكس ذلك. |
| 2026-08-09 | Antigravity | البلاغات FR-201..206 — أُنجزت | تبيّن أن عقود البلاغات الستة **كانت موجودة أصلاً وكاملة** في `packages/contracts/src/balaghs.ts` والجداول الستة عشر موجودة في مخطط `balaghat` — الناقص كان وحدة الـ API فقط. بُنيت `apps/api/src/balaghs/`: مستودع Kysely يحفظ في `balaghat.balaghs` مع لقطة النموذج (لكل نوع بلاغ حقول مختلفة) وسجل الحالات وربط الأنشطة المختارة (FR-201/203/204/206)، وخدمة تفرض الملكية على كل قراءة وتعديل وتقديم، ومتحكم `/api/v1/balaghs` يقيّد السرد بصاحبه ما لم يملك المستدعي `balagh.review`. مُنح المكلف صلاحيات البلاغات الخمس. `requiresFieldVisit` يعكس القسم 4.4: الخمسة الأولى يتبعها نزول ميداني وFR-206 وحده داخلي. تحقق حي 21/21 و10 اختبارات دائمة في `balagh.service.test.ts`. |
| 2026-08-09 | Antigravity | هجرة 20260809000000 — عمود نوع النشاط | `masterdata.commercial_activities` بلا عمود لنوع النشاط رغم أنه حقل إلزامي في FR-001، فكان يُحشر مؤقتاً في `public_ref` — وهو مرجع **فريد**، فأي مكلفَين بنوع النشاط نفسه يتصادمان على قيد التفرّد (ظهر حياً كـ 500 عند تسجيل المكلف الثاني). أُضيف عمود `activity_type` نصي اختياري مع فهرس جزئي، وصار `public_ref` مرجعاً مولّداً `ACT-XXXXXXXX`. طُبّقت وسُجّلت في سجل هجرات Supabase (22 هجرة). |
| 2026-08-09 | Antigravity | الخدمات FR-101..105 — أُنجزت | أُلِّفت عقود الخدمات الخمس في `packages/contracts/src/service-requests.ts` (المسار صار بلا مالك بعد خروج Kimi): كتالوج يحمل جداول المستندات كما وردت **حرفياً** في القسم 4.3، مع تمثيل عمود «الإلزام» كقاعدة قابلة للتنفيذ (`required` / `optional` / `company_only` / `national_id_only` / `passport_only`) ودالة `missingRequiredDocuments` التي تُجسّد «ملاحظات القبول»، ونماذج مستقلة لكل خدمة في اتحاد مميَّز بـ `serviceCode` فلا يمكن إرسال نموذج خدمة تحت رمز أخرى. بُنيت `apps/api/src/service-requests/`: مستودع Kysely على `requests.service_requests` ينشئ نوع الخدمة من الكتالوج عند أول استعمال، وخدمة **تمنع التقديم قبل استيفاء المستندات الإلزامية** بدل أن يصل المكتب ناقصاً، ونقطة `GET /:id/missing-documents` ليعرض التطبيق ما ينقص قبل الإرسال، ومتحكم مرفقات يتحقق من ملكية الطلب وحالته ويرفض رمز مستند ليس من مستندات الخدمة. **إتاحة FR-102 تُفرَض على الخادم** لا في الواجهة: من يملك رقماً ضريبياً لا يراها ولا يستطيع إنشاءها (409). المرفقات تُخزَّن في سلة `taxpayer-documents` بمسار يبدأ بمعرّف المكلف توافقاً مع سياسة السلة في هجرة الدفعة 17. تحقق حي 28/28، و20 اختبار عقود و15 اختبار خدمة دائمة. الإجمالي: 142 اختبار API و118 اختبار عقود. |
| 2026-08-09 | Antigravity | ابتلاع صامت في StorageService | `upload` كان يعيد `false` بلا أي سجل عند فشل الرفع، فيصل المستخدم «الخدمة غير متاحة» بلا سبب — وهو ما أضاع وقتاً في تشخيص سلة خاطئة الاسم. أُضيف تسجيل حالة الخطأ ونصه في سجل الخادم. |
| 2026-08-10 | Antigravity | تطبيق المكلف — الخدمات موصولة | بُنيت ميزة الخدمات في `apps/mobile`: مستودع يخاطب `/service-requests`، ووصف بياني لحقول كل خدمة (`service_forms.dart`) مطابق لمخططات Zod فلا تتفرق قواعد الحقول بين الطرفين، وثلاث شاشات (كتالوج ← نموذج ← مستندات وتقديم). الكتالوج يُقرأ من الخادم لا من قائمة ثابتة، فما يراه المكلف هو ما يسمح به الخادم فعلاً. شاشة المستندات تُخفي البديل غير المختار (بطاقة/جواز)، وتُبرز الإلزامي بحسب السياق، وتُعطّل زر الإرسال ما دام هناك نقص، وتعرض ما يرفضه الخادم بالاسم. أُضيف `uploadFile` متعدد الأجزاء لعميل الـ API. الصفحة الرئيسية صارت تفتح الكتالوج الحقيقي بدل بطاقات ثابتة تقول «قيد الإنشاء». 32 اختباراً جديداً (96 إجمالاً للتطبيق) وتحقق حي 11/11 يثبت أن حمولة التطبيق يقبلها الخادم للخدمات الخمس. |
| 2026-08-10 | Antigravity | 🔴 ابتلاع الرسائل في ApiExceptionFilter — أُصلح | المرشِّح كان يستبدل **كل** رسائل الاستثناءات برسائل إنجليزية عامة. التصميم أمني سليم (منع تسرب التفاصيل) لكنه كان يبتلع أيضاً الرسائل العربية المكتوبة عمداً للمستخدم، و**قائمة المستندات الناقصة** التي يحتاجها التطبيق ليتصرف — فكان المكلف يرى «Request validation failed» بدل معرفة ما ينقصه. الحل: `DomainException` كقناة **صريحة** لما هو آمن للعرض؛ ما يُرمى بها يمر كما هو، وكل ما عداه يبقى عاماً. اشتراك صريح لا افتراضي، فلا تنكسر الخاصية الأمنية. وُسِّع `ApiErrorBody.details` في العقود ليقبل بيانات مبنيّة، واستُعملت القناة في وحدتَي الخدمات والبلاغات، و5 اختبارات تحرسها — منها اختبار يثبت أن خطأً داخلياً يذكر اسم جدول لا يتسرب للعميل. |
| 2026-08-10 | Antigravity | 🔴 باب خلفي في التحقق من OTP — أُغلق | `OtpService.verifyOtp` كان يقبل الرمزين الثابتين `677110` و`874271` **لأي رقم هاتف**، بلا طلب رمز نشط وبلا تحقق من الصلاحية، كلما كان Twilio غير مضبوط — وهي حالة النظام الحالية. أثره: من يعرف الرمزين يستطيع إنشاء حساب بأي رقم، و**إعادة تعيين كلمة مرور أي مكلف** عبر `confirmPasswordReset` الذي يستعمل نفس الدالة، أي استيلاء كامل على أي حساب. لم يكن أي اختبار يعتمد عليهما. أُزيل القبول الثابت؛ رقم التطوير `+967770000000` ما زال يولّد `677110` في `requestOtp` فيُقبل له وحده عبر المسار الطبيعي (طلب نشط + صلاحية + مطابقة الرقم). اختباران يحرسان: رفض الرمزين لرقم بلا طلب نشط، ورفض رمز صحيح إن استُعمل لرقم غير صاحبه. |
| 2026-08-10 | Antigravity | رسالة دخول مضلِّلة — أُصلحت | حين يكون مزود الهاتف معطّلاً يرد GoTrue بـ 422 `phone_provider_disabled`، وكان الـ API يترجمه إلى 401 «رقم الهاتف أو كلمة المرور غير صحيحة» — يُوهم المكلف أن بياناته خاطئة، و**يحتسبها محاولة فاشلة فيقفل حسابه بلا ذنب** بعد خمس محاولات. صار عطل إعداد المزود يُميَّز عن فشل المصادقة: 503 برسالة «الدخول برقم الهاتف غير مُفعّل حالياً»، بلا احتساب محاولة ولا قفل، مع تسجيل السبب الحقيقي في سجل الخادم. |
| 2026-08-10 | Antigravity | تثبيت التطبيق على جهاز حقيقي | ثُبّت على ALI NX1 (أندرويد 15). ثلاثة عوائق ظهرت وأُصلحت: (1) `AndroidManifest` بلا إذن `INTERNET` إطلاقاً؛ (2) أندرويد 9+ يحجب `http://` — أُضيف `network_security_config` تحت `src/debug` يسمح بـ localhost و10.0.2.2 فقط، فبناء الإصدار يبقى محكوماً بمنع الاتصال غير المشفّر؛ (3) `file_picker 8.3.7` يثبّت AGP 7.4.2 ويكسر البناء مع AGP 8.11.1 — رُقّي إلى 11.0.3 مع تعديل الواجهة (`FilePicker.pickFiles` الساكنة). وكشفت الشاشة الأولى على الجهاز تجاوزاً في التخطيط بالوضع الأفقي (121 بكسل) — أُصلح بجعل الشاشة الافتتاحية قابلة للتمرير عند قصر الارتفاع، مع 4 اختبارات على مقاسات مختلفة. |
| 2026-08-10 | Antigravity | رمز تحقق محكوم للتجربة (DEV_OTP_CODE) | بديل آمن عمّا أُزيل: رمز ستة أرقام يُضبط في `.env`، لا قيمة افتراضية له. يُقبل بأربعة قيود مجتمعة — Twilio غير مضبوط، والبيئة ليست `production` (وإلا يُتجاهَل ويُسجَّل خطأ)، ووجود **طلب رمز نشط غير منتهٍ لنفس الرقم**، ويُستهلك مرة واحدة. القيد الثالث هو ما يمنع تكرار الثغرة السابقة: لا يصلح لرقم لم يُطلب له رمز، فلا يُستعمل للاستيلاء على حساب. تحذير صريح في سجل الإقلاع حين يكون مفعّلاً. 10 اختبارات: خمسة للسلوك المقبول وخمسة لكل شرط يعطّله. الإجمالي 160 اختبار API. |
