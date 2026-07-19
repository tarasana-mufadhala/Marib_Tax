# Marib Tax Project Execution State

**Inventory time:** 2026-07-19 (Asia/Riyadh) — end of extended cycle after Batch 04 source merge

**Official repository:** `tarasana-mufadhala/Marib_Tax`

**Supabase project:** `sjmtiwzddztxfrncwkpx`

## Git and delivery state

- `origin/main`: `a0dd811` (PR #42 Batch 04 source merged; Foundation CI PASS).
- Autopilot worktree: `C:\projects\Marib_Tax-autopilot`, branch `chore/marib-tax-autopilot-orchestrator`.
- Primary worktree: `C:\projects\Marib_Tax`, local ahead commit preserved.
- AGENTS.md: not present.
- Merged this cycle: PR #40 (ADR-015), PR #41 (Batch 03 post-apply), PR #42 (Batch 04 source).

## Database and runtime

| Batch | Source | Production/runtime | Notes |
| --- | --- | --- | --- |
| 01A | COMPLETE | APPLIED | `20260715175300` |
| 02 | COMPLETE | APPLIED | `20260716190000` |
| 03 | COMPLETE | **APPLIED / VERIFIED PASS** | `20260717120000`; SHA `BF15774686744A86D641D7B0B212F7B25E53D2AE6A8E4445662CA84475A00A86`; verifier PASS; empty tables |
| 04 | **COMPLETE (source)** | NOT_STARTED / CLOSED | `20260719120000`; SHA `19D92BF7FB23251BF17FE61A80194075ED9FEEB970EFD89EBC88CEF75174F3A4`; PROD-DB-04 required before apply |
| 05-18 | BLOCKED | NOT_STARTED | Behind Batch 04 production apply |

## Continuation checkpoint

- **Last completed task:** Batch 04 source + provider-port hardening merged via PR #42 as `a0dd811`.
- **Active task:** none.
- **Approval gates:** PROD-DB-04 closed; real SMS/WhatsApp closed.
- **Highest next safe task:** independent source work not blocked by Batch 04 apply, or wait for PROD-DB-04 approval packet preparation if requested.
- **Next action:** focused freshness check only; do not re-apply Batch 03; do not apply Batch 04 without new explicit approval.
