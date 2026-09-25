# Bug Index — Redmineflux Checklist

| Bug ID | Title | Status | Severity | Redmine Version | File Path |
|--------|-------|--------|----------|-----------------|-----------|
| BUG-CHK-001 | Journal message for "Apply checklist template" is untranslated, unlike every other checklist journal message | Closed (already reported by user) | Low | 7.0.1.stable | bugs/closed/BUG-CHK-001.md |
| BUG-CHK-002 | Checklist/sub-item title containing a `<script>` tag executes on creation (client-side self-XSS, unescaped AJAX render) | Closed 2026-09-24 — retested PASS, scoped regression PASS, production #121059 synced to Done/100% | Critical | 7.0.0 (Docker) | bugs/closed/BUG-CHK-002.md |
| BUG-CHK-004 | Toggling a sub-checklist item's checkbox writes duplicate Checklist History journal entries — cascading AJAX calls on every click, worse under rapid clicking | Closed 2026-09-24 — retested PASS, scoped regression PASS, production #121060 synced to Done/100% | Medium | 7.0.0 (Docker) | bugs/closed/BUG-CHK-004.md |
| BUG-CHK-005 | Checklist CRUD (create, toggle, delete) is NOT blocked on a closed/read-only project — only "Add from template" is, and even that gives no user-facing feedback | Closed 2026-09-24 — retest #2 PASS (both write-block and feedback halves fixed), production #121061 synced to Done/100% | Low (was High, downgraded after retest #1) | 7.0.0 (Docker) | bugs/closed/BUG-CHK-005.md |
| BUG-CHK-006 | Checklist changes wrote a comment onto the issue's Notes tab again — regression of #87932 | Closed 2026-09-25 — production-reported, fix (commit f51af5b) already live, retested PASS same session; production #121326 not touched (status sync not requested) | Medium | 7.0.0 (Docker) | bugs/closed/BUG-CHK-006.md |
| BUG-CHK-007 | Rapid repeated checklist/sub-item toggling races unsequenced AJAX chains — 3 confirmed failure modes (percentage lag, sub-item lost updates, mixed-interaction overwrite of untouched items) | Closed 2026-09-25 — retested PASS (per-checklist request queue + updateProgressBar reordered to run after toggle_completed_bulk), production #121338 pending Done/100% sync approval | High | 7.0.0 (Docker) | bugs/closed/BUG-CHK-007.md |

## Notes
- Open bugs: bugs/open/
- Closed bugs: bugs/closed/
- Screenshots: screenshots/<BUG-ID>/
