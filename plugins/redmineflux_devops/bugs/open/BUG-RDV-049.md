# Bug Report

- Bug ID: BUG-RDV-049
- Title: DORA metric cards show classification badges and "0" instead of "N/A" when no deployment or incident data exists
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Plugin version: (local)
- Environment: Local Docker (http://localhost:3008)
- Browser: Chromium (Playwright)
- User role: Administrator
- Date: 2026-05-28
- Severity: Medium

## Steps to reproduce

1. Navigate to a project with zero production deployments and zero incidents (e.g., "Orion API" at `/projects/orion-api/devops_metrics`)
2. Observe the DORA metric cards: Deployment Frequency, Lead Time for Changes, Change Failure Rate, Mean Time to Recovery

## Expected result

- All four DORA metric cards display "N/A" or "No data" when there is insufficient data to calculate the metric
- No classification badge (Elite / High / Medium / Low) is shown when the metric cannot be meaningfully calculated
- A guidance message such as "Deploy to production to see DORA metrics" may optionally be shown
- For MTTR specifically: when `incidents: 0`, the card should display "N/A" (not "0 hours (median)") with no badge

## Actual result

- All four DORA metric cards display "0.0", "0%", or "0" with active classification badges:
  - Deployment Frequency: "0.0 deploys/week" — badge "low"
  - Lead Time for Changes: "0 hours (median)" — badge "low"
  - Change Failure Rate: "0%" — badge "elite"
  - Mean Time to Recovery: "0 hours (median)" — badge "elite" (with `incidents: 0`)
- Classification badges are misleading: a project with 0 incidents is NOT "elite" — MTTR cannot be determined
- No "N/A" or guidance message is displayed
- Affects TC-RDV-302 (zero deployments project) and TC-RDV-323 (MTTR with zero incidents)

## Evidence

![BUG-RDV-049 — Zero deployments shows elite badge instead of N/A](../../screenshots/BUG-RDV-049/bug-rdv-049-zero-deployments-with-badge.png)
![BUG-RDV-049 — Zero incidents MTTR shows elite classification instead of N/A](../../screenshots/BUG-RDV-049/bug-rdv-049-mttr-elite-zero-incidents.png)

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —
