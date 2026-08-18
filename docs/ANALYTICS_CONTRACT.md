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

## Data interpretation

Analytics recorded before the 2.45 clean cutover must not be treated as reliable production usage because historical automated browser QA cannot be separated from genuine users with sufficient certainty. After 2.45 deployment and migration, establish a new measurement baseline rather than deleting historical rows blindly.
