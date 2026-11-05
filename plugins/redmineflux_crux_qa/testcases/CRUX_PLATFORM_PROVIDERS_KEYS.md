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

## Suite status

Drafted 2026-11-05, not yet executed. Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §8.
