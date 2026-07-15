# Toolchain Inventory — Marib Tax System

**Task:** MARIB-TAX-REPOSITORY-FOUNDATION-01
**Inventory date:** 2026-07-14
**Host OS:** Windows 10 (win32 10.0.26200)
**Method:** Read-only version checks only. No tools were intentionally installed or upgraded for this inventory.

> Note: Invoking `pnpm --version` caused Corepack to download the pnpm distribution automatically on this host. That side effect is recorded below; it was not an intentional project install step.

| Tool | Detected | Version | Required now / later | Recommended next action |
| --- | --- | --- | --- | --- |
| git | Detected | 2.52.0.windows.1 | Required now | Continue using for branch/PR governance |
| node | Detected | v24.12.0 | Later phase (Node workspaces) | Keep available; pin workspace engines when apps are initialized |
| corepack | Detected | 0.34.5 | Later phase | Prefer Corepack to activate the repo `packageManager` field when Node apps start |
| pnpm | Detected | 11.13.0 | Later phase (workspace installs) | Recorded in root `package.json` `packageManager`; do not install app deps until a later task |
| flutter | Detected | 3.38.7 (stable) | Later phase (`apps/mobile`) | Use when Flutter project is initialized; not part of pnpm workspace |
| dart | Detected | 3.10.7 | Later phase (`apps/mobile`) | Bundled with Flutter; no action for foundation |
| java | Detected | OpenJDK 21.0.10 LTS (Temurin) | Later phase (Android builds) | Required later for Android tooling with Flutter |
| docker | Detected | 29.6.1 | Later phase (infra/local stacks) | Use when Docker-based local services are introduced |
| supabase CLI | Available via `npx --yes supabase@2.109.1` (reviewed enablement version; global install not required) | 2.109.1 | Required for DB migrations | Use reviewed versioned `npx` form; see `docs/governance/MARIB-TAX-SUPABASE-CLI-MIGRATION-STANDARD-01.md` |
| VS Code (`code`) | Detected | 1.117.0 | Optional | Optional editor tooling |
| Cursor (`cursor`) | Detected | 3.10.11 | Optional (agent/editor) | Project rules under `.cursor/rules` apply in Cursor |
| bash (Git Bash) | Detected | GNU bash 5.2.37(1)-release (x86_64-pc-msys) | Required now (foundation script / CI parity on Windows) | Use `C:\Program Files\Git\bin\bash.exe` to run `scripts/validate-foundation.sh` on Windows |

## Summary

- Foundation validation can run locally via Git Bash.
- Node/pnpm/Flutter toolchains are present for **future** phases; this foundation task did not initialize applications or install project dependencies into workspaces.
- Supabase CLI enablement uses the reviewed versioned `npx` invocation (`supabase@2.109.1`); see MARIB-TAX-SUPABASE-CLI-ENABLEMENT-01 / migration standard.
