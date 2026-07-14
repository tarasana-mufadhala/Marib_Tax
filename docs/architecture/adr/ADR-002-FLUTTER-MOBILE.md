# ADR-002: Flutter Mobile

- **Status:** Accepted
- **Date:** 2026-07-14

## Context

Taxpayers need a mobile application for Marib Tax services. Android is the initial target platform; iOS support is a future requirement.

## Decision

Build the taxpayer mobile application with **Flutter**, located at `apps/mobile`, designed for future iOS support. Flutter is **not** part of the pnpm workspace.

## Consequences

- Single codebase for Android-first delivery with a path to iOS.
- Mobile remains a client of the NestJS API; it does not own business rules.
- Separate toolchain (Dart/Flutter) must be inventoried and managed independently of Node workspaces.

## Guardrails

- No service-role or privileged secrets in the mobile app.
- Secure token storage is mandatory.
- Arabic RTL is first-class.
- Feature-first Flutter architecture; no direct operational database writes (ADR-010).
