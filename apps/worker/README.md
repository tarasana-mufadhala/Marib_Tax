# Marib Tax Worker

Source-only background worker foundation governed by ADR-007.

The worker is disabled by default and has no database, SMS, OTP, push, provider, credential, or production connection. Setting `WORKER_ENABLED=true` still fails closed until a reviewed queue repository and delivery adapter are explicitly registered.
