# MARIB-TAX-CODESET-ENUM-DESIGN-01

**Status:** Codeset / constrained-value design (documentation only). No executable SQL. No `CREATE TYPE`. Recommendations are **PROPOSED**. Unresolved matters are **يحتاج اعتماد لاحق**.

**Sources:** Logical integrity rules, open decisions (DMOD/DM), classification baseline, workflow statuses implied by request/Balagh/dues/import/notification lifecycles.

## 1. Strategy summary

| Strategy | When to use (**PROPOSED**) | Physical shape (conceptual) |
| --- | --- | --- |
| Code table | Volatile or administratively extendable values; bilingual labels; retire-without-rewrite history | `{schema}.{concept}_codes` with `code text PK`, labels, `is_active`, effective dates |
| Constrained text | Small, workflow-owned sets that may still grow slightly; avoid PG enum rigidity | `text` + CHECK or app validation; optional seed code table later |
| Rare stable enum | Truly fixed tiny sets unlikely to change for the life of the product | Documented closed set; prefer constrained text over PG `ENUM` type unless later approved |
| Application validation only | Polymorphic discriminators and cross-family rules | No DB enum; NestJS enforces |

**Default preference:** code tables for volatile classifications; constrained text (or rare stable closed sets) for truly fixed values. **Do not** introduce PostgreSQL `CREATE TYPE ... AS ENUM` in this phase.

## 2. Concept inventory

| Concept ID | Concept | Likely consumers | PROPOSED strategy | Rationale | Open decision |
| --- | --- | --- | --- | --- | --- |
| CS-001 | Account Link relationship / authority type | `registry.taxpayer_account_links` | Code table | Policy may add delegation/authority kinds (DM-21) | DM-21 |
| CS-002 | Account Link active/inactive state | `taxpayer_account_links` | Constrained text (stable small set) | Binary-ish lifecycle; labels may localize via i18n | DM-21 |
| CS-003 | Account Link verification status | `taxpayer_account_links` | Code table | Verification steps may expand | DM-21 |
| CS-004 | Taxpayer status / lifecycle | `registry.taxpayers` | Code table | Merge/split/correction policies open (DM-03) | DM-03 |
| CS-005 | Contact type / channel | `taxpayer_contacts` | Code table | Phone/email/address kinds extendable | — |
| CS-006 | Legal entity classification | `legal.legal_entities` | Code table | Master classification owned by Legal Entities | — |
| CS-007 | Tax Number status (issued/invalid/replaced) | `legal.tax_numbers` | Code table | Duplicate/correction policy open | DM-04, DM-23 |
| CS-008 | Commercial Activity status | `masterdata.commercial_activities` + status history | Code table | Stopped/active and related states evolve with FR effects | DM-05 |
| CS-009 | Branch status | `masterdata.branches` | Code table | Branch-scoped stop/reactivation (IR-72) | DM-05 |
| CS-010 | Activity address applicability | activity/branch addresses | Code table or constrained text | Scope: activity-wide vs branch (DMOD-05) | DMOD-05 |
| CS-011 | Property / unit status | properties, property_units | Code table | Soft-archive and operational states | DM-05 |
| CS-012 | Ownership party role (seller/buyer/current/…) | ownership records/histories | Code table | FR-205 party roles may refine | DM-24 |
| CS-013 | Service Type code | `requests.service_types` | Code table (is the type master) | FR-201–206 and future types; retirement preserves meaning | — |
| CS-014 | Service Request status | `service_requests` + status history | Code table | Lifecycle reasons/catalogs open | DM-06, DMOD-01 |
| CS-015 | Balagh status | `balaghat` + status history | Code table | Parallel family; same volatility | DM-06, DMOD-01 |
| CS-016 | Stoppage type (temporary/final) | FR-201 form/snapshot fields | Constrained text (stable pair) | IR-58 fixed pair; unlikely to become a large taxonomy | — |
| CS-017 | Rejection / closure reason | close/archive, decision records | Code table | Catalogs explicitly open | DMOD-04, DM-06 |
| CS-018 | Reopen reason | reopen records | Code table | Authority and reasons open | DMOD-11 |
| CS-019 | Reviewer recommendation state | assignment/decision supporting fields | Code table | SoD and recommendation states open | DMOD-07 |
| CS-020 | Decision outcome (approve/reject/…) | decision records | Code table | Visibility/correction evidence open | DM-07, DMOD-14 |
| CS-021 | Assignment action type | request/balagh assignment history | Constrained text or code table | Assign/reassign/unassign small but may grow | — |
| CS-022 | Field visit status | `visits.field_visits` | Code table | Schedule/complete/cancel lifecycles | DMOD-08 |
| CS-023 | Visit result / finding codes | visit results/corrections | Code table | Result structure open | DM-08, DMOD-15 |
| CS-024 | Due status | `dues.payment_dues` | Code table | Basis/confirmation/correction open | DM-09 |
| CS-025 | Currency code | dues, receipts, confirmations | Constrained text (`text` code) | ISO-like codes; no gateway fields; exact currency list **يحتاج اعتماد لاحق** | DM-09 |
| CS-026 | Receipt acceptance status | `payment_receipts` | Code table | Acceptance required before confirmation | DM-09, DM-22 |
| CS-027 | Receipt correction/replacement type | receipt lineage children | Constrained text or code table | Replacement vs additional evidence open | DM-22, DMOD-15 |
| CS-028 | Confirmation outcome | `payment_confirmations` | Constrained text or code table | Not final case approval | DM-09 |
| CS-029 | Attachment access classification | `files.attachments` / classification | Code table | Public/Internal/Confidential/Highly Sensitive/Audit Restricted baseline; media class separate | DM-10 |
| CS-030 | Attachment media / content type class | attachments | Code table | Logical media/content classification (IR-70) | DM-10 |
| CS-031 | Storage accounting category | attachments | Code table | Operational metrics sensitive (DM-26) | DM-26 |
| CS-032 | Storage / deletion / retention status | attachments | Code table | Retention periods open | DMOD-09, DM-17 |
| CS-033 | Attachment link owner type | `attachment_links.owner_type` | Constrained text + app validation | Polymorphic discriminator; closed set of owner families | — |
| CS-034 | Notification channel | messages / channel config | Code table | Channel behavior open | DM-11, DM-25 |
| CS-035 | Notification delivery status | messages / attempts | Code table | Delivery ≠ read | DM-11 |
| CS-036 | Notification read status | `notification_read_states` | Constrained text (unread/read/unknown) | Unknown ≠ read (DM-25) | DM-25 |
| CS-037 | Notification template / type | templates | Code table | Historical template context retained | — |
| CS-038 | Import batch status | `import_batches` | Code table | Distinct lifecycle stages | DMOD-13, DM-12 |
| CS-039 | Import row outcome | import row results | Code table | Per-row outcomes | DM-12 |
| CS-040 | Import error taxonomy | import errors | Code table | Taxonomy open | DM-12 |
| CS-041 | Import approval / rejection / failure kind | import lifecycle children | Constrained text or code table | SoD exceptions open | DMOD-13 |
| CS-042 | Content publication / withdrawal status | content family | Code table | Publication approval open | DMOD-10 |
| CS-043 | Audit event category / action | `audit.audit_events` | Code table | Catalogue and sensitive threshold open | DM-13, DM-18 |
| CS-044 | Access / security event taxonomy | security events | Code table | Minimization and taxonomy open | DM-18 |
| CS-045 | Report export outcome | `report_export_records` | Constrained text or code table | View ≠ export | DM-16 |
| CS-046 | Data sensitivity label (column-level guidance) | physical catalog annotations | Documentation + optional code table | Aligns with classification baseline; not a PG enum | — |
| CS-047 | Role / permission codes | roles, permissions | Code table (`code` UNIQUE) | Privilege catalog evolves; no silent expansion | — |
| CS-048 | Idempotency processing outcome | worker/command disposition | Constrained text | Retained outcome; not business status | DM-20 |
| CS-049 | Geographical codes (district/street/…) | addresses | Code table | Structure open | DMOD-05 |
| CS-050 | Closed vs archived semantics | close/archive records | **يحتاج اعتماد لاحق** — strategy deferred | Semantics themselves unresolved | DMOD-01 |

## 3. Family notes

### 3.1 Identity and Access

Prefer code/`code text UNIQUE` for roles and permissions. Assignment active/revoked is effective-dated boolean or constrained status; sensitive permission changes are audited, not enum-driven.

### 3.2 Registry and Legal

Account Link verification and authority types are code tables because DM-21 may introduce delegation. Tax Number uniqueness and status remain **يحتاج اعتماد لاحق**.

### 3.3 Master data

Activity/Branch status codes must support branch-scoped effects without implying unrelated branch changes (IR-72). Ownership party roles are code-table driven.

### 3.4 Request and Balagh (parallel, separate codes)

Request and Balagh may share *conceptual* status vocabularies but **must not** share history FKs or cross-type status rows. Physically prefer either:

- separate code tables (`request_status_codes`, `balagh_status_codes`), or
- one shared code table with `applies_to` discriminator

Choice between shared vs separate code tables is **PROPOSED** as separate tables for family isolation (IR-19); final choice **يحتاج اعتماد لاحق**.

### 3.5 Dues and payment evidence

Currency is constrained `text` (no gateway/provider/settlement codes). Due–Receipt allocation does not introduce a cardinality enum pending DM-22.

### 3.6 Files and notifications

Classification codes align with `MARIB-TAX-DATA-CLASSIFICATION-ACCESS-01`. Read status keeps `unknown` distinct from `unread`/`read`.

### 3.7 Imports, audit, reporting

Import error taxonomy and audit catalogues are explicitly open (DM-12, DM-13). Export outcome codes remain small.

## 4. Explicit non-goals

- No `CREATE TYPE` / PostgreSQL ENUM DDL in this document.
- No assumed SLA duration codes as approved values (DMOD-03).
- No payment gateway, PSP, or settlement status codes.
- No phone/tax-number “match result” used as authorization status.

## 5. Summary counts

| Item | Count |
| --- | ---: |
| Concepts inventoried | 50 (CS-001–CS-050) |
| PROPOSED code table primary | 35 |
| PROPOSED constrained text / rare stable set | 12 |
| Deferred / unresolved strategy | 1 (CS-050) + shared-vs-separate request/Balagh status tables |
| `CREATE TYPE` statements | 0 |
