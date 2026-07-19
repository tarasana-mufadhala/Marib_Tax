# Marib Tax Worker

Source-only background worker foundation governed by ADR-007 and ADR-015.

The worker is disabled by default and has no database, SMS, OTP, push, provider, credential, or production connection. Setting `WORKER_ENABLED=true` still fails closed until a reviewed queue repository and delivery adapter are explicitly registered.

Delivery uses `NotificationProviderPort` (`disabled` | `twilio` | `local` | `whatsapp_api`). Twilio is build/test intent only; no real external send is authorized until a separate production communication approval.
