#!/usr/bin/env bash
# Marib Tax System — dependency-free repository baseline validator.
# No network calls. Does not modify files. Exit 0 on PASS, 1 on FAIL.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PASS_COUNT=0
FAIL_COUNT=0

pass() { PASS_COUNT=$((PASS_COUNT + 1)); printf '  [PASS] %s\n' "$1"; }
fail() { FAIL_COUNT=$((FAIL_COUNT + 1)); printf '  [FAIL] %s\n' "$1"; }
section() { printf '\n== %s ==\n' "$1"; }

require_file() {
  if [[ -f "$1" ]]; then pass "file exists: $1"; else fail "missing mandatory file: $1"; fi
}

require_dir_readme() {
  if [[ -f "$1/README.md" ]]; then pass "directory README: $1/README.md"; else fail "missing directory README: $1/README.md"; fi
}

printf 'Marib Tax System — Foundation Validation\n'
printf 'Repository root: %s\n' "$ROOT"

section "Mandatory foundation files"
MANDATORY_FILES=(
  README.md .gitignore .gitattributes .editorconfig .env.example package.json
  pnpm-workspace.yaml CONTRIBUTING.md SECURITY.md PROPRIETARY.md
  scripts/validate-foundation.sh .github/workflows/foundation-ci.yml
  .github/pull_request_template.md .github/CODEOWNERS
  .github/ISSUE_TEMPLATE/feature.yml .github/ISSUE_TEMPLATE/bug.yml
  .github/ISSUE_TEMPLATE/change-request.yml
  docs/governance/PROJECT-CHARTER.md docs/governance/DEVELOPMENT-WORKFLOW.md
  docs/governance/CHANGE-CONTROL.md docs/governance/DEFINITION-OF-DONE.md
  docs/governance/ENVIRONMENT-STRATEGY.md
  docs/architecture/adr/ADR-001-MODULAR-MONOLITH.md
  docs/architecture/adr/ADR-002-FLUTTER-MOBILE.md
  docs/architecture/adr/ADR-003-NEXTJS-WEB-ADMIN.md
  docs/architecture/adr/ADR-004-NESTJS-BACKEND.md
  docs/architecture/adr/ADR-005-POSTGRES-SUPABASE.md
  docs/architecture/adr/ADR-006-API-FIRST-OPENAPI.md
  docs/architecture/adr/ADR-007-NOTIFICATION-OUTBOX.md
  docs/architecture/adr/ADR-008-VERSIONED-SERVICES.md
  docs/architecture/adr/ADR-009-PRIVATE-FILE-STORAGE.md
  docs/architecture/adr/ADR-010-NO-DIRECT-CLIENT-DATABASE-WRITES.md
  docs/baseline/README.md docs/preflight/TOOLCHAIN-INVENTORY.md
  .cursor/rules/00-project-governance.mdc .cursor/rules/10-security.mdc
  .cursor/rules/20-database.mdc .cursor/rules/30-backend.mdc
  .cursor/rules/40-web.mdc .cursor/rules/50-mobile.mdc .cursor/rules/60-testing.mdc
)
for file in "${MANDATORY_FILES[@]}"; do require_file "$file"; done

section "Required directory README files"
README_DIRS=(
  apps apps/mobile apps/web apps/api apps/worker packages packages/contracts
  packages/shared-types packages/config packages/testing database database/migrations
  database/seeds database/tests infrastructure infrastructure/docker
  infrastructure/deployment infrastructure/monitoring scripts docs docs/baseline
  docs/governance docs/architecture docs/architecture/adr docs/domain docs/workflows
  docs/reports docs/security docs/api docs/acceptance docs/operations docs/preflight
)
for dir in "${README_DIRS[@]}"; do require_dir_readme "$dir"; done

section "pnpm workspace boundaries"
if grep -Fq 'apps/*' pnpm-workspace.yaml; then
  pass "pnpm workspace apps/* covers Node applications"
else
  for ws in apps/web apps/api apps/worker; do
    if grep -Fq "$ws" pnpm-workspace.yaml; then pass "pnpm workspace includes $ws"; else fail "pnpm workspace missing $ws (or apps/* glob)"; fi
  done
fi
if grep -Fq 'packages/*' pnpm-workspace.yaml; then pass "pnpm workspace includes packages/*"; else fail "pnpm workspace missing packages/*"; fi
if [[ -f apps/mobile/package.json ]]; then fail "apps/mobile must remain Flutter-only; unexpected package.json found"; else pass "apps/mobile is Flutter-only (no package.json)"; fi

section "Tracked secret and credential hygiene"
if command -v git >/dev/null 2>&1; then
  bad_env=0
  bad_secret=0
  bad_credential=0
  bad_supabase=0
  while IFS= read -r -d '' path; do
    base="$(basename "$path")"
    if [[ "$base" == .env || "$base" == .env.* ]]; then
      if [[ "$base" != *.example ]]; then fail "tracked prohibited env file: $path"; bad_env=1; fi
    fi
    case "$base" in
      *.pem|*.key|*.p12|*.pfx|*.jks|*.keystore|id_rsa|id_ed25519|*.mobileprovision)
        fail "tracked secret filename: $path"; bad_secret=1 ;;
    esac
    case "$base" in
      google-services.json|GoogleService-Info.plist|serviceAccountKey.json|firebase-adminsdk*.json|*-firebase-adminsdk-*.json|firebase-service-account*.json)
        fail "tracked credential file: $path"; bad_credential=1 ;;
    esac
    if [[ "$path" == *supabase/.temp/* || "$path" == */.supabase/* || "$path" == *supabase/.branches/* ]]; then
      fail "tracked local Supabase artifact: $path"; bad_supabase=1
    fi
  done < <(git ls-files -z)
  [[ "$bad_env" -eq 0 ]] && pass "no prohibited tracked .env files"
  [[ "$bad_secret" -eq 0 ]] && pass "no tracked private key / keystore filenames"
  [[ "$bad_credential" -eq 0 ]] && pass "no tracked Firebase / mobile credential files"
  [[ "$bad_supabase" -eq 0 ]] && pass "no tracked local Supabase artifacts"
else
  fail "git is required for tracked-file secret checks"
fi

section "Filename and text hygiene"
if command -v git >/dev/null 2>&1; then
  bad_name=0
  bad_ansi=0
  while IFS= read -r -d '' path; do
    if printf '%s' "$path" | LC_ALL=C grep -q '[[:cntrl:]]'; then
      fail "tracked filename contains control characters: $path"; bad_name=1
    fi
    if [[ "$path" != */* && "$path" == '= @'* ]]; then
      fail "unexpected malformed root filename: $path"; bad_name=1
    fi
    if [[ -f "$path" ]]; then
      case "$path" in
        *.md|*.mdc|*.txt|*.yml|*.yaml|*.json|*.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.css|*.scss|*.html|*.xml|*.svg|*.sh|*.sql|*.dart|*.kt|*.kts|*.gradle|*.toml|*.properties)
          if grep -Iq $'\x1B' -- "$path"; then fail "tracked text file contains ANSI escape characters: $path"; bad_ansi=1; fi
          ;;
      esac
    fi
  done < <(git ls-files -z)
  [[ "$bad_name" -eq 0 ]] && pass "no malformed/control-character tracked filenames"
  [[ "$bad_ansi" -eq 0 ]] && pass "no ANSI escape characters in tracked text files"
else
  fail "git is required for filename and text hygiene checks"
fi

if grep -Fq 'security@example.invalid' SECURITY.md; then fail "SECURITY.md contains prohibited placeholder security@example.invalid"; else pass "SECURITY.md does not contain prohibited placeholder"; fi

section "package.json repository constraints"
if grep -q '"private"[[:space:]]*:[[:space:]]*true' package.json; then pass "package.json is private"; else fail "package.json must set private: true"; fi
if grep -q 'validate:foundation' package.json; then pass "package.json exposes validate:foundation script"; else fail "package.json missing validate:foundation script"; fi
if grep -q '"dependencies"' package.json; then pass "root runtime dependencies allowed at application stage"; else pass "package.json has no root runtime dependencies"; fi

section "Report"
printf '\n----------------------------------------\n'
printf 'PASS: %s\n' "$PASS_COUNT"
printf 'FAIL: %s\n' "$FAIL_COUNT"
if [[ "$FAIL_COUNT" -eq 0 ]]; then
  printf 'RESULT: PASS\n----------------------------------------\n'
  exit 0
fi
printf 'RESULT: FAIL\n----------------------------------------\n'
exit 1
