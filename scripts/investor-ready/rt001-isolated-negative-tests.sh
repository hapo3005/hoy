#!/usr/bin/env bash
set -euo pipefail

PSQL=(psql -X -v ON_ERROR_STOP=1 -qAt)
U1='11111111-1111-1111-1111-111111111111'

expect_fail() {
  local label="$1"
  local expected="$2"
  local sql="$3"
  local output
  set +e
  output=$("${PSQL[@]}" -c "$sql" 2>&1)
  local code=$?
  set -e
  if [[ $code -eq 0 ]]; then
    echo "RT-001 NEGATIVE FAIL [$label]: call unexpectedly succeeded" >&2
    exit 1
  fi
  if [[ "$output" != *"$expected"* ]]; then
    echo "RT-001 NEGATIVE FAIL [$label]: expected '$expected'" >&2
    echo "$output" >&2
    exit 1
  fi
  echo "RT-001 NEGATIVE PASS [$label]: $expected"
}

# Unauthenticated authenticated-role call must fail before any tenant access.
expect_fail \
  'unauthenticated workspace' \
  'login_required' \
  "set role authenticated; select set_config('request.jwt.claim.sub','',false); select public.get_operator_workspace(1001);"

# User 1 is verified only for restaurant 1001. Restaurant 2002 belongs to user 2.
expect_fail \
  'foreign workspace' \
  'membership_required' \
  "set role authenticated; select set_config('request.jwt.claim.sub','$U1',false); select public.get_operator_workspace(2002);"

expect_fail \
  'foreign media review' \
  'claim_required' \
  "set role authenticated; select set_config('request.jwt.claim.sub','$U1',false); select public.get_venue_media_review(2002);"

expect_fail \
  'foreign profile change' \
  'verified_membership_required' \
  "set role authenticated; select set_config('request.jwt.claim.sub','$U1',false); select public.operator_submit_profile_change(2002,'{\"description\":\"foreign write attempt\"}'::jsonb,null);"

expect_fail \
  'foreign upgrade' \
  'verified_membership_required' \
  "set role authenticated; select set_config('request.jwt.claim.sub','$U1',false); select public.operator_request_upgrade(2002,'business'::public.plan_code,null);"

expect_fail \
  'foreign media decision' \
  'verified_operator_required' \
  "set role authenticated; select set_config('request.jwt.claim.sub','$U1',false); select public.review_venue_media_candidates(2002,'{}'::bigint[],'{}'::bigint[],'{}'::bigint[]);"

# An own-tenant read must still work after hardening.
own=$("${PSQL[@]}" -c "set role authenticated; select set_config('request.jwt.claim.sub','$U1',false); select (public.get_operator_workspace(1001)->>'restaurant_id')::bigint;")
[[ "$own" == *"1001"* ]] || { echo "RT-001 POSITIVE FAIL: own workspace unavailable" >&2; exit 1; }
echo 'RT-001 POSITIVE PASS [own workspace]'

# Analytics execution must remain inaccessible to authenticated.
analytics_priv=$("${PSQL[@]}" -c "select has_function_privilege('authenticated','public.log_analytics_event(text,bigint,uuid,uuid,jsonb)','EXECUTE');")
[[ "$analytics_priv" == "f" ]] || { echo "RT-001 PRIVACY FAIL: authenticated analytics EXECUTE is not revoked" >&2; exit 1; }
expect_fail \
  'authenticated analytics transport' \
  'permission denied for function log_analytics_event' \
  "set role authenticated; select public.log_analytics_event('profile_view',1001,null,null,'{}'::jsonb);"

analytics_rows=$("${PSQL[@]}" -c "select count(*) from public.analytics_events;")
[[ "$analytics_rows" == "0" ]] || { echo "RT-001 PRIVACY FAIL: analytics test persisted rows" >&2; exit 1; }

echo 'RT-001 isolated authorization/IDOR/privacy tests: PASS'
