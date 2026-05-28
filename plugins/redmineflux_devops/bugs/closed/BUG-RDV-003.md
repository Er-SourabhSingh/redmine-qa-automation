# Bug Report

- Bug ID: BUG-RDV-003
- Title: SonarQube webhook token not configurable via Admin plugin settings UI
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

1. Navigate to Admin > Plugins > Redmineflux DevOps settings page (`/settings/plugin/redmineflux_devops`)
2. Observe the available configuration fields
3. Attempt to configure a SonarQube webhook token
4. Send `POST /devops/webhook/sonarqube/phoenix-platform` with a valid `X-Sonar-Webhook-HMAC-SHA256` signature header

## Expected result

- The plugin settings page includes a `SonarQube webhook token` field (alongside Jenkins webhook token and Monitoring webhook token)
- After setting a token, SonarQube webhooks sent with the correct HMAC-SHA256 signature in `X-Sonar-Webhook-HMAC-SHA256` are accepted with HTTP 202

## Actual result

- The plugin settings page has no `SonarQube webhook token` field
- The source code (`devops_webhooks_controller.rb`) reads `Setting.plugin_redmineflux_devops['sonarqube_webhook_token']`, but this key cannot be set from the UI
- All SonarQube webhooks are rejected with HTTP 401 `{"error":"Invalid signature"}` because the secret is always blank
- SonarQube integration is completely non-functional for any project

## Root cause

`webhook_secret_for('sonarqube', repo)` reads the `sonarqube_webhook_token` plugin setting key, but the settings view does not render a form field for this key. The Jenkins and monitoring tokens are present; SonarQube was omitted.

## Evidence

- Screenshot path: screenshots/TC-RDV-006/tc-rdv-006-partial-fail.png
- SonarQube webhook response: HTTP 401 `{"error":"Invalid signature"}`

## Duplicate check

- Duplicate found: No

## Retest

- Date: 2026-05-23
- Environment: Local Docker (http://localhost:3008)
- Result: **CONFIRMED**
- Navigated to `/settings/plugin/redmineflux_devops` as admin. Settings page shows: Encryption key, Jenkins webhook token, Monitoring webhook token, System user, rate limit, retention fields. No SonarQube webhook token field present. Screenshot: screenshots/BUG-RDV-003/retest-2026-05-23-confirmed.png

## Retest

- Date: 2026-05-26
- Environment: Local Docker (http://localhost:3008) — fresh instance
- Result: **FIXED**
- Navigated to `/settings/plugin/redmineflux_devops` as admin. Settings page now includes `settings[sonarqube_webhook_token]` password field with label "SonarQube webhook token". Field is present alongside Jenkins and Monitoring token fields. Bug no longer reproduces.

## Retest

- Date: 2026-05-26
- Environment: Forge (https://flux-foq1fnz3j49.forge.zehntech.com) — new instance
- Result: **FIXED**
- `GET /settings/plugin/redmineflux_devops` — HTML contains `settings[sonarqube_webhook_token]` and "SonarQube" label. Field is present in the plugin settings page. Bug does not reproduce on new Forge.
