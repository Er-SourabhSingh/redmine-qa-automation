# Bug Report

- Bug ID: BUG-RDV-055
- Title: Infrastructure resource usage gauges not implemented — no CPU/Memory/Disk on environment cards
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Plugin version: (local)
- Environment: Local Docker (http://localhost:3008)
- Browser: Chromium (Playwright)
- User role: Admin
- Date: 2026-05-28
- Severity: High

## Steps to reproduce

1. Navigate to `/projects/phoenix-platform/devops_environments`
2. Observe the environment cards (dev, staging, qa, uat, production)
3. Look for CPU, Memory, and Disk usage gauges on each card

## Expected result

- Per rfd-118 and TC-RDV-350: each environment card should show three gauges: CPU %, Memory %, Disk %
- Color thresholds: green < 70%, amber 70–89%, red ≥ 90%
- Missing queries should render "N/A" not 0 (TC-RDV-354)
- Gauge values served from 60-second per-environment cache (TC-RDV-355)
- Boundary: exactly 70% = amber, exactly 90% = red (TC-RDV-368, TC-RDV-369)

## Actual result

- Environment cards show ONLY the uptime widget ("UPTIME - 30d / 90d: - / Trend: -") — no CPU, Memory, or Disk gauges
- No `[class*="gauge"]`, `[class*="cpu"]`, `[class*="memory"]`, or `[class*="resource"]` elements exist in the environments page HTML
- The rfd-118 Infrastructure Resource Usage feature (Prometheus/CloudWatch/Datadog CPU/memory/disk queries per environment) is entirely absent
- Affects TC-RDV-350, TC-RDV-351, TC-RDV-352, TC-RDV-353, TC-RDV-354, TC-RDV-355, TC-RDV-368, TC-RDV-369 (all BLOCKED)

## Evidence

![BUG-RDV-055 — Environment cards with no CPU/Memory/Disk infrastructure gauges](../../screenshots/BUG-RDV-055/bug-rdv-055-no-infra-gauges-env-cards.png)

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —
