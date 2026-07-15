# MARIB-TAX-SUPABASE-AUTH-DATABASE-DESIGN-01

**Document ID:** MARIB-TAX-SUPABASE-AUTH-DATABASE-DESIGN-01
**Status:** Proposed auth/database design requirements (documentation only; no hooks, no executable SQL, no policies)

### Purpose

Describe how Supabase Auth (`auth.users`) relates to application identity, Taxpayer Account Link, staff roles, and NestJS authorization. This document does not create functions, triggers, RLS policies, or migrations.

---

## 1. `auth.users` reference model

| Concern | Design requirement |
| --- | --- |
| External identity | Supabase Auth owns credential challenge and session issuance for end users. |
| Application reference | Application `Authentication Identity` stores a stable reference to `auth.users.id` (UUID). |
| Profile binding | Optional `User Profile` may exist for an Authentication Identity; Staff Profile is a specialization/representation of a profile used for staff work. |
| No duplicated password store | The application **must not** store or verify application-level passwords for taxpayers or staff. Password/OTP secrets remain in Auth provider boundaries. |

Clients (Flutter / Next.js) never hold the Supabase **service-role** key. Privileged Auth admin operations remain server-only.

---

## 2. No application passwords

- Login challenges use Supabase Auth supported factors only (session tokens after successful Auth).
- NestJS validates sessions/JWTs and then enforces **authorization** against application Role / Permission data and Account Link state.
- Local “shadow password” tables are forbidden.
- Credential rotation and MFA policy for Auth remain operational concerns outside this document (**يحتاج اعتماد لاحق** for exact factors).

---

## 3. Taxpayer Account Link path (own-data)

Arabic business meaning: ربط حساب المستخدم بملف المكلّف.

**Authoritative own-data path:**

`auth.users` → Authentication Identity → User Profile → **Taxpayer Account Link** (active + verified per policy) → Taxpayer

Requirements:

- Matching phone number alone is **not** authorization.
- Matching Tax Number alone is **not** authorization.
- Account Link carries relationship/authority type, active/inactive, verification status, effective start/end, approval actor, revocation actor, reason/reference, and history of grant/revoke/verification changes.
- Account linkage does **not** grant staff role permissions.
- Multiple-taxpayer / delegation policy remains **يحتاج اعتماد لاحق** (DM-21).

---

## 4. Staff Profile

| Concern | Design requirement |
| --- | --- |
| Representation | Staff work is attributed to a Staff Profile linked to a User Profile / Authentication Identity. |
| Eligibility | Field visit team membership and assignment queues reference Staff Profile, not raw `auth.users.id`. |
| Separation | A profile may be taxpayer-capable via Account Link and staff-capable via Staff Profile + roles; capabilities are additive only through explicit grants, never silent merge of taxpayer and staff identities. |

---

## 5. Roles and permissions

Logical entities (Identity and Access): Role; Permission; Role Assignment; Role Permission; Sensitive Permission Change.

Requirements:

- Authorization decisions for operational mutations are enforced in **NestJS**, using DB-backed role/permission assignments as the permission source of truth for application capabilities.
- JWT/session **claims** may carry identity and coarse hints for UX routing only; claims are **not** a substitute for DB permission checks on sensitive actions.
- Final approve/reject remains Tax Office manager/director capability only (permissions baseline).
- Reviewer recommendation, payment confirmation, and field-visit recording are non-final for case outcome.
- `report.view` and `report.export` are distinct grants.
- Changes to sensitive roles/permissions emit `SensitivePermissionChanged` and append-only audit with Sensitive Change Detail.

---

## 6. Revoke behavior

| Event | Required behavior |
| --- | --- |
| Role Assignment revoked | Effective end retained; prior grants remain in history; subsequent NestJS checks deny the capability. |
| Account Link revoked / inactivated | Own-data path fails closed; drafts/submitted cases remain owned by Taxpayer records; access to own data ceases for that profile until a new authorized link exists. |
| Staff Profile suspended | Assignments and visit eligibility must fail closed; historical attribution preserved. |
| Auth user banned/disabled | Sessions invalidated at Auth layer; application treats identity as non-authenticating. |

Revocation never silently deletes audit, decision, or case history.

---

## 7. OTP events

| Concern | Design requirement |
| --- | --- |
| Issuance | OTP challenge lifecycle is owned by Supabase Auth (or approved Auth factor flow), not by application password tables. |
| Application logging | Do not log OTP codes, raw tokens, or full phone numbers in application logs. |
| Notification overlap | Business إشعارات (status, payment notice) are Notification Delivery outbox messages; they are not Auth OTP messages. |
| Audit | Security-relevant Auth failures may record Access/Security Events with minimization; taxonomy **يحتاج اعتماد لاحق** (DM-18). |

---

## 8. Deletion strategy

| Layer | Strategy |
| --- | --- |
| Auth user deletion | Must not orphan operational history; application identity may be soft-closed / anonymized per policy. |
| Profile deletion | Soft-close preferred; Staff and taxpayer history retain actor references via stable internal ids. |
| Account Link | End-date / revoke; retain grant/revoke evidence. |
| Taxpayer / case data | Not deleted because Auth user departs; retention **يحتاج اعتماد لاحق**. |
| Hard delete | Forbidden for audit_events, decision records, and import commit evidence absent approved legal process. |

Exact destruction and anonymization procedures remain **يحتاج اعتماد لاحق** (DM-17).

---

## 9. NestJS authorization (binding)

- Flutter and Next.js do not bypass NestJS for operational mutations (ADR-010).
- UI hiding is not authorization.
- Server checks: authenticated identity → profile → (Account Link for taxpayer scope | Role Assignment for staff scope) → permission for command → workflow invariants → audit/outbox enrollment.
- Service-role database credentials are used only by backend/worker processes, never embedded in clients.

---

## 10. Claims vs database permissions

| Mechanism | Allowed use | Forbidden use |
| --- | --- | --- |
| JWT / session claims | Subject id; optional display hints; exp/iss validation | Sole authority for final decisions, exports, role admin, attachment URL issuance |
| DB Role Assignment / Permission | Source of truth for application capabilities | Client-side rewriting of grants |
| Account Link state | Source of truth for taxpayer own-data scope | Inferred from phone/tax match |

---

## 11. Service-role isolation

- Service-role (or equivalent privileged DB role) is restricted to NestJS API and worker environments.
- Clients use anon/authenticated keys only as needed for Auth session bootstrap; operational reads/writes go through NestJS unless an approved constrained read pattern is explicitly designed later.
- Storage privileged signing uses server-side credentials only (see storage design).

---

## 12. Explicit prohibitions

1. **No phone/tax auth** — phone number or Tax Number match does not authenticate or authorize.
2. **No staff/taxpayer silent merge** — linking or role grants must be explicit, approved, and audited; never auto-merge staff and taxpayer personas because contact data matches.
3. **No app password tables**.
4. **No service-role in clients**.
5. **No Auth hooks/SQL in this document** — implementation of triggers, Edge Functions, or `CREATE POLICY` is out of scope here.

---

## 13. Traceability

Aligns with:

- MARIB-TAX-LOGICAL-DATA-MODEL-01 (Identity, Account Link, Staff Profile)
- MARIB-TAX-PERMISSIONS-BASELINE-01
- MARIB-TAX-DATA-CLASSIFICATION-ACCESS-01
- ADR-010 (no direct client DB writes)
- ADR-005 (PostgreSQL / Supabase)
