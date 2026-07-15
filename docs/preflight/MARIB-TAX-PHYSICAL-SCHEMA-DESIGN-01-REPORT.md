# MARIB-TAX-PHYSICAL-SCHEMA-DESIGN-01 — Preflight Report

| Field | Value |
| --- | --- |
| Task ID | MARIB-TAX-PHYSICAL-SCHEMA-DESIGN-REMEDIATION-02 |
| Branch | `docs/physical-schema-design-01` |
| Base commit | `c614362787804175552c42fa2e478c7f2a3cc92a` |
| Mode | Documentation-only physical PostgreSQL/Supabase design |
| Decision | **PASS — READY FOR FINAL PHYSICAL SCHEMA DESIGN RE-REVIEW** |

> This report does **not** claim final office approval of the physical design or final commit approval. Business opens remain **Open** / **يحتاج اعتماد لاحق**.

## Source documents reviewed

Requirements/domain/workflow/security/API/architecture baselines; logical data model pack; domain event catalog (56 events); FR-201…206; open decisions; state machines; transition authorization matrix; module boundaries; ADRs 005/007/009/010 as referenced.

## Files in pack

| # | Path |
| ---: | --- |
| 1 | `docs/data/MARIB-TAX-PHYSICAL-SCHEMA-ARCHITECTURE-01.md` |
| 2 | `docs/data/MARIB-TAX-LOGICAL-TO-PHYSICAL-MAPPING-01.md` |
| 3 | `docs/data/MARIB-TAX-PHYSICAL-TABLE-CATALOG-01.md` |
| 4 | `docs/data/MARIB-TAX-PHYSICAL-COLUMN-CONSTRAINT-CATALOG-01.md` |
| 5 | `docs/data/MARIB-TAX-PHYSICAL-IDENTIFIER-DESIGN-01.md` |
| 6 | `docs/data/MARIB-TAX-CODESET-ENUM-DESIGN-01.md` |
| 7 | `docs/data/MARIB-TAX-PHYSICAL-RELATIONAL-INTEGRITY-01.md` |
| 8 | `docs/data/MARIB-TAX-INDEX-QUERY-ACCESS-PLAN-01.md` |
| 9 | `docs/data/MARIB-TAX-HISTORY-EVENT-AUDIT-PHYSICAL-DESIGN-01.md` |
| 10 | `docs/security/MARIB-TAX-SUPABASE-AUTH-DATABASE-DESIGN-01.md` |
| 11 | `docs/storage/MARIB-TAX-SUPABASE-STORAGE-PHYSICAL-DESIGN-01.md` |
| 12 | `docs/security/MARIB-TAX-RLS-DATABASE-ACCESS-REQUIREMENTS-01.md` |
| 13 | `docs/data/MARIB-TAX-REPORTING-PHYSICAL-DESIGN-01.md` |
| 14 | `docs/data/MARIB-TAX-PHYSICAL-MIGRATION-SEQUENCE-01.md` |
| 15 | `docs/governance/MARIB-TAX-PHYSICAL-DESIGN-OPEN-DECISIONS-01.md` |
| 16 | `docs/preflight/MARIB-TAX-PHYSICAL-SCHEMA-DESIGN-01-REPORT.md` |

## Initial content audit

| Field | Value |
| --- | --- |
| Audit task | MARIB-TAX-PHYSICAL-SCHEMA-DESIGN-CONTENT-AUDIT-01 |
| Decision | **REQUEST_CHANGES — PHYSICAL SCHEMA DESIGN CORRECTIONS REQUIRED BEFORE COMMIT** |
| Finding counts | BLOCKER **0** / MAJOR **4** / MINOR **4** / NOTE **3** (0/4/4/3) |

### Findings A-01…A-08 (closed by remediation-01)

| ID | Sev | Closure |
| --- | --- | --- |
| A-01 | MAJOR | Preflight publishes exact column/PK/FK/UQ/CK/JSONB counts from the column catalog (no approximate ranges). |
| A-02 | MAJOR | Column catalog enumerates COL-0001…COL-0894 for every TABLE-001…TABLE-094 with PK/FK/UQ/CK inventories. |
| A-03 | MAJOR | RLS access matrix covers all **94** TABLE IDs (TABLE-001…TABLE-094). |
| A-04 | MAJOR | Dual outbox normalized: TABLE-094 `audit.domain_event_outbox` (domain events); TABLE-072 `notify.notification_outbox_messages` (notification delivery only). |
| A-05 | MINOR | Index plan physicalizes **66** IX candidates; remediation-02 closed remaining A-05 defects (invalid columns + partial count **33**). |
| A-06 | MINOR | Table classification splits baseline / conditional / infrastructure / derived; TABLE-021 **CONDITIONAL_OPEN**. |
| A-07 | MINOR | Mapping + catalog reconcile 92 logical entities to **94** TABLE IDs (payloads, conditional ownership units, dual outbox infra). |
| A-08 | MINOR | Relational integrity maps REL-001…REL-100 with exact enforcement classes (PHYSICAL_FK **92** + MANAGED_SCHEMA_FK **2** + …); REL-069 remains `UNRESOLVED_NO_FK`; column-catalog FK total **238**. |

NOTES A-09…A-11 required no mandatory change beyond documentation clarity.

## Remediation-01 result — exact coverage counts

| Item | Exact count |
| --- | ---: |
| Schemas | **16** (2 managed `auth`/`storage` + 14 application-owned) |
| Catalogued TABLE IDs | **94** (TABLE-001…TABLE-094) |
| Baseline proposed (`BASELINE_PROPOSED`) | **89** |
| Conditional/open (`CONDITIONAL_OPEN`) | **1** (TABLE-021) |
| Infrastructure (`INFRASTRUCTURE`) | **2** (TABLE-072, TABLE-094) |
| Derived/reporting (`DERIVED_REPORTING`) | **2** (TABLE-090, TABLE-091) |
| Classification check | 89 + 1 + 2 + 2 = **94** |
| Logical entities mapped | **92** / 92 |
| Physical columns (COL-*) | **894** |
| Primary keys (PK-*) | **94** |
| Foreign keys (FK-*) | **238** |
| Unique constraints (UQ-*) | **45** |
| Check constraints (CK-*) | **31** |
| JSONB columns | **13** |
| Index candidates (IX-*) | **66** |
| Unique-index candidates | **6** |
| Partial-index candidates | **33** (includes IX-060) |
| Covering/INCLUDE candidates | **54** |
| Expression-index candidates | **0** |
| GIN/JSONB candidates | **0** |
| Index category note | Unique/partial/covering/expression/GIN **overlap** and must **not** be summed to derive 66 |
| REL relationships mapped | **100** (REL-001…REL-100) |
| REL `PHYSICAL_FK` | **92** |
| REL `MANAGED_SCHEMA_FK` | **2** |
| REL `APPLICATION_VALIDATED` | **1** |
| REL `DERIVED_VIEW` | **1** |
| REL `EMBEDDED` | **2** |
| REL `UNRESOLVED_NO_FK` | **1** (REL-069 Due–Receipt) |
| REL `POLYMORPHIC_VALIDATED` | **1** |
| REL `NO_PHYSICAL_ENFORCEMENT` | **0** |
| REL class sum check | 92+2+1+1+2+1+1+0 = **100** |
| Column-catalog FK constraints (FK-*) | **238** (includes co-located FKs beyond one-per-REL) |
| CASCADE delete of submitted cases/decisions/audit/receipts | **0** proposed |
| Identifier families (IDF-01…IDF-28) | **28** |
| Codeset concepts | **50** (CS-001…CS-050); PostgreSQL ENUM creation: **0** |
| Domain events | **56** / 56 → enroll in TABLE-094 |
| Reports 4–29 | **26** / 26 once each |
| Migration batches | **18** |
| Physical open decisions (PHY) | **36** (PHY-01…PHY-36) — all Status **Open** |
| Carried logical opens | **41** (15 DMOD/OD + 26 DM) |
| RLS matrix rows | **94** |
| Dual outbox objects | **2** (TABLE-072 delivery; TABLE-094 domain events) |
| Storage path caseType segments | `requests` \| `balaghat` (no `cases` path segment) |

## Dual outbox normalization

| TABLE ID | schema.name | Role |
| --- | --- | --- |
| TABLE-094 | `audit.domain_event_outbox` | Domain-event outbox for all **56** catalogued domain events |
| TABLE-072 | `notify.notification_outbox_messages` | Notification **delivery** outbox only (not domain events) |

Migration: TABLE-072 in Batch 11; TABLE-094 in Batch 14 (audit/domain-events) within the **18**-batch sequence. Stop-on-failure preserved.

## Consistency and safety checklist

| Check | Result |
| --- | --- |
| No mechanical 1:1 entity→table for every entity | PASS |
| No `cases` table; storage paths use `requests`/`balaghat` | PASS |
| Request/Balagh ownership distinct | PASS |
| Tax Number owned by Legal Entities | PASS |
| No authoritative Taxpayer–Property link | PASS (derived view) |
| TABLE-021 CONDITIONAL_OPEN (PHY-08) | PASS |
| Due–Receipt not fixed (REL-069 / DM-22) | PASS |
| Phone/tax not authorization keys | PASS |
| Clients do not mutate business tables | PASS |
| No service credentials in clients | PASS |
| Transactional attachments private | PASS |
| Reporting/Audit non-authoritative for decisions | PASS |
| Payment confirmation ≠ case approval | PASS |
| Reviewer non-final | PASS |
| Dual outbox responsibilities separated | PASS |
| Exact inventories (no ~ ranges) | PASS |
| Open decisions remain open (not approved) | PASS |
| No SQL / migrations / Supabase mutations | PASS |

## Validation

| Check | Result |
| --- | --- |
| Branch | `docs/physical-schema-design-01` |
| Base / HEAD | `c614362787804175552c42fa2e478c7f2a3cc92a` (unchanged; no commit) |
| Allowed remediation-02 files only (3) | PASS |
| `bash -n scripts/validate-foundation.sh` | PASS (exit 0) |
| `scripts/validate-foundation.sh` | PASS (89 PASS / 0 FAIL) |
| `git diff --check` | PASS (exit 0) |
| No SQL / migrations / Supabase mutations | PASS |
| Inventory recount | COL **894** · PK **94** · FK **238** · UQ **45** · CK **31** · IX **66** · partial **33** · RLS **94** · REL **100** · IDF **28** |

## Non-actions confirmation

Did not: create or execute SQL; create migration files; create indexes; connect to or change Supabase Auth/Storage/RLS/schemas; initialize NestJS/Next.js/Flutter; install dependencies; introduce secrets; commit; push; merge; reset; restore; clean; checkout; or modify `main`.

## Second content re-review

| Field | Value |
| --- | --- |
| Review task | MARIB-TAX-PHYSICAL-SCHEMA-DESIGN-CONTENT-REVIEW-02 |
| Decision | **REQUEST_CHANGES — PHYSICAL SCHEMA DESIGN CORRECTIONS REQUIRED BEFORE COMMIT** |
| Finding counts | BLOCKER **0** / MAJOR **2** / MINOR **3** / NOTE **5** |

| Finding | Sev | Summary |
| --- | --- | --- |
| R2-M01 | MAJOR | IX-031 invalid `is_active`; IX-042 invalid `status_code`; IX-052 invalid `disposition_code` |
| R2-M02 | MAJOR | Partial-index count **32** versus measured **33** (IX-060 omitted) |
| R2-m01 | MINOR | Identifier-family count ambiguity (headline 28 vs 26 combined rows) |
| R2-m02 | MINOR | Incorrect Balagh physical table path (double-name typo; corrected to `balaghat.balaghs.public_ref`) |
| R2-m03 | MINOR | Covering-index density remains a non-blocking implementation risk |
| R2-N01…N05 | NOTE | UQ-aligned IX notes; TABLE-094 no FKs; no storage.objects FK; RLS NestJS-dependent predicates; category overlap |

A-01, A-02, A-03, A-04, A-06, A-07, A-08 remained closed. **A-05** remained open pending remediation-02.

## Second remediation

| Correction | Result |
| --- | --- |
| IX-031 aligned with TABLE-015 | INCLUDE `public_ref, status_code` (no `is_active`) |
| IX-042 uses `acceptance_status_code` | INCLUDE aligned with COL-0568; UQ-029 remains uniqueness of record |
| IX-052 uses `outcome_code` | Key aligned with COL-0725 on TABLE-076 |
| All 66 IX rows validated against column catalog | invalid-column references **0** |
| Partial-index count corrected | **33** (list includes IX-060) |
| Identifier-family inventory | **28** rows IDF-01…IDF-28 (headline = row count) |
| Balagh physical reference | `balaghat.balaghs.public_ref` (TABLE-037) |
| Physical objects created | **None** (documentation only) |

### Current exact inventories (preserved)

| Item | Exact count |
| --- | ---: |
| TABLE IDs | **94** |
| Baseline / conditional / infrastructure / derived | **89** / **1** / **2** / **2** |
| Columns | **894** |
| PK / FK / UQ / CK | **94** / **238** / **45** / **31** |
| JSONB | **13** |
| Indexes / partial indexes | **66** / **33** |
| RLS rows | **94** |
| Events → TABLE-094 | **56** |
| Reports | **26** |
| Migration batches | **18** |
| Physical open decisions | **36** |
| Carried logical decisions | **41** |
| Identifier families | **28** (IDF-01…IDF-28) |

## Decision

**PASS — READY FOR FINAL PHYSICAL SCHEMA DESIGN RE-REVIEW**

This is a remediation-02 gate pass for independent final re-review. It is **not** final physical-schema approval and **not** commit approval.

**End of MARIB-TAX-PHYSICAL-SCHEMA-DESIGN-01-REPORT**
