# MARIB-TAX-REPORT-TO-FIELD-MATRIX-01

**Status:** Approved field-coverage matrix for analytical reports **4–29** (DM-16 / ADR-015).

**Authorization:** `report.view` and `report.export` are separate. Export never follows from view.

**Companions:** `MARIB-TAX-REPORTS-BASELINE-01`, `MARIB-TAX-REPORT-DATA-TRACEABILITY-01`, `MARIB-TAX-REPORTING-PHYSICAL-DESIGN-01`.

## Rules

1. Every approved report lists the **minimum fields** that persistence, history, or derived projections must be able to supply.
2. Masked columns may appear under `report.view` for Report Reader; clear equivalents require elevated clearance and usually `report.export` with audit.
3. Attachment **bytes** are never inline report fields; only metadata/classification/size/status appear.
4. Report **29** fields apply only after an approved analytics integration (FCR-03); until then the row is reserved.
5. Payment reports use manual dues/receipts only; confirmation is not final case approval.

## Shared dimensions (all reports unless marked N/A)

| Field key | Description | view | export |
| --- | --- | --- | --- |
| `generated_at` | Report generation timestamp | Y | Y |
| `generated_by_user_profile_id` | Generating actor | Y | Y |
| `filter_snapshot` | Applied filters | Y | Y |
| `public_ref` / `case_ref` | Request or Balagh reference when case-scoped | Y | Y |
| `taxpayer_display_name` | Masked for Report Reader | masked | clear if granted |
| `taxpayer_phone` | Masked for Report Reader | masked | clear if granted |
| `tax_number_value` | Numeric-text tax number | masked | clear if granted |

## Matrix — reports 4–29

| No. | Report | Required field keys (minimum) | `report.view` | `report.export` |
| ---: | --- | --- | --- | --- |
| 4 | الطلبات المرفوضة والملغاة | `service_type_code`; `status_code`; `decision_outcome_code`; `structured_reason_code`; `reason_notes`; `decided_at`; `deciding_staff_profile_id`; `processing_duration`; `close_archive_reason_code` (admin close); draft-delete marker only if later approved | Y | Separate grant; reason catalogs audited |
| 5 | طلبات استكمال النواقص | `completion_requested_at`; `completion_responded_at`; `missing_or_rejected_document_type`; `return_count`; `assignee_staff_profile_id`; `days_since_last_notification`; `attachment_classification_code` | Y | Metadata/reasons only; no file bytes |
| 6 | البلاغات حسب النوع | `balagh_type_code`; `status_code`; `visit_required_flag`; `opened_at`; `closed_at`; `completion_duration`; `rejection_reason_code`; selected activity/branch ids | Y | Y with masking |
| 7 | نتائج البلاغات | `outcome_code` (approved/rejected/needs_completion/not_verified/closed_without_action/reopened); `decided_at`; `deciding_staff_profile_id`; `balagh_type_code`; revision marker | Y | Restricted basis omitted unless elevated |
| 8 | الأنشطة الموقوفة والمفعلة | `activity_id`; `stoppage_at`; `stoppage_reason_code`; `temporary_or_final`; `reactivated_at`; `stop_to_reactivate_duration`; `tax_number_value`; `address_text`; `taxpayer_id` | Y | Ownership-party clear values restricted |
| 9 | مواعيد النزول الميداني | `visit_id`; `scheduled_for`; `visit_status_code`; `officer_staff_profile_id`; `team_member_staff_profile_ids`; `activity_address_text`; `case_type` (request/balagh); overdue flag | Y | Address/team may require elevation |
| 10 | نتائج الزيارات | `visit_id`; `result_code`; `result_notes`; `completed_at`; `officer_staff_profile_id`; `another_visit_required_flag`; evidence attachment metadata refs; correction lineage flag | Y | Notes/evidence metadata; no auto-generated result |
| 11 | أداء النزول الميداني | `officer_staff_profile_id`; `visits_count`; `on_time_rate`; `avg_delay`; `rescheduled_count`; `resolved_after_visit_count`; `still_pending_count`; period bounds | Y | Aggregate export audited |
| 12 | المكلفون الجدد | `taxpayer_id`; `registered_at`; `registration_channel_code`; `has_tax_number`; `legal_entity_type_code`; `activity_type_code`; `area_code` (when geo exists) | Y | Y with masking |
| 13 | قاعدة المكلفين | `taxpayer_id`; `active_state_code`; `has_tax_number`; `activity_count`; `open_case_count`; `open_dues_flag`; `legal_entity_type_code` | Y | Y with masking |
| 14 | الأنشطة التجارية | `activity_id`; `activity_type_code`; `status_code`; `area_code`; `address_changed_flag`; `taxpayer_id`; branch count | Y | Y with masking |
| 15 | الكيانات القانونية | `legal_entity_id`; `entity_type_code`; `status_code`; linked `taxpayer_id` count | Y | Y |
| 16 | المعاملات المتوقفة بسبب السداد | `case_ref`; `taxpayer_id`; `due_id`; `due_amount`; `currency_code`; `payment_notified_at`; `days_since_notification`; `reminder_sent_flag`; `payment_status_code`; linked `receipt_ids[]` (N receipts/due); `partial_payment_flag`; `admin_confirmed_at`; `confirming_staff_profile_id` | Y | Financial export audited; payer identity not required |
| 17 | رسائل SMS وواتساب | `message_id`; `channel_code`; `notification_type_code`; `delivery_status_code`; `failure_reason_code`; `attempted_at`; `linked_case_ref`; `estimated_cost` (optional); provider port id (not secrets) | Y | No OTP secrets; WhatsApp until enabled = readiness metrics only |
| 18 | رموز التحقق OTP | `otp_event_id`; `channel_code`; `outcome_code` (sent/success/expired/failed); `attempt_count`; `threshold_exceeded_flag`; `registration_success_flag`; timestamps | Y | Audit Restricted; never export raw OTP codes |
| 19 | الإشعارات غير المقروءة | `message_id`; `unread_flag`; `first_read_at`; `age`; `notification_type_code`; `taxpayer_id`; `linked_case_ref`; delivery status distinct from read | Y | Y with masking |
| 20 | المستندات الناقصة أو المرفوضة | `attachment_id` / link id; `classification_code`; `rejection_reason_code`; `service_type_code`; `legal_entity_type_code`; version indicator | Y | Metadata only |
| 21 | التخزين والمرفقات | `attachment_id`; `logical_size_bytes`; `classification_code`; `storage_category_code`; `storage_status_code`; `current_version_flag`; `retention_or_archive_status`; `service_type_code`; growth period | Y | No private bytes |
| 22 | عمليات الاستيراد | `import_batch_id`; `filename`; `imported_at`; `operator_user_profile_id`; `total_rows`; `accepted_rows`; `rejected_rows`; `duplicate_rows`; `approval_status_code`; `commit_status_code` | Y | Y |
| 23 | أخطاء الاستيراد | `import_batch_id`; `row_number`; `field_key`; `invalid_value_masked`; `rejection_reason_code`; `suggested_correction`; error-file export ref | Y | Downloadable error file requires `report.export` |
| 24 | جودة البيانات | `dq_category_code`; `duplicate_phone_flag`; `duplicate_tax_number_flag`; `taxpayer_without_legal_entity_flag`; `activity_without_address_flag`; `missing_mandatory_attachment_flag`; `illogical_state_code`; `orphan_ref`; `changed_after_import_flag` | Y | Clear PII only if elevated + export |
| 25 | سجل التدقيق | `audit_event_id`; `actor_user_profile_id`; `actor_staff_profile_id`; `operation_code`; `affected_record_ref`; `previous_value_masked`; `new_value_masked`; `occurred_at`; `device_or_ip_context` (approved level); `sensitive_reason` | Y | Raw vault values not in standard export |
| 26 | العمليات الحساسة | `sensitive_operation_code`; `previous_value`; `new_value`; `actor_*`; `reason_or_reference`; `correlation_id`; tax-number correction lineage fields; permission-change refs; reopen/import/publish markers | Y restricted | Elevated + `report.export` + audit |
| 27 | الدخول والأمان | `access_event_id`; `outcome_code`; `account_ref`; `occurred_at`; `otp_repeat_flag`; `lock_flag`; `off_hours_flag`; `inactive_account_flag`; password/permission change markers | Y restricted | Elevated export |
| 28 | المحتوى المنشور | `content_item_id`; `content_type_code`; `status_code`; `published_at`; `archived_at`; `validity_start`; `validity_end`; `publishing_staff_profile_id`; `last_updated_at` | Y | Y |
| 29 | استخدام الموقع | Reserved: `visitors`; `page_path`; `service_views`; `form_downloads`; `device_class`; `traffic_source`; `app_download_transition` — only after approved analytics tool | Disabled until FCR-03 | Disabled until FCR-03 |

## Persistence obligations implied by this matrix

| Domain | Must retain for reports |
| --- | --- |
| Tax numbers | Numeric-text value; active uniqueness; correction previous/reason/actor |
| Account links | Single taxpayer per account in v1; grant/revoke history |
| Visits | Staff-entered schedule/result/location only; additive result corrections |
| Dues/receipts | Manual amounts; N receipts per due; partial payments; admin confirmation actor/time; no delete of confirmed receipts |
| Attachments | Classification; archive retention; additive versions |
| Notifications | Channel/delivery/read distinct; provider port identity; no real send required for field presence |
| Authz | Separate grants and export audit rows for `report.export` |

## Still open (not closed by this matrix)

- Exact masking profile maps (PHY-21 detail).
- Timed destruction vs indefinite archive beyond version retention (DM-17).
- Report scheduling / automatic delivery (DMOD-12) — out of MVP.
- Analytics provider selection for report 29 (FCR-03).
