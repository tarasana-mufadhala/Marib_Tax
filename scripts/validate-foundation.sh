#!/usr/bin/env bash
# Marib Tax System — dependency-free repository foundation validator.
# No network calls. Does not modify files. Exit 0 on PASS, 1 on FAIL.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PASS_COUNT=0
FAIL_COUNT=0

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  printf '  [PASS] %s\n' "$1"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  printf '  [FAIL] %s\n' "$1"
}

section() {
  printf '\n== %s ==\n' "$1"
}

require_file() {
  local path="$1"
  if [[ -f "$path" ]]; then
    pass "file exists: $path"
  else
    fail "missing mandatory file: $path"
  fi
}

require_dir_readme() {
  local dir="$1"
  local readme="$dir/README.md"
  if [[ -f "$readme" ]]; then
    pass "directory README: $readme"
  else
    fail "missing directory README: $readme"
  fi
}

contains_control_char() {
  local LC_ALL=C
  [[ "$1" =~ [[:cntrl:]] ]]
}

printf 'Marib Tax System — Foundation Validation\n'
printf 'Repository root: %s\n' "$ROOT"

# ---------------------------------------------------------------------------
section "Mandatory foundation files"
# ---------------------------------------------------------------------------

MANDATORY_FILES=(
  "README.md"
  ".gitignore"
  ".gitattributes"
  ".editorconfig"
  ".env.example"
  "package.json"
  "pnpm-workspace.yaml"
  "CONTRIBUTING.md"
  "SECURITY.md"
  "PROPRIETARY.md"
  "scripts/validate-foundation.sh"
  ".github/workflows/foundation-ci.yml"
  ".github/pull_request_template.md"
  ".github/CODEOWNERS"
  ".github/ISSUE_TEMPLATE/feature.yml"
  ".github/ISSUE_TEMPLATE/bug.yml"
  ".github/ISSUE_TEMPLATE/change-request.yml"
  "docs/governance/PROJECT-CHARTER.md"
  "docs/governance/DEVELOPMENT-WORKFLOW.md"
  "docs/governance/CHANGE-CONTROL.md"
  "docs/governance/DEFINITION-OF-DONE.md"
  "docs/governance/ENVIRONMENT-STRATEGY.md"
  "docs/architecture/adr/ADR-001-MODULAR-MONOLITH.md"
  "docs/architecture/adr/ADR-002-FLUTTER-MOBILE.md"
  "docs/architecture/adr/ADR-003-NEXTJS-WEB-ADMIN.md"
  "docs/architecture/adr/ADR-004-NESTJS-BACKEND.md"
  "docs/architecture/adr/ADR-005-POSTGRES-SUPABASE.md"
  "docs/architecture/adr/ADR-006-API-FIRST-OPENAPI.md"
  "docs/architecture/adr/ADR-007-NOTIFICATION-OUTBOX.md"
  "docs/architecture/adr/ADR-008-VERSIONED-SERVICES.md"
  "docs/architecture/adr/ADR-009-PRIVATE-FILE-STORAGE.md"
  "docs/architecture/adr/ADR-010-NO-DIRECT-CLIENT-DATABASE-WRITES.md"
  "docs/baseline/README.md"
  "docs/preflight/TOOLCHAIN-INVENTORY.md"
  ".cursor/rules/00-project-governance.mdc"
  ".cursor/rules/10-security.mdc"
  ".cursor/rules/20-database.mdc"
  ".cursor/rules/30-backend.mdc"
  ".cursor/rules/40-web.mdc"
  ".cursor/rules/50-mobile.mdc"
  ".cursor/rules/60-testing.mdc"
)

for f in "${MANDATORY_FILES[@]}"; do
  require_file "$f"
done

# ---------------------------------------------------------------------------
section "Required directory README files"
# ---------------------------------------------------------------------------

README_DIRS=(
  "apps"
  "apps/mobile"
  "apps/web"
  "apps/api"
  "apps/worker"
  "packages"
  "packages/contracts"
  "packages/shared-types"
  "packages/config"
  "packages/testing"
  "database"
  "database/migrations"
  "database/seeds"
  "database/tests"
  "infrastructure"
  "infrastructure/docker"
  "infrastructure/deployment"
  "infrastructure/monitoring"
  "scripts"
  "docs"
  "docs/baseline"
  "docs/governance"
  "docs/architecture"
  "docs/architecture/adr"
  "docs/domain"
  "docs/workflows"
  "docs/reports"
  "docs/security"
  "docs/api"
  "docs/acceptance"
  "docs/operations"
  "docs/preflight"
)

for d in "${README_DIRS[@]}"; do
  require_dir_readme "$d"
done

# ---------------------------------------------------------------------------
section "pnpm workspace boundaries"
# ---------------------------------------------------------------------------

if [[ -f pnpm-workspace.yaml ]]; then
  if grep -q 'apps/mobile' pnpm-workspace.yaml; then
    fail "pnpm-workspace.yaml must not include apps/mobile"
  else
    pass "pnpm-workspace.yaml excludes apps/mobile"
  fi
  for ws in "apps/web" "apps/api" "apps/worker" "packages/*"; do
    if grep -Fq "$ws" pnpm-workspace.yaml; then
      pass "pnpm workspace includes $ws"
    else
      fail "pnpm workspace missing $ws"
    fi
  done
fi

# ---------------------------------------------------------------------------
section "Tracked secret and credential hygiene"
# ---------------------------------------------------------------------------

if ! command -v git >/dev/null 2>&1; then
  fail "git is required for tracked-file secret checks"
else
  # Collect tracked files null-safely (filenames may contain newlines)
  TRACKED=()
  while IFS= read -r -d '' path; do
    TRACKED+=("$path")
  done < <(git ls-files -z)

  ENV_VIOLATIONS=()
  SECRET_NAME_VIOLATIONS=()
  CREDENTIAL_VIOLATIONS=()
  SUPABASE_LOCAL_VIOLATIONS=()

  for path in "${TRACKED[@]}"; do
    base="$(basename "$path")"

    # Tracked .env files other than allowed examples (*.example)
    if [[ "$base" == .env || "$base" == .env.* ]]; then
      if [[ "$base" != *.example ]]; then
        ENV_VIOLATIONS+=("$path")
      fi
    fi

    # Prohibited secret filenames
    case "$base" in
      *.pem|*.key|*.p12|*.pfx|*.jks|*.keystore|id_rsa|id_ed25519|*.mobileprovision)
        SECRET_NAME_VIOLATIONS+=("$path")
        ;;
    esac
    case "$base" in
      google-services.json|GoogleService-Info.plist|serviceAccountKey.json)
        CREDENTIAL_VIOLATIONS+=("$path")
        ;;
      firebase-adminsdk*.json|*-firebase-adminsdk-*.json|firebase-service-account*.json)
        CREDENTIAL_VIOLATIONS+=("$path")
        ;;
    esac
    if [[ "$path" == *id_rsa* || "$path" == *id_ed25519* ]]; then
      SECRET_NAME_VIOLATIONS+=("$path")
    fi

    # Local Supabase artifacts
    if [[ "$path" == *supabase/.temp/* || "$path" == */.supabase/* || "$path" == *supabase/.branches/* ]]; then
      SUPABASE_LOCAL_VIOLATIONS+=("$path")
    fi
  done

  if [[ ${#ENV_VIOLATIONS[@]} -eq 0 ]]; then
    pass "no prohibited tracked .env files"
  else
    for v in "${ENV_VIOLATIONS[@]}"; do
      fail "tracked prohibited env file: $v"
    done
  fi

  if [[ ${#SECRET_NAME_VIOLATIONS[@]} -eq 0 ]]; then
    pass "no tracked private key / keystore filenames"
  else
    for v in "${SECRET_NAME_VIOLATIONS[@]}"; do
      fail "tracked secret filename: $v"
    done
  fi

  if [[ ${#CREDENTIAL_VIOLATIONS[@]} -eq 0 ]]; then
    pass "no tracked Firebase / mobile credential files"
  else
    for v in "${CREDENTIAL_VIOLATIONS[@]}"; do
      fail "tracked credential file: $v"
    done
  fi

  if [[ ${#SUPABASE_LOCAL_VIOLATIONS[@]} -eq 0 ]]; then
    pass "no tracked local Supabase artifacts"
  else
    for v in "${SUPABASE_LOCAL_VIOLATIONS[@]}"; do
      fail "tracked local Supabase artifact: $v"
    done
  fi
fi

# ---------------------------------------------------------------------------
section "Filename and text hygiene"
# ---------------------------------------------------------------------------

if ! command -v git >/dev/null 2>&1; then
  fail "git is required for filename and text hygiene checks"
else
  TRACKED_HYGIENE=()
  while IFS= read -r -d '' path; do
    TRACKED_HYGIENE+=("$path")
  done < <(git ls-files -z)

  CONTROL_NAME_VIOLATIONS=()
  MALFORMED_ROOT_VIOLATIONS=()
  ANSI_VIOLATIONS=()

  is_probably_text() {
    local file="$1"
    local base ext
    base="$(basename "$file")"
    ext="${base##*.}"
    case "$ext" in
      md|mdc|txt|yml|yaml|json|ts|tsx|js|jsx|mjs|cjs|css|scss|html|xml|svg|sh|bash|zsh|env|example|editorconfig|gitignore|gitattributes|properties|toml|sql|dart|kt|kts|gradle|Dockerfile|makefile|Makefile|CODEOWNERS)
        return 0
        ;;
    esac
    case "$base" in
      .gitignore|.gitattributes|.editorconfig|.env.example|Dockerfile|Makefile|CODEOWNERS|pnpm-workspace.yaml|package.json)
        return 0
        ;;
    esac
    # Treat extensionless tracked root docs as text when readable
    if [[ "$file" != */* ]]; then
      return 0
    fi
    return 1
  }

  for path in "${TRACKED_HYGIENE[@]}"; do
    # Control characters in filenames
    if contains_control_char "$path"; then
      CONTROL_NAME_VIOLATIONS+=("$path")
    fi

    # Malformed / accidental root filenames (PowerShell fragment leftovers, etc.)
    base="$(basename "$path")"
    if [[ "$path" != */* ]]; then
      case "$base" in
        '= @('|'=('|'@('|')'|']'|'}'|'=')
          MALFORMED_ROOT_VIOLATIONS+=("$path")
          ;;
      esac
      # Broad catch for root names starting with "= @"
      if [[ "$base" == '= @'* ]]; then
        MALFORMED_ROOT_VIOLATIONS+=("$path")
      fi
    fi

    # ANSI escape sequences in tracked text files (ESC [ ... )
    if [[ -f "$path" ]] && is_probably_text "$path"; then
      if grep -Iq $'\x1B\[' -- "$path"; then
        ANSI_VIOLATIONS+=("$path")
      elif grep -Iq $'\x1B' -- "$path"; then
        ANSI_VIOLATIONS+=("$path")
      fi
    fi
  done

  # Deduplicate malformed list
  if [[ ${#MALFORMED_ROOT_VIOLATIONS[@]} -gt 0 ]]; then
    mapfile -t MALFORMED_ROOT_VIOLATIONS < <(printf '%s\n' "${MALFORMED_ROOT_VIOLATIONS[@]}" | sort -u)
  fi

  if [[ ${#CONTROL_NAME_VIOLATIONS[@]} -eq 0 ]]; then
    pass "no tracked filenames with control characters"
  else
    for v in "${CONTROL_NAME_VIOLATIONS[@]}"; do
      fail "tracked filename contains control characters: $v"
    done
  fi

  if [[ ${#MALFORMED_ROOT_VIOLATIONS[@]} -eq 0 ]]; then
    pass "no unexpected malformed root filenames"
  else
    for v in "${MALFORMED_ROOT_VIOLATIONS[@]}"; do
      fail "unexpected malformed root filename: $v"
    done
  fi

  if [[ -f SECURITY.md ]]; then
    if grep -Fq 'security@example.invalid' SECURITY.md; then
      fail "SECURITY.md contains prohibited placeholder security@example.invalid"
    else
      pass "SECURITY.md does not contain security@example.invalid"
    fi
  else
    fail "SECURITY.md missing for placeholder check"
  fi

  if [[ ${#ANSI_VIOLATIONS[@]} -eq 0 ]]; then
    pass "no ANSI escape characters in tracked text files"
  else
    for v in "${ANSI_VIOLATIONS[@]}"; do
      fail "tracked text file contains ANSI escape characters: $v"
    done
  fi
fi

# ---------------------------------------------------------------------------
section "package.json foundation constraints"
# ---------------------------------------------------------------------------

if [[ -f package.json ]]; then
  if grep -q '"private"[[:space:]]*:[[:space:]]*true' package.json; then
    pass "package.json is private"
  else
    fail "package.json must set private: true"
  fi
  if grep -q '"dependencies"' package.json; then
    fail "package.json must not declare runtime dependencies at foundation stage"
  else
    pass "package.json has no runtime dependencies block"
  fi
  if grep -q 'validate:foundation' package.json; then
    pass "package.json exposes validate:foundation script"
  else
    fail "package.json missing validate:foundation script"
  fi
fi

# ---------------------------------------------------------------------------
section "Report"
# ---------------------------------------------------------------------------

printf '\n%s\n' '----------------------------------------'
printf 'PASS: %s\n' "$PASS_COUNT"
printf 'FAIL: %s\n' "$FAIL_COUNT"
if [[ "$FAIL_COUNT" -eq 0 ]]; then
  printf 'RESULT: PASS\n'
  printf '%s\n' '----------------------------------------'
  exit 0
else
  printf 'RESULT: FAIL\n'
  printf '%s\n' '----------------------------------------'
  exit 1
fi
