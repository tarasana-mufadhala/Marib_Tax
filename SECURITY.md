# Security Policy — Marib Tax System

## Vulnerability reporting

Report suspected vulnerabilities privately. Do **not** open public issues for security findings.

Vulnerabilities must be reported through:

1. **GitHub Private Vulnerability Reporting / Security Advisory** when enabled on this repository.
2. **Private communication with the authorized SysTrac project owner.**

Do not invent or publish an alternative public email contact in this file.

Include: description, impact, reproduction steps, affected component, and whether exploitation is known.

## Secret handling

- Never commit secrets, tokens, private keys, keystores, or credential files.
- Use environment variables and secret managers; track only `.env.example` placeholders.
- Rotate credentials immediately if exposure is suspected.
- Do not log secrets, tokens, national IDs, or other sensitive personal data.

## Service-role and privileged credentials

- Supabase **service-role** keys and equivalent privileged credentials must **never** appear in Flutter, Next.js client bundles, or any public client.
- Only trusted server components (`apps/api`, `apps/worker`) may use privileged credentials under least privilege.

## Private storage

- Operational files are private.
- Access must use authorized, short-lived mechanisms (e.g., signed URLs).
- Public buckets for operational taxpayer/admin documents are prohibited.

## Audit requirements

- Sensitive state changes must be auditable.
- Audit records must not be silently overwritten or deleted.
- Authorization decisions that change access or workflow state should leave an audit trail.

## Dependency and supply-chain review

- Review new dependencies for license, maintenance, and known vulnerabilities before adoption.
- Prefer pinned, reproducible installs for Node workspaces.
- Do not introduce unreviewed binary or opaque SDK drops into the repository.

## Incident reporting expectations

1. Contain exposure (revoke keys, disable compromised access).
2. Notify the authorized SysTrac project owner through private communication (and GitHub Private Vulnerability Reporting when applicable).
3. Document timeline, impact, and remediation.
4. Do not discuss active incidents in public channels or public tickets.
