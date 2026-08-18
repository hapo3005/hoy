# HOY analytics contract

HOY analytics are intentionally fail-closed. New measurement features are welcome, but every event name must be explicit, reviewable and present in the client/server contract.

## Adding a new analytics function

1. Use a literal event name in the client, for example `trackEvent('menu_search', restaurantId, {...})`. Dynamic or concatenated event names are not allowed.
2. Add the event name to `data/analytics-event-contract-2.45.json`.
3. Add the same event name to the next versioned `log_analytics_event` migration. Do not replace the allowlist with free text or a wildcard.
4. Keep metadata non-personal, small and decision-relevant. The RPC rejects non-object metadata and payloads above 4 KB; the client also removes common personal-data keys.
5. Run the normal PR QA. `scripts/check-runtime-contracts.js` fails on unregistered events, dynamic event names, missing server allowlist entries or lost analytics safety guards.

## QA isolation

Automated Playwright traffic must never become business analytics. QA contexts are marked with `X-HOY-QA: 1` and local storage marker `hoy-qa-runtime=1`. The client blocks QA writes and the server migration independently discards explicitly marked QA traffic before insert. Headless Chromium is also rejected server-side as defense in depth.

## Proof-gate participant enrollment

The consumer field-test cohort uses pseudonymous participant codes `P01` through `P30`. A participant enters once through a URL containing `?pilot=P07` (example only).

Rules:

- only the strict `P01`–`P30` pattern is accepted;
- the code is stored locally as `hoy-proof-pilot-code-v1` and is not a name, email, phone number or address;
- the `pilot` query parameter is removed from the visible URL immediately after capture, including malformed/free-text values;
- a browser already bound to one valid pilot code cannot be silently reassigned by a later URL;
- enrollment reuses the already allowed `qr_open` event with metadata `source=proof_gate` and `pilot_code=Pxx`; no free-text event name is added;
- the enrollment event is sent only on the explicit Production host and only outside QA/WebDriver contexts;
- because analytics loads before final cloud initialization, Production enrollment retries briefly while Supabase is connecting and is marked locally as sent only after the RPC confirms success;
- QA/preview runs may exercise the sanitized local payload for tests but can never write it to Production.

The private research/cohort sheet holds observation eligibility and any human participant administration. Product analytics contain only the pseudonymous pilot code, anonymous browser id, session id, timestamps and the normal allowlisted event metadata.

## Proof-gate field metrics

### Repeat use

For a privately eligible participant observed for at least three days, repeat use means the enrolled `anonymous_id` has qualifying HOY usage on at least two distinct local calendar days (`Europe/Madrid`). The enrollment event itself does not count as usage.

### Qualified session

A qualified session is a distinct `session_id` containing at least one user-initiated engagement event. Passive enrollment (`qr_open`) and passive promotion impressions alone are not sufficient to qualify a session.

### Action session

A qualified session counts as an action session if it contains at least one of:

- `route_start`
- `service_open`
- `reservation_start`
- `call_click`
- `website_open`

The field-test action rate is `action sessions / qualified sessions`. This denominator and numerator are fixed before field start so the result cannot be improved later by redefining a session.

### Privacy boundary

Analytics do not decide whether a participant is eligible for the repeat-use denominator (for example, whether the person was actually observable for three days). That eligibility remains in the private cohort record and is joined to pseudonymous `Pxx` results only for the proof analysis. Research identities are never copied into `analytics_events`.

## Data interpretation

Analytics recorded before the 2.45 clean cutover must not be treated as reliable production usage because historical automated browser QA cannot be separated from genuine users with sufficient certainty. After 2.45 deployment and migration, establish a new measurement baseline rather than deleting historical rows blindly.
