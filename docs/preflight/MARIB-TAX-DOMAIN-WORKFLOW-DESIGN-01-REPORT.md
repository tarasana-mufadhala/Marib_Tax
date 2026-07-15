# MARIB-TAX-DOMAIN-WORKFLOW-DESIGN-01 — Preflight Report

| Field | Value |
| --- | --- |
| **Task ID** | MARIB-TAX-DOMAIN-WORKFLOW-DESIGN-01 |
| **Branch** | `docs/domain-workflow-design-01` |
| **Base commit** | `44483da859d82ab76c2535f52c1b58b5415daee9` |
| **Date** | 2026-07-15 |
| **Scope** | Documentation-only domain and workflow design |

## Source baseline documents reviewed

- `docs/baseline/MARIB-TAX-SRS-BASELINE-01.md`
- `docs/domain/MARIB-TAX-DOMAIN-MODEL-BASELINE-01.md`
- `docs/workflows/MARIB-TAX-WORKFLOW-BASELINE-01.md`
- `docs/reports/MARIB-TAX-REPORTS-BASELINE-01.md`
- `docs/security/MARIB-TAX-PERMISSIONS-BASELINE-01.md`
- `docs/api/MARIB-TAX-API-CONTRACT-BASELINE-01.md`
- `docs/preflight/MARIB-TAX-REQUIREMENTS-BASELINE-01-REPORT.md`

## Files created

| Path |
| --- |
| `docs/architecture/MARIB-TAX-MODULE-BOUNDARIES-01.md` |
| `docs/domain/MARIB-TAX-AGGREGATES-AND-INVARIANTS-01.md` |
| `docs/workflows/MARIB-TAX-STATE-MACHINE-CATALOG-01.md` |
| `docs/workflows/MARIB-TAX-TRANSITION-AUTHORIZATION-MATRIX-01.md` |
| `docs/domain/MARIB-TAX-DOMAIN-EVENT-CATALOG-01.md` |
| `docs/domain/MARIB-TAX-FR-201-206-FIELD-RULES-01.md` |
| `docs/governance/MARIB-TAX-DOMAIN-DESIGN-OPEN-DECISIONS-01.md` |
| `docs/preflight/MARIB-TAX-DOMAIN-WORKFLOW-DESIGN-01-REPORT.md` |

## Coverage summary

| Item | Count / coverage |
| --- | --- |
| Modules | **14** |
| Aggregates | **14** |
| State machines | **7** |
| Transition-matrix commands | Core lifecycle + revise/correct/reject-import rows |
| Domain events | **56** named events (was 44 after first remediation; 12 generic case-family rows replaced by 24 concrete Request/Balagh events) |
| FR field-rule forms | **FR-201 … FR-206** (6/6) |
| Open decisions (section B) | **15** office-approval items (OD-01…15) |
| Deferred technical (section C) | **6** |
| Future CRs (section D) | **5** |

## Explicit non-actions

| Confirmation | Status |
| --- | --- |
| No application initialization | Confirmed |
| No production code | Confirmed |
| No SQL / schema / migrations | Confirmed |
| No dependencies installed | Confirmed |
| No external services contacted | Confirmed |
| No secrets introduced | Confirmed |
| No commit / push | Confirmed |
| `main` not modified | Confirmed |

## Validation results

| Command | Result |
| --- | --- |
| `bash -n scripts/validate-foundation.sh` | **PASS** — exit 0 |
| `scripts/validate-foundation.sh` | **PASS** — 89 checks, 0 failures, exit 0 |
| `git diff --check` | **PASS** — exit 0 |
| Direct hygiene on 8 design docs | **PASS** — no trailing WS, no BOM, no ANSI, no placeholder email, no gateway wording, final newline present |

HEAD remained `44483da859d82ab76c2535f52c1b58b5415daee9` (no commit).

## Final decision (initial design)

**PASS — READY FOR DOMAIN AND WORKFLOW DESIGN REVIEW**

---

## Content audit and remediation

| Field | Value |
| --- | --- |
| **Remediation task** | MARIB-TAX-DOMAIN-WORKFLOW-DESIGN-REMEDIATION-01 |
| **Initial audit decision** | REQUEST_CHANGES — DESIGN CORRECTIONS REQUIRED BEFORE COMMIT |
| **Audit finding counts** | BLOCKER: 0 · MAJOR: 6 · MINOR: 5 · NOTE: 4 |

### Main remediation areas

- Direct manager final-decision path from `under_review` (recommendation remains optional)
- Timing of Activity / Branch / Address / Property effects (after authorized checkpoint only)
- Module dependency direction (Activities does not depend on Balaghat; no circular ownership)
- Single producer per domain event
- ImportRejected and ImportFailed history events
- DecisionRevised history event
- Administrative close coverage for eligible non-draft states
- Conceptual permission identifiers (PROPOSED)
- Correction/retry events (receipt, visit result, notification retry)
- Case decision ownership for both Requests and Balaghat
- Import approval/commit separation of duties (safe baseline + OD-13)

### Remediation status

Corrections occurred **before the first commit**. Design documents remain **uncommitted and unpushed** during this remediation. This report does **not** claim final office approval of the design.

### Remediation task decision

**PASS — READY FOR DOMAIN AND WORKFLOW DESIGN RE-REVIEW**

---

## Second content re-review and producer-ownership remediation

| Field | Value |
| --- | --- |
| **Remediation task** | MARIB-TAX-DOMAIN-WORKFLOW-DESIGN-REMEDIATION-02 |
| **Second re-review decision** | REQUEST_CHANGES — DESIGN CORRECTIONS REQUIRED BEFORE COMMIT |
| **Finding counts** | BLOCKER: 0 · MAJOR: 1 · MINOR: 3 · NOTE: 3 |

### Remaining major issue (from re-review)

Twelve generic `Case-owning module` event rows (ambiguous producer ownership).

### Minor corrections (from re-review)

- `import.preview`
- `import.validate`
- Balagh decision-revision permission (`balagh.decision.revise`) distinct from request
- Explicit orchestration owner (Service Requests application service / Balaghat application service)

### Remediation performed

- Twelve generic events replaced by twenty-four concrete events
- Event count changed from **44** to **56**
- Each concrete event now names exactly one producer
- Request and balagh event references aligned in state machines, aggregates, authz matrix, and open decisions
- Import permission mappings completed (`import.preview`, `import.validate`)
- Decision-revision permissions separated (`request.decision.revise`, `balagh.decision.revise`)
- Orchestration ownership named (no unnamed global orchestrator)

### Status

Files remain **uncommitted and unpushed**. Changes occurred **before the first commit**. Final approval is **not** yet claimed.

### Remediation-02 decision

**PASS — READY FOR FINAL DOMAIN AND WORKFLOW DESIGN RE-REVIEW**
