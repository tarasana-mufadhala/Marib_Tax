# MARIB-TAX-LOGICAL-ERD-01

**Status:** Logical ERD; the relationship catalog is authoritative. Due–Receipt business cardinality is unresolved — **يحتاج اعتماد لاحق**.

```mermaid
erDiagram
  AuthenticationIdentity ||--o| UserProfile : authenticates
  UserProfile ||--o{ TaxpayerAccountLink : has
  TaxpayerAccountLink }o--|| Taxpayer : links
  Taxpayer ||--o{ TaxpayerLegalEntityAssociation : has
  TaxpayerLegalEntityAssociation }o--|| LegalEntity : relates
  Taxpayer ||--o{ TaxNumber : has
  Property ||--o{ PropertyOwnershipRecord : has
  Taxpayer ||--o{ PropertyOwnershipRecord : holds
  PropertyOwnershipRecord ||--o{ PropertyOwnershipHistory : preserves
```

```mermaid
erDiagram
  ServiceRequest ||--o{ RequestSelectedActivity : selects
  RequestSelectedActivity ||--o{ RequestSelectedBranch : may_have
  RequestSelectedBranch }o--|| RequestSelectedActivity : belongs_to
  ServiceRequest ||--o{ RequestAssignmentHistory : has
  RequestAssignmentHistory }o--|| StaffProfile : references
  ServiceRequest ||--o| RequestDecisionRecord : has
  RequestDecisionRecord ||--o{ RequestDecisionRevision : revises
  BusinessNotificationBalagh ||--o{ BalaghSelectedActivity : selects
  BalaghSelectedActivity ||--o{ BalaghSelectedBranch : may_have
  BalaghSelectedBranch }o--|| BalaghSelectedActivity : belongs_to
  BusinessNotificationBalagh ||--o{ BalaghAssignmentHistory : has
  BalaghAssignmentHistory }o--|| StaffProfile : references
  BusinessNotificationBalagh ||--o| BalaghDecisionRecord : has
  BalaghDecisionRecord ||--o{ BalaghDecisionRevision : revises
```

```mermaid
erDiagram
  FieldVisit ||--o{ VisitTeamMember : has
  VisitTeamMember }o--|| StaffProfile : references
  PaymentNotice ||--o{ NotificationMessage : optional_context
  NotificationMessage ||--o{ NotificationReadState : records
  ReportExportRecord }o--|| UserProfile : requested_by
```

**Due–Receipt note (no Mermaid edge):** Due–Receipt business cardinality is unresolved. **يحتاج اعتماد لاحق**. Payment Confirmation still requires an accepted Payment Receipt. Receipt correction/replacement history is retained. No gateway, payment provider, or settlement integration is modeled.

Property authority is Activities and Branches; a direct Taxpayer-to-Property view is derived from active ownership records. Request and Balagh children are parallel concrete families owned by their respective modules. Branch-scoped effects apply only to the selected Branch; unrelated branches remain unchanged (IR-72).
