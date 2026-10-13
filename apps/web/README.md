# Web application

`apps/web` contains the Next.js web surfaces for the Marib Tax System, including the administrative dashboard and public-facing web experience.

## Repository role

- Uses the shared API contracts from `packages/contracts`.
- Must not write directly to PostgreSQL/Supabase application tables.
- Administrative mutations go through the NestJS API and its authorization layer.
- Arabic RTL is the primary interface direction.

## Validation

From the repository root, run the normal monorepo gates (`typecheck`, `test`, `build`, `lint`, and `format:check`) through pnpm.
