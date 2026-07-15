# MARIB-TAX-PHYSICAL-COLUMN-CONSTRAINT-CATALOG-01

**Document ID:** MARIB-TAX-PHYSICAL-COLUMN-CONSTRAINT-CATALOG-01
**Status:** PROPOSED complete auditable physical column and constraint catalogue (documentation only)
**Companion:** `MARIB-TAX-PHYSICAL-TABLE-CATALOG-01`, `MARIB-TAX-PHYSICAL-RELATIONAL-INTEGRITY-01`, `MARIB-TAX-PHYSICAL-IDENTIFIER-DESIGN-01`, `MARIB-TAX-HISTORY-EVENT-AUDIT-PHYSICAL-DESIGN-01`

> Unresolved items are **يحتاج اعتماد لاحق**. Recommendations are **PROPOSED** only. No executable SQL. No secrets.
> Column IDs are sequential `COL-0001` ... across TABLE-001 ... TABLE-094.
> Templates TPL_ROOT and TPL_HISTORY are expanded explicitly as COL rows (not left as standard applies).
> TABLE-021 is **CONDITIONAL**. REL-069 asserts **no** fixed Due-Receipt FK.
> Money: `numeric(18,2)` + `currency_code text`; CHECK amount >= 0; **no float**; rounding ownership **يحتاج اعتماد لاحق**.
> JSONB columns are snapshot/supporting, not sole authoritative state without typed columns.

## Conventions

| Topic | Rule |
| --- | --- |
| Internal IDs | `uuid` |
| Timestamps | `timestamptz` |
| Public refs | `text` (format **يحتاج اعتماد لاحق**) |
| Money | `numeric(18,2)` + `currency_code text`; no float; no payment-gateway columns |
| Sensitivity | Pub / Int / Conf / HS / AR |
| Managed schema FK | `auth.users` referenced as MANAGED_SCHEMA_FK (not an application TABLE ID) |
| TABLE-094 | `audit.domain_event_outbox` — infrastructure domain event outbox (NOT notification delivery) |

## Column inventory by table

### TABLE-001 — `identity.user_profiles`

**Purpose:** Application user profile

**Notes:** auth_user_id UNIQUE → auth.users (MANAGED_SCHEMA_FK). Phone is not an auth key.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0001 | TABLE-001 | identity.user_profiles | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Int | — | Y | PK | DM-01 |
| COL-0002 | TABLE-001 | identity.user_profiles | auth_user_id | Supabase auth identity | uuid | NOT NULL | — | — | auth.users.id MANAGED_SCHEMA_FK | UNIQUE | — | Y | Conf | — | Y | UNIQUE | — |
| COL-0003 | TABLE-001 | identity.user_profiles | display_name | Display name | text | NULL | — | — | — | — | — | N | Conf | mask list | Y | — | DM-14 |
| COL-0004 | TABLE-001 | identity.user_profiles | is_active | Profile active flag | boolean | NOT NULL | true PROPOSED | — | — | — | — | N | Int | — | Y | maybe | — |
| COL-0005 | TABLE-001 | identity.user_profiles | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0006 | TABLE-001 | identity.user_profiles | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0007 | TABLE-001 | identity.user_profiles | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0008 | TABLE-001 | identity.user_profiles | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |
| COL-0009 | TABLE-001 | identity.user_profiles | archived_at | Soft-archive timestamp | timestamptz | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | — |

### TABLE-002 — `identity.staff_profiles`

**Purpose:** Staff eligibility profile

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0010 | TABLE-002 | identity.staff_profiles | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0011 | TABLE-002 | identity.staff_profiles | user_profile_id | Backing user profile | uuid | NOT NULL | — | — | identity.user_profiles.id | UNIQUE | — | Y | Conf | — | Y | UNIQUE | — |
| COL-0012 | TABLE-002 | identity.staff_profiles | staff_code | Optional staff code | text | NULL | — | — | — | UNIQUE NULLS DISTINCT PROPOSED | — | N | Conf | — | Y | maybe | DM-14 |
| COL-0013 | TABLE-002 | identity.staff_profiles | title | Job title | text | NULL | — | — | — | — | — | N | Conf | — | — | — | — |
| COL-0014 | TABLE-002 | identity.staff_profiles | is_active | Eligibility active flag | boolean | NOT NULL | true PROPOSED | — | — | — | — | N | Int | — | Y | maybe | — |
| COL-0015 | TABLE-002 | identity.staff_profiles | effective_from | Eligibility start | timestamptz | NOT NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0016 | TABLE-002 | identity.staff_profiles | effective_to | Effective end | timestamptz | NULL | — | — | — | — | effective_to > effective_from PROPOSED | N | Int | — | Y | — | — |
| COL-0017 | TABLE-002 | identity.staff_profiles | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0018 | TABLE-002 | identity.staff_profiles | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0019 | TABLE-002 | identity.staff_profiles | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0020 | TABLE-002 | identity.staff_profiles | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |
| COL-0021 | TABLE-002 | identity.staff_profiles | archived_at | Soft-archive timestamp | timestamptz | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | — |

### TABLE-003 — `identity.roles`

**Purpose:** Role catalogue

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0022 | TABLE-003 | identity.roles | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Int | — | Y | PK | — |
| COL-0023 | TABLE-003 | identity.roles | code | Stable role code | text | NOT NULL | — | — | — | UNIQUE | — | Y after issue PROPOSED | Int | — | Y | UNIQUE | — |
| COL-0024 | TABLE-003 | identity.roles | name | Display name | text | NOT NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0025 | TABLE-003 | identity.roles | description | Description | text | NULL | — | — | — | — | — | N | Int | — | — | — | — |
| COL-0026 | TABLE-003 | identity.roles | is_active | Catalogue active flag | boolean | NOT NULL | true PROPOSED | — | — | — | — | N | Int | — | Y | maybe | — |
| COL-0027 | TABLE-003 | identity.roles | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0028 | TABLE-003 | identity.roles | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0029 | TABLE-003 | identity.roles | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0030 | TABLE-003 | identity.roles | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |

### TABLE-004 — `identity.permissions`

**Purpose:** Permission catalogue

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0031 | TABLE-004 | identity.permissions | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Int | — | Y | PK | — |
| COL-0032 | TABLE-004 | identity.permissions | code | Stable permission code | text | NOT NULL | — | — | — | UNIQUE | — | Y after issue PROPOSED | Int | — | Y | UNIQUE | — |
| COL-0033 | TABLE-004 | identity.permissions | name | Display name | text | NOT NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0034 | TABLE-004 | identity.permissions | description | Description | text | NULL | — | — | — | — | — | N | Int | — | — | — | — |
| COL-0035 | TABLE-004 | identity.permissions | is_active | Catalogue active flag | boolean | NOT NULL | true PROPOSED | — | — | — | — | N | Int | — | Y | maybe | — |
| COL-0036 | TABLE-004 | identity.permissions | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0037 | TABLE-004 | identity.permissions | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0038 | TABLE-004 | identity.permissions | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0039 | TABLE-004 | identity.permissions | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |

### TABLE-005 — `identity.role_assignments`

**Purpose:** Effective-dated role grants

**Notes:** Overlapping active assignment policy يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0040 | TABLE-005 | identity.role_assignments | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | — |
| COL-0041 | TABLE-005 | identity.role_assignments | user_profile_id | Subject user profile | uuid | NOT NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0042 | TABLE-005 | identity.role_assignments | role_id | Granted role | uuid | NOT NULL | — | — | identity.roles.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0043 | TABLE-005 | identity.role_assignments | effective_from | Grant start | timestamptz | NOT NULL | — | — | — | — | — | N | Int | — | Y | Y | — |
| COL-0044 | TABLE-005 | identity.role_assignments | effective_to | Effective end | timestamptz | NULL | — | — | — | — | effective_to > effective_from PROPOSED | N | Int | — | Y | — | — |
| COL-0045 | TABLE-005 | identity.role_assignments | granted_by_profile_id | Grant actor | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y when set | Conf | — | Y | — | — |
| COL-0046 | TABLE-005 | identity.role_assignments | revoked_by_profile_id | Revoke actor | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y when set | Conf | — | Y | — | — |
| COL-0047 | TABLE-005 | identity.role_assignments | reason | Grant or revoke reason | text | NULL | — | — | — | — | — | N | Conf | — | Y | — | — |
| COL-0048 | TABLE-005 | identity.role_assignments | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0049 | TABLE-005 | identity.role_assignments | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-006 — `identity.role_permissions`

**Purpose:** Role to permission mappings

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0050 | TABLE-006 | identity.role_permissions | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | — |
| COL-0051 | TABLE-006 | identity.role_permissions | role_id | Role | uuid | NOT NULL | — | — | identity.roles.id | — | — | Y | Int | — | Y | Y | — |
| COL-0052 | TABLE-006 | identity.role_permissions | permission_id | Permission | uuid | NOT NULL | — | — | identity.permissions.id | — | — | Y | Int | — | Y | Y | — |
| COL-0053 | TABLE-006 | identity.role_permissions | effective_from | Mapping start | timestamptz | NOT NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0054 | TABLE-006 | identity.role_permissions | effective_to | Effective end | timestamptz | NULL | — | — | — | — | effective_to > effective_from PROPOSED | N | Int | — | Y | — | — |
| COL-0055 | TABLE-006 | identity.role_permissions | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0056 | TABLE-006 | identity.role_permissions | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0057 | TABLE-006 | identity.role_permissions | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-007 — `identity.sensitive_permission_changes`

**Purpose:** Sensitive permission change evidence

**Notes:** Append-only; threshold DM-13 يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0058 | TABLE-007 | identity.sensitive_permission_changes | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | AR | — | Y | PK | — |
| COL-0059 | TABLE-007 | identity.sensitive_permission_changes | role_assignment_id | Related role assignment when applicable | uuid | NULL | — | — | identity.role_assignments.id | — | — | Y | AR | — | Y | maybe | — |
| COL-0060 | TABLE-007 | identity.sensitive_permission_changes | permission_id | Related permission when applicable | uuid | NULL | — | — | identity.permissions.id | — | — | Y | AR | — | Y | maybe | — |
| COL-0061 | TABLE-007 | identity.sensitive_permission_changes | change_type_code | Change type code | text | NOT NULL | — | — | — | — | — | Y | AR | — | Y | maybe | — |
| COL-0062 | TABLE-007 | identity.sensitive_permission_changes | changed_at | Change occurrence time | timestamptz | NOT NULL | — | — | — | — | — | Y | AR | — | Y | Y | — |
| COL-0063 | TABLE-007 | identity.sensitive_permission_changes | changed_by_profile_id | Actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | AR | — | Y | — | — |
| COL-0064 | TABLE-007 | identity.sensitive_permission_changes | reason | Change reason | text | NULL | — | — | — | — | — | Y | AR | — | Y | — | — |
| COL-0065 | TABLE-007 | identity.sensitive_permission_changes | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | AR | — | Y | maybe | DM-20 |
| COL-0066 | TABLE-007 | identity.sensitive_permission_changes | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | AR | — | Y | — | — |

### TABLE-008 — `registry.taxpayers`

**Purpose:** Taxpayer registry root

**Notes:** Merge/split fields يحتاج اعتماد لاحق (DM-03).

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0067 | TABLE-008 | registry.taxpayers | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | — |
| COL-0068 | TABLE-008 | registry.taxpayers | public_ref | Public business reference | text | NULL | — | — | — | UNIQUE NULLS DISTINCT PROPOSED | — | Y when issued | Conf | mask list | Y | UNIQUE | DM-01 |
| COL-0069 | TABLE-008 | registry.taxpayers | display_name | Taxpayer display name | text | NOT NULL | — | — | — | — | — | N | HS | mask | Y | — | DM-03 |
| COL-0070 | TABLE-008 | registry.taxpayers | status_code | Lifecycle status code | text | NOT NULL | — | — | — | — | — | N | Conf | — | Y | Y | DM-03 |
| COL-0071 | TABLE-008 | registry.taxpayers | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0072 | TABLE-008 | registry.taxpayers | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0073 | TABLE-008 | registry.taxpayers | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0074 | TABLE-008 | registry.taxpayers | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |
| COL-0075 | TABLE-008 | registry.taxpayers | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0076 | TABLE-008 | registry.taxpayers | archived_at | Soft-archive timestamp | timestamptz | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | — |

### TABLE-009 — `registry.taxpayer_contacts`

**Purpose:** Taxpayer contact channels

**Notes:** Phone is not an authentication key.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0077 | TABLE-009 | registry.taxpayer_contacts | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0078 | TABLE-009 | registry.taxpayer_contacts | taxpayer_id | Owning taxpayer | uuid | NOT NULL | — | — | registry.taxpayers.id | — | — | N governed reassign | Conf | — | Y | Y | — |
| COL-0079 | TABLE-009 | registry.taxpayer_contacts | contact_type_code | Contact type or channel code | text | NOT NULL | — | — | — | — | — | N | Conf | — | Y | — | — |
| COL-0080 | TABLE-009 | registry.taxpayer_contacts | contact_value | Contact value | text | NOT NULL | — | — | — | — | — | N | HS | mask/encrypt PROPOSED purpose-limited | Y | maybe | DM-14 |
| COL-0081 | TABLE-009 | registry.taxpayer_contacts | is_primary | Primary contact flag | boolean | NOT NULL | false PROPOSED | — | — | — | — | N | Conf | — | Y | — | — |
| COL-0082 | TABLE-009 | registry.taxpayer_contacts | is_active | Active flag | boolean | NOT NULL | true PROPOSED | — | — | — | — | N | Conf | — | Y | — | — |
| COL-0083 | TABLE-009 | registry.taxpayer_contacts | effective_from | Effective start | timestamptz | NOT NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0084 | TABLE-009 | registry.taxpayer_contacts | effective_to | Effective end | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0085 | TABLE-009 | registry.taxpayer_contacts | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0086 | TABLE-009 | registry.taxpayer_contacts | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0087 | TABLE-009 | registry.taxpayer_contacts | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0088 | TABLE-009 | registry.taxpayer_contacts | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |

### TABLE-010 — `registry.taxpayer_account_links`

**Purpose:** User profile to taxpayer authority link

**Notes:** Phone/tax match insufficient. Multiplicity DM-21 يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0089 | TABLE-010 | registry.taxpayer_account_links | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | DM-21 |
| COL-0090 | TABLE-010 | registry.taxpayer_account_links | public_ref | Public business reference | text | NULL | — | — | — | UNIQUE NULLS DISTINCT PROPOSED | — | Y when issued | Conf | mask list | Y | UNIQUE | DM-01 |
| COL-0091 | TABLE-010 | registry.taxpayer_account_links | user_profile_id | Linked user profile | uuid | NOT NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | Y | DM-21 |
| COL-0092 | TABLE-010 | registry.taxpayer_account_links | taxpayer_id | Linked taxpayer | uuid | NOT NULL | — | — | registry.taxpayers.id | — | — | Y | HS | — | Y | Y | DM-21 |
| COL-0093 | TABLE-010 | registry.taxpayer_account_links | relationship_type_code | Authority relationship type | text | NOT NULL | — | — | — | — | — | N | Conf | — | Y | maybe | DM-21 |
| COL-0094 | TABLE-010 | registry.taxpayer_account_links | active_state_code | Active or inactive state | text | NOT NULL | — | — | — | — | — | N | Conf | — | Y | Y | DM-21 |
| COL-0095 | TABLE-010 | registry.taxpayer_account_links | verification_status_code | Verification status | text | NOT NULL | — | — | — | — | — | N | Conf | — | Y | Y | DM-21 |
| COL-0096 | TABLE-010 | registry.taxpayer_account_links | effective_from | Effective start | timestamptz | NOT NULL | — | — | — | — | — | N | Int | — | Y | Y | — |
| COL-0097 | TABLE-010 | registry.taxpayer_account_links | effective_to | Effective end | timestamptz | NULL | — | — | — | — | effective_to > effective_from PROPOSED | N | Int | — | Y | — | — |
| COL-0098 | TABLE-010 | registry.taxpayer_account_links | approved_by_profile_id | Approval actor | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y when set | Conf | — | Y | — | DM-21 |
| COL-0099 | TABLE-010 | registry.taxpayer_account_links | revoked_by_profile_id | Revocation actor | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y when set | Conf | — | Y | — | DM-21 |
| COL-0100 | TABLE-010 | registry.taxpayer_account_links | reason_reference | Reason or reference text | text | NULL | — | — | — | — | — | N | Conf | — | Y | — | — |
| COL-0101 | TABLE-010 | registry.taxpayer_account_links | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0102 | TABLE-010 | registry.taxpayer_account_links | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0103 | TABLE-010 | registry.taxpayer_account_links | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0104 | TABLE-010 | registry.taxpayer_account_links | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |
| COL-0105 | TABLE-010 | registry.taxpayer_account_links | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-011 — `registry.taxpayer_legal_entity_associations`

**Purpose:** Taxpayer to legal entity association

**Notes:** Legal Entities module does not mutate association rows.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0106 | TABLE-011 | registry.taxpayer_legal_entity_associations | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | — |
| COL-0107 | TABLE-011 | registry.taxpayer_legal_entity_associations | taxpayer_id | Associated taxpayer | uuid | NOT NULL | — | — | registry.taxpayers.id | — | — | Y | HS | — | Y | Y | — |
| COL-0108 | TABLE-011 | registry.taxpayer_legal_entity_associations | legal_entity_id | Associated legal entity | uuid | NOT NULL | — | — | legal.legal_entities.id | — | — | Y | HS | — | Y | Y | — |
| COL-0109 | TABLE-011 | registry.taxpayer_legal_entity_associations | association_type_code | Association type | text | NOT NULL | — | — | — | — | — | N | Conf | — | Y | — | — |
| COL-0110 | TABLE-011 | registry.taxpayer_legal_entity_associations | effective_from | Effective start | timestamptz | NOT NULL | — | — | — | — | — | N | Int | — | Y | Y | — |
| COL-0111 | TABLE-011 | registry.taxpayer_legal_entity_associations | effective_to | Effective end | timestamptz | NULL | — | — | — | — | effective_to > effective_from PROPOSED | N | Int | — | Y | — | — |
| COL-0112 | TABLE-011 | registry.taxpayer_legal_entity_associations | evidence_reference | Evidence reference | text | NULL | — | — | — | — | — | N | HS | — | Y | — | — |
| COL-0113 | TABLE-011 | registry.taxpayer_legal_entity_associations | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0114 | TABLE-011 | registry.taxpayer_legal_entity_associations | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0115 | TABLE-011 | registry.taxpayer_legal_entity_associations | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0116 | TABLE-011 | registry.taxpayer_legal_entity_associations | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |
| COL-0117 | TABLE-011 | registry.taxpayer_legal_entity_associations | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-012 — `legal.legal_entities`

**Purpose:** Legal entity root

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0118 | TABLE-012 | legal.legal_entities | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0119 | TABLE-012 | legal.legal_entities | public_ref | Public business reference | text | NULL | — | — | — | UNIQUE NULLS DISTINCT PROPOSED | — | Y when issued | Conf | mask list | Y | UNIQUE | DM-01 |
| COL-0120 | TABLE-012 | legal.legal_entities | legal_name | Legal name | text | NOT NULL | — | — | — | — | — | N | HS | mask | Y | — | — |
| COL-0121 | TABLE-012 | legal.legal_entities | classification_code | Legal classification code | text | NULL | — | — | — | — | — | N | Conf | — | Y | maybe | — |
| COL-0122 | TABLE-012 | legal.legal_entities | is_active | Active flag | boolean | NOT NULL | true PROPOSED | — | — | — | — | N | Int | — | Y | — | — |
| COL-0123 | TABLE-012 | legal.legal_entities | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0124 | TABLE-012 | legal.legal_entities | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0125 | TABLE-012 | legal.legal_entities | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0126 | TABLE-012 | legal.legal_entities | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |
| COL-0127 | TABLE-012 | legal.legal_entities | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0128 | TABLE-012 | legal.legal_entities | archived_at | Soft-archive timestamp | timestamptz | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | — |

### TABLE-013 — `legal.tax_numbers`

**Purpose:** Tax number issuance lineage

**Notes:** Not an authentication key. Uniqueness DM-04/DM-23 يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0129 | TABLE-013 | legal.tax_numbers | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | DM-04 |
| COL-0130 | TABLE-013 | legal.tax_numbers | legal_entity_id | Owning legal entity | uuid | NOT NULL | — | — | legal.legal_entities.id | — | — | N | HS | — | Y | Y | DM-23 |
| COL-0131 | TABLE-013 | legal.tax_numbers | taxpayer_id | Optional display association | uuid | NULL | — | — | registry.taxpayers.id | — | — | N | HS | — | Y | maybe | DM-04, DM-23 |
| COL-0132 | TABLE-013 | legal.tax_numbers | tax_number_value | Tax number value | text | NOT NULL | — | — | — | uniqueness يحتاج اعتماد لاحق | — | N replace via lineage | HS | mask/encrypt PROPOSED | Y | maybe | DM-04, DM-23 |
| COL-0133 | TABLE-013 | legal.tax_numbers | status_code | Issued invalid or replaced status | text | NOT NULL | — | — | — | — | — | N | HS | — | Y | Y | DM-23 |
| COL-0134 | TABLE-013 | legal.tax_numbers | issued_at | Issuance time | timestamptz | NULL | — | — | — | — | — | Y when set | Int | — | Y | — | — |
| COL-0135 | TABLE-013 | legal.tax_numbers | superseded_by_id | Replacement lineage | uuid | NULL | — | — | legal.tax_numbers.id | — | — | Y when set | HS | — | Y | — | DM-23 |
| COL-0136 | TABLE-013 | legal.tax_numbers | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0137 | TABLE-013 | legal.tax_numbers | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0138 | TABLE-013 | legal.tax_numbers | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0139 | TABLE-013 | legal.tax_numbers | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |
| COL-0140 | TABLE-013 | legal.tax_numbers | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-014 — `masterdata.commercial_activities`

**Purpose:** Commercial activity root

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0141 | TABLE-014 | masterdata.commercial_activities | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0142 | TABLE-014 | masterdata.commercial_activities | public_ref | Public business reference | text | NULL | — | — | — | UNIQUE NULLS DISTINCT PROPOSED | — | Y when issued | Conf | mask list | Y | UNIQUE | DM-01 |
| COL-0143 | TABLE-014 | masterdata.commercial_activities | taxpayer_id | Operating taxpayer | uuid | NOT NULL | — | — | registry.taxpayers.id | — | — | N | HS | — | Y | Y | — |
| COL-0144 | TABLE-014 | masterdata.commercial_activities | name | Activity or trade name | text | NOT NULL | — | — | — | — | — | N | Conf | mask | Y | maybe | — |
| COL-0145 | TABLE-014 | masterdata.commercial_activities | status_code | Activity status code | text | NOT NULL | — | — | — | — | — | N | Conf | — | Y | Y | DM-05 |
| COL-0146 | TABLE-014 | masterdata.commercial_activities | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0147 | TABLE-014 | masterdata.commercial_activities | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0148 | TABLE-014 | masterdata.commercial_activities | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0149 | TABLE-014 | masterdata.commercial_activities | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |
| COL-0150 | TABLE-014 | masterdata.commercial_activities | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0151 | TABLE-014 | masterdata.commercial_activities | archived_at | Soft-archive timestamp | timestamptz | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | — |

### TABLE-015 — `masterdata.branches`

**Purpose:** Branch under commercial activity

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0152 | TABLE-015 | masterdata.branches | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0153 | TABLE-015 | masterdata.branches | public_ref | Public business reference | text | NULL | — | — | — | UNIQUE NULLS DISTINCT PROPOSED | — | Y when issued | Conf | mask list | Y | UNIQUE | DM-01 |
| COL-0154 | TABLE-015 | masterdata.branches | commercial_activity_id | Parent commercial activity | uuid | NOT NULL | — | — | masterdata.commercial_activities.id | — | — | Y no silent reparent | Conf | — | Y | Y | — |
| COL-0155 | TABLE-015 | masterdata.branches | name | Branch name | text | NOT NULL | — | — | — | — | — | N | Conf | mask | Y | — | — |
| COL-0156 | TABLE-015 | masterdata.branches | status_code | Branch status code | text | NOT NULL | — | — | — | — | — | N | Conf | — | Y | Y | DM-05 |
| COL-0157 | TABLE-015 | masterdata.branches | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0158 | TABLE-015 | masterdata.branches | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0159 | TABLE-015 | masterdata.branches | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0160 | TABLE-015 | masterdata.branches | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |
| COL-0161 | TABLE-015 | masterdata.branches | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0162 | TABLE-015 | masterdata.branches | archived_at | Soft-archive timestamp | timestamptz | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | — |

### TABLE-016 — `masterdata.activity_addresses`

**Purpose:** Activity or branch address

**Notes:** Geo representation OD-05 / DMOD-05 يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0163 | TABLE-016 | masterdata.activity_addresses | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0164 | TABLE-016 | masterdata.activity_addresses | commercial_activity_id | Activity scope when applicable | uuid | NULL | — | — | masterdata.commercial_activities.id | — | — | N | Conf | — | Y | maybe | DMOD-05 |
| COL-0165 | TABLE-016 | masterdata.activity_addresses | branch_id | Branch scope when applicable | uuid | NULL | — | — | masterdata.branches.id | — | — | N | Conf | — | Y | maybe | DMOD-05 |
| COL-0166 | TABLE-016 | masterdata.activity_addresses | address_line | Address line text | text | NULL | — | — | — | — | — | N | Conf | mask | Y | — | — |
| COL-0167 | TABLE-016 | masterdata.activity_addresses | city_code | City code | text | NULL | — | — | — | — | — | N | Conf | — | Y | — | OD-05 |
| COL-0168 | TABLE-016 | masterdata.activity_addresses | district_code | District code | text | NULL | — | — | — | — | — | N | Conf | — | Y | — | OD-05 |
| COL-0169 | TABLE-016 | masterdata.activity_addresses | geo_payload | Optional geo supporting payload | jsonb | NULL | — | — | — | — | — | N | Conf | mask | Y | — | OD-05; supporting not sole authority |
| COL-0170 | TABLE-016 | masterdata.activity_addresses | effective_from | Effective start | timestamptz | NOT NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0171 | TABLE-016 | masterdata.activity_addresses | effective_to | Effective end | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0172 | TABLE-016 | masterdata.activity_addresses | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0173 | TABLE-016 | masterdata.activity_addresses | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0174 | TABLE-016 | masterdata.activity_addresses | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0175 | TABLE-016 | masterdata.activity_addresses | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |
| COL-0176 | TABLE-016 | masterdata.activity_addresses | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-017 — `masterdata.activity_status_histories`

**Purpose:** Append-only activity status history

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0177 | TABLE-017 | masterdata.activity_status_histories | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0178 | TABLE-017 | masterdata.activity_status_histories | commercial_activity_id | Parent aggregate | uuid | NOT NULL | — | — | masterdata.commercial_activities.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0179 | TABLE-017 | masterdata.activity_status_histories | changed_at | Change occurrence time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0180 | TABLE-017 | masterdata.activity_status_histories | changed_by_profile_id | Actor who performed change | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | — |
| COL-0181 | TABLE-017 | masterdata.activity_status_histories | from_status_code | Prior status code | text | NULL | — | — | — | — | — | Y | Conf | — | Y | — | — |
| COL-0182 | TABLE-017 | masterdata.activity_status_histories | to_status_code | New status code | text | NOT NULL | — | — | — | — | — | Y | Conf | — | Y | maybe | — |
| COL-0183 | TABLE-017 | masterdata.activity_status_histories | reason | Change reason | text | NULL | — | — | — | — | — | Y | Conf | — | Y | — | — |
| COL-0184 | TABLE-017 | masterdata.activity_status_histories | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0185 | TABLE-017 | masterdata.activity_status_histories | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |

### TABLE-018 — `masterdata.properties`

**Purpose:** Property root

**Notes:** No direct authoritative Taxpayer FK (DM-24).

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0186 | TABLE-018 | masterdata.properties | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | — |
| COL-0187 | TABLE-018 | masterdata.properties | public_ref | Public business reference | text | NULL | — | — | — | UNIQUE NULLS DISTINCT PROPOSED | — | Y when issued | Conf | mask list | Y | UNIQUE | DM-01 |
| COL-0188 | TABLE-018 | masterdata.properties | status_code | Property status code | text | NOT NULL | — | — | — | — | — | N | Conf | — | Y | maybe | DM-05 |
| COL-0189 | TABLE-018 | masterdata.properties | description | Property description | text | NULL | — | — | — | — | — | N | Conf | — | — | — | — |
| COL-0190 | TABLE-018 | masterdata.properties | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0191 | TABLE-018 | masterdata.properties | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0192 | TABLE-018 | masterdata.properties | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0193 | TABLE-018 | masterdata.properties | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |
| COL-0194 | TABLE-018 | masterdata.properties | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0195 | TABLE-018 | masterdata.properties | archived_at | Soft-archive timestamp | timestamptz | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | — |

### TABLE-019 — `masterdata.property_units`

**Purpose:** Property unit child

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0196 | TABLE-019 | masterdata.property_units | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | — |
| COL-0197 | TABLE-019 | masterdata.property_units | property_id | Parent property | uuid | NOT NULL | — | — | masterdata.properties.id | — | — | Y | HS | — | Y | Y | — |
| COL-0198 | TABLE-019 | masterdata.property_units | public_ref | Public business reference | text | NULL | — | — | — | UNIQUE NULLS DISTINCT PROPOSED | — | Y when issued | Conf | mask list | Y | UNIQUE | DM-01 |
| COL-0199 | TABLE-019 | masterdata.property_units | unit_label | Unit label | text | NULL | — | — | — | — | — | N | Conf | — | — | — | — |
| COL-0200 | TABLE-019 | masterdata.property_units | status_code | Unit status code | text | NOT NULL | — | — | — | — | — | N | Conf | — | Y | — | — |
| COL-0201 | TABLE-019 | masterdata.property_units | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0202 | TABLE-019 | masterdata.property_units | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0203 | TABLE-019 | masterdata.property_units | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0204 | TABLE-019 | masterdata.property_units | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |
| COL-0205 | TABLE-019 | masterdata.property_units | archived_at | Soft-archive timestamp | timestamptz | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | — |

### TABLE-020 — `masterdata.property_ownership_records`

**Purpose:** Authoritative property ownership record

**Notes:** Authoritative ownership path REL-020–REL-022. Ownership grain OPEN.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0206 | TABLE-020 | masterdata.property_ownership_records | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | DM-24 |
| COL-0207 | TABLE-020 | masterdata.property_ownership_records | property_id | Owned property | uuid | NOT NULL | — | — | masterdata.properties.id | — | — | Y | HS | — | Y | Y | — |
| COL-0208 | TABLE-020 | masterdata.property_ownership_records | taxpayer_id | Party taxpayer | uuid | NOT NULL | — | — | registry.taxpayers.id | — | — | N | HS | — | Y | Y | DM-24 |
| COL-0209 | TABLE-020 | masterdata.property_ownership_records | party_role_code | Party role code | text | NOT NULL | — | — | — | — | — | N | HS | — | Y | Y | — |
| COL-0210 | TABLE-020 | masterdata.property_ownership_records | is_current | Current ownership flag | boolean | NOT NULL | false PROPOSED | — | — | — | — | N | HS | — | Y | Y | DM-24 |
| COL-0211 | TABLE-020 | masterdata.property_ownership_records | effective_from | Ownership start | timestamptz | NOT NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0212 | TABLE-020 | masterdata.property_ownership_records | effective_to | Ownership end | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0213 | TABLE-020 | masterdata.property_ownership_records | evidence_reference | Evidence reference | text | NULL | — | — | — | — | — | N | HS | — | Y | — | — |
| COL-0214 | TABLE-020 | masterdata.property_ownership_records | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0215 | TABLE-020 | masterdata.property_ownership_records | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0216 | TABLE-020 | masterdata.property_ownership_records | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0217 | TABLE-020 | masterdata.property_ownership_records | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |
| COL-0218 | TABLE-020 | masterdata.property_ownership_records | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-021 — `masterdata.property_ownership_units` **CONDITIONAL**

**Purpose:** Optional unit-level ownership association

**Notes:** CONDITIONAL table. Adoption and grain (property-only / unit-only / both) يحتاج اعتماد لاحق. Does not replace REL-020–REL-022.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0219 | TABLE-021 | masterdata.property_ownership_units | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | DM-24 CONDITIONAL |
| COL-0220 | TABLE-021 | masterdata.property_ownership_units | ownership_record_id | Parent ownership record | uuid | NOT NULL | — | — | masterdata.property_ownership_records.id | — | — | Y | HS | — | Y | Y | — |
| COL-0221 | TABLE-021 | masterdata.property_ownership_units | property_unit_id | Unit in ownership scope | uuid | NOT NULL | — | — | masterdata.property_units.id | — | — | Y | HS | — | Y | Y | — |
| COL-0222 | TABLE-021 | masterdata.property_ownership_units | effective_from | Association start | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0223 | TABLE-021 | masterdata.property_ownership_units | effective_to | Association end | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0224 | TABLE-021 | masterdata.property_ownership_units | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0225 | TABLE-021 | masterdata.property_ownership_units | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |

### TABLE-022 — `masterdata.property_ownership_histories`

**Purpose:** Append-only ownership history

**Notes:** Append-only; no UPDATE of business columns.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0226 | TABLE-022 | masterdata.property_ownership_histories | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | — |
| COL-0227 | TABLE-022 | masterdata.property_ownership_histories | ownership_record_id | Parent aggregate | uuid | NOT NULL | — | — | masterdata.property_ownership_records.id | — | — | Y | HS | — | Y | Y | — |
| COL-0228 | TABLE-022 | masterdata.property_ownership_histories | change_type_code | Transfer or revise type | text | NOT NULL | — | — | — | — | — | Y | HS | — | Y | maybe | — |
| COL-0229 | TABLE-022 | masterdata.property_ownership_histories | prior_snapshot | Prior state supporting snapshot | jsonb | NULL | — | — | — | — | — | Y | HS | mask | Y | — | DM-13; supporting not sole authority |
| COL-0230 | TABLE-022 | masterdata.property_ownership_histories | new_snapshot | New state supporting snapshot | jsonb | NULL | — | — | — | — | — | Y | HS | mask | Y | — | DM-13; supporting not sole authority |
| COL-0231 | TABLE-022 | masterdata.property_ownership_histories | changed_at | Change occurrence time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0232 | TABLE-022 | masterdata.property_ownership_histories | changed_by_profile_id | Actor who performed change | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | — |
| COL-0233 | TABLE-022 | masterdata.property_ownership_histories | reason | Change reason | text | NULL | — | — | — | — | — | Y | Conf | — | Y | — | — |
| COL-0234 | TABLE-022 | masterdata.property_ownership_histories | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0235 | TABLE-022 | masterdata.property_ownership_histories | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |

### TABLE-023 — `requests.service_types`

**Purpose:** Service type catalogue

**Notes:** ADR-008 versioning يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0236 | TABLE-023 | requests.service_types | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Int | — | Y | PK | — |
| COL-0237 | TABLE-023 | requests.service_types | code | Stable service type code | text | NOT NULL | — | — | — | UNIQUE | — | Y after issue PROPOSED | Int | — | Y | UNIQUE | — |
| COL-0238 | TABLE-023 | requests.service_types | name | Display name | text | NOT NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0239 | TABLE-023 | requests.service_types | description | Description | text | NULL | — | — | — | — | — | N | Int | — | — | — | — |
| COL-0240 | TABLE-023 | requests.service_types | is_active | Catalogue active flag | boolean | NOT NULL | true PROPOSED | — | — | — | — | N | Int | — | Y | maybe | — |
| COL-0241 | TABLE-023 | requests.service_types | version_label | Optional version label | text | NULL | — | — | — | — | — | N | Int | — | Y | — | ADR-008 |
| COL-0242 | TABLE-023 | requests.service_types | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0243 | TABLE-023 | requests.service_types | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0244 | TABLE-023 | requests.service_types | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0245 | TABLE-023 | requests.service_types | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |

### TABLE-024 — `requests.service_requests`

**Purpose:** service_requests aggregate root

**Notes:** Draft delete DMOD-06 يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0246 | TABLE-024 | requests.service_requests | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0247 | TABLE-024 | requests.service_requests | public_ref | Public business reference | text | NULL | — | — | — | UNIQUE NULLS DISTINCT PROPOSED | — | Y when issued | Conf | mask list | Y | UNIQUE | DM-01 |
| COL-0248 | TABLE-024 | requests.service_requests | service_type_id | Service type | uuid | NOT NULL | — | — | requests.service_types.id | — | — | Y after classify | Conf | — | Y | Y | — |
| COL-0249 | TABLE-024 | requests.service_requests | taxpayer_id | Taxpayer subject | uuid | NOT NULL | — | — | registry.taxpayers.id | — | — | Y after submit | HS | — | Y | Y | — |
| COL-0250 | TABLE-024 | requests.service_requests | status_code | Current status code | text | NOT NULL | — | — | — | — | — | N | Conf | — | Y | Y | DM-06 |
| COL-0251 | TABLE-024 | requests.service_requests | submitted_at | Submit time | timestamptz | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | — |
| COL-0252 | TABLE-024 | requests.service_requests | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0253 | TABLE-024 | requests.service_requests | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0254 | TABLE-024 | requests.service_requests | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0255 | TABLE-024 | requests.service_requests | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |
| COL-0256 | TABLE-024 | requests.service_requests | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0257 | TABLE-024 | requests.service_requests | archived_at | Soft-archive timestamp | timestamptz | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | — |
| COL-0258 | TABLE-024 | requests.service_requests | idempotency_key | Client idempotency key | text | NULL | — | — | — | scoped UNIQUE PROPOSED | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-025 — `requests.request_selected_activities`

**Purpose:** Selected activity on service_requests

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0259 | TABLE-025 | requests.request_selected_activities | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0260 | TABLE-025 | requests.request_selected_activities | service_request_id | Parent case | uuid | NOT NULL | — | — | requests.service_requests.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0261 | TABLE-025 | requests.request_selected_activities | commercial_activity_id | Selected commercial activity | uuid | NOT NULL | — | — | masterdata.commercial_activities.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0262 | TABLE-025 | requests.request_selected_activities | selection_snapshot | Supporting selection snapshot | jsonb | NULL | — | — | — | — | — | Y | Conf | — | Y | — | supporting not sole authoritative state |
| COL-0263 | TABLE-025 | requests.request_selected_activities | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0264 | TABLE-025 | requests.request_selected_activities | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0265 | TABLE-025 | requests.request_selected_activities | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-026 — `requests.request_selected_branches`

**Purpose:** Selected branch on service_requests

**Notes:** Selected-activity FK required when branch selected.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0266 | TABLE-026 | requests.request_selected_branches | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0267 | TABLE-026 | requests.request_selected_branches | service_request_id | Parent case | uuid | NOT NULL | — | — | requests.service_requests.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0268 | TABLE-026 | requests.request_selected_branches | request_selected_activity_id | Parent selected activity | uuid | NOT NULL | — | — | requests.request_selected_activities.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0269 | TABLE-026 | requests.request_selected_branches | branch_id | Selected branch | uuid | NOT NULL | — | — | masterdata.branches.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0270 | TABLE-026 | requests.request_selected_branches | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0271 | TABLE-026 | requests.request_selected_branches | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0272 | TABLE-026 | requests.request_selected_branches | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-027 — `requests.request_form_snapshots`

**Purpose:** service_requests form snapshot header

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0273 | TABLE-027 | requests.request_form_snapshots | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | — |
| COL-0274 | TABLE-027 | requests.request_form_snapshots | service_request_id | Parent case | uuid | NOT NULL | — | — | requests.service_requests.id | — | — | Y | HS | — | Y | Y | — |
| COL-0275 | TABLE-027 | requests.request_form_snapshots | snapshot_version | Snapshot version number | integer | NOT NULL | — | — | — | — | snapshot_version >= 1 PROPOSED | Y | Int | — | Y | — | — |
| COL-0276 | TABLE-027 | requests.request_form_snapshots | captured_at | Capture time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0277 | TABLE-027 | requests.request_form_snapshots | captured_by_profile_id | Capturing actor | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | — | — |
| COL-0278 | TABLE-027 | requests.request_form_snapshots | schema_version | Form schema version label | text | NOT NULL | — | — | — | — | — | Y | Int | — | Y | — | JSON schema version يحتاج اعتماد لاحق |
| COL-0279 | TABLE-027 | requests.request_form_snapshots | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0280 | TABLE-027 | requests.request_form_snapshots | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-028 — `requests.request_form_snapshot_payloads`

**Purpose:** service_requests form snapshot JSONB payload

**Notes:** JSONB payload is snapshot/supporting; not sole authoritative state without typed columns.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0281 | TABLE-028 | requests.request_form_snapshot_payloads | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | — |
| COL-0282 | TABLE-028 | requests.request_form_snapshot_payloads | request_form_snapshot_id | Parent snapshot header | uuid | NOT NULL | — | — | requests.request_form_snapshots.id | UNIQUE PROPOSED | — | Y | HS | — | Y | UNIQUE | — |
| COL-0283 | TABLE-028 | requests.request_form_snapshot_payloads | schema_version | Payload schema version | text | NOT NULL | — | — | — | — | — | Y | Int | — | Y | — | JSON schema version يحتاج اعتماد لاحق |
| COL-0284 | TABLE-028 | requests.request_form_snapshot_payloads | payload | Form payload snapshot JSONB | jsonb | NOT NULL | — | — | — | — | — | Y | HS | mask | Y | — | snapshot/supporting not sole authoritative state |
| COL-0285 | TABLE-028 | requests.request_form_snapshot_payloads | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |

### TABLE-029 — `requests.request_status_histories`

**Purpose:** Append-only service_requests status history

**Notes:** No cross-type history FKs. DM-06 reasons يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0286 | TABLE-029 | requests.request_status_histories | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0287 | TABLE-029 | requests.request_status_histories | service_request_id | Parent aggregate | uuid | NOT NULL | — | — | requests.service_requests.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0288 | TABLE-029 | requests.request_status_histories | changed_at | Change occurrence time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0289 | TABLE-029 | requests.request_status_histories | changed_by_profile_id | Actor who performed change | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | — |
| COL-0290 | TABLE-029 | requests.request_status_histories | from_status_code | Prior status code | text | NULL | — | — | — | — | — | Y | Conf | — | Y | — | — |
| COL-0291 | TABLE-029 | requests.request_status_histories | to_status_code | New status code | text | NOT NULL | — | — | — | — | — | Y | Conf | — | Y | maybe | — |
| COL-0292 | TABLE-029 | requests.request_status_histories | reason | Change reason | text | NULL | — | — | — | — | — | Y | Conf | — | Y | — | — |
| COL-0293 | TABLE-029 | requests.request_status_histories | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0294 | TABLE-029 | requests.request_status_histories | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |

### TABLE-030 — `requests.request_assignment_histories`

**Purpose:** Append-only service_requests assignment history

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0295 | TABLE-030 | requests.request_assignment_histories | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0296 | TABLE-030 | requests.request_assignment_histories | service_request_id | Parent aggregate | uuid | NOT NULL | — | — | requests.service_requests.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0297 | TABLE-030 | requests.request_assignment_histories | action_code | Assignment action code | text | NOT NULL | — | — | — | — | — | Y | Conf | — | Y | maybe | — |
| COL-0298 | TABLE-030 | requests.request_assignment_histories | assigned_at | Assignment time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0299 | TABLE-030 | requests.request_assignment_histories | staff_profile_id | Assigned staff profile | uuid | NOT NULL | — | — | identity.staff_profiles.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0300 | TABLE-030 | requests.request_assignment_histories | changed_at | Change occurrence time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0301 | TABLE-030 | requests.request_assignment_histories | changed_by_staff_profile_id | Actor who performed change | uuid | NULL | — | — | identity.staff_profiles.id | — | — | Y | Conf | — | Y | maybe | — |
| COL-0302 | TABLE-030 | requests.request_assignment_histories | reason | Change reason | text | NULL | — | — | — | — | — | Y | Conf | — | Y | — | — |
| COL-0303 | TABLE-030 | requests.request_assignment_histories | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0304 | TABLE-030 | requests.request_assignment_histories | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |

### TABLE-031 — `requests.request_completion_requests`

**Purpose:** service_requests completion cycle request

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0305 | TABLE-031 | requests.request_completion_requests | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0306 | TABLE-031 | requests.request_completion_requests | service_request_id | Parent case | uuid | NOT NULL | — | — | requests.service_requests.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0307 | TABLE-031 | requests.request_completion_requests | request_text | Completion request text | text | NULL | — | — | — | — | — | Y | Conf | — | Y | — | — |
| COL-0308 | TABLE-031 | requests.request_completion_requests | requested_at | Request time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0309 | TABLE-031 | requests.request_completion_requests | requested_by_staff_profile_id | Requesting staff | uuid | NULL | — | — | identity.staff_profiles.id | — | — | Y | Conf | — | Y | — | — |
| COL-0310 | TABLE-031 | requests.request_completion_requests | status_code | Cycle status code | text | NOT NULL | — | — | — | — | — | N | Conf | — | Y | maybe | — |
| COL-0311 | TABLE-031 | requests.request_completion_requests | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0312 | TABLE-031 | requests.request_completion_requests | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-032 — `requests.request_completion_responses`

**Purpose:** service_requests completion cycle response

**Notes:** UNIQUE completion_request_id PROPOSED.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0313 | TABLE-032 | requests.request_completion_responses | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0314 | TABLE-032 | requests.request_completion_responses | completion_request_id | Parent completion request | uuid | NOT NULL | — | — | requests.request_completion_requests.id | UNIQUE PROPOSED | — | Y | Conf | — | Y | UNIQUE | — |
| COL-0315 | TABLE-032 | requests.request_completion_responses | response_text | Response text | text | NULL | — | — | — | — | — | Y | Conf | — | Y | — | — |
| COL-0316 | TABLE-032 | requests.request_completion_responses | responded_at | Response time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0317 | TABLE-032 | requests.request_completion_responses | responded_by_profile_id | Responding actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | — | — |
| COL-0318 | TABLE-032 | requests.request_completion_responses | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0319 | TABLE-032 | requests.request_completion_responses | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-033 — `requests.request_decision_records`

**Purpose:** service_requests decision record with embedded decision value

**Notes:** 0..1 per case PROPOSED. Never overwrite; revisions additive. DMOD-14.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0320 | TABLE-033 | requests.request_decision_records | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | DM-07 |
| COL-0321 | TABLE-033 | requests.request_decision_records | service_request_id | Parent case | uuid | NOT NULL | — | — | requests.service_requests.id | UNIQUE PROPOSED | — | Y | HS | — | Y | UNIQUE | — |
| COL-0322 | TABLE-033 | requests.request_decision_records | outcome_code | Decision outcome code | text | NOT NULL | — | — | — | — | — | Y | HS | — | Y | Y | — |
| COL-0323 | TABLE-033 | requests.request_decision_records | decision_summary | Decision summary | text | NULL | — | — | — | — | — | Y | HS | mask | Y | — | — |
| COL-0324 | TABLE-033 | requests.request_decision_records | basis_text | Decision basis | text | NULL | — | — | — | — | — | Y | HS | mask | Y | — | — |
| COL-0325 | TABLE-033 | requests.request_decision_records | decided_at | Decision time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0326 | TABLE-033 | requests.request_decision_records | decided_by_staff_profile_id | Deciding staff | uuid | NULL | — | — | identity.staff_profiles.id | — | — | Y | Conf | — | Y | — | — |
| COL-0327 | TABLE-033 | requests.request_decision_records | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0328 | TABLE-033 | requests.request_decision_records | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0329 | TABLE-033 | requests.request_decision_records | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-034 — `requests.request_decision_revisions`

**Purpose:** Append-only service_requests decision revision

**Notes:** DMOD-14 يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0330 | TABLE-034 | requests.request_decision_revisions | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | — |
| COL-0331 | TABLE-034 | requests.request_decision_revisions | decision_record_id | Parent decision record | uuid | NOT NULL | — | — | requests.request_decision_records.id | — | — | Y | HS | — | Y | Y | — |
| COL-0332 | TABLE-034 | requests.request_decision_revisions | revision_number | Revision sequence | integer | NOT NULL | — | — | — | — | revision_number >= 1 PROPOSED | Y | Int | — | Y | — | — |
| COL-0333 | TABLE-034 | requests.request_decision_revisions | revised_outcome_code | Revised outcome code | text | NULL | — | — | — | — | — | Y | HS | — | Y | — | — |
| COL-0334 | TABLE-034 | requests.request_decision_revisions | revision_summary | Revision summary | text | NULL | — | — | — | — | — | Y | HS | mask | Y | — | — |
| COL-0335 | TABLE-034 | requests.request_decision_revisions | revised_at | Revision time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0336 | TABLE-034 | requests.request_decision_revisions | revised_by_staff_profile_id | Revising staff | uuid | NULL | — | — | identity.staff_profiles.id | — | — | Y | Conf | — | Y | — | — |
| COL-0337 | TABLE-034 | requests.request_decision_revisions | reason | Revision reason | text | NULL | — | — | — | — | — | Y | Conf | — | Y | — | — |
| COL-0338 | TABLE-034 | requests.request_decision_revisions | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0339 | TABLE-034 | requests.request_decision_revisions | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |

### TABLE-035 — `requests.request_close_archive_records`

**Purpose:** service_requests close or archive event

**Notes:** Closed vs archived semantics DMOD-01 يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0340 | TABLE-035 | requests.request_close_archive_records | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0341 | TABLE-035 | requests.request_close_archive_records | service_request_id | Parent case | uuid | NOT NULL | — | — | requests.service_requests.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0342 | TABLE-035 | requests.request_close_archive_records | action_code | Close or archive action code | text | NOT NULL | — | — | — | — | — | Y | Conf | — | Y | — | DMOD-01 |
| COL-0343 | TABLE-035 | requests.request_close_archive_records | reason | Action reason | text | NULL | — | — | — | — | — | Y | Conf | — | Y | — | — |
| COL-0344 | TABLE-035 | requests.request_close_archive_records | acted_at | Action time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0345 | TABLE-035 | requests.request_close_archive_records | acted_by_staff_profile_id | Acting staff | uuid | NULL | — | — | identity.staff_profiles.id | — | — | Y | Conf | — | Y | — | — |
| COL-0346 | TABLE-035 | requests.request_close_archive_records | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0347 | TABLE-035 | requests.request_close_archive_records | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |

### TABLE-036 — `requests.request_reopen_records`

**Purpose:** service_requests reopen event

**Notes:** Reopen authority DMOD-11 يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0348 | TABLE-036 | requests.request_reopen_records | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0349 | TABLE-036 | requests.request_reopen_records | service_request_id | Parent case | uuid | NOT NULL | — | — | requests.service_requests.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0350 | TABLE-036 | requests.request_reopen_records | reason | Reopen reason | text | NULL | — | — | — | — | — | Y | Conf | — | Y | — | — |
| COL-0351 | TABLE-036 | requests.request_reopen_records | reopened_at | Reopen time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0352 | TABLE-036 | requests.request_reopen_records | reopened_by_staff_profile_id | Reopening staff | uuid | NULL | — | — | identity.staff_profiles.id | — | — | Y | Conf | — | Y | — | DMOD-11 |
| COL-0353 | TABLE-036 | requests.request_reopen_records | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0354 | TABLE-036 | requests.request_reopen_records | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |

### TABLE-037 — `balaghat.balaghs`

**Purpose:** balaghs aggregate root

**Notes:** Multi-activity allowed. No subject mutation after submit. No cross-type history FKs.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0355 | TABLE-037 | balaghat.balaghs | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0356 | TABLE-037 | balaghat.balaghs | public_ref | Public business reference | text | NULL | — | — | — | UNIQUE NULLS DISTINCT PROPOSED | — | Y when issued | Conf | mask list | Y | UNIQUE | DM-01 |
| COL-0357 | TABLE-037 | balaghat.balaghs | taxpayer_id | Taxpayer subject | uuid | NOT NULL | — | — | registry.taxpayers.id | — | — | Y after submit | HS | — | Y | Y | — |
| COL-0358 | TABLE-037 | balaghat.balaghs | status_code | Current status code | text | NOT NULL | — | — | — | — | — | N | Conf | — | Y | Y | DM-06 |
| COL-0359 | TABLE-037 | balaghat.balaghs | submitted_at | Submit time | timestamptz | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | — |
| COL-0360 | TABLE-037 | balaghat.balaghs | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0361 | TABLE-037 | balaghat.balaghs | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0362 | TABLE-037 | balaghat.balaghs | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0363 | TABLE-037 | balaghat.balaghs | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |
| COL-0364 | TABLE-037 | balaghat.balaghs | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0365 | TABLE-037 | balaghat.balaghs | archived_at | Soft-archive timestamp | timestamptz | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | — |
| COL-0366 | TABLE-037 | balaghat.balaghs | idempotency_key | Client idempotency key | text | NULL | — | — | — | scoped UNIQUE PROPOSED | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-038 — `balaghat.balagh_selected_activities`

**Purpose:** Selected activity on balaghs

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0367 | TABLE-038 | balaghat.balagh_selected_activities | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0368 | TABLE-038 | balaghat.balagh_selected_activities | balagh_id | Parent case | uuid | NOT NULL | — | — | balaghat.balaghs.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0369 | TABLE-038 | balaghat.balagh_selected_activities | commercial_activity_id | Selected commercial activity | uuid | NOT NULL | — | — | masterdata.commercial_activities.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0370 | TABLE-038 | balaghat.balagh_selected_activities | selection_snapshot | Supporting selection snapshot | jsonb | NULL | — | — | — | — | — | Y | Conf | — | Y | — | supporting not sole authoritative state |
| COL-0371 | TABLE-038 | balaghat.balagh_selected_activities | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0372 | TABLE-038 | balaghat.balagh_selected_activities | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0373 | TABLE-038 | balaghat.balagh_selected_activities | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-039 — `balaghat.balagh_selected_branches`

**Purpose:** Selected branch on balaghs

**Notes:** Selected-activity FK required when branch selected.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0374 | TABLE-039 | balaghat.balagh_selected_branches | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0375 | TABLE-039 | balaghat.balagh_selected_branches | balagh_id | Parent case | uuid | NOT NULL | — | — | balaghat.balaghs.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0376 | TABLE-039 | balaghat.balagh_selected_branches | balagh_selected_activity_id | Parent selected activity | uuid | NOT NULL | — | — | balaghat.balagh_selected_activities.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0377 | TABLE-039 | balaghat.balagh_selected_branches | branch_id | Selected branch | uuid | NOT NULL | — | — | masterdata.branches.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0378 | TABLE-039 | balaghat.balagh_selected_branches | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0379 | TABLE-039 | balaghat.balagh_selected_branches | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0380 | TABLE-039 | balaghat.balagh_selected_branches | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-040 — `balaghat.balagh_form_snapshots`

**Purpose:** balaghs form snapshot header

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0381 | TABLE-040 | balaghat.balagh_form_snapshots | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | — |
| COL-0382 | TABLE-040 | balaghat.balagh_form_snapshots | balagh_id | Parent case | uuid | NOT NULL | — | — | balaghat.balaghs.id | — | — | Y | HS | — | Y | Y | — |
| COL-0383 | TABLE-040 | balaghat.balagh_form_snapshots | snapshot_version | Snapshot version number | integer | NOT NULL | — | — | — | — | snapshot_version >= 1 PROPOSED | Y | Int | — | Y | — | — |
| COL-0384 | TABLE-040 | balaghat.balagh_form_snapshots | captured_at | Capture time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0385 | TABLE-040 | balaghat.balagh_form_snapshots | captured_by_profile_id | Capturing actor | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | — | — |
| COL-0386 | TABLE-040 | balaghat.balagh_form_snapshots | schema_version | Form schema version label | text | NOT NULL | — | — | — | — | — | Y | Int | — | Y | — | JSON schema version يحتاج اعتماد لاحق |
| COL-0387 | TABLE-040 | balaghat.balagh_form_snapshots | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0388 | TABLE-040 | balaghat.balagh_form_snapshots | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-041 — `balaghat.balagh_form_snapshot_payloads`

**Purpose:** balaghs form snapshot JSONB payload

**Notes:** JSONB payload is snapshot/supporting; not sole authoritative state without typed columns.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0389 | TABLE-041 | balaghat.balagh_form_snapshot_payloads | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | — |
| COL-0390 | TABLE-041 | balaghat.balagh_form_snapshot_payloads | balagh_form_snapshot_id | Parent snapshot header | uuid | NOT NULL | — | — | balaghat.balagh_form_snapshots.id | UNIQUE PROPOSED | — | Y | HS | — | Y | UNIQUE | — |
| COL-0391 | TABLE-041 | balaghat.balagh_form_snapshot_payloads | schema_version | Payload schema version | text | NOT NULL | — | — | — | — | — | Y | Int | — | Y | — | JSON schema version يحتاج اعتماد لاحق |
| COL-0392 | TABLE-041 | balaghat.balagh_form_snapshot_payloads | payload | Form payload snapshot JSONB | jsonb | NOT NULL | — | — | — | — | — | Y | HS | mask | Y | — | snapshot/supporting not sole authoritative state |
| COL-0393 | TABLE-041 | balaghat.balagh_form_snapshot_payloads | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |

### TABLE-042 — `balaghat.balagh_status_histories`

**Purpose:** Append-only balaghs status history

**Notes:** No cross-type history FKs. DM-06 reasons يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0394 | TABLE-042 | balaghat.balagh_status_histories | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0395 | TABLE-042 | balaghat.balagh_status_histories | balagh_id | Parent aggregate | uuid | NOT NULL | — | — | balaghat.balaghs.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0396 | TABLE-042 | balaghat.balagh_status_histories | changed_at | Change occurrence time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0397 | TABLE-042 | balaghat.balagh_status_histories | changed_by_profile_id | Actor who performed change | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | — |
| COL-0398 | TABLE-042 | balaghat.balagh_status_histories | from_status_code | Prior status code | text | NULL | — | — | — | — | — | Y | Conf | — | Y | — | — |
| COL-0399 | TABLE-042 | balaghat.balagh_status_histories | to_status_code | New status code | text | NOT NULL | — | — | — | — | — | Y | Conf | — | Y | maybe | — |
| COL-0400 | TABLE-042 | balaghat.balagh_status_histories | reason | Change reason | text | NULL | — | — | — | — | — | Y | Conf | — | Y | — | — |
| COL-0401 | TABLE-042 | balaghat.balagh_status_histories | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0402 | TABLE-042 | balaghat.balagh_status_histories | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |

### TABLE-043 — `balaghat.balagh_assignment_histories`

**Purpose:** Append-only balaghs assignment history

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0403 | TABLE-043 | balaghat.balagh_assignment_histories | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0404 | TABLE-043 | balaghat.balagh_assignment_histories | balagh_id | Parent aggregate | uuid | NOT NULL | — | — | balaghat.balaghs.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0405 | TABLE-043 | balaghat.balagh_assignment_histories | action_code | Assignment action code | text | NOT NULL | — | — | — | — | — | Y | Conf | — | Y | maybe | — |
| COL-0406 | TABLE-043 | balaghat.balagh_assignment_histories | assigned_at | Assignment time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0407 | TABLE-043 | balaghat.balagh_assignment_histories | staff_profile_id | Assigned staff profile | uuid | NOT NULL | — | — | identity.staff_profiles.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0408 | TABLE-043 | balaghat.balagh_assignment_histories | changed_at | Change occurrence time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0409 | TABLE-043 | balaghat.balagh_assignment_histories | changed_by_staff_profile_id | Actor who performed change | uuid | NULL | — | — | identity.staff_profiles.id | — | — | Y | Conf | — | Y | maybe | — |
| COL-0410 | TABLE-043 | balaghat.balagh_assignment_histories | reason | Change reason | text | NULL | — | — | — | — | — | Y | Conf | — | Y | — | — |
| COL-0411 | TABLE-043 | balaghat.balagh_assignment_histories | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0412 | TABLE-043 | balaghat.balagh_assignment_histories | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |

### TABLE-044 — `balaghat.balagh_completion_requests`

**Purpose:** balaghs completion cycle request

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0413 | TABLE-044 | balaghat.balagh_completion_requests | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0414 | TABLE-044 | balaghat.balagh_completion_requests | balagh_id | Parent case | uuid | NOT NULL | — | — | balaghat.balaghs.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0415 | TABLE-044 | balaghat.balagh_completion_requests | request_text | Completion request text | text | NULL | — | — | — | — | — | Y | Conf | — | Y | — | — |
| COL-0416 | TABLE-044 | balaghat.balagh_completion_requests | requested_at | Request time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0417 | TABLE-044 | balaghat.balagh_completion_requests | requested_by_staff_profile_id | Requesting staff | uuid | NULL | — | — | identity.staff_profiles.id | — | — | Y | Conf | — | Y | — | — |
| COL-0418 | TABLE-044 | balaghat.balagh_completion_requests | status_code | Cycle status code | text | NOT NULL | — | — | — | — | — | N | Conf | — | Y | maybe | — |
| COL-0419 | TABLE-044 | balaghat.balagh_completion_requests | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0420 | TABLE-044 | balaghat.balagh_completion_requests | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-045 — `balaghat.balagh_completion_responses`

**Purpose:** balaghs completion cycle response

**Notes:** UNIQUE completion_request_id PROPOSED.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0421 | TABLE-045 | balaghat.balagh_completion_responses | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0422 | TABLE-045 | balaghat.balagh_completion_responses | completion_request_id | Parent completion request | uuid | NOT NULL | — | — | balaghat.balagh_completion_requests.id | UNIQUE PROPOSED | — | Y | Conf | — | Y | UNIQUE | — |
| COL-0423 | TABLE-045 | balaghat.balagh_completion_responses | response_text | Response text | text | NULL | — | — | — | — | — | Y | Conf | — | Y | — | — |
| COL-0424 | TABLE-045 | balaghat.balagh_completion_responses | responded_at | Response time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0425 | TABLE-045 | balaghat.balagh_completion_responses | responded_by_profile_id | Responding actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | — | — |
| COL-0426 | TABLE-045 | balaghat.balagh_completion_responses | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0427 | TABLE-045 | balaghat.balagh_completion_responses | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-046 — `balaghat.balagh_decision_records`

**Purpose:** balaghs decision record with embedded decision value

**Notes:** 0..1 per case PROPOSED. Never overwrite; revisions additive. DMOD-14.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0428 | TABLE-046 | balaghat.balagh_decision_records | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | DM-07 |
| COL-0429 | TABLE-046 | balaghat.balagh_decision_records | balagh_id | Parent case | uuid | NOT NULL | — | — | balaghat.balaghs.id | UNIQUE PROPOSED | — | Y | HS | — | Y | UNIQUE | — |
| COL-0430 | TABLE-046 | balaghat.balagh_decision_records | outcome_code | Decision outcome code | text | NOT NULL | — | — | — | — | — | Y | HS | — | Y | Y | — |
| COL-0431 | TABLE-046 | balaghat.balagh_decision_records | decision_summary | Decision summary | text | NULL | — | — | — | — | — | Y | HS | mask | Y | — | — |
| COL-0432 | TABLE-046 | balaghat.balagh_decision_records | basis_text | Decision basis | text | NULL | — | — | — | — | — | Y | HS | mask | Y | — | — |
| COL-0433 | TABLE-046 | balaghat.balagh_decision_records | decided_at | Decision time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0434 | TABLE-046 | balaghat.balagh_decision_records | decided_by_staff_profile_id | Deciding staff | uuid | NULL | — | — | identity.staff_profiles.id | — | — | Y | Conf | — | Y | — | — |
| COL-0435 | TABLE-046 | balaghat.balagh_decision_records | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0436 | TABLE-046 | balaghat.balagh_decision_records | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0437 | TABLE-046 | balaghat.balagh_decision_records | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-047 — `balaghat.balagh_decision_revisions`

**Purpose:** Append-only balaghs decision revision

**Notes:** DMOD-14 يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0438 | TABLE-047 | balaghat.balagh_decision_revisions | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | — |
| COL-0439 | TABLE-047 | balaghat.balagh_decision_revisions | decision_record_id | Parent decision record | uuid | NOT NULL | — | — | balaghat.balagh_decision_records.id | — | — | Y | HS | — | Y | Y | — |
| COL-0440 | TABLE-047 | balaghat.balagh_decision_revisions | revision_number | Revision sequence | integer | NOT NULL | — | — | — | — | revision_number >= 1 PROPOSED | Y | Int | — | Y | — | — |
| COL-0441 | TABLE-047 | balaghat.balagh_decision_revisions | revised_outcome_code | Revised outcome code | text | NULL | — | — | — | — | — | Y | HS | — | Y | — | — |
| COL-0442 | TABLE-047 | balaghat.balagh_decision_revisions | revision_summary | Revision summary | text | NULL | — | — | — | — | — | Y | HS | mask | Y | — | — |
| COL-0443 | TABLE-047 | balaghat.balagh_decision_revisions | revised_at | Revision time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0444 | TABLE-047 | balaghat.balagh_decision_revisions | revised_by_staff_profile_id | Revising staff | uuid | NULL | — | — | identity.staff_profiles.id | — | — | Y | Conf | — | Y | — | — |
| COL-0445 | TABLE-047 | balaghat.balagh_decision_revisions | reason | Revision reason | text | NULL | — | — | — | — | — | Y | Conf | — | Y | — | — |
| COL-0446 | TABLE-047 | balaghat.balagh_decision_revisions | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0447 | TABLE-047 | balaghat.balagh_decision_revisions | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |

### TABLE-048 — `balaghat.balagh_close_archive_records`

**Purpose:** balaghs close or archive event

**Notes:** Closed vs archived semantics DMOD-01 يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0448 | TABLE-048 | balaghat.balagh_close_archive_records | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0449 | TABLE-048 | balaghat.balagh_close_archive_records | balagh_id | Parent case | uuid | NOT NULL | — | — | balaghat.balaghs.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0450 | TABLE-048 | balaghat.balagh_close_archive_records | action_code | Close or archive action code | text | NOT NULL | — | — | — | — | — | Y | Conf | — | Y | — | DMOD-01 |
| COL-0451 | TABLE-048 | balaghat.balagh_close_archive_records | reason | Action reason | text | NULL | — | — | — | — | — | Y | Conf | — | Y | — | — |
| COL-0452 | TABLE-048 | balaghat.balagh_close_archive_records | acted_at | Action time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0453 | TABLE-048 | balaghat.balagh_close_archive_records | acted_by_staff_profile_id | Acting staff | uuid | NULL | — | — | identity.staff_profiles.id | — | — | Y | Conf | — | Y | — | — |
| COL-0454 | TABLE-048 | balaghat.balagh_close_archive_records | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0455 | TABLE-048 | balaghat.balagh_close_archive_records | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |

### TABLE-049 — `balaghat.balagh_reopen_records`

**Purpose:** balaghs reopen event

**Notes:** Reopen authority DMOD-11 يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0456 | TABLE-049 | balaghat.balagh_reopen_records | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0457 | TABLE-049 | balaghat.balagh_reopen_records | balagh_id | Parent case | uuid | NOT NULL | — | — | balaghat.balaghs.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0458 | TABLE-049 | balaghat.balagh_reopen_records | reason | Reopen reason | text | NULL | — | — | — | — | — | Y | Conf | — | Y | — | — |
| COL-0459 | TABLE-049 | balaghat.balagh_reopen_records | reopened_at | Reopen time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0460 | TABLE-049 | balaghat.balagh_reopen_records | reopened_by_staff_profile_id | Reopening staff | uuid | NULL | — | — | identity.staff_profiles.id | — | — | Y | Conf | — | Y | — | DMOD-11 |
| COL-0461 | TABLE-049 | balaghat.balagh_reopen_records | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0462 | TABLE-049 | balaghat.balagh_reopen_records | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |

### TABLE-050 — `visits.field_visits`

**Purpose:** Field visit root

**Notes:** Exactly one of service_request_id / balagh_id PROPOSED app+CHK (DMOD-08).

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0463 | TABLE-050 | visits.field_visits | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0464 | TABLE-050 | visits.field_visits | public_ref | Public business reference | text | NULL | — | — | — | UNIQUE NULLS DISTINCT PROPOSED | — | Y when issued | Conf | mask list | Y | UNIQUE | DM-01 |
| COL-0465 | TABLE-050 | visits.field_visits | service_request_id | Request context | uuid | NULL | — | — | requests.service_requests.id | — | — | Y when set | Conf | — | Y | Y | DMOD-08 |
| COL-0466 | TABLE-050 | visits.field_visits | balagh_id | Balagh context | uuid | NULL | — | — | balaghat.balaghs.id | — | — | Y when set | Conf | — | Y | Y | DMOD-08 |
| COL-0467 | TABLE-050 | visits.field_visits | status_code | Visit status code | text | NOT NULL | — | — | — | — | — | N | Conf | — | Y | Y | — |
| COL-0468 | TABLE-050 | visits.field_visits | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0469 | TABLE-050 | visits.field_visits | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0470 | TABLE-050 | visits.field_visits | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0471 | TABLE-050 | visits.field_visits | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |
| COL-0472 | TABLE-050 | visits.field_visits | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0473 | TABLE-050 | visits.field_visits | archived_at | Soft-archive timestamp | timestamptz | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | — |

### TABLE-051 — `visits.visit_schedules`

**Purpose:** Visit schedule child

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0474 | TABLE-051 | visits.visit_schedules | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0475 | TABLE-051 | visits.visit_schedules | field_visit_id | Parent field visit | uuid | NOT NULL | — | — | visits.field_visits.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0476 | TABLE-051 | visits.visit_schedules | scheduled_start_at | Scheduled start | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | maybe | — |
| COL-0477 | TABLE-051 | visits.visit_schedules | scheduled_end_at | Scheduled end | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0478 | TABLE-051 | visits.visit_schedules | schedule_status_code | Schedule status | text | NOT NULL | — | — | — | — | — | N | Conf | — | Y | maybe | — |
| COL-0479 | TABLE-051 | visits.visit_schedules | revision_number | Schedule revision number | integer | NOT NULL | — | — | — | — | revision_number >= 1 PROPOSED | Y | Int | — | Y | — | — |
| COL-0480 | TABLE-051 | visits.visit_schedules | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0481 | TABLE-051 | visits.visit_schedules | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0482 | TABLE-051 | visits.visit_schedules | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0483 | TABLE-051 | visits.visit_schedules | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |
| COL-0484 | TABLE-051 | visits.visit_schedules | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-052 — `visits.visit_team_members`

**Purpose:** Visit team membership

**Notes:** DM-08 masking يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0485 | TABLE-052 | visits.visit_team_members | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0486 | TABLE-052 | visits.visit_team_members | field_visit_id | Parent field visit | uuid | NOT NULL | — | — | visits.field_visits.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0487 | TABLE-052 | visits.visit_team_members | staff_profile_id | Team staff profile | uuid | NOT NULL | — | — | identity.staff_profiles.id | — | — | Y | Conf | — | Y | Y | DM-08 |
| COL-0488 | TABLE-052 | visits.visit_team_members | role_on_visit | Role on visit | text | NULL | — | — | — | — | — | N | Conf | — | Y | — | — |
| COL-0489 | TABLE-052 | visits.visit_team_members | effective_from | Membership start | timestamptz | NOT NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0490 | TABLE-052 | visits.visit_team_members | effective_to | Membership end | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0491 | TABLE-052 | visits.visit_team_members | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0492 | TABLE-052 | visits.visit_team_members | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0493 | TABLE-052 | visits.visit_team_members | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-053 — `visits.visit_results`

**Purpose:** Visit result

**Notes:** UNIQUE field_visit_id PROPOSED. Result structure يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0494 | TABLE-053 | visits.visit_results | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | — |
| COL-0495 | TABLE-053 | visits.visit_results | field_visit_id | Parent field visit | uuid | NOT NULL | — | — | visits.field_visits.id | UNIQUE PROPOSED | — | Y | HS | — | Y | UNIQUE | — |
| COL-0496 | TABLE-053 | visits.visit_results | result_summary | Result summary | text | NULL | — | — | — | — | — | N | HS | mask | Y | — | — |
| COL-0497 | TABLE-053 | visits.visit_results | result_code | Result code | text | NULL | — | — | — | — | — | N | HS | — | Y | maybe | — |
| COL-0498 | TABLE-053 | visits.visit_results | recorded_at | Result recorded time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0499 | TABLE-053 | visits.visit_results | recorded_by_staff_profile_id | Recording staff | uuid | NULL | — | — | identity.staff_profiles.id | — | — | Y | Conf | — | Y | — | — |
| COL-0500 | TABLE-053 | visits.visit_results | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0501 | TABLE-053 | visits.visit_results | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0502 | TABLE-053 | visits.visit_results | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0503 | TABLE-053 | visits.visit_results | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |
| COL-0504 | TABLE-053 | visits.visit_results | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-054 — `visits.visit_result_corrections`

**Purpose:** Append-only visit result correction

**Notes:** DMOD-15 يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0505 | TABLE-054 | visits.visit_result_corrections | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | — |
| COL-0506 | TABLE-054 | visits.visit_result_corrections | visit_result_id | Parent visit result | uuid | NOT NULL | — | — | visits.visit_results.id | — | — | Y | HS | — | Y | Y | — |
| COL-0507 | TABLE-054 | visits.visit_result_corrections | correction_summary | Correction summary | text | NULL | — | — | — | — | — | Y | HS | mask | Y | — | — |
| COL-0508 | TABLE-054 | visits.visit_result_corrections | corrected_at | Correction time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0509 | TABLE-054 | visits.visit_result_corrections | corrected_by_staff_profile_id | Correcting staff | uuid | NULL | — | — | identity.staff_profiles.id | — | — | Y | Conf | — | Y | — | DMOD-15 |
| COL-0510 | TABLE-054 | visits.visit_result_corrections | reason | Correction reason | text | NULL | — | — | — | — | — | Y | Conf | — | Y | — | — |
| COL-0511 | TABLE-054 | visits.visit_result_corrections | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0512 | TABLE-054 | visits.visit_result_corrections | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |

### TABLE-055 — `visits.visit_evidences`

**Purpose:** Visit evidence link

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0513 | TABLE-055 | visits.visit_evidences | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | — |
| COL-0514 | TABLE-055 | visits.visit_evidences | field_visit_id | Parent field visit | uuid | NOT NULL | — | — | visits.field_visits.id | — | — | Y | HS | — | Y | Y | — |
| COL-0515 | TABLE-055 | visits.visit_evidences | attachment_id | Linked attachment | uuid | NOT NULL | — | — | files.attachments.id | — | — | Y | HS | — | Y | Y | — |
| COL-0516 | TABLE-055 | visits.visit_evidences | evidence_role_code | Evidence role code | text | NULL | — | — | — | — | — | N | HS | — | Y | — | — |
| COL-0517 | TABLE-055 | visits.visit_evidences | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0518 | TABLE-055 | visits.visit_evidences | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0519 | TABLE-055 | visits.visit_evidences | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-056 — `dues.payment_dues`

**Purpose:** Payment due root

**Notes:** No gateway/provider/settlement columns. REL-069: no fixed Due–Receipt FK (DM-22 يحتاج اعتماد لاحق).

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0520 | TABLE-056 | dues.payment_dues | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | — |
| COL-0521 | TABLE-056 | dues.payment_dues | public_ref | Public business reference | text | NULL | — | — | — | UNIQUE NULLS DISTINCT PROPOSED | — | Y when issued | Conf | mask list | Y | UNIQUE | DM-01 |
| COL-0522 | TABLE-056 | dues.payment_dues | service_request_id | Optional request context | uuid | NULL | — | — | requests.service_requests.id | — | — | Y when set | Conf | — | Y | Y | DM-09 |
| COL-0523 | TABLE-056 | dues.payment_dues | balagh_id | Optional balagh context | uuid | NULL | — | — | balaghat.balaghs.id | — | — | Y when set | Conf | — | Y | Y | DM-09 |
| COL-0524 | TABLE-056 | dues.payment_dues | amount | Monetary amount | numeric(18,2) | NOT NULL | — | — | — | — | amount >= 0 PROPOSED | N | HS | mask | Y | — | DM-09; rounding ownership يحتاج اعتماد لاحق; no float |
| COL-0525 | TABLE-056 | dues.payment_dues | currency_code | Currency code | text | NOT NULL | — | — | — | — | — | N | Conf | — | Y | maybe | DM-09; no float money types |
| COL-0526 | TABLE-056 | dues.payment_dues | status_code | Due status code | text | NOT NULL | — | — | — | — | — | N | HS | — | Y | Y | DM-09 |
| COL-0527 | TABLE-056 | dues.payment_dues | assessed_at | Assessment time | timestamptz | NULL | — | — | — | — | — | Y when set | Int | — | Y | — | — |
| COL-0528 | TABLE-056 | dues.payment_dues | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0529 | TABLE-056 | dues.payment_dues | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0530 | TABLE-056 | dues.payment_dues | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0531 | TABLE-056 | dues.payment_dues | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |
| COL-0532 | TABLE-056 | dues.payment_dues | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0533 | TABLE-056 | dues.payment_dues | archived_at | Soft-archive timestamp | timestamptz | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | — |

### TABLE-057 — `dues.due_basis_document_references`

**Purpose:** Due basis document reference

**Notes:** App enforces ≥1 basis per due.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0534 | TABLE-057 | dues.due_basis_document_references | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | — |
| COL-0535 | TABLE-057 | dues.due_basis_document_references | payment_due_id | Parent payment due | uuid | NOT NULL | — | — | dues.payment_dues.id | — | — | Y | HS | — | Y | Y | — |
| COL-0536 | TABLE-057 | dues.due_basis_document_references | document_reference | Document or attachment reference | text | NULL | — | — | — | — | — | Y | HS | — | Y | — | — |
| COL-0537 | TABLE-057 | dues.due_basis_document_references | attachment_id | Optional attachment | uuid | NULL | — | — | files.attachments.id | — | — | Y when set | HS | — | Y | maybe | — |
| COL-0538 | TABLE-057 | dues.due_basis_document_references | basis_type_code | Basis type code | text | NOT NULL | — | — | — | — | — | N | HS | — | Y | — | — |
| COL-0539 | TABLE-057 | dues.due_basis_document_references | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0540 | TABLE-057 | dues.due_basis_document_references | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0541 | TABLE-057 | dues.due_basis_document_references | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-058 — `dues.due_corrections`

**Purpose:** Append-only due correction

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0542 | TABLE-058 | dues.due_corrections | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | — |
| COL-0543 | TABLE-058 | dues.due_corrections | payment_due_id | Parent payment due | uuid | NOT NULL | — | — | dues.payment_dues.id | — | — | Y | HS | — | Y | Y | — |
| COL-0544 | TABLE-058 | dues.due_corrections | prior_amount | Prior amount | numeric(18,2) | NOT NULL | — | — | — | — | prior_amount >= 0 PROPOSED | N | HS | mask | Y | — | DM-09; rounding ownership يحتاج اعتماد لاحق; no float |
| COL-0545 | TABLE-058 | dues.due_corrections | new_amount | Corrected amount | numeric(18,2) | NOT NULL | — | — | — | — | new_amount >= 0 PROPOSED | N | HS | mask | Y | — | DM-09; rounding ownership يحتاج اعتماد لاحق; no float |
| COL-0546 | TABLE-058 | dues.due_corrections | currency_code | Currency code | text | NOT NULL | — | — | — | — | — | N | Conf | — | Y | maybe | DM-09; no float money types |
| COL-0547 | TABLE-058 | dues.due_corrections | reason | Correction reason | text | NULL | — | — | — | — | — | Y | Conf | — | Y | — | — |
| COL-0548 | TABLE-058 | dues.due_corrections | corrected_at | Correction time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0549 | TABLE-058 | dues.due_corrections | corrected_by_staff_profile_id | Correcting staff | uuid | NULL | — | — | identity.staff_profiles.id | — | — | Y | Conf | — | Y | — | — |
| COL-0550 | TABLE-058 | dues.due_corrections | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0551 | TABLE-058 | dues.due_corrections | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |

### TABLE-059 — `dues.payment_notices`

**Purpose:** Payment notice

**Notes:** May trigger notification; no gateway.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0552 | TABLE-059 | dues.payment_notices | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | — |
| COL-0553 | TABLE-059 | dues.payment_notices | public_ref | Public business reference | text | NULL | — | — | — | UNIQUE NULLS DISTINCT PROPOSED | — | Y when issued | Conf | mask list | Y | UNIQUE | DM-01 |
| COL-0554 | TABLE-059 | dues.payment_notices | payment_due_id | Related payment due | uuid | NOT NULL | — | — | dues.payment_dues.id | — | — | Y | HS | — | Y | Y | — |
| COL-0555 | TABLE-059 | dues.payment_notices | notice_status_code | Notice status | text | NOT NULL | — | — | — | — | — | N | Conf | — | Y | Y | — |
| COL-0556 | TABLE-059 | dues.payment_notices | issued_at | Issue time | timestamptz | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | — |
| COL-0557 | TABLE-059 | dues.payment_notices | notice_amount | Notice amount | numeric(18,2) | NOT NULL | — | — | — | — | notice_amount >= 0 PROPOSED | N | HS | mask | Y | — | DM-09; rounding ownership يحتاج اعتماد لاحق; no float |
| COL-0558 | TABLE-059 | dues.payment_notices | currency_code | Currency code | text | NOT NULL | — | — | — | — | — | N | Conf | — | Y | maybe | DM-09; no float money types |
| COL-0559 | TABLE-059 | dues.payment_notices | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0560 | TABLE-059 | dues.payment_notices | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0561 | TABLE-059 | dues.payment_notices | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0562 | TABLE-059 | dues.payment_notices | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |
| COL-0563 | TABLE-059 | dues.payment_notices | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-060 — `dues.payment_receipts`

**Purpose:** Payment receipt root

**Notes:** No gateway fields. No fixed Due FK (REL-069). No due_receipt_links table pending DM-22.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0564 | TABLE-060 | dues.payment_receipts | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | — |
| COL-0565 | TABLE-060 | dues.payment_receipts | public_ref | Public business reference | text | NULL | — | — | — | UNIQUE NULLS DISTINCT PROPOSED | — | Y when issued | Conf | mask list | Y | UNIQUE | DM-01 |
| COL-0566 | TABLE-060 | dues.payment_receipts | amount | Monetary amount | numeric(18,2) | NOT NULL | — | — | — | — | amount >= 0 PROPOSED | N | HS | mask | Y | — | DM-09; rounding ownership يحتاج اعتماد لاحق; no float |
| COL-0567 | TABLE-060 | dues.payment_receipts | currency_code | Currency code | text | NOT NULL | — | — | — | — | — | N | Conf | — | Y | maybe | DM-09; no float money types |
| COL-0568 | TABLE-060 | dues.payment_receipts | acceptance_status_code | Acceptance status | text | NOT NULL | — | — | — | — | — | N | HS | — | Y | Y | DM-09 |
| COL-0569 | TABLE-060 | dues.payment_receipts | received_at | Received time | timestamptz | NULL | — | — | — | — | — | Y when set | Int | — | Y | — | — |
| COL-0570 | TABLE-060 | dues.payment_receipts | replaces_receipt_id | Replacement lineage | uuid | NULL | — | — | dues.payment_receipts.id | — | — | Y when set | HS | — | Y | maybe | DM-22 |
| COL-0571 | TABLE-060 | dues.payment_receipts | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0572 | TABLE-060 | dues.payment_receipts | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0573 | TABLE-060 | dues.payment_receipts | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0574 | TABLE-060 | dues.payment_receipts | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |
| COL-0575 | TABLE-060 | dues.payment_receipts | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-061 — `dues.receipt_correction_replacements`

**Purpose:** Receipt correction or replacement lineage

**Notes:** DM-22 يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0576 | TABLE-061 | dues.receipt_correction_replacements | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | — |
| COL-0577 | TABLE-061 | dues.receipt_correction_replacements | payment_receipt_id | Subject receipt | uuid | NOT NULL | — | — | dues.payment_receipts.id | — | — | Y | HS | — | Y | Y | — |
| COL-0578 | TABLE-061 | dues.receipt_correction_replacements | replaces_receipt_id | Optional replaced receipt | uuid | NULL | — | — | dues.payment_receipts.id | — | — | Y when set | HS | — | Y | maybe | DM-22 |
| COL-0579 | TABLE-061 | dues.receipt_correction_replacements | correction_reason | Correction or replacement reason | text | NULL | — | — | — | — | — | Y | Conf | — | Y | — | — |
| COL-0580 | TABLE-061 | dues.receipt_correction_replacements | acted_at | Action time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0581 | TABLE-061 | dues.receipt_correction_replacements | acted_by_staff_profile_id | Acting staff | uuid | NULL | — | — | identity.staff_profiles.id | — | — | Y | Conf | — | Y | — | — |
| COL-0582 | TABLE-061 | dues.receipt_correction_replacements | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0583 | TABLE-061 | dues.receipt_correction_replacements | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |

### TABLE-062 — `dues.payment_confirmations`

**Purpose:** Payment confirmation

**Notes:** Requires accepted receipt; not final case approval.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0584 | TABLE-062 | dues.payment_confirmations | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | — |
| COL-0585 | TABLE-062 | dues.payment_confirmations | payment_receipt_id | Accepted receipt | uuid | NOT NULL | — | — | dues.payment_receipts.id | — | — | Y | HS | — | Y | Y | — |
| COL-0586 | TABLE-062 | dues.payment_confirmations | outcome_code | Confirmation outcome | text | NOT NULL | — | — | — | — | — | Y | HS | — | Y | — | DM-09 |
| COL-0587 | TABLE-062 | dues.payment_confirmations | confirmed_at | Confirmation time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0588 | TABLE-062 | dues.payment_confirmations | confirmed_by_profile_id | Confirming actor | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | — | — |
| COL-0589 | TABLE-062 | dues.payment_confirmations | amount_confirmed | Optional confirmed amount | numeric(18,2) | NULL | — | — | — | — | amount_confirmed >= 0 PROPOSED | Y when set | HS | mask | Y | — | DM-09; rounding ownership يحتاج اعتماد لاحق; no float |
| COL-0590 | TABLE-062 | dues.payment_confirmations | currency_code | Currency code | text | NULL | — | — | — | — | — | Y when set | Conf | — | Y | — | DM-09; no float money types |
| COL-0591 | TABLE-062 | dues.payment_confirmations | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0592 | TABLE-062 | dues.payment_confirmations | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0593 | TABLE-062 | dues.payment_confirmations | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-063 — `files.attachments`

**Purpose:** Attachment metadata with access classification columns

**Notes:** Access classification is COLUMN not table. Transaction attachments private by default.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0594 | TABLE-063 | files.attachments | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | — |
| COL-0595 | TABLE-063 | files.attachments | logical_file_size_bytes | Logical file size bytes | bigint | NOT NULL | — | — | — | — | logical_file_size_bytes >= 0 PROPOSED | N | HS | — | Y | — | DM-26 |
| COL-0596 | TABLE-063 | files.attachments | media_content_class_code | Media content class | text | NOT NULL | — | — | — | — | — | N | HS | — | Y | maybe | DM-10 |
| COL-0597 | TABLE-063 | files.attachments | access_classification_code | Access classification | text | NOT NULL | — | — | — | — | — | N | HS | — | Y | Y | DM-10 |
| COL-0598 | TABLE-063 | files.attachments | storage_accounting_category_code | Storage accounting category | text | NOT NULL | — | — | — | — | — | N | HS | — | Y | maybe | DM-26 |
| COL-0599 | TABLE-063 | files.attachments | storage_object_path | Storage object path | text | NULL | — | — | — | — | — | N | HS | — | Y | maybe | DM-26 |
| COL-0600 | TABLE-063 | files.attachments | storage_object_id | Storage object id | text | NULL | — | — | — | — | — | N | HS | — | Y | maybe | DM-26 |
| COL-0601 | TABLE-063 | files.attachments | version_number | Version number | integer | NOT NULL | 1 PROPOSED | — | — | — | version_number >= 1 PROPOSED | N | Int | — | Y | — | — |
| COL-0602 | TABLE-063 | files.attachments | is_current_version | Current version flag | boolean | NOT NULL | true PROPOSED | — | — | — | — | N | Int | — | Y | Y | — |
| COL-0603 | TABLE-063 | files.attachments | storage_status_code | Storage status | text | NOT NULL | — | — | — | — | — | N | HS | — | Y | maybe | DM-26 |
| COL-0604 | TABLE-063 | files.attachments | deletion_retention_status_code | Deletion or retention status | text | NOT NULL | — | — | — | — | — | N | HS | — | Y | maybe | DMOD-09 |
| COL-0605 | TABLE-063 | files.attachments | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0606 | TABLE-063 | files.attachments | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0607 | TABLE-063 | files.attachments | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0608 | TABLE-063 | files.attachments | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |
| COL-0609 | TABLE-063 | files.attachments | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-064 — `files.attachment_links`

**Purpose:** Polymorphic attachment to owner link

**Notes:** owner_type + owner_id polymorphic; NestJS validates. Link ≠ authorization.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0610 | TABLE-064 | files.attachment_links | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | — |
| COL-0611 | TABLE-064 | files.attachment_links | attachment_id | Linked attachment | uuid | NOT NULL | — | — | files.attachments.id | — | — | Y | HS | — | Y | Y | — |
| COL-0612 | TABLE-064 | files.attachment_links | owner_type | Owner type discriminator | text | NOT NULL | — | — | — | — | — | Y | HS | — | Y | Y | — |
| COL-0613 | TABLE-064 | files.attachment_links | owner_id | Owner identity | uuid | NOT NULL | — | — | — | — | — | Y | HS | — | Y | Y | — |
| COL-0614 | TABLE-064 | files.attachment_links | link_role_code | Link role code | text | NULL | — | — | — | — | — | N | HS | — | Y | — | — |
| COL-0615 | TABLE-064 | files.attachment_links | linked_at | Link time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0616 | TABLE-064 | files.attachment_links | unlinked_at | Unlink time | timestamptz | NULL | — | — | — | — | — | Y when set | Int | — | Y | — | — |
| COL-0617 | TABLE-064 | files.attachment_links | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0618 | TABLE-064 | files.attachment_links | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0619 | TABLE-064 | files.attachment_links | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-065 — `files.attachment_version_histories`

**Purpose:** Append-only attachment version history

**Notes:** DMOD-09 retention يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0620 | TABLE-065 | files.attachment_version_histories | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | — |
| COL-0621 | TABLE-065 | files.attachment_version_histories | attachment_id | Parent attachment | uuid | NOT NULL | — | — | files.attachments.id | — | — | Y | HS | — | Y | Y | — |
| COL-0622 | TABLE-065 | files.attachment_version_histories | version_number | Version number | integer | NOT NULL | — | — | — | — | version_number >= 1 PROPOSED | Y | Int | — | Y | — | — |
| COL-0623 | TABLE-065 | files.attachment_version_histories | storage_object_path | Version storage path | text | NULL | — | — | — | — | — | Y | HS | — | Y | — | — |
| COL-0624 | TABLE-065 | files.attachment_version_histories | storage_object_id | Version storage object id | text | NULL | — | — | — | — | — | Y | HS | — | Y | — | — |
| COL-0625 | TABLE-065 | files.attachment_version_histories | changed_at | Version change time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0626 | TABLE-065 | files.attachment_version_histories | changed_by_profile_id | Changing actor | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | — | — |
| COL-0627 | TABLE-065 | files.attachment_version_histories | reason | Version change reason | text | NULL | — | — | — | — | — | Y | Conf | — | Y | — | — |
| COL-0628 | TABLE-065 | files.attachment_version_histories | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0629 | TABLE-065 | files.attachment_version_histories | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |

### TABLE-066 — `notify.notification_messages`

**Purpose:** Notification message root

**Notes:** Delivery never decides business outcome. OTP minimize DM-11 يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0630 | TABLE-066 | notify.notification_messages | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0631 | TABLE-066 | notify.notification_messages | service_request_id | Optional request context | uuid | NULL | — | — | requests.service_requests.id | — | — | Y when set | Conf | — | Y | maybe | — |
| COL-0632 | TABLE-066 | notify.notification_messages | balagh_id | Optional balagh context | uuid | NULL | — | — | balaghat.balaghs.id | — | — | Y when set | Conf | — | Y | maybe | — |
| COL-0633 | TABLE-066 | notify.notification_messages | payment_notice_id | Optional payment notice | uuid | NULL | — | — | dues.payment_notices.id | — | — | Y when set | Conf | — | Y | maybe | — |
| COL-0634 | TABLE-066 | notify.notification_messages | template_id | Notification template | uuid | NULL | — | — | notify.notification_templates.id | — | — | Y when set | Int | — | Y | — | — |
| COL-0635 | TABLE-066 | notify.notification_messages | channel_config_id | Channel configuration | uuid | NULL | — | — | notify.notification_channel_configurations.id | — | — | Y when set | Int | — | Y | — | DM-25 |
| COL-0636 | TABLE-066 | notify.notification_messages | delivery_status_code | Delivery status | text | NOT NULL | — | — | — | — | — | N | Conf | — | Y | Y | DM-11 |
| COL-0637 | TABLE-066 | notify.notification_messages | recipient_profile_id | Intended recipient profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y when set | Conf | — | Y | Y | — |
| COL-0638 | TABLE-066 | notify.notification_messages | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0639 | TABLE-066 | notify.notification_messages | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0640 | TABLE-066 | notify.notification_messages | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0641 | TABLE-066 | notify.notification_messages | idempotency_key | Dedup key | text | NULL | — | — | — | scoped UNIQUE PROPOSED | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-067 — `notify.delivery_attempts`

**Purpose:** Append-only delivery attempt

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0642 | TABLE-067 | notify.delivery_attempts | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0643 | TABLE-067 | notify.delivery_attempts | notification_message_id | Parent notification message | uuid | NOT NULL | — | — | notify.notification_messages.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0644 | TABLE-067 | notify.delivery_attempts | attempt_number | Attempt sequence | integer | NOT NULL | — | — | — | — | attempt_number >= 1 PROPOSED | Y | Int | — | Y | — | — |
| COL-0645 | TABLE-067 | notify.delivery_attempts | attempt_status_code | Attempt outcome status | text | NOT NULL | — | — | — | — | — | Y | Conf | — | Y | Y | — |
| COL-0646 | TABLE-067 | notify.delivery_attempts | provider_reference | Safe provider reference | text | NULL | — | — | — | — | — | Y | Conf | — | Y | — | — |
| COL-0647 | TABLE-067 | notify.delivery_attempts | failure_reason_safe | Safe failure reason | text | NULL | — | — | — | — | — | Y | Conf | — | Y | — | — |
| COL-0648 | TABLE-067 | notify.delivery_attempts | attempted_at | Attempt time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0649 | TABLE-067 | notify.delivery_attempts | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0650 | TABLE-067 | notify.delivery_attempts | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |

### TABLE-068 — `notify.delivery_retries`

**Purpose:** Append-only delivery retry

**Notes:** Retry policy يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0651 | TABLE-068 | notify.delivery_retries | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0652 | TABLE-068 | notify.delivery_retries | delivery_attempt_id | Parent delivery attempt | uuid | NOT NULL | — | — | notify.delivery_attempts.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0653 | TABLE-068 | notify.delivery_retries | retry_number | Retry sequence | integer | NOT NULL | — | — | — | — | retry_number >= 1 PROPOSED | Y | Int | — | Y | — | — |
| COL-0654 | TABLE-068 | notify.delivery_retries | retry_status_code | Retry outcome status | text | NOT NULL | — | — | — | — | — | Y | Conf | — | Y | — | — |
| COL-0655 | TABLE-068 | notify.delivery_retries | scheduled_at | Scheduled retry time | timestamptz | NULL | — | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0656 | TABLE-068 | notify.delivery_retries | executed_at | Executed retry time | timestamptz | NULL | — | — | — | — | — | Y when set | Int | — | Y | — | — |
| COL-0657 | TABLE-068 | notify.delivery_retries | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0658 | TABLE-068 | notify.delivery_retries | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |

### TABLE-069 — `notify.notification_templates`

**Purpose:** Notification template catalogue

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0659 | TABLE-069 | notify.notification_templates | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Int | — | Y | PK | — |
| COL-0660 | TABLE-069 | notify.notification_templates | code | Template code | text | NOT NULL | — | — | — | UNIQUE | — | Y after issue PROPOSED | Int | — | Y | UNIQUE | — |
| COL-0661 | TABLE-069 | notify.notification_templates | name | Display name | text | NOT NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0662 | TABLE-069 | notify.notification_templates | channel_code | Default channel code | text | NOT NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0663 | TABLE-069 | notify.notification_templates | is_active | Catalogue active flag | boolean | NOT NULL | true PROPOSED | — | — | — | — | N | Int | — | Y | maybe | — |
| COL-0664 | TABLE-069 | notify.notification_templates | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0665 | TABLE-069 | notify.notification_templates | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0666 | TABLE-069 | notify.notification_templates | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0667 | TABLE-069 | notify.notification_templates | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |

### TABLE-070 — `notify.notification_channel_configurations`

**Purpose:** Notification channel configuration

**Notes:** Secrets never stored in DB documentation or application tables.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0668 | TABLE-070 | notify.notification_channel_configurations | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Int | — | Y | PK | — |
| COL-0669 | TABLE-070 | notify.notification_channel_configurations | channel_code | Channel code | text | NOT NULL | — | — | — | UNIQUE PROPOSED | — | Y after issue PROPOSED | Int | — | Y | UNIQUE | — |
| COL-0670 | TABLE-070 | notify.notification_channel_configurations | is_enabled | Enabled flag | boolean | NOT NULL | true PROPOSED | — | — | — | — | N | Int | — | Y | — | — |
| COL-0671 | TABLE-070 | notify.notification_channel_configurations | config_label | Non-secret config label | text | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0672 | TABLE-070 | notify.notification_channel_configurations | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0673 | TABLE-070 | notify.notification_channel_configurations | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0674 | TABLE-070 | notify.notification_channel_configurations | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0675 | TABLE-070 | notify.notification_channel_configurations | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |

### TABLE-071 — `notify.notification_read_states`

**Purpose:** Notification read state per recipient

**Notes:** DM-25 يحتاج اعتماد لاحق. Delivered may remain unread.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0676 | TABLE-071 | notify.notification_read_states | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | DM-25 |
| COL-0677 | TABLE-071 | notify.notification_read_states | notification_message_id | Parent message | uuid | NOT NULL | — | — | notify.notification_messages.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0678 | TABLE-071 | notify.notification_read_states | recipient_profile_id | Recipient profile | uuid | NOT NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | Y | DM-25 |
| COL-0679 | TABLE-071 | notify.notification_read_states | read_status_code | unread read or unknown | text | NOT NULL | — | — | — | — | — | N | Conf | — | Y | Y | DM-25 |
| COL-0680 | TABLE-071 | notify.notification_read_states | first_read_at | First read timestamp | timestamptz | NULL | — | — | — | — | — | Y once set PROPOSED | Conf | — | Y | maybe | DM-25 |
| COL-0681 | TABLE-071 | notify.notification_read_states | latest_acknowledged_at | Latest acknowledgement | timestamptz | NULL | — | — | — | — | — | N | Conf | — | Y | — | DM-25 |
| COL-0682 | TABLE-071 | notify.notification_read_states | read_source_channel_code | Read source channel | text | NULL | — | — | — | — | — | N | Int | — | Y | — | DM-25 |
| COL-0683 | TABLE-071 | notify.notification_read_states | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0684 | TABLE-071 | notify.notification_read_states | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |

### TABLE-072 — `notify.notification_outbox_messages`

**Purpose:** Notification delivery outbox

**Notes:** ADR-007 notification processing outbox. Distinct from audit.domain_event_outbox (TABLE-094).

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0685 | TABLE-072 | notify.notification_outbox_messages | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0686 | TABLE-072 | notify.notification_outbox_messages | notification_message_id | Related notification message | uuid | NULL | — | — | notify.notification_messages.id | — | — | Y when set | Conf | — | Y | Y | — |
| COL-0687 | TABLE-072 | notify.notification_outbox_messages | payload_ref | Minimized payload reference | text | NULL | — | — | — | — | — | Y | Conf | — | Y | — | — |
| COL-0688 | TABLE-072 | notify.notification_outbox_messages | publication_state | Outbox publication state | text | NOT NULL | — | — | — | — | — | N | Int | — | Y | Y | — |
| COL-0689 | TABLE-072 | notify.notification_outbox_messages | attempt_count | Processing attempt count | integer | NOT NULL | 0 PROPOSED | — | — | — | attempt_count >= 0 PROPOSED | N | Int | — | Y | — | — |
| COL-0690 | TABLE-072 | notify.notification_outbox_messages | last_error | Last safe error text | text | NULL | — | — | — | — | — | N | Conf | — | Y | — | — |
| COL-0691 | TABLE-072 | notify.notification_outbox_messages | next_attempt_at | Next attempt time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | maybe | — |
| COL-0692 | TABLE-072 | notify.notification_outbox_messages | published_at | Published time | timestamptz | NULL | — | — | — | — | — | Y when set | Int | — | Y | — | — |
| COL-0693 | TABLE-072 | notify.notification_outbox_messages | idempotency_key | Outbox idempotency key | text | NULL | — | — | — | scoped UNIQUE PROPOSED | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0694 | TABLE-072 | notify.notification_outbox_messages | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0695 | TABLE-072 | notify.notification_outbox_messages | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-073 — `imports.import_batches`

**Purpose:** Import batch root

**Notes:** DM-12 يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0696 | TABLE-073 | imports.import_batches | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0697 | TABLE-073 | imports.import_batches | public_ref | Public business reference | text | NULL | — | — | — | UNIQUE NULLS DISTINCT PROPOSED | — | Y when issued | Conf | mask list | Y | UNIQUE | DM-01 |
| COL-0698 | TABLE-073 | imports.import_batches | status_code | Batch status | text | NOT NULL | — | — | — | — | — | N | Conf | — | Y | Y | DM-12 |
| COL-0699 | TABLE-073 | imports.import_batches | source_label | Source label | text | NULL | — | — | — | — | — | N | Conf | — | Y | — | DM-12 |
| COL-0700 | TABLE-073 | imports.import_batches | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0701 | TABLE-073 | imports.import_batches | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0702 | TABLE-073 | imports.import_batches | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0703 | TABLE-073 | imports.import_batches | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |
| COL-0704 | TABLE-073 | imports.import_batches | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0705 | TABLE-073 | imports.import_batches | idempotency_key | Dedup key | text | NULL | — | — | — | scoped UNIQUE PROPOSED | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-074 — `imports.import_previews`

**Purpose:** Import preview record

**Notes:** Preview ≠ commit.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0706 | TABLE-074 | imports.import_previews | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | — |
| COL-0707 | TABLE-074 | imports.import_previews | import_batch_id | Parent import batch | uuid | NOT NULL | — | — | imports.import_batches.id | — | — | Y | HS | — | Y | Y | — |
| COL-0708 | TABLE-074 | imports.import_previews | preview_summary | Preview summary | text | NULL | — | — | — | — | — | Y | HS | mask | Y | — | — |
| COL-0709 | TABLE-074 | imports.import_previews | row_count_previewed | Previewed row count | integer | NULL | — | — | — | — | row_count_previewed >= 0 PROPOSED | Y | Int | — | Y | — | — |
| COL-0710 | TABLE-074 | imports.import_previews | previewed_at | Preview time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0711 | TABLE-074 | imports.import_previews | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0712 | TABLE-074 | imports.import_previews | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0713 | TABLE-074 | imports.import_previews | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-075 — `imports.import_validation_results`

**Purpose:** Import validation result

**Notes:** Validation precedes commit. Taxonomy يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0714 | TABLE-075 | imports.import_validation_results | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | — |
| COL-0715 | TABLE-075 | imports.import_validation_results | import_batch_id | Parent import batch | uuid | NOT NULL | — | — | imports.import_batches.id | — | — | Y | HS | — | Y | Y | — |
| COL-0716 | TABLE-075 | imports.import_validation_results | validation_status_code | Validation status | text | NOT NULL | — | — | — | — | — | Y | HS | — | Y | Y | — |
| COL-0717 | TABLE-075 | imports.import_validation_results | error_count | Error count | integer | NULL | — | — | — | — | error_count >= 0 PROPOSED | Y | Int | — | Y | — | — |
| COL-0718 | TABLE-075 | imports.import_validation_results | validated_at | Validation time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0719 | TABLE-075 | imports.import_validation_results | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0720 | TABLE-075 | imports.import_validation_results | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0721 | TABLE-075 | imports.import_validation_results | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-076 — `imports.import_row_results`

**Purpose:** Import row result

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0722 | TABLE-076 | imports.import_row_results | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | — |
| COL-0723 | TABLE-076 | imports.import_row_results | import_batch_id | Parent import batch | uuid | NOT NULL | — | — | imports.import_batches.id | — | — | Y | HS | — | Y | Y | — |
| COL-0724 | TABLE-076 | imports.import_row_results | row_number | Source row number | integer | NOT NULL | — | — | — | — | row_number >= 1 PROPOSED | Y | Int | — | Y | — | — |
| COL-0725 | TABLE-076 | imports.import_row_results | outcome_code | Row outcome code | text | NOT NULL | — | — | — | — | — | Y | HS | — | Y | maybe | — |
| COL-0726 | TABLE-076 | imports.import_row_results | target_ref | Target reference if applied | text | NULL | — | — | — | — | — | Y | HS | — | Y | — | — |
| COL-0727 | TABLE-076 | imports.import_row_results | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0728 | TABLE-076 | imports.import_row_results | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0729 | TABLE-076 | imports.import_row_results | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-077 — `imports.import_errors`

**Purpose:** Import error detail

**Notes:** Error taxonomy DM-12 يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0730 | TABLE-077 | imports.import_errors | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | HS | — | Y | PK | — |
| COL-0731 | TABLE-077 | imports.import_errors | import_row_result_id | Parent row result | uuid | NOT NULL | — | — | imports.import_row_results.id | — | — | Y | HS | — | Y | Y | — |
| COL-0732 | TABLE-077 | imports.import_errors | error_code | Error code | text | NOT NULL | — | — | — | — | — | Y | HS | — | Y | maybe | DM-12 |
| COL-0733 | TABLE-077 | imports.import_errors | error_detail | Error detail | text | NULL | — | — | — | — | — | Y | HS | mask | Y | — | — |
| COL-0734 | TABLE-077 | imports.import_errors | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0735 | TABLE-077 | imports.import_errors | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0736 | TABLE-077 | imports.import_errors | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-078 — `imports.import_approvals`

**Purpose:** Import approval record

**Notes:** SoD exceptions DMOD-13 يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0737 | TABLE-078 | imports.import_approvals | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | AR | — | Y | PK | — |
| COL-0738 | TABLE-078 | imports.import_approvals | import_batch_id | Parent import batch | uuid | NOT NULL | — | — | imports.import_batches.id | — | — | Y | AR | — | Y | Y | — |
| COL-0739 | TABLE-078 | imports.import_approvals | approved_at | Approval time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0740 | TABLE-078 | imports.import_approvals | approved_by_profile_id | Approving actor | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | AR | — | Y | — | — |
| COL-0741 | TABLE-078 | imports.import_approvals | reason | Approval reason | text | NULL | — | — | — | — | — | Y | AR | — | Y | — | — |
| COL-0742 | TABLE-078 | imports.import_approvals | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | AR | — | Y | — | — |
| COL-0743 | TABLE-078 | imports.import_approvals | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-079 — `imports.import_rejections`

**Purpose:** Import rejection record

**Notes:** Rejection blocks commit.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0744 | TABLE-079 | imports.import_rejections | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | AR | — | Y | PK | — |
| COL-0745 | TABLE-079 | imports.import_rejections | import_batch_id | Parent import batch | uuid | NOT NULL | — | — | imports.import_batches.id | — | — | Y | AR | — | Y | Y | — |
| COL-0746 | TABLE-079 | imports.import_rejections | rejected_at | Rejection time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0747 | TABLE-079 | imports.import_rejections | rejected_by_profile_id | Rejecting actor | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | AR | — | Y | — | — |
| COL-0748 | TABLE-079 | imports.import_rejections | reason | Rejection reason | text | NULL | — | — | — | — | — | Y | AR | — | Y | — | — |
| COL-0749 | TABLE-079 | imports.import_rejections | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | AR | — | Y | — | — |
| COL-0750 | TABLE-079 | imports.import_rejections | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-080 — `imports.import_failures`

**Purpose:** Import failure record

**Notes:** Distinct from rejection.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0751 | TABLE-080 | imports.import_failures | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | AR | — | Y | PK | — |
| COL-0752 | TABLE-080 | imports.import_failures | import_batch_id | Parent import batch | uuid | NOT NULL | — | — | imports.import_batches.id | — | — | Y | AR | — | Y | Y | — |
| COL-0753 | TABLE-080 | imports.import_failures | failed_at | Failure time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0754 | TABLE-080 | imports.import_failures | failure_code | Failure code | text | NOT NULL | — | — | — | — | — | Y | AR | — | Y | — | — |
| COL-0755 | TABLE-080 | imports.import_failures | failure_detail | Failure detail | text | NULL | — | — | — | — | — | Y | AR | mask | Y | — | — |
| COL-0756 | TABLE-080 | imports.import_failures | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | AR | — | Y | — | — |
| COL-0757 | TABLE-080 | imports.import_failures | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-081 — `imports.import_commits`

**Purpose:** Import commit record

**Notes:** UNIQUE import_batch_id PROPOSED. DM-20 يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0758 | TABLE-081 | imports.import_commits | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | AR | — | Y | PK | — |
| COL-0759 | TABLE-081 | imports.import_commits | import_batch_id | Parent import batch | uuid | NOT NULL | — | — | imports.import_batches.id | UNIQUE PROPOSED | — | Y | AR | — | Y | UNIQUE | — |
| COL-0760 | TABLE-081 | imports.import_commits | committed_at | Commit time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0761 | TABLE-081 | imports.import_commits | committed_by_profile_id | Committing actor | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | AR | — | Y | — | — |
| COL-0762 | TABLE-081 | imports.import_commits | idempotency_disposition | Idempotency disposition | text | NULL | — | — | — | — | — | Y | Int | — | Y | — | DM-20 |
| COL-0763 | TABLE-081 | imports.import_commits | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | AR | — | Y | — | — |
| COL-0764 | TABLE-081 | imports.import_commits | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-082 — `content.content_items`

**Purpose:** Content item root

**Notes:** DMOD-10 يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0765 | TABLE-082 | content.content_items | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Int | — | Y | PK | — |
| COL-0766 | TABLE-082 | content.content_items | public_ref | Public business reference | text | NULL | — | — | — | UNIQUE NULLS DISTINCT PROPOSED | — | Y when issued | Int | mask list | Y | UNIQUE | DM-01 |
| COL-0767 | TABLE-082 | content.content_items | title | Content title | text | NOT NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0768 | TABLE-082 | content.content_items | status_code | Lifecycle status | text | NOT NULL | — | — | — | — | — | N | Int | — | Y | Y | — |
| COL-0769 | TABLE-082 | content.content_items | content_type_code | Content type | text | NOT NULL | — | — | — | — | — | N | Int | — | Y | maybe | — |
| COL-0770 | TABLE-082 | content.content_items | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0771 | TABLE-082 | content.content_items | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0772 | TABLE-082 | content.content_items | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0773 | TABLE-082 | content.content_items | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |
| COL-0774 | TABLE-082 | content.content_items | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0775 | TABLE-082 | content.content_items | archived_at | Soft-archive timestamp | timestamptz | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | — |

### TABLE-083 — `content.content_revisions`

**Purpose:** Content revision

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0776 | TABLE-083 | content.content_revisions | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Int | — | Y | PK | — |
| COL-0777 | TABLE-083 | content.content_revisions | content_item_id | Parent content item | uuid | NOT NULL | — | — | content.content_items.id | — | — | Y | Int | — | Y | Y | — |
| COL-0778 | TABLE-083 | content.content_revisions | revision_number | Revision sequence | integer | NOT NULL | — | — | — | — | revision_number >= 1 PROPOSED | Y | Int | — | Y | — | — |
| COL-0779 | TABLE-083 | content.content_revisions | body_text | Revision body text | text | NULL | — | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0780 | TABLE-083 | content.content_revisions | body_payload | Optional supporting body payload | jsonb | NULL | — | — | — | — | — | Y | Int | — | Y | — | supporting not sole authoritative state |
| COL-0781 | TABLE-083 | content.content_revisions | revised_at | Revision time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0782 | TABLE-083 | content.content_revisions | revised_by_profile_id | Revising actor | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | — | — |
| COL-0783 | TABLE-083 | content.content_revisions | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0784 | TABLE-083 | content.content_revisions | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-084 — `content.publication_records`

**Purpose:** Content publication record

**Notes:** Required before Public attachment context.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0785 | TABLE-084 | content.publication_records | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Int | — | Y | PK | — |
| COL-0786 | TABLE-084 | content.publication_records | content_item_id | Parent content item | uuid | NOT NULL | — | — | content.content_items.id | — | — | Y | Int | — | Y | Y | — |
| COL-0787 | TABLE-084 | content.publication_records | content_revision_id | Published revision | uuid | NULL | — | — | content.content_revisions.id | — | — | Y when set | Int | — | Y | maybe | — |
| COL-0788 | TABLE-084 | content.publication_records | published_at | Publication time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0789 | TABLE-084 | content.publication_records | published_by_profile_id | Publishing actor | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | — | — |
| COL-0790 | TABLE-084 | content.publication_records | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0791 | TABLE-084 | content.publication_records | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-085 — `content.withdrawal_records`

**Purpose:** Content withdrawal record

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0792 | TABLE-085 | content.withdrawal_records | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Int | — | Y | PK | — |
| COL-0793 | TABLE-085 | content.withdrawal_records | content_item_id | Parent content item | uuid | NOT NULL | — | — | content.content_items.id | — | — | Y | Int | — | Y | Y | — |
| COL-0794 | TABLE-085 | content.withdrawal_records | withdrawn_at | Withdrawal time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0795 | TABLE-085 | content.withdrawal_records | withdrawn_by_profile_id | Withdrawing actor | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | — | — |
| COL-0796 | TABLE-085 | content.withdrawal_records | reason | Withdrawal reason | text | NULL | — | — | — | — | — | Y | Conf | — | Y | — | — |
| COL-0797 | TABLE-085 | content.withdrawal_records | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0798 | TABLE-085 | content.withdrawal_records | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-086 — `content.announcement_validity_periods`

**Purpose:** Announcement validity period

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0799 | TABLE-086 | content.announcement_validity_periods | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Int | — | Y | PK | — |
| COL-0800 | TABLE-086 | content.announcement_validity_periods | content_item_id | Parent content item | uuid | NOT NULL | — | — | content.content_items.id | — | — | Y | Int | — | Y | Y | — |
| COL-0801 | TABLE-086 | content.announcement_validity_periods | valid_from | Validity start | timestamptz | NOT NULL | — | — | — | — | — | N | Int | — | Y | Y | — |
| COL-0802 | TABLE-086 | content.announcement_validity_periods | valid_to | Validity end | timestamptz | NULL | — | — | — | — | valid_to > valid_from PROPOSED | N | Int | — | Y | — | — |
| COL-0803 | TABLE-086 | content.announcement_validity_periods | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0804 | TABLE-086 | content.announcement_validity_periods | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0805 | TABLE-086 | content.announcement_validity_periods | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0806 | TABLE-086 | content.announcement_validity_periods | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |
| COL-0807 | TABLE-086 | content.announcement_validity_periods | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-087 — `audit.audit_events`

**Purpose:** Append-only audit event with embedded actor_context

**Notes:** Actor Context embedded (not separate table). Append-only; never hard-delete. actor_context jsonb is supporting.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0808 | TABLE-087 | audit.audit_events | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | AR | — | Y | PK | DM-13 |
| COL-0809 | TABLE-087 | audit.audit_events | event_category_code | Event category | text | NOT NULL | — | — | — | — | — | Y | AR | — | Y | Y | DM-13 |
| COL-0810 | TABLE-087 | audit.audit_events | action_code | Action code | text | NOT NULL | — | — | — | — | — | Y | AR | — | Y | Y | DM-13 |
| COL-0811 | TABLE-087 | audit.audit_events | outcome_code | Outcome code | text | NULL | — | — | — | — | — | Y | AR | — | Y | — | — |
| COL-0812 | TABLE-087 | audit.audit_events | actor_user_profile_id | Actor user profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | AR | — | Y | Y | DM-13 |
| COL-0813 | TABLE-087 | audit.audit_events | actor_staff_profile_id | Actor staff profile | uuid | NULL | — | — | identity.staff_profiles.id | — | — | Y | AR | — | Y | maybe | — |
| COL-0814 | TABLE-087 | audit.audit_events | actor_context | Supporting actor context JSONB | jsonb | NULL | — | — | — | — | — | Y | AR | mask | Y | — | DM-13; supporting not sole authoritative state |
| COL-0815 | TABLE-087 | audit.audit_events | target_type | Target type | text | NULL | — | — | — | — | — | Y | AR | — | Y | maybe | — |
| COL-0816 | TABLE-087 | audit.audit_events | target_id | Target identity | uuid | NULL | — | — | — | — | — | Y | AR | — | Y | maybe | — |
| COL-0817 | TABLE-087 | audit.audit_events | occurred_at | Event occurrence time | timestamptz | NOT NULL | — | — | — | — | — | Y | AR | — | Y | Y | — |
| COL-0818 | TABLE-087 | audit.audit_events | domain_event_name | Optional mirrored domain event name | text | NULL | — | — | — | — | — | Y | AR | — | Y | — | — |
| COL-0819 | TABLE-087 | audit.audit_events | domain_event_id | Optional mirrored domain event id | uuid | NULL | — | — | — | — | — | Y | AR | — | Y | maybe | — |
| COL-0820 | TABLE-087 | audit.audit_events | summary | Non-sensitive summary | text | NULL | — | — | — | — | — | Y | AR | minimize | Y | — | DM-13 |
| COL-0821 | TABLE-087 | audit.audit_events | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | AR | — | Y | Y | DM-20 |
| COL-0822 | TABLE-087 | audit.audit_events | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | AR | — | Y | — | — |

### TABLE-088 — `audit.sensitive_change_details`

**Purpose:** Append-only sensitive change detail

**Notes:** Threshold يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0823 | TABLE-088 | audit.sensitive_change_details | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | AR | — | Y | PK | DM-13 |
| COL-0824 | TABLE-088 | audit.sensitive_change_details | audit_event_id | Parent audit event | uuid | NOT NULL | — | — | audit.audit_events.id | — | — | Y | AR | — | Y | Y | — |
| COL-0825 | TABLE-088 | audit.sensitive_change_details | role_assignment_id | Optional role assignment link | uuid | NULL | — | — | identity.role_assignments.id | — | — | Y when set | AR | — | Y | maybe | — |
| COL-0826 | TABLE-088 | audit.sensitive_change_details | field_name | Changed field or aspect | text | NULL | — | — | — | — | — | Y | AR | — | Y | — | — |
| COL-0827 | TABLE-088 | audit.sensitive_change_details | previous_value_masked | Masked previous value | text | NULL | — | — | — | — | — | Y | AR | mask/encrypt PROPOSED | Y | — | DM-13 |
| COL-0828 | TABLE-088 | audit.sensitive_change_details | new_value_masked | Masked new value | text | NULL | — | — | — | — | — | Y | AR | mask/encrypt PROPOSED | Y | — | DM-13 |
| COL-0829 | TABLE-088 | audit.sensitive_change_details | change_reason | Change reason | text | NULL | — | — | — | — | — | Y | AR | — | Y | — | — |
| COL-0830 | TABLE-088 | audit.sensitive_change_details | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | AR | — | Y | — | — |

### TABLE-089 — `audit.access_security_events`

**Purpose:** Append-only access or security event

**Notes:** DM-18 يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0831 | TABLE-089 | audit.access_security_events | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | AR | — | Y | PK | DM-18 |
| COL-0832 | TABLE-089 | audit.access_security_events | auth_user_id | Related auth user when applicable | uuid | NULL | — | — | auth.users.id MANAGED_SCHEMA_FK | — | — | Y when set | AR | — | Y | maybe | — |
| COL-0833 | TABLE-089 | audit.access_security_events | user_profile_id | Related user profile when applicable | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y when set | AR | — | Y | maybe | — |
| COL-0834 | TABLE-089 | audit.access_security_events | event_type_code | Security event type | text | NOT NULL | — | — | — | — | — | Y | AR | — | Y | Y | — |
| COL-0835 | TABLE-089 | audit.access_security_events | outcome_code | Event outcome | text | NULL | — | — | — | — | — | Y | AR | — | Y | — | — |
| COL-0836 | TABLE-089 | audit.access_security_events | occurred_at | Event occurrence time | timestamptz | NOT NULL | — | — | — | — | — | Y | AR | — | Y | Y | — |
| COL-0837 | TABLE-089 | audit.access_security_events | source_ip_hash | Hashed source IP if captured | text | NULL | — | — | — | — | — | Y | AR | hash | Y | — | — |
| COL-0838 | TABLE-089 | audit.access_security_events | user_agent_safe | Safe user agent fragment | text | NULL | — | — | — | — | — | Y | AR | — | Y | — | — |
| COL-0839 | TABLE-089 | audit.access_security_events | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | AR | — | Y | maybe | DM-20 |
| COL-0840 | TABLE-089 | audit.access_security_events | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | AR | — | Y | — | — |

### TABLE-090 — `reporting.domain_event_history_records`

**Purpose:** Supporting domain event history for analytics

**Notes:** Derived/supporting; not authoritative case state. DM-15 freshness يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0841 | TABLE-090 | reporting.domain_event_history_records | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0842 | TABLE-090 | reporting.domain_event_history_records | projection_definition_id | Optional projection definition | uuid | NULL | — | — | reporting.reporting_projection_definitions.id | — | — | Y when set | Int | — | Y | maybe | DM-15 |
| COL-0843 | TABLE-090 | reporting.domain_event_history_records | event_name | Domain event name | text | NOT NULL | — | — | — | — | — | Y | Conf | — | Y | Y | — |
| COL-0844 | TABLE-090 | reporting.domain_event_history_records | aggregate_type | Aggregate type | text | NOT NULL | — | — | — | — | — | Y | Conf | — | Y | maybe | — |
| COL-0845 | TABLE-090 | reporting.domain_event_history_records | aggregate_id | Aggregate identity | uuid | NOT NULL | — | — | — | — | — | Y | HS | — | Y | Y | — |
| COL-0846 | TABLE-090 | reporting.domain_event_history_records | occurred_at | Business event time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0847 | TABLE-090 | reporting.domain_event_history_records | payload_jsonb | Minimized supporting payload | jsonb | NULL | — | — | — | — | — | Y | HS | mask | Y | — | supporting not sole authoritative state |
| COL-0848 | TABLE-090 | reporting.domain_event_history_records | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0849 | TABLE-090 | reporting.domain_event_history_records | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |

### TABLE-091 — `reporting.reporting_projection_definitions`

**Purpose:** Reporting projection definition

**Notes:** Rebuild/reconcile يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0850 | TABLE-091 | reporting.reporting_projection_definitions | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Int | — | Y | PK | — |
| COL-0851 | TABLE-091 | reporting.reporting_projection_definitions | code | Projection definition code | text | NOT NULL | — | — | — | UNIQUE | — | Y after issue PROPOSED | Int | — | Y | UNIQUE | — |
| COL-0852 | TABLE-091 | reporting.reporting_projection_definitions | name | Display name | text | NOT NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0853 | TABLE-091 | reporting.reporting_projection_definitions | version_label | Definition version label | text | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0854 | TABLE-091 | reporting.reporting_projection_definitions | is_active | Active flag | boolean | NOT NULL | true PROPOSED | — | — | — | — | N | Int | — | Y | maybe | — |
| COL-0855 | TABLE-091 | reporting.reporting_projection_definitions | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0856 | TABLE-091 | reporting.reporting_projection_definitions | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0857 | TABLE-091 | reporting.reporting_projection_definitions | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0858 | TABLE-091 | reporting.reporting_projection_definitions | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |

### TABLE-092 — `reporting.saved_report_filters`

**Purpose:** Saved report filter preference

**Notes:** DM-16 masking يحتاج اعتماد لاحق. Soft-delete OPEN.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0859 | TABLE-092 | reporting.saved_report_filters | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | — |
| COL-0860 | TABLE-092 | reporting.saved_report_filters | user_profile_id | Owning user profile | uuid | NOT NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | Y | — |
| COL-0861 | TABLE-092 | reporting.saved_report_filters | report_key | Report key | text | NOT NULL | — | — | — | — | — | Y | Conf | — | Y | Y | — |
| COL-0862 | TABLE-092 | reporting.saved_report_filters | filter_payload | Saved filter supporting payload | jsonb | NULL | — | — | — | — | — | N | Conf | mask | Y | — | DM-16; supporting not sole authoritative state |
| COL-0863 | TABLE-092 | reporting.saved_report_filters | name | Saved filter name | text | NULL | — | — | — | — | — | N | Conf | — | Y | — | — |
| COL-0864 | TABLE-092 | reporting.saved_report_filters | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0865 | TABLE-092 | reporting.saved_report_filters | created_by_profile_id | Creating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | maybe | DM-13 |
| COL-0866 | TABLE-092 | reporting.saved_report_filters | updated_at | Last update time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | — | — |
| COL-0867 | TABLE-092 | reporting.saved_report_filters | updated_by_profile_id | Updating actor profile | uuid | NULL | — | — | identity.user_profiles.id | — | — | N | Conf | — | Y | — | DM-13 |
| COL-0868 | TABLE-092 | reporting.saved_report_filters | archived_at | Soft-archive timestamp | timestamptz | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | — |

### TABLE-093 — `reporting.report_export_records`

**Purpose:** Report export evidence record

**Notes:** View != export authorization. DMOD-12 scheduling يحتاج اعتماد لاحق.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0869 | TABLE-093 | reporting.report_export_records | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Conf | — | Y | PK | DM-16 |
| COL-0870 | TABLE-093 | reporting.report_export_records | projection_definition_id | Projection definition | uuid | NOT NULL | — | — | reporting.reporting_projection_definitions.id | — | — | Y | Int | — | Y | Y | DM-15 |
| COL-0871 | TABLE-093 | reporting.report_export_records | requested_by_user_profile_id | Requesting user profile | uuid | NOT NULL | — | — | identity.user_profiles.id | — | — | Y | Conf | — | Y | Y | DM-16 |
| COL-0872 | TABLE-093 | reporting.report_export_records | outcome_code | Export attempt outcome | text | NOT NULL | — | — | — | — | — | Y | Conf | — | Y | Y | — |
| COL-0873 | TABLE-093 | reporting.report_export_records | requested_at | Request time | timestamptz | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0874 | TABLE-093 | reporting.report_export_records | completed_at | Completion time | timestamptz | NULL | — | — | — | — | — | Y when set | Int | — | Y | — | — |
| COL-0875 | TABLE-093 | reporting.report_export_records | filter_snapshot | Filter snapshot used | jsonb | NULL | — | — | — | — | — | Y | Conf | mask | Y | — | DM-16; supporting not sole authoritative state |
| COL-0876 | TABLE-093 | reporting.report_export_records | row_count | Exported row count | integer | NULL | — | — | — | — | row_count >= 0 PROPOSED | Y when set | Int | — | Y | — | — |
| COL-0877 | TABLE-093 | reporting.report_export_records | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0878 | TABLE-093 | reporting.report_export_records | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |

### TABLE-094 — `audit.domain_event_outbox`

**Purpose:** Infrastructure domain event outbox

**Notes:** INFRASTRUCTURE domain event outbox (NOT notification delivery). Distinct from notify.notification_outbox_messages. Outbox rows are not authoritative case state.

| Column ID | TABLE ID | schema.table | column name | business meaning | PG type | null | default | PK | FK target | uniqueness | check | immutable | sensitivity | mask/encrypt | audit | index candidate | open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COL-0879 | TABLE-094 | audit.domain_event_outbox | id | Internal identity | uuid | NOT NULL | — | Y | — | — | — | Y | Int | — | Y | PK | — |
| COL-0880 | TABLE-094 | audit.domain_event_outbox | event_id | Unique domain event occurrence id | uuid | NOT NULL | — | — | — | UNIQUE | — | Y | Int | — | Y | UNIQUE | — |
| COL-0881 | TABLE-094 | audit.domain_event_outbox | event_name | Catalogued domain event name | text | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0882 | TABLE-094 | audit.domain_event_outbox | producer_module | Producing NestJS module | text | NOT NULL | — | — | — | — | — | Y | Int | — | Y | maybe | — |
| COL-0883 | TABLE-094 | audit.domain_event_outbox | aggregate_type | Owning aggregate type | text | NOT NULL | — | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0884 | TABLE-094 | audit.domain_event_outbox | aggregate_id | Owning aggregate identity | uuid | NOT NULL | — | — | — | — | — | Y | Int | — | Y | Y | — |
| COL-0885 | TABLE-094 | audit.domain_event_outbox | correlation_id | Operation correlation chain | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0886 | TABLE-094 | audit.domain_event_outbox | causation_id | Causation identity | uuid | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | — |
| COL-0887 | TABLE-094 | audit.domain_event_outbox | idempotency_key | Catalog dedupe key | text | NULL | — | — | — | scoped UNIQUE PROPOSED | — | Y when set | Int | — | Y | maybe | DM-20 |
| COL-0888 | TABLE-094 | audit.domain_event_outbox | payload_jsonb | Minimized event payload JSONB | jsonb | NULL | — | — | — | — | — | Y | Conf | minimize PII | Y | — | supporting minimized payload; not authoritative case state |
| COL-0889 | TABLE-094 | audit.domain_event_outbox | publication_state | Outbox publication state | text | NOT NULL | — | — | — | — | — | N | Int | — | Y | Y | — |
| COL-0890 | TABLE-094 | audit.domain_event_outbox | attempt_count | Publication attempt count | integer | NOT NULL | 0 PROPOSED | — | — | — | attempt_count >= 0 PROPOSED | N | Int | — | Y | — | — |
| COL-0891 | TABLE-094 | audit.domain_event_outbox | last_error | Last safe error text | text | NULL | — | — | — | — | — | N | Conf | — | Y | — | — |
| COL-0892 | TABLE-094 | audit.domain_event_outbox | created_at | Insert time | timestamptz | NOT NULL | now() | — | — | — | — | Y | Int | — | Y | — | — |
| COL-0893 | TABLE-094 | audit.domain_event_outbox | published_at | Successful publish time | timestamptz | NULL | — | — | — | — | — | Y when set | Int | — | Y | maybe | — |
| COL-0894 | TABLE-094 | audit.domain_event_outbox | next_attempt_at | Next retry attempt time | timestamptz | NULL | — | — | — | — | — | N | Int | — | Y | maybe | — |

## Constraint catalogue

### Primary keys (PK-*)

| Constraint ID | TABLE ID | Column |
| --- | --- | --- |
| PK-001 | TABLE-001 | `identity.user_profiles.id` |
| PK-002 | TABLE-002 | `identity.staff_profiles.id` |
| PK-003 | TABLE-003 | `identity.roles.id` |
| PK-004 | TABLE-004 | `identity.permissions.id` |
| PK-005 | TABLE-005 | `identity.role_assignments.id` |
| PK-006 | TABLE-006 | `identity.role_permissions.id` |
| PK-007 | TABLE-007 | `identity.sensitive_permission_changes.id` |
| PK-008 | TABLE-008 | `registry.taxpayers.id` |
| PK-009 | TABLE-009 | `registry.taxpayer_contacts.id` |
| PK-010 | TABLE-010 | `registry.taxpayer_account_links.id` |
| PK-011 | TABLE-011 | `registry.taxpayer_legal_entity_associations.id` |
| PK-012 | TABLE-012 | `legal.legal_entities.id` |
| PK-013 | TABLE-013 | `legal.tax_numbers.id` |
| PK-014 | TABLE-014 | `masterdata.commercial_activities.id` |
| PK-015 | TABLE-015 | `masterdata.branches.id` |
| PK-016 | TABLE-016 | `masterdata.activity_addresses.id` |
| PK-017 | TABLE-017 | `masterdata.activity_status_histories.id` |
| PK-018 | TABLE-018 | `masterdata.properties.id` |
| PK-019 | TABLE-019 | `masterdata.property_units.id` |
| PK-020 | TABLE-020 | `masterdata.property_ownership_records.id` |
| PK-021 | TABLE-021 | `masterdata.property_ownership_units.id` |
| PK-022 | TABLE-022 | `masterdata.property_ownership_histories.id` |
| PK-023 | TABLE-023 | `requests.service_types.id` |
| PK-024 | TABLE-024 | `requests.service_requests.id` |
| PK-025 | TABLE-025 | `requests.request_selected_activities.id` |
| PK-026 | TABLE-026 | `requests.request_selected_branches.id` |
| PK-027 | TABLE-027 | `requests.request_form_snapshots.id` |
| PK-028 | TABLE-028 | `requests.request_form_snapshot_payloads.id` |
| PK-029 | TABLE-029 | `requests.request_status_histories.id` |
| PK-030 | TABLE-030 | `requests.request_assignment_histories.id` |
| PK-031 | TABLE-031 | `requests.request_completion_requests.id` |
| PK-032 | TABLE-032 | `requests.request_completion_responses.id` |
| PK-033 | TABLE-033 | `requests.request_decision_records.id` |
| PK-034 | TABLE-034 | `requests.request_decision_revisions.id` |
| PK-035 | TABLE-035 | `requests.request_close_archive_records.id` |
| PK-036 | TABLE-036 | `requests.request_reopen_records.id` |
| PK-037 | TABLE-037 | `balaghat.balaghs.id` |
| PK-038 | TABLE-038 | `balaghat.balagh_selected_activities.id` |
| PK-039 | TABLE-039 | `balaghat.balagh_selected_branches.id` |
| PK-040 | TABLE-040 | `balaghat.balagh_form_snapshots.id` |
| PK-041 | TABLE-041 | `balaghat.balagh_form_snapshot_payloads.id` |
| PK-042 | TABLE-042 | `balaghat.balagh_status_histories.id` |
| PK-043 | TABLE-043 | `balaghat.balagh_assignment_histories.id` |
| PK-044 | TABLE-044 | `balaghat.balagh_completion_requests.id` |
| PK-045 | TABLE-045 | `balaghat.balagh_completion_responses.id` |
| PK-046 | TABLE-046 | `balaghat.balagh_decision_records.id` |
| PK-047 | TABLE-047 | `balaghat.balagh_decision_revisions.id` |
| PK-048 | TABLE-048 | `balaghat.balagh_close_archive_records.id` |
| PK-049 | TABLE-049 | `balaghat.balagh_reopen_records.id` |
| PK-050 | TABLE-050 | `visits.field_visits.id` |
| PK-051 | TABLE-051 | `visits.visit_schedules.id` |
| PK-052 | TABLE-052 | `visits.visit_team_members.id` |
| PK-053 | TABLE-053 | `visits.visit_results.id` |
| PK-054 | TABLE-054 | `visits.visit_result_corrections.id` |
| PK-055 | TABLE-055 | `visits.visit_evidences.id` |
| PK-056 | TABLE-056 | `dues.payment_dues.id` |
| PK-057 | TABLE-057 | `dues.due_basis_document_references.id` |
| PK-058 | TABLE-058 | `dues.due_corrections.id` |
| PK-059 | TABLE-059 | `dues.payment_notices.id` |
| PK-060 | TABLE-060 | `dues.payment_receipts.id` |
| PK-061 | TABLE-061 | `dues.receipt_correction_replacements.id` |
| PK-062 | TABLE-062 | `dues.payment_confirmations.id` |
| PK-063 | TABLE-063 | `files.attachments.id` |
| PK-064 | TABLE-064 | `files.attachment_links.id` |
| PK-065 | TABLE-065 | `files.attachment_version_histories.id` |
| PK-066 | TABLE-066 | `notify.notification_messages.id` |
| PK-067 | TABLE-067 | `notify.delivery_attempts.id` |
| PK-068 | TABLE-068 | `notify.delivery_retries.id` |
| PK-069 | TABLE-069 | `notify.notification_templates.id` |
| PK-070 | TABLE-070 | `notify.notification_channel_configurations.id` |
| PK-071 | TABLE-071 | `notify.notification_read_states.id` |
| PK-072 | TABLE-072 | `notify.notification_outbox_messages.id` |
| PK-073 | TABLE-073 | `imports.import_batches.id` |
| PK-074 | TABLE-074 | `imports.import_previews.id` |
| PK-075 | TABLE-075 | `imports.import_validation_results.id` |
| PK-076 | TABLE-076 | `imports.import_row_results.id` |
| PK-077 | TABLE-077 | `imports.import_errors.id` |
| PK-078 | TABLE-078 | `imports.import_approvals.id` |
| PK-079 | TABLE-079 | `imports.import_rejections.id` |
| PK-080 | TABLE-080 | `imports.import_failures.id` |
| PK-081 | TABLE-081 | `imports.import_commits.id` |
| PK-082 | TABLE-082 | `content.content_items.id` |
| PK-083 | TABLE-083 | `content.content_revisions.id` |
| PK-084 | TABLE-084 | `content.publication_records.id` |
| PK-085 | TABLE-085 | `content.withdrawal_records.id` |
| PK-086 | TABLE-086 | `content.announcement_validity_periods.id` |
| PK-087 | TABLE-087 | `audit.audit_events.id` |
| PK-088 | TABLE-088 | `audit.sensitive_change_details.id` |
| PK-089 | TABLE-089 | `audit.access_security_events.id` |
| PK-090 | TABLE-090 | `reporting.domain_event_history_records.id` |
| PK-091 | TABLE-091 | `reporting.reporting_projection_definitions.id` |
| PK-092 | TABLE-092 | `reporting.saved_report_filters.id` |
| PK-093 | TABLE-093 | `reporting.report_export_records.id` |
| PK-094 | TABLE-094 | `audit.domain_event_outbox.id` |

### Foreign keys (FK-*)

| Constraint ID | TABLE ID | Source | Target |
| --- | --- | --- | --- |
| FK-001 | TABLE-001 | `identity.user_profiles.auth_user_id` | `auth.users.id MANAGED_SCHEMA_FK` |
| FK-002 | TABLE-001 | `identity.user_profiles.created_by_profile_id` | `identity.user_profiles.id` |
| FK-003 | TABLE-001 | `identity.user_profiles.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-004 | TABLE-002 | `identity.staff_profiles.user_profile_id` | `identity.user_profiles.id` |
| FK-005 | TABLE-002 | `identity.staff_profiles.created_by_profile_id` | `identity.user_profiles.id` |
| FK-006 | TABLE-002 | `identity.staff_profiles.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-007 | TABLE-003 | `identity.roles.created_by_profile_id` | `identity.user_profiles.id` |
| FK-008 | TABLE-003 | `identity.roles.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-009 | TABLE-004 | `identity.permissions.created_by_profile_id` | `identity.user_profiles.id` |
| FK-010 | TABLE-004 | `identity.permissions.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-011 | TABLE-005 | `identity.role_assignments.user_profile_id` | `identity.user_profiles.id` |
| FK-012 | TABLE-005 | `identity.role_assignments.role_id` | `identity.roles.id` |
| FK-013 | TABLE-005 | `identity.role_assignments.granted_by_profile_id` | `identity.user_profiles.id` |
| FK-014 | TABLE-005 | `identity.role_assignments.revoked_by_profile_id` | `identity.user_profiles.id` |
| FK-015 | TABLE-006 | `identity.role_permissions.role_id` | `identity.roles.id` |
| FK-016 | TABLE-006 | `identity.role_permissions.permission_id` | `identity.permissions.id` |
| FK-017 | TABLE-006 | `identity.role_permissions.created_by_profile_id` | `identity.user_profiles.id` |
| FK-018 | TABLE-007 | `identity.sensitive_permission_changes.role_assignment_id` | `identity.role_assignments.id` |
| FK-019 | TABLE-007 | `identity.sensitive_permission_changes.permission_id` | `identity.permissions.id` |
| FK-020 | TABLE-007 | `identity.sensitive_permission_changes.changed_by_profile_id` | `identity.user_profiles.id` |
| FK-021 | TABLE-008 | `registry.taxpayers.created_by_profile_id` | `identity.user_profiles.id` |
| FK-022 | TABLE-008 | `registry.taxpayers.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-023 | TABLE-009 | `registry.taxpayer_contacts.taxpayer_id` | `registry.taxpayers.id` |
| FK-024 | TABLE-009 | `registry.taxpayer_contacts.created_by_profile_id` | `identity.user_profiles.id` |
| FK-025 | TABLE-009 | `registry.taxpayer_contacts.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-026 | TABLE-010 | `registry.taxpayer_account_links.user_profile_id` | `identity.user_profiles.id` |
| FK-027 | TABLE-010 | `registry.taxpayer_account_links.taxpayer_id` | `registry.taxpayers.id` |
| FK-028 | TABLE-010 | `registry.taxpayer_account_links.approved_by_profile_id` | `identity.user_profiles.id` |
| FK-029 | TABLE-010 | `registry.taxpayer_account_links.revoked_by_profile_id` | `identity.user_profiles.id` |
| FK-030 | TABLE-010 | `registry.taxpayer_account_links.created_by_profile_id` | `identity.user_profiles.id` |
| FK-031 | TABLE-010 | `registry.taxpayer_account_links.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-032 | TABLE-011 | `registry.taxpayer_legal_entity_associations.taxpayer_id` | `registry.taxpayers.id` |
| FK-033 | TABLE-011 | `registry.taxpayer_legal_entity_associations.legal_entity_id` | `legal.legal_entities.id` |
| FK-034 | TABLE-011 | `registry.taxpayer_legal_entity_associations.created_by_profile_id` | `identity.user_profiles.id` |
| FK-035 | TABLE-011 | `registry.taxpayer_legal_entity_associations.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-036 | TABLE-012 | `legal.legal_entities.created_by_profile_id` | `identity.user_profiles.id` |
| FK-037 | TABLE-012 | `legal.legal_entities.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-038 | TABLE-013 | `legal.tax_numbers.legal_entity_id` | `legal.legal_entities.id` |
| FK-039 | TABLE-013 | `legal.tax_numbers.taxpayer_id` | `registry.taxpayers.id` |
| FK-040 | TABLE-013 | `legal.tax_numbers.superseded_by_id` | `legal.tax_numbers.id` |
| FK-041 | TABLE-013 | `legal.tax_numbers.created_by_profile_id` | `identity.user_profiles.id` |
| FK-042 | TABLE-013 | `legal.tax_numbers.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-043 | TABLE-014 | `masterdata.commercial_activities.taxpayer_id` | `registry.taxpayers.id` |
| FK-044 | TABLE-014 | `masterdata.commercial_activities.created_by_profile_id` | `identity.user_profiles.id` |
| FK-045 | TABLE-014 | `masterdata.commercial_activities.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-046 | TABLE-015 | `masterdata.branches.commercial_activity_id` | `masterdata.commercial_activities.id` |
| FK-047 | TABLE-015 | `masterdata.branches.created_by_profile_id` | `identity.user_profiles.id` |
| FK-048 | TABLE-015 | `masterdata.branches.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-049 | TABLE-016 | `masterdata.activity_addresses.commercial_activity_id` | `masterdata.commercial_activities.id` |
| FK-050 | TABLE-016 | `masterdata.activity_addresses.branch_id` | `masterdata.branches.id` |
| FK-051 | TABLE-016 | `masterdata.activity_addresses.created_by_profile_id` | `identity.user_profiles.id` |
| FK-052 | TABLE-016 | `masterdata.activity_addresses.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-053 | TABLE-017 | `masterdata.activity_status_histories.commercial_activity_id` | `masterdata.commercial_activities.id` |
| FK-054 | TABLE-017 | `masterdata.activity_status_histories.changed_by_profile_id` | `identity.user_profiles.id` |
| FK-055 | TABLE-018 | `masterdata.properties.created_by_profile_id` | `identity.user_profiles.id` |
| FK-056 | TABLE-018 | `masterdata.properties.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-057 | TABLE-019 | `masterdata.property_units.property_id` | `masterdata.properties.id` |
| FK-058 | TABLE-019 | `masterdata.property_units.created_by_profile_id` | `identity.user_profiles.id` |
| FK-059 | TABLE-019 | `masterdata.property_units.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-060 | TABLE-020 | `masterdata.property_ownership_records.property_id` | `masterdata.properties.id` |
| FK-061 | TABLE-020 | `masterdata.property_ownership_records.taxpayer_id` | `registry.taxpayers.id` |
| FK-062 | TABLE-020 | `masterdata.property_ownership_records.created_by_profile_id` | `identity.user_profiles.id` |
| FK-063 | TABLE-020 | `masterdata.property_ownership_records.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-064 | TABLE-021 | `masterdata.property_ownership_units.ownership_record_id` | `masterdata.property_ownership_records.id` |
| FK-065 | TABLE-021 | `masterdata.property_ownership_units.property_unit_id` | `masterdata.property_units.id` |
| FK-066 | TABLE-021 | `masterdata.property_ownership_units.created_by_profile_id` | `identity.user_profiles.id` |
| FK-067 | TABLE-022 | `masterdata.property_ownership_histories.ownership_record_id` | `masterdata.property_ownership_records.id` |
| FK-068 | TABLE-022 | `masterdata.property_ownership_histories.changed_by_profile_id` | `identity.user_profiles.id` |
| FK-069 | TABLE-023 | `requests.service_types.created_by_profile_id` | `identity.user_profiles.id` |
| FK-070 | TABLE-023 | `requests.service_types.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-071 | TABLE-024 | `requests.service_requests.service_type_id` | `requests.service_types.id` |
| FK-072 | TABLE-024 | `requests.service_requests.taxpayer_id` | `registry.taxpayers.id` |
| FK-073 | TABLE-024 | `requests.service_requests.created_by_profile_id` | `identity.user_profiles.id` |
| FK-074 | TABLE-024 | `requests.service_requests.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-075 | TABLE-025 | `requests.request_selected_activities.service_request_id` | `requests.service_requests.id` |
| FK-076 | TABLE-025 | `requests.request_selected_activities.commercial_activity_id` | `masterdata.commercial_activities.id` |
| FK-077 | TABLE-025 | `requests.request_selected_activities.created_by_profile_id` | `identity.user_profiles.id` |
| FK-078 | TABLE-026 | `requests.request_selected_branches.service_request_id` | `requests.service_requests.id` |
| FK-079 | TABLE-026 | `requests.request_selected_branches.request_selected_activity_id` | `requests.request_selected_activities.id` |
| FK-080 | TABLE-026 | `requests.request_selected_branches.branch_id` | `masterdata.branches.id` |
| FK-081 | TABLE-026 | `requests.request_selected_branches.created_by_profile_id` | `identity.user_profiles.id` |
| FK-082 | TABLE-027 | `requests.request_form_snapshots.service_request_id` | `requests.service_requests.id` |
| FK-083 | TABLE-027 | `requests.request_form_snapshots.captured_by_profile_id` | `identity.user_profiles.id` |
| FK-084 | TABLE-028 | `requests.request_form_snapshot_payloads.request_form_snapshot_id` | `requests.request_form_snapshots.id` |
| FK-085 | TABLE-029 | `requests.request_status_histories.service_request_id` | `requests.service_requests.id` |
| FK-086 | TABLE-029 | `requests.request_status_histories.changed_by_profile_id` | `identity.user_profiles.id` |
| FK-087 | TABLE-030 | `requests.request_assignment_histories.service_request_id` | `requests.service_requests.id` |
| FK-088 | TABLE-030 | `requests.request_assignment_histories.staff_profile_id` | `identity.staff_profiles.id` |
| FK-089 | TABLE-030 | `requests.request_assignment_histories.changed_by_staff_profile_id` | `identity.staff_profiles.id` |
| FK-090 | TABLE-031 | `requests.request_completion_requests.service_request_id` | `requests.service_requests.id` |
| FK-091 | TABLE-031 | `requests.request_completion_requests.requested_by_staff_profile_id` | `identity.staff_profiles.id` |
| FK-092 | TABLE-032 | `requests.request_completion_responses.completion_request_id` | `requests.request_completion_requests.id` |
| FK-093 | TABLE-032 | `requests.request_completion_responses.responded_by_profile_id` | `identity.user_profiles.id` |
| FK-094 | TABLE-033 | `requests.request_decision_records.service_request_id` | `requests.service_requests.id` |
| FK-095 | TABLE-033 | `requests.request_decision_records.decided_by_staff_profile_id` | `identity.staff_profiles.id` |
| FK-096 | TABLE-033 | `requests.request_decision_records.created_by_profile_id` | `identity.user_profiles.id` |
| FK-097 | TABLE-034 | `requests.request_decision_revisions.decision_record_id` | `requests.request_decision_records.id` |
| FK-098 | TABLE-034 | `requests.request_decision_revisions.revised_by_staff_profile_id` | `identity.staff_profiles.id` |
| FK-099 | TABLE-035 | `requests.request_close_archive_records.service_request_id` | `requests.service_requests.id` |
| FK-100 | TABLE-035 | `requests.request_close_archive_records.acted_by_staff_profile_id` | `identity.staff_profiles.id` |
| FK-101 | TABLE-036 | `requests.request_reopen_records.service_request_id` | `requests.service_requests.id` |
| FK-102 | TABLE-036 | `requests.request_reopen_records.reopened_by_staff_profile_id` | `identity.staff_profiles.id` |
| FK-103 | TABLE-037 | `balaghat.balaghs.taxpayer_id` | `registry.taxpayers.id` |
| FK-104 | TABLE-037 | `balaghat.balaghs.created_by_profile_id` | `identity.user_profiles.id` |
| FK-105 | TABLE-037 | `balaghat.balaghs.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-106 | TABLE-038 | `balaghat.balagh_selected_activities.balagh_id` | `balaghat.balaghs.id` |
| FK-107 | TABLE-038 | `balaghat.balagh_selected_activities.commercial_activity_id` | `masterdata.commercial_activities.id` |
| FK-108 | TABLE-038 | `balaghat.balagh_selected_activities.created_by_profile_id` | `identity.user_profiles.id` |
| FK-109 | TABLE-039 | `balaghat.balagh_selected_branches.balagh_id` | `balaghat.balaghs.id` |
| FK-110 | TABLE-039 | `balaghat.balagh_selected_branches.balagh_selected_activity_id` | `balaghat.balagh_selected_activities.id` |
| FK-111 | TABLE-039 | `balaghat.balagh_selected_branches.branch_id` | `masterdata.branches.id` |
| FK-112 | TABLE-039 | `balaghat.balagh_selected_branches.created_by_profile_id` | `identity.user_profiles.id` |
| FK-113 | TABLE-040 | `balaghat.balagh_form_snapshots.balagh_id` | `balaghat.balaghs.id` |
| FK-114 | TABLE-040 | `balaghat.balagh_form_snapshots.captured_by_profile_id` | `identity.user_profiles.id` |
| FK-115 | TABLE-041 | `balaghat.balagh_form_snapshot_payloads.balagh_form_snapshot_id` | `balaghat.balagh_form_snapshots.id` |
| FK-116 | TABLE-042 | `balaghat.balagh_status_histories.balagh_id` | `balaghat.balaghs.id` |
| FK-117 | TABLE-042 | `balaghat.balagh_status_histories.changed_by_profile_id` | `identity.user_profiles.id` |
| FK-118 | TABLE-043 | `balaghat.balagh_assignment_histories.balagh_id` | `balaghat.balaghs.id` |
| FK-119 | TABLE-043 | `balaghat.balagh_assignment_histories.staff_profile_id` | `identity.staff_profiles.id` |
| FK-120 | TABLE-043 | `balaghat.balagh_assignment_histories.changed_by_staff_profile_id` | `identity.staff_profiles.id` |
| FK-121 | TABLE-044 | `balaghat.balagh_completion_requests.balagh_id` | `balaghat.balaghs.id` |
| FK-122 | TABLE-044 | `balaghat.balagh_completion_requests.requested_by_staff_profile_id` | `identity.staff_profiles.id` |
| FK-123 | TABLE-045 | `balaghat.balagh_completion_responses.completion_request_id` | `balaghat.balagh_completion_requests.id` |
| FK-124 | TABLE-045 | `balaghat.balagh_completion_responses.responded_by_profile_id` | `identity.user_profiles.id` |
| FK-125 | TABLE-046 | `balaghat.balagh_decision_records.balagh_id` | `balaghat.balaghs.id` |
| FK-126 | TABLE-046 | `balaghat.balagh_decision_records.decided_by_staff_profile_id` | `identity.staff_profiles.id` |
| FK-127 | TABLE-046 | `balaghat.balagh_decision_records.created_by_profile_id` | `identity.user_profiles.id` |
| FK-128 | TABLE-047 | `balaghat.balagh_decision_revisions.decision_record_id` | `balaghat.balagh_decision_records.id` |
| FK-129 | TABLE-047 | `balaghat.balagh_decision_revisions.revised_by_staff_profile_id` | `identity.staff_profiles.id` |
| FK-130 | TABLE-048 | `balaghat.balagh_close_archive_records.balagh_id` | `balaghat.balaghs.id` |
| FK-131 | TABLE-048 | `balaghat.balagh_close_archive_records.acted_by_staff_profile_id` | `identity.staff_profiles.id` |
| FK-132 | TABLE-049 | `balaghat.balagh_reopen_records.balagh_id` | `balaghat.balaghs.id` |
| FK-133 | TABLE-049 | `balaghat.balagh_reopen_records.reopened_by_staff_profile_id` | `identity.staff_profiles.id` |
| FK-134 | TABLE-050 | `visits.field_visits.service_request_id` | `requests.service_requests.id` |
| FK-135 | TABLE-050 | `visits.field_visits.balagh_id` | `balaghat.balaghs.id` |
| FK-136 | TABLE-050 | `visits.field_visits.created_by_profile_id` | `identity.user_profiles.id` |
| FK-137 | TABLE-050 | `visits.field_visits.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-138 | TABLE-051 | `visits.visit_schedules.field_visit_id` | `visits.field_visits.id` |
| FK-139 | TABLE-051 | `visits.visit_schedules.created_by_profile_id` | `identity.user_profiles.id` |
| FK-140 | TABLE-051 | `visits.visit_schedules.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-141 | TABLE-052 | `visits.visit_team_members.field_visit_id` | `visits.field_visits.id` |
| FK-142 | TABLE-052 | `visits.visit_team_members.staff_profile_id` | `identity.staff_profiles.id` |
| FK-143 | TABLE-052 | `visits.visit_team_members.created_by_profile_id` | `identity.user_profiles.id` |
| FK-144 | TABLE-053 | `visits.visit_results.field_visit_id` | `visits.field_visits.id` |
| FK-145 | TABLE-053 | `visits.visit_results.recorded_by_staff_profile_id` | `identity.staff_profiles.id` |
| FK-146 | TABLE-053 | `visits.visit_results.created_by_profile_id` | `identity.user_profiles.id` |
| FK-147 | TABLE-053 | `visits.visit_results.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-148 | TABLE-054 | `visits.visit_result_corrections.visit_result_id` | `visits.visit_results.id` |
| FK-149 | TABLE-054 | `visits.visit_result_corrections.corrected_by_staff_profile_id` | `identity.staff_profiles.id` |
| FK-150 | TABLE-055 | `visits.visit_evidences.field_visit_id` | `visits.field_visits.id` |
| FK-151 | TABLE-055 | `visits.visit_evidences.attachment_id` | `files.attachments.id` |
| FK-152 | TABLE-055 | `visits.visit_evidences.created_by_profile_id` | `identity.user_profiles.id` |
| FK-153 | TABLE-056 | `dues.payment_dues.service_request_id` | `requests.service_requests.id` |
| FK-154 | TABLE-056 | `dues.payment_dues.balagh_id` | `balaghat.balaghs.id` |
| FK-155 | TABLE-056 | `dues.payment_dues.created_by_profile_id` | `identity.user_profiles.id` |
| FK-156 | TABLE-056 | `dues.payment_dues.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-157 | TABLE-057 | `dues.due_basis_document_references.payment_due_id` | `dues.payment_dues.id` |
| FK-158 | TABLE-057 | `dues.due_basis_document_references.attachment_id` | `files.attachments.id` |
| FK-159 | TABLE-057 | `dues.due_basis_document_references.created_by_profile_id` | `identity.user_profiles.id` |
| FK-160 | TABLE-058 | `dues.due_corrections.payment_due_id` | `dues.payment_dues.id` |
| FK-161 | TABLE-058 | `dues.due_corrections.corrected_by_staff_profile_id` | `identity.staff_profiles.id` |
| FK-162 | TABLE-059 | `dues.payment_notices.payment_due_id` | `dues.payment_dues.id` |
| FK-163 | TABLE-059 | `dues.payment_notices.created_by_profile_id` | `identity.user_profiles.id` |
| FK-164 | TABLE-059 | `dues.payment_notices.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-165 | TABLE-060 | `dues.payment_receipts.replaces_receipt_id` | `dues.payment_receipts.id` |
| FK-166 | TABLE-060 | `dues.payment_receipts.created_by_profile_id` | `identity.user_profiles.id` |
| FK-167 | TABLE-060 | `dues.payment_receipts.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-168 | TABLE-061 | `dues.receipt_correction_replacements.payment_receipt_id` | `dues.payment_receipts.id` |
| FK-169 | TABLE-061 | `dues.receipt_correction_replacements.replaces_receipt_id` | `dues.payment_receipts.id` |
| FK-170 | TABLE-061 | `dues.receipt_correction_replacements.acted_by_staff_profile_id` | `identity.staff_profiles.id` |
| FK-171 | TABLE-062 | `dues.payment_confirmations.payment_receipt_id` | `dues.payment_receipts.id` |
| FK-172 | TABLE-062 | `dues.payment_confirmations.confirmed_by_profile_id` | `identity.user_profiles.id` |
| FK-173 | TABLE-062 | `dues.payment_confirmations.created_by_profile_id` | `identity.user_profiles.id` |
| FK-174 | TABLE-063 | `files.attachments.created_by_profile_id` | `identity.user_profiles.id` |
| FK-175 | TABLE-063 | `files.attachments.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-176 | TABLE-064 | `files.attachment_links.attachment_id` | `files.attachments.id` |
| FK-177 | TABLE-064 | `files.attachment_links.created_by_profile_id` | `identity.user_profiles.id` |
| FK-178 | TABLE-065 | `files.attachment_version_histories.attachment_id` | `files.attachments.id` |
| FK-179 | TABLE-065 | `files.attachment_version_histories.changed_by_profile_id` | `identity.user_profiles.id` |
| FK-180 | TABLE-066 | `notify.notification_messages.service_request_id` | `requests.service_requests.id` |
| FK-181 | TABLE-066 | `notify.notification_messages.balagh_id` | `balaghat.balaghs.id` |
| FK-182 | TABLE-066 | `notify.notification_messages.payment_notice_id` | `dues.payment_notices.id` |
| FK-183 | TABLE-066 | `notify.notification_messages.template_id` | `notify.notification_templates.id` |
| FK-184 | TABLE-066 | `notify.notification_messages.channel_config_id` | `notify.notification_channel_configurations.id` |
| FK-185 | TABLE-066 | `notify.notification_messages.recipient_profile_id` | `identity.user_profiles.id` |
| FK-186 | TABLE-066 | `notify.notification_messages.created_by_profile_id` | `identity.user_profiles.id` |
| FK-187 | TABLE-067 | `notify.delivery_attempts.notification_message_id` | `notify.notification_messages.id` |
| FK-188 | TABLE-068 | `notify.delivery_retries.delivery_attempt_id` | `notify.delivery_attempts.id` |
| FK-189 | TABLE-069 | `notify.notification_templates.created_by_profile_id` | `identity.user_profiles.id` |
| FK-190 | TABLE-069 | `notify.notification_templates.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-191 | TABLE-070 | `notify.notification_channel_configurations.created_by_profile_id` | `identity.user_profiles.id` |
| FK-192 | TABLE-070 | `notify.notification_channel_configurations.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-193 | TABLE-071 | `notify.notification_read_states.notification_message_id` | `notify.notification_messages.id` |
| FK-194 | TABLE-071 | `notify.notification_read_states.recipient_profile_id` | `identity.user_profiles.id` |
| FK-195 | TABLE-072 | `notify.notification_outbox_messages.notification_message_id` | `notify.notification_messages.id` |
| FK-196 | TABLE-073 | `imports.import_batches.created_by_profile_id` | `identity.user_profiles.id` |
| FK-197 | TABLE-073 | `imports.import_batches.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-198 | TABLE-074 | `imports.import_previews.import_batch_id` | `imports.import_batches.id` |
| FK-199 | TABLE-074 | `imports.import_previews.created_by_profile_id` | `identity.user_profiles.id` |
| FK-200 | TABLE-075 | `imports.import_validation_results.import_batch_id` | `imports.import_batches.id` |
| FK-201 | TABLE-075 | `imports.import_validation_results.created_by_profile_id` | `identity.user_profiles.id` |
| FK-202 | TABLE-076 | `imports.import_row_results.import_batch_id` | `imports.import_batches.id` |
| FK-203 | TABLE-076 | `imports.import_row_results.created_by_profile_id` | `identity.user_profiles.id` |
| FK-204 | TABLE-077 | `imports.import_errors.import_row_result_id` | `imports.import_row_results.id` |
| FK-205 | TABLE-077 | `imports.import_errors.created_by_profile_id` | `identity.user_profiles.id` |
| FK-206 | TABLE-078 | `imports.import_approvals.import_batch_id` | `imports.import_batches.id` |
| FK-207 | TABLE-078 | `imports.import_approvals.approved_by_profile_id` | `identity.user_profiles.id` |
| FK-208 | TABLE-079 | `imports.import_rejections.import_batch_id` | `imports.import_batches.id` |
| FK-209 | TABLE-079 | `imports.import_rejections.rejected_by_profile_id` | `identity.user_profiles.id` |
| FK-210 | TABLE-080 | `imports.import_failures.import_batch_id` | `imports.import_batches.id` |
| FK-211 | TABLE-081 | `imports.import_commits.import_batch_id` | `imports.import_batches.id` |
| FK-212 | TABLE-081 | `imports.import_commits.committed_by_profile_id` | `identity.user_profiles.id` |
| FK-213 | TABLE-082 | `content.content_items.created_by_profile_id` | `identity.user_profiles.id` |
| FK-214 | TABLE-082 | `content.content_items.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-215 | TABLE-083 | `content.content_revisions.content_item_id` | `content.content_items.id` |
| FK-216 | TABLE-083 | `content.content_revisions.revised_by_profile_id` | `identity.user_profiles.id` |
| FK-217 | TABLE-084 | `content.publication_records.content_item_id` | `content.content_items.id` |
| FK-218 | TABLE-084 | `content.publication_records.content_revision_id` | `content.content_revisions.id` |
| FK-219 | TABLE-084 | `content.publication_records.published_by_profile_id` | `identity.user_profiles.id` |
| FK-220 | TABLE-085 | `content.withdrawal_records.content_item_id` | `content.content_items.id` |
| FK-221 | TABLE-085 | `content.withdrawal_records.withdrawn_by_profile_id` | `identity.user_profiles.id` |
| FK-222 | TABLE-086 | `content.announcement_validity_periods.content_item_id` | `content.content_items.id` |
| FK-223 | TABLE-086 | `content.announcement_validity_periods.created_by_profile_id` | `identity.user_profiles.id` |
| FK-224 | TABLE-086 | `content.announcement_validity_periods.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-225 | TABLE-087 | `audit.audit_events.actor_user_profile_id` | `identity.user_profiles.id` |
| FK-226 | TABLE-087 | `audit.audit_events.actor_staff_profile_id` | `identity.staff_profiles.id` |
| FK-227 | TABLE-088 | `audit.sensitive_change_details.audit_event_id` | `audit.audit_events.id` |
| FK-228 | TABLE-088 | `audit.sensitive_change_details.role_assignment_id` | `identity.role_assignments.id` |
| FK-229 | TABLE-089 | `audit.access_security_events.auth_user_id` | `auth.users.id MANAGED_SCHEMA_FK` |
| FK-230 | TABLE-089 | `audit.access_security_events.user_profile_id` | `identity.user_profiles.id` |
| FK-231 | TABLE-090 | `reporting.domain_event_history_records.projection_definition_id` | `reporting.reporting_projection_definitions.id` |
| FK-232 | TABLE-091 | `reporting.reporting_projection_definitions.created_by_profile_id` | `identity.user_profiles.id` |
| FK-233 | TABLE-091 | `reporting.reporting_projection_definitions.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-234 | TABLE-092 | `reporting.saved_report_filters.user_profile_id` | `identity.user_profiles.id` |
| FK-235 | TABLE-092 | `reporting.saved_report_filters.created_by_profile_id` | `identity.user_profiles.id` |
| FK-236 | TABLE-092 | `reporting.saved_report_filters.updated_by_profile_id` | `identity.user_profiles.id` |
| FK-237 | TABLE-093 | `reporting.report_export_records.projection_definition_id` | `reporting.reporting_projection_definitions.id` |
| FK-238 | TABLE-093 | `reporting.report_export_records.requested_by_user_profile_id` | `identity.user_profiles.id` |

> REL-069: **no** Due-Receipt FK is declared. Allocation remains application-only pending DM-22 **يحتاج اعتماد لاحق**.

### Unique constraints (UQ-*)

| Constraint ID | TABLE ID | Column / key | Uniqueness rule |
| --- | --- | --- | --- |
| UQ-001 | TABLE-001 | `identity.user_profiles.auth_user_id` | UNIQUE |
| UQ-002 | TABLE-002 | `identity.staff_profiles.user_profile_id` | UNIQUE |
| UQ-003 | TABLE-002 | `identity.staff_profiles.staff_code` | UNIQUE NULLS DISTINCT PROPOSED |
| UQ-004 | TABLE-003 | `identity.roles.code` | UNIQUE |
| UQ-005 | TABLE-004 | `identity.permissions.code` | UNIQUE |
| UQ-006 | TABLE-008 | `registry.taxpayers.public_ref` | UNIQUE NULLS DISTINCT PROPOSED |
| UQ-007 | TABLE-010 | `registry.taxpayer_account_links.public_ref` | UNIQUE NULLS DISTINCT PROPOSED |
| UQ-008 | TABLE-012 | `legal.legal_entities.public_ref` | UNIQUE NULLS DISTINCT PROPOSED |
| UQ-009 | TABLE-013 | `legal.tax_numbers.tax_number_value` | uniqueness يحتاج اعتماد لاحق |
| UQ-010 | TABLE-014 | `masterdata.commercial_activities.public_ref` | UNIQUE NULLS DISTINCT PROPOSED |
| UQ-011 | TABLE-015 | `masterdata.branches.public_ref` | UNIQUE NULLS DISTINCT PROPOSED |
| UQ-012 | TABLE-018 | `masterdata.properties.public_ref` | UNIQUE NULLS DISTINCT PROPOSED |
| UQ-013 | TABLE-019 | `masterdata.property_units.public_ref` | UNIQUE NULLS DISTINCT PROPOSED |
| UQ-014 | TABLE-023 | `requests.service_types.code` | UNIQUE |
| UQ-015 | TABLE-024 | `requests.service_requests.public_ref` | UNIQUE NULLS DISTINCT PROPOSED |
| UQ-016 | TABLE-024 | `requests.service_requests.idempotency_key` | scoped UNIQUE PROPOSED |
| UQ-017 | TABLE-028 | `requests.request_form_snapshot_payloads.request_form_snapshot_id` | UNIQUE PROPOSED |
| UQ-018 | TABLE-032 | `requests.request_completion_responses.completion_request_id` | UNIQUE PROPOSED |
| UQ-019 | TABLE-033 | `requests.request_decision_records.service_request_id` | UNIQUE PROPOSED |
| UQ-020 | TABLE-037 | `balaghat.balaghs.public_ref` | UNIQUE NULLS DISTINCT PROPOSED |
| UQ-021 | TABLE-037 | `balaghat.balaghs.idempotency_key` | scoped UNIQUE PROPOSED |
| UQ-022 | TABLE-041 | `balaghat.balagh_form_snapshot_payloads.balagh_form_snapshot_id` | UNIQUE PROPOSED |
| UQ-023 | TABLE-045 | `balaghat.balagh_completion_responses.completion_request_id` | UNIQUE PROPOSED |
| UQ-024 | TABLE-046 | `balaghat.balagh_decision_records.balagh_id` | UNIQUE PROPOSED |
| UQ-025 | TABLE-050 | `visits.field_visits.public_ref` | UNIQUE NULLS DISTINCT PROPOSED |
| UQ-026 | TABLE-053 | `visits.visit_results.field_visit_id` | UNIQUE PROPOSED |
| UQ-027 | TABLE-056 | `dues.payment_dues.public_ref` | UNIQUE NULLS DISTINCT PROPOSED |
| UQ-028 | TABLE-059 | `dues.payment_notices.public_ref` | UNIQUE NULLS DISTINCT PROPOSED |
| UQ-029 | TABLE-060 | `dues.payment_receipts.public_ref` | UNIQUE NULLS DISTINCT PROPOSED |
| UQ-030 | TABLE-066 | `notify.notification_messages.idempotency_key` | scoped UNIQUE PROPOSED |
| UQ-031 | TABLE-069 | `notify.notification_templates.code` | UNIQUE |
| UQ-032 | TABLE-070 | `notify.notification_channel_configurations.channel_code` | UNIQUE PROPOSED |
| UQ-033 | TABLE-072 | `notify.notification_outbox_messages.idempotency_key` | scoped UNIQUE PROPOSED |
| UQ-034 | TABLE-073 | `imports.import_batches.public_ref` | UNIQUE NULLS DISTINCT PROPOSED |
| UQ-035 | TABLE-073 | `imports.import_batches.idempotency_key` | scoped UNIQUE PROPOSED |
| UQ-036 | TABLE-081 | `imports.import_commits.import_batch_id` | UNIQUE PROPOSED |
| UQ-037 | TABLE-082 | `content.content_items.public_ref` | UNIQUE NULLS DISTINCT PROPOSED |
| UQ-038 | TABLE-091 | `reporting.reporting_projection_definitions.code` | UNIQUE |
| UQ-039 | TABLE-094 | `audit.domain_event_outbox.event_id` | UNIQUE |
| UQ-040 | TABLE-094 | `audit.domain_event_outbox.idempotency_key` | scoped UNIQUE PROPOSED |

Additional composite UNIQUE proposals (not separate COL uniqueness cells):

| Constraint ID | TABLE ID | Columns | Rule |
| --- | --- | --- | --- |
| UQ-C01 | TABLE-006 | `role_id, permission_id, effective_from` | UNIQUE PROPOSED |
| UQ-C02 | TABLE-021 | `ownership_record_id, property_unit_id` | UNIQUE PROPOSED CONDITIONAL |
| UQ-C03 | TABLE-052 | `field_visit_id, staff_profile_id, effective_from` | UNIQUE PROPOSED |
| UQ-C04 | TABLE-071 | `notification_message_id, recipient_profile_id` | UNIQUE PROPOSED |
| UQ-C05 | TABLE-076 | `import_batch_id, row_number` | UNIQUE PROPOSED |

### Check constraints (CK-*)

| Constraint ID | TABLE ID | Column | Check |
| --- | --- | --- | --- |
| CK-001 | TABLE-002 | `identity.staff_profiles.effective_to` | effective_to > effective_from PROPOSED |
| CK-002 | TABLE-005 | `identity.role_assignments.effective_to` | effective_to > effective_from PROPOSED |
| CK-003 | TABLE-006 | `identity.role_permissions.effective_to` | effective_to > effective_from PROPOSED |
| CK-004 | TABLE-010 | `registry.taxpayer_account_links.effective_to` | effective_to > effective_from PROPOSED |
| CK-005 | TABLE-011 | `registry.taxpayer_legal_entity_associations.effective_to` | effective_to > effective_from PROPOSED |
| CK-006 | TABLE-027 | `requests.request_form_snapshots.snapshot_version` | snapshot_version >= 1 PROPOSED |
| CK-007 | TABLE-034 | `requests.request_decision_revisions.revision_number` | revision_number >= 1 PROPOSED |
| CK-008 | TABLE-040 | `balaghat.balagh_form_snapshots.snapshot_version` | snapshot_version >= 1 PROPOSED |
| CK-009 | TABLE-047 | `balaghat.balagh_decision_revisions.revision_number` | revision_number >= 1 PROPOSED |
| CK-010 | TABLE-051 | `visits.visit_schedules.revision_number` | revision_number >= 1 PROPOSED |
| CK-011 | TABLE-056 | `dues.payment_dues.amount` | amount >= 0 PROPOSED |
| CK-012 | TABLE-058 | `dues.due_corrections.prior_amount` | prior_amount >= 0 PROPOSED |
| CK-013 | TABLE-058 | `dues.due_corrections.new_amount` | new_amount >= 0 PROPOSED |
| CK-014 | TABLE-059 | `dues.payment_notices.notice_amount` | notice_amount >= 0 PROPOSED |
| CK-015 | TABLE-060 | `dues.payment_receipts.amount` | amount >= 0 PROPOSED |
| CK-016 | TABLE-062 | `dues.payment_confirmations.amount_confirmed` | amount_confirmed >= 0 PROPOSED |
| CK-017 | TABLE-063 | `files.attachments.logical_file_size_bytes` | logical_file_size_bytes >= 0 PROPOSED |
| CK-018 | TABLE-063 | `files.attachments.version_number` | version_number >= 1 PROPOSED |
| CK-019 | TABLE-065 | `files.attachment_version_histories.version_number` | version_number >= 1 PROPOSED |
| CK-020 | TABLE-067 | `notify.delivery_attempts.attempt_number` | attempt_number >= 1 PROPOSED |
| CK-021 | TABLE-068 | `notify.delivery_retries.retry_number` | retry_number >= 1 PROPOSED |
| CK-022 | TABLE-072 | `notify.notification_outbox_messages.attempt_count` | attempt_count >= 0 PROPOSED |
| CK-023 | TABLE-074 | `imports.import_previews.row_count_previewed` | row_count_previewed >= 0 PROPOSED |
| CK-024 | TABLE-075 | `imports.import_validation_results.error_count` | error_count >= 0 PROPOSED |
| CK-025 | TABLE-076 | `imports.import_row_results.row_number` | row_number >= 1 PROPOSED |
| CK-026 | TABLE-083 | `content.content_revisions.revision_number` | revision_number >= 1 PROPOSED |
| CK-027 | TABLE-086 | `content.announcement_validity_periods.valid_to` | valid_to > valid_from PROPOSED |
| CK-028 | TABLE-093 | `reporting.report_export_records.row_count` | row_count >= 0 PROPOSED |
| CK-029 | TABLE-094 | `audit.domain_event_outbox.attempt_count` | attempt_count >= 0 PROPOSED |

Additional table-level CHECK proposals:

| Constraint ID | TABLE ID | Check |
| --- | --- | --- |
| CK-T01 | TABLE-050 | Exactly one of `service_request_id` / `balagh_id` is NOT NULL PROPOSED (DMOD-08) |
| CK-T02 | TABLE-056 | Case XOR: not both `service_request_id` and `balagh_id` set PROPOSED (DM-09) |

## Summary totals

| Metric | Exact count |
| --- | ---: |
| Physical columns (COL-*) | 894 |
| Primary keys (PK-*) | 94 |
| Foreign keys (FK-*) | 238 |
| Unique constraints (UQ-*) | 45 |
| Check constraints (CK-*) | 31 |
| JSONB columns | 13 |
| Tables covered (TABLE-001...TABLE-094) | 94 |

## Explicit exclusions

| Exclusion | Rationale |
| --- | --- |
| Due-Receipt allocation FK / `due_receipt_links` | REL-069 application-only; DM-22 **يحتاج اعتماد لاحق** |
| Payment gateway / PSP / settlement columns | Out of scope |
| Executable SQL | Documentation-only catalogue |
| `auth.users`, `storage.objects` as TABLE IDs | Supabase-managed; referenced only via MANAGED_SCHEMA_FK where needed |
