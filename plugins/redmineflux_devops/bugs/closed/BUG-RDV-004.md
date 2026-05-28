# Bug Report

- Bug ID: BUG-RDV-004
- Title: FOSSA provider cannot be added as repository connection — missing from Add Repository form
- Redmine version: 6.0.9 (Forge)
- Plugin name: redmineflux_devops
- Plugin version: 0.1.0
- Environment: Forge + Local Docker (http://localhost:3008)
- Browser: Playwright (automated)
- User role: Admin
- Severity: High
- Date: 2026-05-22
- Discovered in TC: TC-RDV-006

## Steps to reproduce

1. Navigate to Project Settings > DevOps > Repositories for project `phoenix-platform`
2. Click "Add Repository"
3. Open the Provider dropdown and observe the available options
4. Attempt to add a FOSSA connection
5. Send `POST /devops/webhook/fossa/phoenix-platform` with a valid `X-FOSSA-Signature` header

## Expected result

- The Add Repository form includes `FOSSA` in the Provider dropdown
- After adding a FOSSA connection with a webhook secret, FOSSA webhooks sent with the correct HMAC-SHA256 signature in `X-FOSSA-Signature` are accepted with HTTP 202
- FOSSA is listed in `SUPPORTED_PROVIDERS` and the UI should support adding FOSSA connections

## Actual result

- The Add Repository Provider dropdown only shows: Github, Gitlab, Bitbucket
- FOSSA is absent from the form despite being listed in `SUPPORTED_PROVIDERS`
- The controller's `webhook_secret_for('fossa', repo)` falls through to `repo&.webhook_secret`, but no FOSSA repo record can ever be created via the UI
- All FOSSA webhooks are rejected with HTTP 401 `{"error":"Invalid signature"}` because no repo connection exists
- FOSSA integration is completely non-functional

## Root cause

`SUPPORTED_PROVIDERS` includes `fossa`, and the auth mechanism (`validate_fossa_signature`) is implemented, but the `devops_repositories` form view (provider `<select>`) does not include `fossa` as an option. The repo connection record required for the webhook secret lookup can therefore never be created through the UI.

## Evidence

- Screenshot path: screenshots/TC-RDV-006/tc-rdv-006-partial-fail.png
- FOSSA webhook response: HTTP 401 `{"error":"Invalid signature"}`

## Duplicate check

- Duplicate found: No

## Retest

- Date: 2026-05-23
- Environment: Local Docker (http://localhost:3008)
- Result: **CONFIRMED**
- Navigated to `/projects/phoenix-platform/devops_repositories/new` as admin. Provider dropdown options: Github, Gitlab, Bitbucket only. No FOSSA option present. Screenshot: screenshots/BUG-RDV-004/retest-2026-05-23-confirmed.png

## Retest

- Date: 2026-05-26
- Environment: Local Docker (http://localhost:3008) — fresh instance
- Result: **FIXED**
- Navigated to `/projects/phoenix-platform/devops_repositories/new` as admin. Provider dropdown now includes: Github, Gitlab, Bitbucket, Fossa, Argocd. FOSSA (value="fossa") is now present. ArgoCD was also added. Bug no longer reproduces.

## Retest

- Date: 2026-05-26
- Environment: Forge (https://flux-foq1fnz3j49.forge.zehntech.com) — new instance
- Result: **FIXED**
- `/projects/agileboard/devops_repositories/new` — provider dropdown contains: `value="github"`, `value="gitlab"`, `value="bitbucket"`, `value="fossa"`, `value="argocd"`. FOSSA and ArgoCD both present. Bug does not reproduce on new Forge.
