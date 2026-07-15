# Marib Tax System — FR-201…FR-206 Field Rules 01

**Document ID:** MARIB-TAX-FR-201-206-FIELD-RULES-01
**Status:** Compact field/business-datum rules (no DB field names, lengths, regex, or invented attachments)

Editable stages (conceptual): `draft` · `need_more_info` · `staff_correction` (authorized only).

---

## FR-201 — إخطار إيقاف نشاط (Activity stoppage)

| Field / datum | Req / Opt / Cond | Entered by | Editable stages | Validation rule | Sensitive | Evidence | Audit | Unresolved |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Selected activities (one or more) | Required | Taxpayer | draft; NMI | ≥1 activity | Low | — | Y on change | — |
| Selected branch | Conditional | Taxpayer | draft; NMI | Valid branch of taxpayer/entity | Low | — | Y | When mandatory by config: **يحتاج اعتماد لاحق** |
| Stoppage type (temporary \| final) | Required | Taxpayer | draft; NMI | One of two values | Low | — | Y | — |
| Stoppage reason | Required | Taxpayer | draft; NMI | Non-empty structured/free per catalog | Med | — | Y | Reason catalog **يحتاج اعتماد لاحق** |
| Supporting attachments | Optional | Taxpayer | draft; NMI | Private files | Med | Optional | Y upload | Types **يحتاج اعتماد لاحق** |
| Field visit | Conditional | Staff | visit flow | Per service config | Med | Visit evidence | Y | Triggers **يحتاج اعتماد لاحق** |
| Final decision reason + reference | Required at final | Manager/Director | decision | Non-empty reason+reference | Med | — | Y + history | — |

---

## FR-202 — إخطار خروج مستأجر أو إخلاء عقار

| Field / datum | Req / Opt / Cond | Entered by | Editable stages | Validation rule | Sensitive | Evidence | Audit | Unresolved |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Property data | Required | **Taxpayer** | draft; NMI | Present conceptual property description/ids as configured | Med | — | Y | Master geo structure **يحتاج اعتماد لاحق** |
| Tenant count | Conditional | Taxpayer | draft; NMI | Non-negative integer when relevant | Low | — | Y | When required: **يحتاج اعتماد لاحق** |
| Tenant identity details | **Not required / out of scope** | — | — | Must not require | — | — | — | — |
| Detailed rental/evacuation data | **Out of scope** | — | — | Must not require | — | — | — | — |
| Field visit | Conditional | Staff | visit flow | Config | Med | Visit evidence | Y | Triggers **يحتاج اعتماد لاحق** |
| Final decision reason + reference | Required at final | Manager/Director | decision | Reason+reference | Med | — | Y | — |

---

## FR-203 — إخطار خروج عامل

| Field / datum | Req / Opt / Cond | Entered by | Editable stages | Validation rule | Sensitive | Evidence | Audit | Unresolved |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Worker count | Required | Taxpayer | draft; NMI | Positive/non-negative per policy | Low | — | Y | — |
| Worker identity details | **Not required / out of scope** | — | — | Must not require | — | — | — | — |
| Field visit | Conditional | Staff | visit flow | Config | Med | Visit evidence | Y | Triggers **يحتاج اعتماد لاحق** |
| Final decision reason + reference | Required at final | Manager/Director | decision | Reason+reference | Med | — | Y | — |

---

## FR-204 — إخطار تغيير عنوان النشاط

| Field / datum | Req / Opt / Cond | Entered by | Editable stages | Validation rule | Sensitive | Evidence | Audit | Unresolved |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Activities and/or branches (one or more) | Required | Taxpayer | draft; NMI | ≥1 | Low | — | Y | — |
| Specific branch selection | Conditional | Taxpayer | draft; NMI | Valid branch | Low | — | Y | — |
| Change scope | Required | System/Taxpayer | draft | **Address only** (not trade name; not activity type) | Low | — | Y | — |
| Previous address (shown) | Required display | System | draft; NMI (correctable) | Displayed; taxpayer may correct | Med | — | Y corrections | — |
| New district | Required | Taxpayer | draft; NMI | Non-empty | Low | — | Y | — |
| New street | Required | Taxpayer | draft; NMI | Non-empty | Low | — | Y | — |
| Move date | **Not required** | — | — | Must not require | — | — | — | — |
| Area/neighborhood | **Not required** | Optional if offered | draft | Optional | Low | — | C | — |
| Building/shop number | **Not required** | Optional | draft | Optional | Low | — | C | — |
| Landmark | **Not required** | Optional | draft | Optional | Low | — | C | — |
| Map location | Optional (recommended) | Taxpayer | draft; NMI | Optional coordinates/ref | Med | — | C | — |
| Proof document | Optional | Taxpayer | draft; NMI | Optional private file | Med | Optional | Y if uploaded | — |
| Final decision reason + reference | Required at final | Manager/Director | decision | Reason+reference | Med | — | Y | — |

---

## FR-205 — إخطار نقل ملكية عقار

| Field / datum | Req / Opt / Cond | Entered by | Editable stages | Validation rule | Sensitive | Evidence | Audit | Unresolved |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Concise seller data | Required | Taxpayer | draft; NMI | Concise set only | High | — | Y | Exact fields **يحتاج اعتماد لاحق** |
| Concise buyer data | Required | Taxpayer | draft; NMI | Concise set only | High | — | Y | Exact fields **يحتاج اعتماد لاحق** |
| Property units (one or more) | Required | Taxpayer | draft; NMI | ≥1 unit | Med | — | Y | — |
| Mandatory attachments list | **Open** | — | — | **Do not invent** | High | — | Y when attached | **يحتاج اعتماد لاحق من المكتب** |
| Optional attachments | Optional until list fixed | Taxpayer | draft; NMI | Private | High | — | Y | — |
| Final decision reason + reference | Required at final | Manager/Director | decision | Reason+reference | Med | — | Y | — |

---

## FR-206 — إخطار تفعيل نشاط موقوف

| Field / datum | Req / Opt / Cond | Entered by | Editable stages | Validation rule | Sensitive | Evidence | Audit | Unresolved |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Stopped activities (one or more) | Required | Taxpayer | draft; NMI | Must be currently stopped | Low | — | Y | — |
| Reactivation reason | Required | Taxpayer | draft; NMI | Non-empty | Med | — | Y | Reason catalog **يحتاج اعتماد لاحق** |
| Attachments | Optional | Taxpayer | draft; NMI | Optional | Med | Optional | Y if uploaded | Do not invent mandatory set |
| Field visit | Conditional | Staff | visit flow | Config | Med | Visit evidence | Y | Triggers **يحتاج اعتماد لاحق** |
| Final decision reason + reference | Required at final | Manager/Director | decision | Reason+reference | Med | — | Y | — |

---

## Cross-form notes

- Do not invent database names, max lengths, file-size limits, validation regex, or government ID integrations.
- Submitted data changes only via authorized NMI/correction.
- Taxpayer cannot delete/cancel after submit.
