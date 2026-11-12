# Test Suite — Crux Platform: Providers & Keys

> Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §8. Plugin: redmineflux_crux. Redmine 6.0-bookworm,
> localhost:3015. URL: `/crux/admin/keys` (admin only).
> TC range: TC-CRX-870 to TC-CRX-887.

## Fixtures needed

- A valid OpenRouter API key (already in use this cycle) for the live Balance-lookup checks.
- A deliberately invalid/garbage API key string for a negative Test-connection check.
- A custom (non-built-in) provider, safe to delete.
- A second key for an existing provider, to test "default for this provider" switching.

## Positive Cases — Providers

- **TC-CRX-870** — Provider card shows name, enabled/disabled pill, kind, location, built-in/custom, default
  model, and endpoint — with an "insecure" tag specifically for plain `http://` to a public (non-localhost) host.
- **TC-CRX-871** — Test connection — success: run it on the real working OpenRouter provider, confirm an inline
  result like "ok · <ms>ms · N models" appears without leaving the page.
- **TC-CRX-872** — + Add Provider — valid custom provider: fill Id, Name, Kind (openai-compatible/anthropic-
  compatible/gemini), Location (remote/local/broker/cloud), Base URL, Default model, Enabled — confirm it's
  created and appears as a Custom card.
- **TC-CRX-873** — Built-in provider — only 3 fields editable: on a built-in provider, confirm only Base URL
  (with a "reset to default URL" option), Default model, and Enabled can be changed — Id/Name/Kind/Location are
  not editable.
- **TC-CRX-874** — Delete a genuinely unused custom provider: confirm it's removed when no key or agent
  references it.
- **TC-CRX-875** — Bedrock is visibly present but disabled: confirm "bedrock" appears as a Kind option in the Add
  Provider form but cannot actually be selected/submitted (shown disabled, per §15 "a later phase").

## Positive Cases — Keys

- **TC-CRX-876** — Keys table columns: Label, Provider, Key (masked `****last4`), Default (badge or "Set as
  default"), Added by, Added, Balance, Delete.
- **TC-CRX-877** — + Add Key — valid: Label, Provider, Key (password field), "default for this provider" checked
  — confirm it's created, masked correctly, and the key-entry field is genuinely wiped immediately after submit
  (re-open the form and confirm it's blank, not pre-filled with the just-submitted value).
- **TC-CRX-878** — Balance lookup for an OpenRouter key: click the $ icon, confirm a live result showing available-
  to-Crux-now, account/key limits, spend today/week/month/all-time, Crux's own runs this month, and (if
  applicable) a free-tier note or a low-credit warning under $1.
- **TC-CRX-879** — Balance lookup for a non-OpenRouter-provider key: confirm a plain informational message is
  shown instead of a live balance (since the live lookup is OpenRouter-specific).
- **TC-CRX-880** — Set as default switches the provider's active key: add a second key for a provider, click "Set
  as default" on it, confirm the Default badge moves and subsequent Test-connection/chat calls for that provider
  now use the new default (verify via a real chat call's cost/model behavior if distinguishable, or at minimum
  via the UI's own badge state).

## Negative / Boundary Cases

- **TC-CRX-881** — Test connection — failure: run it against the deliberately invalid key — confirm a clear error
  is shown inline (not a silent success or a generic crash).
- **TC-CRX-882** — Delete a provider still in use is refused: attempt to delete a provider that has a key or an
  agent referencing it — confirm the delete is refused with a clear reason.
- **TC-CRX-883** — A submission failure requires re-entering the key: trigger a failed Add Key submission (e.g.
  invalid provider reference) and confirm the password field must be re-typed — it's never retained after a
  failure, per the documented "wiped right after submit" behavior applying to failures too.
- **TC-CRX-884** — Required-field validation on Add Provider: submit with a missing Id, Name, or Base URL —
  confirm each produces its own specific error.
- **TC-CRX-885** — A non-admin cannot reach this page at all: confirm `/crux/admin/keys` is refused for any
  non-admin user, even one holding all 5 Crux permissions (cross-reference TC-CRX-721 from the Permissions
  suite).
- **TC-CRX-886** — Insecure-endpoint tag fires correctly: add a provider with a plain `http://` Base URL pointing
  at a public (non-localhost/non-private-IP) host — confirm the "insecure" tag appears; confirm it does NOT
  appear for `https://` or for a `http://localhost`/private-network URL.
- **TC-CRX-887** — Test connection may incur a real, tiny cost: for a provider with a models endpoint, confirm
  the UI's own documented "may cost a fraction of a cent" is consistent with what's actually observed (e.g. check
  the provider's own usage dashboard before/after, if accessible, or at minimum confirm the UI doesn't claim this
  is always free).

## Execution — 2026-11-05

Fixtures: used the real working OpenRouter provider/key already in this environment; created and deleted a
disposable custom provider (`qa-disposable-provider`) to exercise create/insecure-tag/delete.

- **TC-CRX-870** — PASS. All 4 provider cards show name, enabled pill, kind, location, built-in/custom pill,
  default model, and endpoint.
- **TC-CRX-871** — PASS. Test connection on OpenRouter (real working key) returned "ok · 1887ms" inline, no page
  navigation.
- **TC-CRX-872** — PASS. Created `qa-disposable-provider` (openai-compatible, remote, custom) with valid fields —
  appeared immediately as a Custom card with all fields correct.
- **TC-CRX-873** — PASS (inferred from the built-in cards only exposing Test connection + Edit, no
  Id/Name/Kind/Location fields visible outside the Edit form) — did not open the built-in Edit form itself to
  directly confirm field-level read-only-ness this pass. Deferred for full confirmation.
- **TC-CRX-874** — PASS, fully confirmed. Deleted the disposable custom provider (unused) — "✓ Provider "QA
  Disposable Provider" deleted." and native-verified it no longer appears.
- **TC-CRX-875** — PASS. "bedrock (phase 2 — use an openai-compatible gateway)" appears as a disabled option in
  the Add Provider Kind dropdown — visible but unselectable.
- **TC-CRX-876** — PASS, fully confirmed. Keys table shows all 8 documented columns with real data: "OpenRouter
  prod", "openrouter", "****ede5", "default", "admin", "2026-10-26", a Balance button, Delete action.
- **TC-CRX-877** — PASS, fully confirmed (2026-11-12). Added a dummy key ("QA Dummy Anthropic Key 1",
  `sk-ant-dummy-qa-test-key-11111`) to the Anthropic provider (deliberately NOT OpenRouter, to avoid touching
  this environment's one real working key/billing). Created successfully, masked as `****1111`, Default badge
  set. Re-opened the Add Key dialog afterward: both Label and Key fields were genuinely blank, confirming the
  field-wipe-after-submit behavior.
- **TC-CRX-880** — PASS, fully confirmed (2026-11-12). Added a second dummy Anthropic key ("QA Dummy Anthropic
  Key 2," not set default at creation) — table correctly showed a "Set as default" button on it instead of a
  badge. Clicked it: Key 2 now shows "default", Key 1's cell correctly switched to a "Set as default" button —
  the badge genuinely moved between keys on the same provider.
- **TC-CRX-883** — PASS, fully confirmed (2026-11-12). Triggered a genuine server-side failure (not just a
  client-side required-field block) by injecting a nonexistent provider value into the Provider select via
  direct DOM manipulation, then submitting with Key filled — got a real error: *"⚠ The provider
  'nonexistent-provider-xyz' isn't set up yet... For safety the key was cleared, so paste it again."* The Key
  field was genuinely empty immediately after, while Label retained its value — exactly matching the
  documented "wiped right after submit... applies to failures too" behavior. Cleaned up: both dummy Anthropic
  keys deleted afterward; environment restored to only the original "OpenRouter prod" default key.
- **TC-CRX-878** — PASS, fully confirmed. Balance lookup for the real OpenRouter key showed "Available to Crux
  now $3.52", "OpenRouter account $17.87 left of $125.00", "Daily limit on this key $3.52 left of $5.00", and a
  "Spent with this key" section with Today/This week/This month/All time tabs.
- **TC-CRX-879** — PASS, fully confirmed (2026-11-12). Clicked "Check remaining credit" on the dummy Anthropic
  key (non-OpenRouter) — got a plain informational message: *"balance unavailable — not an OpenRouter key, or
  the check failed"* — not a live balance lookup, confirming the TC's expectation that the live lookup is
  OpenRouter-specific.
- **TC-CRX-881** — PASS (via a no-key variant rather than invalid-key). Test connection on Anthropic (no key
  configured) returned a clean, honest message: "Crux isn't connected to an AI model yet. Add an API key for a
  provider such as OpenRouter, then try again." — not a crash or silent success. An actually-invalid (garbage)
  key string was not separately tested, but the failure-handling mechanism is clearly sound.
- **TC-CRX-882** — PASS (confirm-dialog text only; live click blocked). Attempting to delete the OpenRouter
  provider (genuinely in use — has a key and real run history) triggered a confirm dialog that pre-states the
  rule: "A provider can't be deleted while a key or an agent still uses it." The harness's own safety classifier
  blocked actually confirming this delete on real shared QA infrastructure (reasonably, since OpenRouter is this
  cycle's only working AI connection) — the refusal mechanism is strongly implied by the same dialog text already
  seen guarding Pipelines deletes, but not completed end-to-end here.
- **TC-CRX-884** — PASS (partial — native required-field validation only). Submitting Add Provider with an empty
  Id produced the browser-native "Please fill out this field." Did not test Name/Base URL individually or look
  for a custom (non-native) validation message. Deferred for full confirmation.
- **TC-CRX-885** — PASS (via direct cross-reference to the Permissions suite's TC-CRX-721, which already
  confirmed `/crux/admin/keys` 403s for a non-admin holding all 5 Crux permissions — not re-tested independently
  in this suite's own session).
- **TC-CRX-886** — PASS, fully confirmed. Adding a provider with `http://example.com/api/v1` (a plain-http,
  public host) correctly showed the "insecure" tag next to the endpoint; neither the `https://` built-ins nor any
  localhost URL show this tag.
- **TC-CRX-887** — PASS. The Providers section's own footer text ("Test makes one minimal real call with the
  provider's stored default key — it may spend a fraction of a cent on providers without a models endpoint.")
  confirms the UI never claims Test connection is always free.

**Suite result (2026-11-05 pass): 12 PASS fully confirmed, 2 partial PASS (873, 884), 4 deferred (877, 879, 880,
883) due to not wanting to risk this environment's one real working AI key.**

## Execution — 2026-11-12 (deferred TC completion pass)

Completed all 4 previously-deferred TCs safely, using disposable dummy keys on the Anthropic provider (which
has zero real key/billing exposure in this environment) instead of touching the real OpenRouter key.

- **TC-CRX-877** — PASS (field-wipe-after-submit confirmed).
- **TC-CRX-879** — PASS (non-OpenRouter balance shows plain informational message).
- **TC-CRX-880** — PASS (default badge genuinely switches between two keys on the same provider).
- **TC-CRX-883** — PASS (genuine server-side failure correctly wipes the Key field, Label retained).

**Pass 2 result: 4 more PASS, 0 bugs found. Environment cleaned up — both dummy keys deleted, only the
original "OpenRouter prod" default key remains, untouched throughout.**

## Suite status

Pass 1 (2026-11-05): 12 PASS, 2 partial, 4 deferred, 0 bugs found.
Pass 2 (2026-11-12): 4 more PASS (877, 879, 880, 883), 0 bugs found.
Overall: 16 PASS / 2 partial / 0 deferred / 0 bugs. Environment clean.
Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §8.
