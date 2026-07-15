# MARIB-TAX-DATA-CLASSIFICATION-ACCESS-01

**Status:** Logical classification/access baseline. Server-side NestJS authorization is required; UI hiding and a public reference do not authorize access.

| Classification | Data / handling |
| --- | --- |
| Public | An attachment may be classified Public only when: it belongs to an approved public Content Item or publication context; the Content Management authorization flow permits publication; the attachment contains no taxpayer, case, payment, visit, audit, import, or staff-sensitive data; publication is explicitly recorded; and withdrawal/reclassification remains auditable. All transaction attachments remain private. The following must never become Public merely by an admin label: taxpayer identity documents; receipts; due basis documents; field-visit evidence; case attachments; import source/error files; audit exports; permission/security evidence. |
| Internal | Service configuration, publication workflow metadata, derived projection definitions. |
| Confidential | Taxpayer contact, Account Link, Activity/Branch, request/Balagh state, notifications, filters; mask outside justified purpose. |
| Highly Sensitive | Tax Number, property ownership, decision details, visit findings, dues/receipts, attachment metadata/content; purpose-limited, masked, audited export. |
| Audit Restricted | Audit, sensitive change, security, and import approval/commit evidence; narrowly authorized only. |

1. Own-data access requires Authentication Identity → User Profile → Taxpayer Account Link → Taxpayer. Multiple-taxpayer policy is **يحتاج اعتماد لاحق**.
2. Manager final action is separately authorized from non-final reviewer recommendation; payment and field officers have no final decision authority.
3. Balagh subject references do not authorize Activity, Branch, or Property mutation.
4. Payment Confirmation requires accepted receipt; payment information does not grant final request/Balagh approval.
5. Attachment reports expose only authorized aggregate/status data. Attachment storage metrics are sensitive operational metadata.
6. Notification Read State is visible only to its authorized recipient and justified operational readers.
7. Viewing and exporting reports are different authorizations; exports retain the requesting User Profile.
