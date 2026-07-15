# MARIB-TAX-LOGICAL-INTEGRITY-RULES-01

**Status:** Logical integrity rules for authorized NestJS workflows; no physical implementation is prescribed. Every unresolved rule is **يحتاج اعتماد لاحق**.

1. **IR-01 — Authoritative writes.** Clients do not write business, history, audit, reporting, or attachment records directly.
2. **IR-02 — Module ownership.** Only the designated owner materially changes its logical entity through an authorized workflow.
3. **IR-03 — Stable internal identity.** Each logical record has one immutable internal identity distinct from public references.
4. **IR-04 — Public references.** A public reference identifies only its issued record and is never reused.
5. **IR-05 — Reference is not ownership.** A reference neither proves ownership nor authorizes access.
6. **IR-06 — Correlation separation.** Correlation and idempotency/deduplication identifiers are not business references.
7. **IR-07 — Identity/profile cardinality.** An identity has at most one profile; a profile has at most one staff profile.
8. **IR-08 — Effective authorization.** Active role, permission, and assignment state is required for an authorized action.
9. **IR-09 — Sensitive authorization trace.** Material role/permission change creates immutable sensitive-change and/or audit evidence.
10. **IR-10 — Taxpayer contact association.** A contact belongs to one taxpayer and reassignment preserves governed history.
11. **IR-11 — Tax-number optionality and quality.** Tax Number may be absent; duplicate handling and uniqueness enforcement are **يحتاج اعتماد لاحق**.
12. **IR-12 — Legal association history.** A Taxpayer Legal-Entity Association identifies one taxpayer and legal entity with effective history.
13. **IR-13 — Activity and branch ownership.** A Branch belongs to one Commercial Activity within Activities and Branches.
14. **IR-14 — Address applicability.** An address is linked only to its authorized Activity and/or Branch context.
15. **IR-15 — Activity status history.** A material activity status change creates immutable Activity Status History.
16. **IR-16 — Property lineage.** Property Unit belongs to one Property; ownership changes preserve record and immutable history.
17. **IR-17 — Request classification.** A Service Request references an active Service Type at classification; retirement preserves historic meaning.
18. **IR-18 — Instance origin.** Each Service Request and Balagh belongs to one submitting Taxpayer through authorized workflow.
19. **IR-19 — Separate instance families.** Request-prefixed children belong only to Service Requests; Balagh-prefixed children belong only to Business Notifications / Balaghat.
20. **IR-20 — Selection is not mutation.** Selected Activity/Branch snapshots do not grant mutation authority over Activity, Branch, or Property.
21. **IR-21 — Submitted-instance preservation.** Submitted requests and Balaghat are retained and cannot be taxpayer-deleted.
22. **IR-22 — Draft deletion.** Draft deletion retention/audit treatment is **يحتاج اعتماد لاحق**.
23. **IR-23 — Immutable status.** Every valid request or Balagh status transition creates immutable family-specific history.
24. **IR-24 — Assignment trace.** Every material request or Balagh assignment change creates immutable family-specific history.
25. **IR-25 — Completion trace.** A completion response remains linked to its completion request and does not erase earlier snapshots.
26. **IR-26 — Decision ownership.** Request Decision Record is owned by Service Requests; Balagh Decision Record is owned by Business Notifications / Balaghat. An embedded decision value object is not a separate entity.
27. **IR-27 — Decision revisions.** A Decision Record is not overwritten; authorized change creates its family-specific Decision Revision.
28. **IR-28 — Administrative lifecycle.** Close/archive and reopen actions create retained family-specific records.
29. **IR-29 — Visit authorization.** A Field Visit is linked to exactly one authorized request or Balagh workflow context.
30. **IR-30 — Visit team eligibility.** Every Visit Team Member references one eligible Staff Profile for the visit period.
31. **IR-31 — Visit scheduling history.** Schedule creation/change/cancellation preserves prior operational trace.
32. **IR-32 — Visit-result correction.** A Visit Result is corrected only by an additive retained correction.
33. **IR-33 — Visit evidence.** Visit Evidence references one authorized visit and follows Attachment classification/access controls.
34. **IR-34 — Due basis.** Every Payment Due has at least one Due Basis Document Reference.
35. **IR-35 — Due correction.** A material due correction creates retained Due Correction with reason and basis.
36. **IR-36 — Receipt lineage.** Receipt correction/replacement preserves original receipt lineage.
37. **IR-37 — Confirmation trace.** Payment Confirmation references its receipt and preserves source/outcome trace.
38. **IR-38 — Attachment independence.** Attachment links do not own business decisions or independently grant file access.
39. **IR-39 — Attachment classification/versioning.** Every Attachment has one classification and preserved replacement/version lineage.
40. **IR-40 — Notification boundary.** Delivery records never decide, alter, or authorize business outcomes.
41. **IR-41 — Delivery attempts.** Attempts and retries are append-only outcomes.
42. **IR-42 — Template historical integrity.** Later template/channel changes do not rewrite historical message context.
43. **IR-43 — Import lifecycle separation.** Preview, validation, row result, error, approval, rejection, failure, and commit remain distinct.
44. **IR-44 — Import sequencing and SoD.** Validation precedes authorized commit; rejection prevents commit; exceptions are **يحتاج اعتماد لاحق**.
45. **IR-45 — Import traceability.** Row outcome/error remains traceable to batch.
46. **IR-46 — Content revisions.** Published content is withdrawn through retained history, not erased.
47. **IR-47 — Audit append-only.** Audit/security facts are append-only; corrections are new events.
48. **IR-48 — Actor context.** Material audit evidence preserves the actor context known at event time.
49. **IR-49 — Reporting derivation.** Projections are non-authoritative and rebuildable from retained source history.
50. **IR-50 — Report export trace.** Export captures authorized attempt/outcome; viewing does not imply exporting.
51. **IR-51 — Own-data boundary.** A taxpayer may access only own authorized data.
52. **IR-52 — Restricted evidence.** Highly Sensitive and Audit Restricted data is masked/withheld absent authorized purpose.
53. **IR-53 — Retention non-assumption.** No duration, attachment format, or external service behavior is assumed.
54. **IR-54 — Finality separation.** Final approval or rejection of a Request or Balagh Decision Record requires Tax Office Manager / Director authority; a Request Reviewer may recommend but cannot issue the final decision; a Decision Revision cannot bypass Manager / Director authority.
55. **IR-55 — Officer non-finality.** Payment Officer and Field Visit Officer cannot issue final case decisions; their evidence and actions remain non-final.
56. **IR-56 — Balagh multi-activity.** A Balagh may select multiple activities; each Balagh Selected Branch must belong to a Balagh Selected Activity.
57. **IR-57 — Balagh subject protection.** A Balagh may reference/snapshot Activity, Branch, or Property but never directly mutates them.
58. **IR-58 — FR-201 stoppage.** One or more activities may be selected; a branch may be selected where applicable; stoppage type is temporary or final; stoppage reason is mandatory.
59. **IR-59 — FR-202 tenant/property evacuation.** Tenant count may be recorded where relevant; tenant identity details are not required; detailed rental/evacuation data is not required.
60. **IR-60 — FR-203 worker departure.** Worker count may be recorded; worker identities are not stored as required case data.
61. **IR-61 — FR-204 address change.** Only address is changed; trade-name and activity-type are not changed by this form; district and street are supported; move date is not mandatory; map and proof are optional; previous address is preserved.
62. **IR-62 — FR-205 ownership transfer.** Concise seller and buyer information is supported; multiple Property Units are supported; the mandatory attachment list remains **يحتاج اعتماد لاحق من المكتب**.
63. **IR-63 — FR-206 reactivation.** Only stopped activities are eligible; one or more activities may be selected; reactivation reason is mandatory; attachments remain optional.
64. **IR-64 — Payment basis and acceptance.** Due requires basis evidence; Payment Confirmation requires an accepted Payment Receipt; Due–Receipt allocation/cardinality remains **يحتاج اعتماد لاحق**.
65. **IR-65 — Payment is not final approval.** Payment confirmation is not final case approval; payment authority does not grant final decision authority.
66. **IR-66 — Master-data effect timing.** Submission, recommendation, visit completion, and payment confirmation do not apply authoritative Activity or Property effects; effects occur only after authorized approval and are applied by Activities and Branches.
67. **IR-67 — Idempotency.** Retrying the same command must not duplicate a case, due, decision, payment confirmation, notification, import commit, or domain event; correlation identifier and business reference remain distinct.
68. **IR-68 — Account-link own data.** Own-data access requires an active verified Taxpayer Account Link on the path Authentication Identity → User Profile → Taxpayer Account Link → Taxpayer; multiple-taxpayer policy is **يحتاج اعتماد لاحق**.
69. **IR-69 — Notification read state.** Notification Read State is tied to one message and authorized recipient/profile context; delivery does not imply reading.
70. **IR-70 — Attachment storage metrics.** Attachment retains logical file size, media/content classification, storage accounting category, current-version indicator, storage status, and deletion/retention status.
71. **IR-71 — Public attachment constraint.** An Attachment may be Public only with approved Content Management publication context and must contain no taxpayer, case, payment, visit, audit, import, or staff-sensitive data. Transaction attachments remain private.
72. **IR-72 — Branch-specific effect isolation.** When a Balagh or approved form targets a specific Branch, the resulting stop, reactivation, or address-change effect applies only to that selected Branch; unrelated branches of the same Commercial Activity remain unchanged. An activity-wide effect requires explicit selection or authorization for the whole activity. The selected Branch must belong to the selected eligible Commercial Activity. Activities and Branches validates the target before applying the effect; Balaghat cannot directly update Branch or Activity records; every applied effect is audited with target scope.

## Count

**Integrity rule count: 72 (IR-01 through IR-72).**
