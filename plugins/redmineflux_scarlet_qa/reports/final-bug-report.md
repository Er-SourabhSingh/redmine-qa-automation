# Final Bug Report — Redmineflux Scarlet Theme

> Generated from bugs/open/ after Session 2. PDF only on explicit user request.

## Summary

| Total | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| 4 | 0 | 1 | 2 | 1 |

## Open Bugs

### BUG-RSC-001 — Theme asset activity.css returns 404 on every page
- **Severity**: Medium
- **Affected pages**: All pages (every page load)
- **Error**: `Failed to load resource: 404 @ /assets/plugin_assets/redmineflux_scarlet/activity.css`
- **Impact**: Activity page/block renders unstyled; `Activity container not found` JS log follows
- **Evidence**: screenshots/TC-RSC-002/tc-rsc-002-my-page-pass.png

---

### BUG-RSC-002 — JavaScript error — identifier 'lastJstPreviewed' already declared
- **Severity**: Medium
- **Affected pages**: All pages with JsToolbar rich text editor (New Issue, Issue Detail, New Project, Wiki edit)
- **Error**: `Identifier 'lastJstPreviewed' has already been declared`
- **Impact**: Duplicate JS variable declaration — rich text editor preview may malfunction
- **Evidence**: screenshots/BUG-RSC-002/bug-rsc-002-lastjstpreviewed-new-issue.png

---

### BUG-RSC-003 — Priority icon SVG assets missing (404) on issues list ★ HIGH
- **Severity**: High
- **Affected pages**: Issues list (/projects/*/issues)
- **Missing assets**:
  - `/plugin_assets/redmineflux_scarlet/images/priority_medium.svg`
  - `/plugin_assets/redmineflux_scarlet/images/priority_high.svg`
  - `/plugin_assets/redmineflux_scarlet/images/priority_blocker.svg`
- **Impact**: Priority indicators invisible on Issues list — users cannot visually distinguish issue priority at a glance
- **Evidence**: screenshots/BUG-RSC-003/bug-rsc-003-priority-icons-missing-issues-list.png

---

### BUG-RSC-004 — Tribute mention library bound twice to textarea
- **Severity**: Low
- **Affected pages**: All pages with textarea (Wiki edit, New Issue, Issue detail)
- **Warning**: `Tribute was already bound to TEXTAREA @ tribute-5.1.3.min`
- **Impact**: @-mention autocomplete may fire duplicate events; cosmetic risk of double dropdown
- **Evidence**: screenshots/TC-RSC-018/tc-rsc-018-wiki-empty-pass.png

---

## Environment

- Redmine Version: 6.1.2.stable.24650
- Plugin Version: redmineflux_scarlet 1.0.0
- Environment: Forge — https://dev-flux.zehntech.com/
- Browser: Chrome
- Test Dates: 2026-06-04 (Sessions 1 & 2)
- Tested By: sourabh.singh
