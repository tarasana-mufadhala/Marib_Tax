# Marib Tax System — Analytical Reports Baseline 01

**Document ID:** MARIB-TAX-REPORTS-BASELINE-01
**Status:** Approved analytical report catalog (numbers **4–29**)

> **تقرير تحليلي (Analytical Report)** ≠ **بلاغ (Business Notification / Balagh)** ≠ **إشعار (Notification Message)**.

---

## Shared filters

| Filter | Notes |
| --- | --- |
| From / to date | Created, submitted, decided, visited, notified |
| Transaction type | طلب (Service Request) or بلاغ (Business Notification / Balagh) |
| Service | Versioned service / FR type |
| Status | Current workflow status |
| Taxpayer type | Individual / representative context |
| Legal entity | كيان قانوني |
| Activity | نشاط تجاري |
| District / area | When organized geographical data exists |
| Assigned employee | Reviewer / visit officer / payment officer |
| Field-visit existence | Yes / no / overdue |
| Registered dues existence | مستحق present |
| Notification channel | SMS / push / WhatsApp-ready / in-app |
| Request / reference number | Case identifier |
| Tax number | رقم ضريبي |
| Taxpayer name or phone | Identity search (masking may apply) |

## Shared report features

| Feature | Baseline |
| --- | --- |
| Tabular display | Required |
| Charts | Where appropriate |
| Drill-down | Indicator → detail when authorized |
| Export | **PDF**, **Excel**, **CSV** where applicable |
| Print | Tax Office letterhead |
| Metadata | Generated date/time; generating user; applied filters |
| Saved favorite filters | Supported |
| Permissions | Separate **report.view** and **report.export** |
| Masking | Report Reader receives masked phone/sensitive fields where configured |
| Prepared views | Daily / weekly / monthly |

**Future (not MVP):** Automatic scheduled delivery of تقارير تحليلية to the manager.

---

## Technical data requirements (history, not only current state)

Accurate تقارير تحليلية require preserving:

1. Every state transition with timestamp and actor.
2. Assignment history for every responsible employee.
3. Structured rejection, cancellation, delay, and closure reasons plus notes.
4. Date of completion request and taxpayer response.
5. Every field-visit schedule, status, result, team, notes, and evidence.
6. Every outbound إشعار delivery state and failure reason.
7. Amount-entry history (مستحق).
8. Payment-notification history.
9. Receipt and Payment Confirmation history.
10. Payment actor and timestamp.
11. Import batch history: preview, approval, commit.
12. Before/after values for sensitive changes.
13. Decision reason, reference, actor, timestamp, and revision history.

**Payment model note for reports 16+:** amounts are manually registered in-system; online checkout processors and external finance sync are out of scope.

---

## Catalog — reports 4 through 29

| Number | Report name | Purpose | Main indicators | Main filters |
| --- | --- | --- | --- | --- |
| **4** | الطلبات المرفوضة والملغاة | Rejected / cancelled demand analysis | Rejected count; structured rejection reason; decision employee; service; processing duration before rejection; taxpayer-cancelled **drafts** where applicable; administratively closed/cancelled records with reason | Date; service; status; employee; reason |
| **5** | طلبات استكمال النواقص | Need-more-info pressure | Returned requests; missing/rejected document; return count; completion-request date; taxpayer response; duration since last إشعار | Date; service; assignee; document type |
| **6** | البلاغات حسب النوع | Balagh volume by type | Totals for: activity stoppage; tenant departure/property evacuation; worker departure; activity address change; property ownership transfer; stopped-activity reactivation; open/closed; approved/rejected; visit required; avg completion time; frequent rejection reasons | Date; بلاغ type; status; visit flag |
| **7** | نتائج البلاغات | Balagh outcomes | Approved; rejected; needs completion; not verified; closed without action; reopened | Date; type; result; employee |
| **8** | الأنشطة الموقوفة والمفعلة | Stoppage / reactivation | Stopped activities; stoppage date; reason; reactivated; duration stop→reactivate; taxpayer; tax number; address | Date; temporary/final; taxpayer; area |
| **9** | مواعيد النزول الميداني | Visit schedule ops | Today/week visits; overdue; cancelled/rescheduled; assigned officer/team; activity address; طلب/بلاغ type | Date; officer; status; type |
| **10** | نتائج الزيارات | Visit outcomes | Inspected; unable to reach; location closed; taxpayer unavailable; approved; rejection recommended; another visit required; notes/attachments | Date; officer; result; type |
| **11** | أداء النزول الميداني | Visit productivity | Visits/employee; on-time rate; avg delay; rescheduled; resolved after visit; still pending | Date; officer; team |
| **12** | المكلفون الجدد | New registrations | Registrations in period; with/without tax number; legal-entity distribution; activity type; geographical area when organized; registration channel | Date; channel; entity; area |
| **13** | قاعدة المكلفين | Taxpayer base | Total; active; without tax number; multiple activities; without requests; with open transactions; with registered dues | Status; entity; dues flag |
| **14** | الأنشطة التجارية | Activities | By type; active; stopped; reactivated; address changed; by area; activities per taxpayer | Type; status; area |
| **15** | الكيانات القانونية | Legal entities | Individual; company; bank; establishment; association/organization; other admin-configured types | Entity type; status |
| **16** | المعاملات المتوقفة بسبب السداد | Blocked on payment | Request number; taxpayer; amount; payment-notification date; days since notification; reminder sent; payment status | Date; status; amount range |
| **17** | رسائل SMS وواتساب | Channel delivery health | Sent; delivered; failed; pending; channel; notification type; period; linked transaction; failure reason; estimated cost. WhatsApp = readiness/future until enabled | Date; channel; status; type |
| **18** | رموز التحقق OTP | OTP security/ops | Sent; successful; expired; failed attempts; numbers exceeding limits; registration success rate; channel | Date; channel; outcome |
| **19** | الإشعارات غير المقروءة | Unread in-app | Unread count; age; type; taxpayer; linked transaction | Date; type; taxpayer |
| **20** | المستندات الناقصة أو المرفوضة | Document quality | Most missing; most rejected; reasons (unclear, expired, missing pages, unsupported format); service; legal entity | Date; service; reason |
| **21** | التخزين والمرفقات | Storage ops | File count; total storage; by service; large files; duplicates when technically possible; unlinked files; monthly growth | Date; service; size |
| **22** | عمليات الاستيراد | Import batches | Filename; import date; user; total/accepted/rejected/duplicate rows; approval/commit status | Date; operator; status |
| **23** | أخطاء الاستيراد | Import errors | Row number; field; invalid value; rejection reason; suggested correction; downloadable error file | Date; batch; field |
| **24** | جودة البيانات | Data quality | Duplicate phones; duplicate tax numbers; taxpayers without legal entity; activities without address; requests without mandatory attachments; illogical states; orphan records/files; data changed after import | Date; category |
| **25** | سجل التدقيق | Audit log | Actor; operation; affected record; previous value; new value; date/time; device/IP when needed; reason for sensitive action | Date; actor; operation |
| **26** | العمليات الحساسة | Sensitive ops | Rejection state changes; deletion/archive; tax-number edits; taxpayer-data edits; permission changes; reopening closed transactions; import approval; publishing/withdrawing official forms | Date; operation; actor |
| **27** | الدخول والأمان | Access security | Successful/failed logins; locked accounts; repeated OTP attempts; employee access outside normal times; inactive accounts; password/permission changes | Date; outcome; account |
| **28** | المحتوى المنشور | Published content | Laws/regulations; approved forms; drafts; archived documents; active/expired announcements; last update; publishing employee | Date; content type; status |
| **29** | استخدام الموقع | Website usage | **Only when an approved analytics tool is connected:** visitors; most visited pages; most viewed services; most downloaded forms; devices; traffic sources; transitions to app download | Date; page; device |

Reports **22–24** and **28–29** are approved catalog members. Report **29** indicators apply only after approved analytics integration (future/conditional enablement).
