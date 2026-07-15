# MARIB-TAX-IDENTIFIER-AND-REFERENCE-RULES-01

**Status:** Logical identifier rules. Format, length, sequencing, check digits, reuse, and presentation are **يحتاج اعتماد لاحق**.

| Identifier/reference | Issuer / owner | Rule |
| --- | --- | --- |
| Internal stable identifier | Owning module | Immutable logical identity; not public or an authorization credential. |
| Public request number | Service Requests | One request; immutable, non-reusable, access-restricted, audited. |
| Public Balagh number | Business Notifications / Balaghat | One Balagh; immutable, non-reusable; does not authorize subject-data mutation. |
| Taxpayer reference and Account Link reference | Taxpayer Registry | Account Link supports own-data path; multiple-taxpayer policy **يحتاج اعتماد لاحق**. |
| Tax Number | Legal Entities | May be absent; issuer, format, verification, duplicate handling, uniqueness, and reuse policy **يحتاج اعتماد لاحق**. |
| Taxpayer Legal-Entity Association reference | Taxpayer Registry | Effective-dated evidence-backed taxpayer/legal-entity relation. |
| Activity, Branch, Property references | Activities and Branches | Stable reference; Property relation comes from ownership record history. |
| Due and receipt references | Dues and Payment Evidence | Immutable issued record; receipt replacement preserves lineage; allocation policy **يحتاج اعتماد لاحق**. |
| Visit and import references | Field Visits / Imports and Data Quality | Immutable lifecycle reference. |
| Content/attachment reference | Content Management / Attachments and Private Files | A reference never authorizes file access; publication context controls any public attachment. |
| Correlation identifier | Producing workflow / Audit and Security | Immutable operation chain trace. |
| Idempotency/deduplication identifier | Receiving workflow or worker | Retains duplicate/processing outcome; never a business reference. |

All issuance, correction, use in sensitive context, exceptional disclosure, and idempotency outcome is auditable.
