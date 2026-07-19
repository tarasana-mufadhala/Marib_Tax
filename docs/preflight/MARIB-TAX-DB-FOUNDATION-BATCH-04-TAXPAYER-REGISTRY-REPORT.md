# MARIB-TAX-DB-FOUNDATION-BATCH-04 — Source Authoring Report

| Field | Value |
| --- | --- |
| Task ID | MARIB-TAX-DB-FOUNDATION-BATCH-04-TAXPAYER-REGISTRY-SOURCE-01 |
| Repository | `tarasana-mufadhala/Marib_Tax` |
| Migration | `supabase/migrations/20260719120000_create_taxpayer_registry_and_legal_entities.sql` |
| Verifier | `scripts/db/verify/verify_batch_04_taxpayer_registry_and_legal_entities.sql` |
| Mode | Source authoring only |
| Production apply | **CLOSED** — requires separate PROD-DB-04 approval |

## Objects

| Schema | Table |
| --- | --- |
| `registry` | `taxpayers` |
| `registry` | `taxpayer_contacts` |
| `registry` | `taxpayer_account_links` |
| `registry` | `taxpayer_legal_entity_associations` |
| `legal` | `legal_entities` |
| `legal` | `tax_numbers` |

## ADR-015 encodings

- Tax number: `text` + digits-only CHECK; no DB generation; `correction_reason` + `superseded_by_id` lineage; partial unique on `tax_number_value` where `status_code = 'issued'`.
- Account link: partial unique on `user_profile_id` where `active_state_code = 'active' AND effective_to IS NULL`.
- RLS enabled; no policies; REVOKE from PUBLIC/anon/authenticated/service_role; no seeds.

## Non-actions

This source task does not apply Batch 04 to production, run `db push`, seed data, or authorize real notification delivery.
