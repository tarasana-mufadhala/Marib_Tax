# MARIB-TAX-REPORT-DATA-TRACEABILITY-01

**Status:** Logical traceability. Reports 4–29 appear once; projections are derived and non-authoritative.

| No. | Report | Sources |
| ---: | --- | --- |
| 4 | الطلبات المرفوضة والملغاة | Service Request; Request Status History; Request Decision Record (final rejection); Request Close/Archive Record (administrative close/archive); draft-deletion treatment **يحتاج اعتماد لاحق**; taxpayer cancellation after submission remains prohibited |
| 5 | طلبات استكمال النواقص | Request Completion Request/Response; Request Snapshot; Attachment Link |
| 6 | البلاغات حسب النوع | Balagh; Balagh Status History; Balagh Selected Activity; Balagh Selected Branch |
| 7 | نتائج البلاغات | Balagh Decision Record/Revision; Balagh Status History; Balagh Selected Activity/Branch; Property Ownership Record where FR-205 transfer effects apply |
| 8 | الأنشطة الموقوفة والمفعلة | Commercial Activity; Activity Status History; Property; Property Unit; Property Ownership Record / History where ownership context applies; FR-205 multi-unit support |
| 9 | مواعيد النزول الميداني | Field Visit; Visit Schedule; Visit Team Member; Staff Profile |
| 10 | نتائج الزيارات | Field Visit; Visit Result; Visit Result Correction; Visit Evidence |
| 11 | أداء النزول الميداني | Field Visit; Schedule; Team Member; Result |
| 12 | المكلفون الجدد | Taxpayer; Contact; Tax Number; Taxpayer Account Link |
| 13 | قاعدة المكلفين | Taxpayer; Legal Entity; Tax Number; Activity/Branch; Property Ownership Record |
| 14 | الأنشطة التجارية | Commercial Activity; Branch; Address; Status History |
| 15 | الكيانات القانونية | Legal Entity; Taxpayer Legal-Entity Association; Taxpayer |
| 16 | المعاملات المتوقفة بسبب السداد | Payment Due; Basis; Correction; Receipt; Confirmation; request/Balagh status |
| 17 | رسائل SMS وواتساب | Notification Message; Delivery Attempt; Retry; Template/Type; Channel |
| 18 | رموز التحقق OTP | Access/Security Event; Notification Message; Delivery Attempt |
| 19 | الإشعارات غير المقروءة | Notification Message; Delivery Attempt (delivery ≠ read); Notification Read State (recipient unread/read) |
| 20 | المستندات الناقصة أو المرفوضة | Attachment; Link; Classification; Completion Request; Visit Evidence |
| 21 | التخزين والمرفقات | Attachment (logical file size; storage category/status; version state; private by default); Link; Version/Replacement; Classification; owning transaction context |
| 22 | عمليات الاستيراد | Import Batch; Preview; Validation; Approval; Rejection; Failure; Commit |
| 23 | أخطاء الاستيراد | Import Batch; Row Result; Import Error |
| 24 | جودة البيانات | Taxpayer; Tax Number; Activity/Branch/Property; Import Validation/Error |
| 25 | سجل التدقيق | Audit Event; Access/Security Event; Actor Context; User Profile; Staff Profile; role and permission change history (Role Assignment; Sensitive Permission Change); action timestamp; authorization context |
| 26 | العمليات الحساسة | Sensitive Change Detail (previous value; new value); Actor Context; User Profile; Staff Profile where actor is staff; reason/reference; correlation identifier; Audit Event; decision revisions; corrections; Import Approval/Commit; Report Export Record |
| 27 | الدخول والأمان | Authentication Identity; User Profile; Staff Profile where applicable; Access/Security Event; OTP/security event history; successful and failed access outcomes; timestamps; client/channel context at approved logical level; masking and export restrictions; Sensitive Permission Change; Taxpayer Account Link |
| 28 | المحتوى المنشور | Content Item; Revision; Publication; Withdrawal; Validity Period |
| 29 | استخدام الموقع (conditional analytics) | Approved conditional analytics source; Content Item where applicable |

Reports 13 and 24 use Property Ownership Records for the taxpayer/property association. Report 16 leaves Due–Receipt allocation/cardinality **يحتاج اعتماد لاحق** and does not treat payment as final approval. Report 19 derives unread state from Notification Read State, including first-read timestamp where available, and keeps delivery distinct from read status. Report 21 uses logical file size, media/content classification, storage accounting category, current-version indicator, storage status, and deletion/retention status. Reports 25–27 explicitly use User Profile, Staff Profile where applicable, Actor Context, and before/after sensitive-change evidence. Viewing and exporting are separately authorized.
