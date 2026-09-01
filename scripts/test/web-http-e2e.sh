#!/usr/bin/env bash
# Process-level Web E2E fallback for runners where a browser is unavailable.
# It starts the real Next.js server and exercises public and fail-closed routes.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WEB_ROOT="$ROOT/apps/web"
SERVER_LOG="$ROOT/test-results/next-http-e2e-server.log"
NEXT_LOCK="$WEB_ROOT/.next/dev/lock"
BASE_URL="http://127.0.0.1:3100"

for tool in node curl; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    printf '[FAIL] required tool is unavailable: %s\n' "$tool"
    exit 1
  fi
done

if curl --silent --fail --max-time 1 "$BASE_URL/" >/dev/null 2>&1; then
  printf '[FAIL] port 3100 is already serving another process\n'
  exit 1
fi

# A restricted runner can leave this generated lock after the process exits.
if [[ -f "$NEXT_LOCK" ]]; then
  rm -f "$NEXT_LOCK"
fi

mkdir -p "$ROOT/test-results"

(
  cd "$WEB_ROOT"
  exec node \
    --require ../../tests/e2e/web/node-memory-shim.cjs \
    ./node_modules/next/dist/bin/next \
    dev --hostname 127.0.0.1 --port 3100
) >"$SERVER_LOG" 2>&1 &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
  rm -f "$NEXT_LOCK" "$SERVER_LOG"
}
trap cleanup EXIT

READY=false
for _attempt in $(seq 1 40); do
  if curl --silent --fail "$BASE_URL/" >/dev/null; then
    READY=true
    break
  fi
  sleep 0.25
done

if [[ "$READY" != true ]]; then
  sed -n '1,160p' "$SERVER_LOG"
  printf '[FAIL] Next.js test server did not become ready\n'
  exit 1
fi

PASS_COUNT=0
FAIL_COUNT=0

check() {
  local label="$1"
  shift
  if "$@"; then
    PASS_COUNT=$((PASS_COUNT + 1))
    printf '[PASS] %s\n' "$label"
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
    printf '[FAIL] %s\n' "$label"
  fi
}

contains() {
  [[ "$1" == *"$2"* ]]
}

not_contains() {
  [[ "$1" != *"$2"* ]]
}

HOME_BODY="$(curl --fail --silent --show-error "$BASE_URL/")"
ADMIN_HEADERS="$(curl --silent --show-error --dump-header - --output /dev/null "$BASE_URL/admin")"
FORGED_HEADERS="$(
  curl --silent --show-error --dump-header - --output /dev/null \
    -H 'Authorization: Bearer forged-test-token' \
    -H 'X-User-Role: admin' \
    -H 'Cookie: role=admin' \
    "$BASE_URL/admin"
)"
REGISTRY_BODY="$(curl --fail --silent --show-error "$BASE_URL/mock/registry")"
MASTERDATA_BODY="$(curl --fail --silent --show-error "$BASE_URL/mock/masterdata")"
ATTACHMENTS_BODY="$(curl --fail --silent --show-error "$BASE_URL/mock/attachments?classification=highly_sensitive")"

check 'public page is Arabic RTL' contains "$HOME_BODY" '<html lang="ar" dir="rtl">'
check 'public heading is rendered' contains "$HOME_BODY" 'مكتب الضرائب بمحافظة مأرب'
check 'public page declares operational services disabled' contains "$HOME_BODY" 'الخدمات التشغيلية وتسجيل الدخول غير مفعّلة'
check 'anonymous admin request redirects' contains "$ADMIN_HEADERS" '307 Temporary Redirect'
check 'anonymous admin redirect points to public root' contains "$ADMIN_HEADERS" 'location: /'
check 'forged admin context still redirects' contains "$FORGED_HEADERS" '307 Temporary Redirect'
check 'forged admin response does not render dashboard' not_contains "$FORGED_HEADERS" 'لوحة تحكم المسؤول'
check 'registry mock renders masked tax-number label' contains "$REGISTRY_BODY" 'الرقم الضريبي (مقنّع)'
check 'masterdata mock renders ownership state' contains "$MASTERDATA_BODY" 'الملكية الحالية'
check 'attachment filter returns sensitive fixture' contains "$ATTACHMENTS_BODY" 'كشف-الحساب.xlsx'
check 'attachment filter excludes internal fixture' not_contains "$ATTACHMENTS_BODY" 'السجل-التجاري.pdf'
check 'unauthorized attachment action is disabled' contains "$ATTACHMENTS_BODY" 'disabled=""'

printf 'HTTP Web E2E totals: PASS=%d FAIL=%d\n' "$PASS_COUNT" "$FAIL_COUNT"
[[ "$FAIL_COUNT" -eq 0 ]]
