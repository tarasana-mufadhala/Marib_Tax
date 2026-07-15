# MARIB-TAX-LOGICAL-DATA-MODEL-01

**Status:** Logical data model, not a physical schema. All unresolved matters are **يحتاج اعتماد لاحق**.

Activities and Branches authoritatively owns Activity, Branch, Property, Property Unit, and Property Ownership data.
Taxpayer-to-Property navigation is derived, non-authoritative, and based only on active Property Ownership Records.

Branch-scoped stop, reactivation, or address-change effects apply only to the selected Branch; unrelated branches of the same Commercial Activity remain unchanged unless an activity-wide effect is explicitly authorized (IR-72).

## Entity catalog

| Owner | Logical entities | Critical logical boundary |
| --- | --- | --- |
| Identity and Access | Authentication Identity; User Profile; Staff Profile; Role; Permission; Role Assignment; Role Permission; Sensitive Permission Change | Identity authenticates optional profile; profile may represent Staff Profile. |
| Taxpayer Registry | Taxpayer; Taxpayer Contact; Taxpayer Account Link (ربط حساب المستخدم بملف المكلّف); Taxpayer Legal-Entity Association | Own-data path: Authentication Identity → User Profile → Account Link → Taxpayer. Association links taxpayer to Legal Entity master data without Legal Entities mutating the association. Multiple-taxpayer policy **يحتاج اعتماد لاحق**. |
| Legal Entities | Legal Entity; Tax Number | Tax Number is owned here (not by Taxpayer Registry). Taxpayer Registry may display/read it; duplicates remain a data-quality concern; uniqueness **يحتاج اعتماد لاحق**. |
| Activities and Branches | Commercial Activity; Branch; Activity Address; Activity Status History; Property; Property Unit; Property Ownership Record; Property Ownership History | Ownership Record is the authoritative taxpayer/property relation. Validates target scope before applying effects. |
| Service Requests | Service Type; Service Request; Request Selected Activity; Request Selected Branch; Request Form/Data Snapshot; Request Status History; Request Assignment History; Request Completion Request; Request Completion Response; Request Decision Record; Request Decision Revision; Request Close/Archive Record; Request Reopen Record | Request-prefixed children belong solely to a request instance. Request Selected Branch belongs to Request Selected Activity (REL-028). Decision value object is embedded in Decision Record and not separately counted. |
| Business Notifications / Balaghat | Business Notification / Balagh; Balagh Selected Activity; Balagh Selected Branch; Balagh Form/Data Snapshot; Balagh Status History; Balagh Assignment History; Balagh Completion Request; Balagh Completion Response; Balagh Decision Record; Balagh Decision Revision; Balagh Close/Archive Record; Balagh Reopen Record | Balagh-prefixed children belong solely to a Balagh instance. Balagh Selected Branch belongs to Balagh Selected Activity (REL-044). Multiple activities allowed; no direct Activity/Branch/Property mutation. |
| Field Visits | Field Visit; Visit Schedule; Visit Team Member; Visit Result; Visit Result Correction; Visit Evidence | Visit Team Member references eligible Staff Profile. |
| Dues and Payment Evidence | Payment Due; Due Basis Document Reference; Due Correction; Payment Notice; Payment Receipt; Receipt Correction/Replacement; Payment Confirmation | Due–Receipt business cardinality **يحتاج اعتماد لاحق** (no fixed Mermaid edge). Confirmation requires accepted receipt; payment is not final approval; manual model only. |
| Attachments and Private Files | Attachment; Attachment Link; Attachment Access Classification; Attachment Version/Replacement History | Includes logical file size, media/content classification, storage accounting category, current-version indicator, storage status, deletion/retention status. |
| Notification Delivery | Notification Message; Delivery Attempt; Delivery Retry; Notification Template/Type; Notification Channel Configuration; Notification Read State | Optional Payment Notice context; Read State is recipient/profile-specific. |
| Imports and Data Quality | Import Batch; Import Preview; Import Validation Result; Import Row Result; Import Error; Import Approval; Import Rejection; Import Failure; Import Commit | Separate retained lifecycle records. |
| Reporting and Analytics | Domain Event History Record; Reporting Projection Definition; Saved Report Filter; Report Export Record | Derived projections; export references User Profile. |
| Content Management | Content Item; Content Revision; Publication Record; Withdrawal Record; Announcement Validity Period | Public attachment context only with approved publication and no sensitive data. |
| Audit and Security | Audit Event; Sensitive Change Detail; Actor Context; Access/Security Event | Append-only supporting evidence, never decision owner. |

## Taxpayer Account Link — principal logical attributes

Arabic business meaning: ربط حساب المستخدم بملف المكلّف.

Owning module: Taxpayer Registry.

Principal logical attributes (no physical fields or enums):

- linked User Profile reference;
- linked Taxpayer reference;
- relationship/authority type;
- active/inactive state;
- verification status;
- effective start;
- effective end where applicable;
- approval actor;
- revocation actor where applicable;
- reason/reference;
- history requirement (grant/revoke and verification changes).

Clarifications:

- the link is the basis of own-data authorization;
- matching phone number or tax number is not sufficient authorization proof;
- account linkage does not grant staff role permissions;
- delegation and multiplicity remain **يحتاج اعتماد لاحق** (DM-21).

## Notification Read State — principal logical attributes

Owning module: Notification Delivery.

Principal logical attributes (no physical fields or tracking technology):

- Notification Message reference;
- recipient or account context;
- unread/read status;
- first-read timestamp;
- latest acknowledgement timestamp where applicable;
- read-state source/channel at a conceptual level;
- actor/account reference;
- history/audit expectation.

Clarifications:

- delivery status and read status are separate;
- a delivered message may remain unread;
- not every channel guarantees read confirmation;
- unsupported read confirmation remains unknown rather than assumed;
- exact channel behavior remains **يحتاج اعتماد لاحق** (DM-25).

## Finality and effects

- Manager final action is distinct from reviewer recommendation; reviewer, payment-officer, and field-officer actions are non-final.
- Request/Balagh effects occur only after approval by their owning workflow; Activities and Branches applies authoritative Activity/Branch/Property effects and audits target scope (IR-72).
- Material commands and imports retain idempotency/deduplication disposition and correlation where available.

## Entity count summary

| Module | Count |
| --- | ---: |
| Identity and Access | 8 |
| Taxpayer Registry | 4 |
| Legal Entities | 2 |
| Activities and Branches | 8 |
| Service Requests | 13 |
| Business Notifications / Balaghat | 12 |
| Field Visits | 6 |
| Dues and Payment Evidence | 7 |
| Attachments and Private Files | 4 |
| Notification Delivery | 6 |
| Imports and Data Quality | 9 |
| Reporting and Analytics | 4 |
| Content Management | 5 |
| Audit and Security | 4 |
| **Total** | **92** |

**Relationship catalog:** 100 (REL-001 through REL-100). **Integrity rules:** 72 (IR-01 through IR-72).
