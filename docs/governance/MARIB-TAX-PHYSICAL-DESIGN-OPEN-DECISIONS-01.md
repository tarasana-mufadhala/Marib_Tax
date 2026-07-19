# MARIB-TAX-PHYSICAL-DESIGN-OPEN-DECISIONS-01

**Document ID:** MARIB-TAX-PHYSICAL-DESIGN-OPEN-DECISIONS-01
**Status:** Mixed — PHY-06 / PHY-09 / PHY-10 accepted via ADR-015 (2026-07-19); DMOD-01 / DMOD-06 / DMOD-11 accepted via ADR-016 (2026-07-20); other PHY rows remain Open / **PROPOSED**. No executable SQL in this register.

**Companions:** `MARIB-TAX-DATA-MODEL-OPEN-DECISIONS-01`, `MARIB-TAX-DOMAIN-DESIGN-OPEN-DECISIONS-01`, physical schema/table/identifier/reporting/migration/storage docs.

> Stable IDs use **PHY-##** for physical questions. Logical **DM-*** / **DMOD-*** / **OD-*** IDs are **carried by reference** and must **not** be renumbered.

## 1. Carried-forward logical opens (do not renumber)

### 1.1 Domain / workflow (DMOD / OD)

| Reference | Question (summary) |
| --- | --- |
| DMOD-01 / OD-01 | **Approved** — close vs archive independent events (ADR-016) |
| DMOD-02 / OD-02 | Final FR-205 mandatory attachment list |
| DMOD-03 / OD-03 | Configured SLA durations |
| DMOD-04 / OD-04 | Rejection/closure reason catalogs |
| DMOD-05 / OD-05 | Geographical master-data structure |
| DMOD-06 / OD-06 | **Approved** — draft cancel before submit; no hard delete (ADR-016) |
| DMOD-07 / OD-07 | Reviewer recommendation states and SoD |
| DMOD-08 / OD-08 | Service-specific field-visit triggers |
| DMOD-09 / OD-09 | File retention periods |
| DMOD-10 / OD-10 | Content publication approval |
| DMOD-11 / OD-11 | **Approved** — staff-only reopen with mandatory reason (ADR-016) |
| DMOD-12 / OD-12 | Report scheduling configuration |
| DMOD-13 / OD-13 | Import two-person approval and exceptions |
| DMOD-14 / OD-14 | Decision revision scenarios and actors |
| DMOD-15 / OD-15 | Visit-result and receipt correction authority |

### 1.2 Data-model (DM)

| Reference | Question (summary) |
| --- | --- |
| DM-01 | Identifier/reference representation and generation |
| DM-02 | Public-reference issue/display point |
| DM-03 | Taxpayer matching, merge, split, and correction |
| DM-04 | **Approved** — Tax Number format/verification/uniqueness (ADR-015) |
| DM-05 | Effective-dated Activity, Branch, Property fields |
| DM-06 | Request/Balagh lifecycle reason catalogs |
| DM-07 | Decision visibility, restricted basis, correction evidence |
| DM-08 | **Partial** — staff entry only approved; masking/structure detail open |
| DM-09 | Due basis, status, confirmation, and correction evidence |
| DM-10 | **Partial** — classification + version archive approved |
| DM-11 | **Partial** — Twilio via provider port; no real send; read/retry open |
| DM-12 | Import source, validation/error taxonomy, remediation |
| DM-13 | Audit catalogue, sensitive threshold, actor context |
| DM-14 | Representation, staff purpose, own-data attributes |
| DM-15 | Projection freshness, rebuild, reconciliation |
| DM-16 | **Approved** — report field matrix + view/export separation |
| DM-17 | Retention, archive, legal-hold, destruction periods |
| DM-18 | Access/security event taxonomy and minimization |
| DM-19 | Conditional analytics scope and consent |
| DM-20 | Logical-control implementation strategy and idempotency handling |
| DM-21 | **Partial** — v1 one account / one taxpayer approved |
| DM-22 | **Approved** — 1 due : N receipts; partial payment; manual admin confirm |
| DM-23 | **Approved** — active uniqueness + correction lineage |
| DM-24 | Property relationship via ownership only (derived Taxpayer↔Property) |
| DM-25 | Notification read tracking definition and retention |
| DM-26 | Attachment storage metrics accounting source and retention |

**Carried logical open count:** see `MARIB-TAX-DATA-MODEL-OPEN-DECISIONS-01` (approved slices removed from the blocking set for Batch 04).

---

## 2. Physical design decisions (PHY-01 onward)

Each row: **Status = Open** (يحتاج اعتماد لاحق). **Recommended** is **PROPOSED** only.

| ID | Question | Options | Recommended (PROPOSED) | Business impact | Security impact | Migration impact | Perf impact | Approver | Required-before phase | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PHY-01 | Application schema organization | A. 14 app schemas as proposed · B. Fewer consolidated schemas · C. One `app` schema | **A** — 14 schemas per architecture doc | Module ownership clarity | Smaller blast radius per grant | Batch 1 schema create | Negligible | Architecture + Security | Migration batch 1 | Open |
| PHY-02 | Internal primary key type | A. `uuid` · B. `bigint` identity · C. ULID text | **A** — `uuid` | Cross-module refs stable | Non-guessable ids aid defense-in-depth (not authz) | All table batches | Index width vs sequential | Architecture | Migration batch 2+ | Open |
| PHY-03 | UUID generation locus | A. App-generated · B. DB `gen_random_uuid()` · C. Mixed | **C** — app-generated for aggregates; DB default allowed | Idempotent create semantics | Key material never client-trusted | Default clauses in early batches | Minor | Architecture | Batch 2 | Open |
| PHY-04 | Public numbering format | A. Opaque random text · B. Structured office series · C. Hybrid | Carry **DM-01/DM-02**; no silent pick | Taxpayer/staff usability; letterhead | Public ref ≠ credential | UNIQUE on `public_ref` | Lookup indexes | Tax Office + Architecture | Before issuing production public refs | Open |
| PHY-05 | Public ref issue/display point | A. On draft create · B. On submit · C. On first staff accept | Carry **DM-02** | When numbers appear in UX/reports | Early disclosure surface | Nullable then SET UNIQUE | None material | Tax Office + Product | API/DB before submit go-live | Open |
| PHY-06 | Tax number uniqueness scope | A. Global unique active · B. Unique per legal entity · C. Soft unique + DQ reports | **A** — unique among active taxpayers; numeric text; no generation; correction lineage | Registration/DQ (report 24) | Mis-unique can hide fraud or block legit | Batch 4 constraints | Unique index cost | Tax Office + Legal module owner | Before tax-number enforce constraints | **Accepted 2026-07-19** |
| PHY-07 | Phone normalization storage | A. Store raw only · B. E.164 normalized + raw · C. Normalized only | **B** — normalized search column + raw display where needed | Contact matching / report 24 | Masking/encryption still required; not auth key | Batch 4 contact columns | Duplicate detection indexes | Security + Registry | Before contact DQ reports | Open |
| PHY-08 | Property/unit ownership grain | A. Property-only · B. Unit-only · C. Both (record + optional units) | **C** documentation option; **not** final — TABLE-021 `masterdata.property_ownership_units` remains **CONDITIONAL_OPEN** (not a baseline business rule) | FR-205 multi-unit | Highly Sensitive party data shape | Batch 5 optional table | Extra joins if both | Tax Office + Architecture | Before FR-205 ownership write path | Open |
| PHY-09 | Due–Receipt cardinality | A. 1:1 · B. 1 due : N receipts · C. 1 receipt : N dues · D. Allocation link table | **B** — one due may associate with multiple receipts; manual evidence; confirmed receipts immutable | Payment ops; report 16 | Financial evidence integrity | Batch 10 additive link/evidence | Join shape for indexes | Tax Office + Dues owner | Before dues confirmation hardening | **Accepted 2026-07-19** |
| PHY-10 | Partial payments | A. Disallowed · B. Allowed via multiple receipts · C. Allowed via partial allocation rows | **B** — partial payment via multiple receipts per due | Cashier workload; aging metrics | Under/over payment disputes | Receipt association object | Extra rows | Tax Office | Before partial-pay UX | **Accepted 2026-07-19** |
| PHY-11 | Form snapshot JSONB vs typed | A. JSONB only · B. Fully typed columns · C. Hybrid header + JSONB payload | **C** — hybrid (TABLE snapshot + payload) | FR field evolution | Highly Sensitive payloads | Batches 6–7 | JSONB query limits | Architecture + Product | Before request/balagh form persist | Open |
| PHY-12 | Attachment polymorphic links | A. Per-parent link tables · B. Single `attachment_links` + `owner_type` · C. Mix | **B** — single polymorphic link table | Simpler attachment UX | Reference ≠ authorization critical | Batch 8 | Owner-type indexes | Architecture + Attachments | Batch 8 | Open |
| PHY-13 | Audit before/after storage | A. Raw values · B. Masked only · C. Raw vault + masked report cols | **C** — masked for normal audit read; raw vault/restricted **يحتاج اعتماد لاحق** | Reports 25–26 usefulness | Breach blast radius | Batch 14 columns | Storage growth | Security + Audit owner | Before sensitive-change reporting | Open |
| PHY-14 | Actor Context physical shape | A. JSONB only on `audit_events` · B. Typed columns only · C. JSONB + key typed cols | **C** — embedded; child table only if multi-actor nested needed | Audit reconstructability | Minimization (DM-13/18) | Batch 14 | JSONB size | Security + Architecture | Batch 14 | Open |
| PHY-15 | Partitioning strategy | A. None at MVP · B. Time-partition audit/notify/outbox · C. Partition all high-growth | **A** then revisit; candidate later: audit, access events, outbox, delivery attempts | Ops retention windows | Partition detach vs delete policy | Late migration CR | Maintenance & pruning | Architecture + Ops | Before Very High volume pain | Open |
| PHY-16 | Materialized views for reports | A. None (live SQL) · B. Selective matviews (6/11/13/21/24) · C. Broad matview layer | **B** — selective, justified only | Report latency vs freshness | Stale sensitive aggregates risk | Batch 15+ | Refresh cost | Architecture + Reporting | Before matview deploy | Open |
| PHY-17 | Reporting refresh mode | A. On-demand only · B. Scheduled rebuild jobs · C. Event-incremental | Carry **DM-15**; MVP **A**, optional **B** | Manager trust in numbers | Export of stale restricted data | Worker jobs after batch 15 | Load spikes on refresh | Product + Architecture | Before ops rely on matviews | Open |
| PHY-18 | Projection rebuild/reconciliation | A. Rebuild-only · B. Rebuild + event reconcile · C. Event-sourced reports as SoT | **B** — rebuild from authoritative + optional reconcile to TABLE-090; never **C** | Incident recovery | Prevents projection-as-SoT abuse | Reporting jobs | Rebuild windows | Architecture + Reporting | Before production reporting SLAs | Open |
| PHY-19 | Retention / legal hold / destruction | A. Soft-archive indefinite · B. Timed destruction per class · C. Legal-hold overrides timed | Carry **DM-17** / DMOD-09; **C** when timed exists | Compliance; storage cost | Irreversible destruction risk | Cross-batch policies | Table growth | Security + Tax Office | Before any destructive purge job | Open |
| PHY-20 | Field-level encryption | A. App-level for selected PII · B. DB TDE only · C. Both | **C** posture target; exact columns **يحتاج اعتماد لاحق** | Ops key management | Phone/tax/receipt protection | Column choices batches 4/8/10 | CPU on read/write | Security | Before production PII at scale | Open |
| PHY-21 | Report/API masking profiles | A. Role-based mask maps · B. Column clearances · C. Separate masked views | **A** + selective restricted views for 18/25–27 | Report Reader UX | Prevents clear export by viewers | Reporting + grants | View complexity | Security + Product | Before report.export go-live | Open |
| PHY-22 | Deletion / anonymization model | A. Soft-delete only · B. Anonymize in place · C. Tombstone + purge job | Prefer **A** MVP; **C** when retention approved | Draft delete (DMOD-06); GDPR-like asks | Audit trail integrity | Affects batches 2/4/6/8 | Purge job cost | Security + Tax Office | Before hard-delete tooling | Open |
| PHY-23 | Storage bucket topology | A. Single private bucket · B. Purpose buckets as proposed · C. Per-taxpayer buckets | **B** — purpose buckets in storage design | Ops isolation | Blast radius / public gate | Batch 18 | Ops complexity | Security + Attachments | Batch 18 | Open |
| PHY-24 | Signed URL expiry | A. ≤60s · B. 1–5 min · C. >5 min exceptional | Duration **يحتاج اعتماد لاحق**; prefer short-lived **B** band as proposal | Download UX | URL forwarding risk | Batch 18 policies | Negligible | Security | Before file download UX freeze | Open |
| PHY-25 | Notification outbox retention | A. Keep forever · B. Retain N days after processed · C. Archive then purge | Carry retention **يحتاج اعتماد لاحق**; **B** with evidence archive **PROPOSED** | Debuggability vs storage | PII in payloads | Batch 11+ purge CR | Table growth | Security + Notify owner | Before outbox purge jobs | Open |
| PHY-26 | Idempotency key retention | A. Short TTL · B. Align to case retention · C. Forever | Carry **DM-20**; **B** **PROPOSED** | Replay safety | Key linkage privacy | API/worker stores | Unique index size | Architecture | Before public API idempotency | Open |
| PHY-27 | Import staging retention | A. Drop staging after commit · B. Retain with batch evidence · C. Timed purge | **B** default; timed purge only after **DM-17** | Remediation / report 23 | Staging PII | Batch 12 | Storage for row results | Security + Imports | Before staging cleanup jobs | Open |
| PHY-28 | Enum vs code table default | A. PG ENUM types · B. Code tables · C. Constrained text | **B** for volatile; constrained text for tiny stable; **avoid** PG ENUM (codeset design) | Catalogue evolution | Safer migrations | Early seeds batches 3–7 | Join vs CHECK | Architecture | Before first status catalogues | Open |
| PHY-29 | RLS enforcement mechanism | A. RLS primary · B. API-only · C. RLS defense-in-depth + NestJS authority | **C** — NestJS authoritative; RLS defense-in-depth | Ops if PostgREST ever exposed | Client bypass resistance | Batch 17 | Policy planning cost | Security + Architecture | Batch 17 | Open |
| PHY-30 | DB role split | A. One API role · B. API + worker + migrator + read-report · C. Per-module DB roles | **B** least-privilege split | Blast radius | Credential theft impact | Grants in batches 1/17 | Connection pooling | Security + Ops | Before production grants | Open |
| PHY-31 | PostgREST exposure of app schemas | A. None transactional · B. Read-only views · C. Full CRUD | **A** default; any read-model needs explicit approval | Prevents ADR-010 violation | Critical | Batch 17 | N/A if none | Security + Architecture | Before any PostgREST enablement | Open |
| PHY-32 | Domain event history physical store | A. Domain outbox only · B. Domain outbox (TABLE-094) + TABLE-090 curated · C. Event store as SoT | **B** — curated optional analytics; SoT remains modules; dual outbox with TABLE-072 is a **documented PROPOSED design choice** (not a business approval) | Reporting 4–29 support | Sensitive payload minimization | Batch 14 (TABLE-094) + Batch 15 | Dual-write cost | Architecture + Reporting | Before event-fed reports | Open |
| PHY-33 | Report 29 analytics integration | A. Disabled · B. Approved tool connected · C. Invent in-app tracker | **A** until FCR-03; **never C** in this design | Website usage metrics | Consent/minimization (DM-19) | No invented tables | External only | Product + Security | Before enabling report 29 | Open |
| PHY-34 | Late index deployment window | A. With each table batch · B. Consolidated batch 16 · C. Continuous based on metrics | **B** for secondary; critical UNIQUE/PK with tables | Ops lock risk | Avoid premature UNIQUE on open DMs | Batch 16 | Build locks | Ops + Architecture | Before production load tests | Open |
| PHY-35 | Money / currency physical type | A. `numeric(18,2)` + currency text · B. integer minor units · C. floating types | **A** — never float | Dues accuracy | Financial disputes | Batch 10 | Negligible | Architecture + Dues | Batch 10 | Open |
| PHY-36 | Correlation id type | A. `uuid` · B. `text` · C. either | **A** when system-issued | Cross-module trace (reports 25–26) | Trace vs PII separation | Audit/outbox columns | Index joins | Architecture | Before distributed tracing freeze | Open |

---

## 3. Dependency notes (selected)

| Physical ID | Must align with logical opens |
| --- | --- |
| PHY-04, PHY-05 | DM-01, DM-02 |
| PHY-06 | DM-04, DM-23 |
| PHY-07 | DM-14, report 24 masking |
| PHY-08 | DM-24, TABLE-021 **CONDITIONAL_OPEN** |
| PHY-09, PHY-10 | DM-22 (no fixed Mermaid/FK) |
| PHY-11 | Form snapshot mapping |
| PHY-13, PHY-14 | DM-13, DM-16, DM-18 |
| PHY-16, PHY-17, PHY-18 | DM-15, DMOD-12 |
| PHY-19, PHY-22, PHY-25, PHY-26, PHY-27 | DM-17, DMOD-06, DMOD-09, DM-20, DM-25, DM-26 |
| PHY-23, PHY-24 | ADR-009, storage design |
| PHY-28 | Codeset design (CS-*) |
| PHY-33 | DM-19, FCR-03, Report 29 |

---

## 4. Documented PROPOSED design choices (not business approvals)

These are physical-pack design normalizations. They remain **PROPOSED** documentation choices and do **not** close business opens (DM/DMOD/PHY Status stays **Open** where listed above).

| Choice | Documented stance |
| --- | --- |
| Dual outbox | **TABLE-094** `audit.domain_event_outbox` holds all **56** catalogued domain events. **TABLE-072** `notify.notification_outbox_messages` is the **notification delivery** queue only. Responsibilities must not be merged. |
| Catalogued TABLE IDs | **94** (TABLE-001…TABLE-094), including CONDITIONAL TABLE-021 and INFRASTRUCTURE TABLE-072 / TABLE-094 |
| TABLE-021 | Remains **CONDITIONAL_OPEN** under PHY-08; alternatives property-only / unit-only / both stay **يحتاج اعتماد لاحق** |

---

## 5. Counts

| Metric | Count |
| --- | ---: |
| Carried logical opens (remaining) | see data-model register |
| Physical decisions in this register (PHY-01…PHY-36) | **36** |
| PHY accepted (ADR-015) | **PHY-06, PHY-09, PHY-10** |
| Remaining PHY Status Open / PROPOSED | **33** |
| Catalogued TABLE IDs referenced | **94** |

**Physical open decision count: 33** remaining (PHY-01…PHY-36 minus PHY-06/09/10). Accepted rows are binding for Batch 04+ source authoring where applicable.

**End of MARIB-TAX-PHYSICAL-DESIGN-OPEN-DECISIONS-01**
