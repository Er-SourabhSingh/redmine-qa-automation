# Final Bug Report — Redmineflux DevOps

> Generated from bugs/open/. PDF only on explicit user request.

## Summary

| Total Open | Critical | High | Medium | Low |
|------------|----------|------|--------|-----|
| 1          | 0        | 0    | 1      | 0   |

*(BUG-RDV-028 excluded — not testable, no real CI artifact data)*

## Open Bugs

### BUG-RDV-091 — Medium
**Codecov and Coveralls webhook endpoints return 404 — coverage ingestion not implemented despite UI guidance**

- File: [bugs/open/BUG-RDV-091.md](../bugs/open/BUG-RDV-091.md)
- Redmine version: 6.0.0
- Plugin version: Release 6.0.0 (version 2033)
- User role: Administrator
- Date filed: 2026-06-03
- Last retest: 2026-06-05 — **STILL OPEN** (Forge flux-fswj5prkp49)

Summary: The coverage page displays "Configure a Codecov or Coveralls webhook to start tracking coverage." but the ingestion endpoints `/devops/webhook/codecov` and `/devops/webhook/coveralls` return HTTP 404. Both providers are absent from SUPPORTED_PROVIDERS. Coverage data can never be populated — the feature is a UI shell without a working data pipeline.

Affected TCs: TC-RDV-262, TC-RDV-263, TC-RDV-279

---

## Recently Closed (Retest 2026-06-05)

| Bug ID | Title | Fix confirmed |
|--------|-------|---------------|
| BUG-RDV-087 | DevOps Audit Log admin menu link has no visible text | "DevOps Audit Log" link now visible with correct text and URL in admin sidebar |
| BUG-RDV-088 | Build trigger action not logged in audit log | `build.triggered` and `build.cancelled` action types now present in audit_action dropdown |
| BUG-RDV-089 | Audit log viewer ignores per_page URL parameter | `?per_page=25` now returns 25 rows/page with correct pagination (1-25/270) |
| BUG-RDV-090 | Performance series endpoint returns HTTP 403 for browser session | Series endpoint now returns HTTP 200 with session cookie; charts render correctly |

## Environment

- Redmine Version: 6.0.0
- Plugin Version: Release 6.0.0 (version 2033)
- Retest Environment: Forge (flux-fswj5prkp49.forge.zehntech.com)
- Retest Date: 2026-06-05
- Total bugs filed (all time): 91 (excluding BUG-RDV-025)
- Closed: 90 | Open: 1 (+ 1 not testable)
