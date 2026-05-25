# BUG-RDV-033 — ArgoCD provider not supported; canary/progressive rollout TCs entirely blocked

- Bug ID: BUG-RDV-033
- Title: ArgoCD is not a supported provider — canary and progressive rollout features are unavailable
- Severity: High
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Plugin version: unknown
- Environment: Local Docker (http://localhost:3008)
- Browser: Playwright (Chromium)
- User role: Admin
- Date: 2026-05-25

## Steps to reproduce

1. Attempt to create a DevOps connection with provider `argocd` by POSTing to `/projects/phoenix-platform/devops_connections` with `provider=argocd`.
2. Observe the HTTP response.
3. Alternatively, navigate to the connections new form and inspect the provider dropdown for ArgoCD option.

## Expected result

- ArgoCD should be listed as a supported CI/CD provider given the plugin advertises canary rollouts, progressive deployments, and ArgoCD sync status features.
- Creating an ArgoCD connection should succeed and enable related webhook endpoints.

## Actual result

- POST with `provider=argocd` returns HTTP 400 (Bad Request) immediately.
- SUPPORTED_PROVIDERS constant in the plugin is: `[github, gitlab, bitbucket, jenkins, sonarqube, fossa, prometheus, datadog, zabbix, pagerduty]` — ArgoCD is absent.
- All TC-RDV-193 (canary rollout via ArgoCD) and TC-RDV-194 (progressive rollout) are blocked entirely.
- Features advertised in the plugin documentation (ArgoCD sync, canary %, rollback from ArgoCD) cannot be tested or used.

## Evidence

- Screenshot path: screenshots/TC-RDV-193/ (BLOCKED)
- Log path: —
- Trace/video path: —

## Duplicate check

- Duplicate found: No
- Existing bug reference: —
