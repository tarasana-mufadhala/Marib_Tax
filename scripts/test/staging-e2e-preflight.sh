#!/usr/bin/env bash
# Validates the non-secret isolation contract before any staging E2E network call.
# This script is read-only and deliberately fails closed.

set -euo pipefail

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

require_value() {
  local name="$1"
  if [[ -n "${!name:-}" ]]; then
    pass "$name is configured"
  else
    fail "$name is required"
  fi
}

require_exact() {
  local name="$1"
  local expected="$2"
  if [[ "${!name:-}" == "$expected" ]]; then
    pass "$name=$expected"
  else
    fail "$name must equal $expected"
  fi
}

require_https_url() {
  local name="$1"
  local value="${!name:-}"
  if [[ "$value" =~ ^https://[^[:space:]]+$ ]]; then
    pass "$name uses HTTPS"
  else
    fail "$name must be a non-empty HTTPS URL"
  fi
}

printf 'Marib Tax — Staging E2E Preflight\n'

require_exact E2E_TARGET staging
require_exact E2E_DATASET synthetic
require_exact E2E_CONFIRM_NO_PRODUCTION_WRITES true
require_exact E2E_CONFIRM_SYNTHETIC_TAXPAYERS_ONLY true
require_exact E2E_OTP_MODE fixed_test_code
require_exact E2E_SMS_ADAPTER fake
require_exact E2E_PUSH_ADAPTER test

require_https_url E2E_WEB_BASE_URL
require_https_url E2E_API_BASE_URL
require_https_url E2E_STAGING_SUPABASE_URL
require_https_url E2E_PRODUCTION_WEB_URL
require_https_url E2E_PRODUCTION_API_URL

require_value E2E_STAGING_PROJECT_REF
require_value E2E_PRODUCTION_PROJECT_REF
require_value E2E_STORAGE_BUCKET
require_value E2E_FCM_PROJECT_ID

if [[ -n "${E2E_STAGING_PROJECT_REF:-}" ]]; then
  if [[ "${E2E_STAGING_PROJECT_REF}" =~ ^[a-z0-9]{20}$ ]]; then
    pass "E2E_STAGING_PROJECT_REF format is valid"
  else
    fail "E2E_STAGING_PROJECT_REF has an invalid Supabase project-ref format"
  fi
fi

if [[ -n "${E2E_PRODUCTION_PROJECT_REF:-}" ]]; then
  if [[ "${E2E_PRODUCTION_PROJECT_REF}" =~ ^[a-z0-9]{20}$ ]]; then
    pass "E2E_PRODUCTION_PROJECT_REF format is valid"
  else
    fail "E2E_PRODUCTION_PROJECT_REF has an invalid Supabase project-ref format"
  fi
fi

if [[ -n "${E2E_STAGING_PROJECT_REF:-}" ]] &&
  [[ -n "${E2E_PRODUCTION_PROJECT_REF:-}" ]]; then
  if [[ "${E2E_STAGING_PROJECT_REF}" == "${E2E_PRODUCTION_PROJECT_REF}" ]]; then
    fail "staging and production Supabase project refs must be different"
  else
    pass "staging and production Supabase project refs are isolated"
  fi
fi

if [[ -n "${E2E_WEB_BASE_URL:-}" ]] &&
  [[ -n "${E2E_PRODUCTION_WEB_URL:-}" ]]; then
  if [[ "${E2E_WEB_BASE_URL}" == "${E2E_PRODUCTION_WEB_URL}" ]]; then
    fail "E2E_WEB_BASE_URL must not equal E2E_PRODUCTION_WEB_URL"
  else
    pass "web target is not the declared production URL"
  fi
fi

if [[ -n "${E2E_API_BASE_URL:-}" ]] &&
  [[ -n "${E2E_PRODUCTION_API_URL:-}" ]]; then
  if [[ "${E2E_API_BASE_URL}" == "${E2E_PRODUCTION_API_URL}" ]]; then
    fail "E2E_API_BASE_URL must not equal E2E_PRODUCTION_API_URL"
  else
    pass "API target is not the declared production URL"
  fi
fi

printf '\nPreflight totals: PASS=%d FAIL=%d\n' "$PASS_COUNT" "$FAIL_COUNT"

if [[ "$FAIL_COUNT" -gt 0 ]]; then
  printf 'HOLD — staging isolation is not proven; no E2E network calls are authorized.\n'
  exit 1
fi

printf 'PASS — non-secret staging isolation contract is satisfied.\n'
