# Redmineflux Platform — Code Quality Testing Report — 2026-10-01

> One report per testing type, per day it was performed on this plugin — see CLAUDE.md §7.
> Per `SENIOR_QA_STANDARDS.md` §30, code quality review is not a separate TC suite — it is folded into
> root-cause investigations where plugin source is actually read. This report documents the review performed
> while investigating TC-PLT-218 (Security suite) and its confirmed finding.

## Source reviewed this session

| File | Reason read |
|---|---|
| `app/views/redmineflux_platform/overview/index.html.erb` (full file, 239 lines) | Root-cause investigation for TC-PLT-218's suspected stored-XSS |
| `app/views/redmineflux_platform/shared/_holiday_calendar.html.erb` (full file, 55 lines) | Same investigation — shared partial reused by other screens |

## Findings

| Finding | Category (§30) | Severity | Bug reference |
|---|---|---|---|
| `title=#{...inspect}.html_safe` pattern splices an unescaped attribute directly into markup with no surrounding quote supplied by the template — the exact pattern `SENIOR_QA_STANDARDS.md` §30 calls out ("the same rule... enforced identically") was violated here between the attribute path and the adjacent `<%= holidays.first.name %>` label on the same line (line 43 of the partial), which correctly auto-escapes via ordinary ERB interpolation. One rendering path for the same data (`holidays.first.name`) is safe; the other (`title=` attribute) is not. | Consistent validation / escaping not applied identically across rendering paths for the same field | Critical | `BUG-PLT-027` (filed under Security, since the observable defect is XSS — this report cross-references it as the code-quality root cause) |

No other defects from the §30 checklist (dead/orphaned code paths, unhandled exceptions surfacing as raw errors, defensive handling of external dependencies, migration safety) were found in the two files reviewed — both are otherwise clean, well-commented view code with no dead branches or unguarded external calls.

## Bugs / Defects Found

| Bug ID | Title | Severity | Status | Production Redmine Issue ID |
|--------|-------|----------|--------|------------------------------|
| BUG-PLT-027 | Confirmed stored XSS — Holiday name breaks out of the unquoted `title=` attribute on the Overview's Holiday Calendar widget and executes as real script on every page load | Critical | Open | Not yet reported |

## Notes / Findings

- **Redmine Version:** 6 (Rails 7.2.3.1)
- **Environment:** `redmine-docker-6-platform`, `localhost:3013`
- **Test Date:** 2026-10-01
- This report intentionally does not duplicate the full reproduction/evidence detail already in `BUG-PLT-027.md` and `reports/PLT-Security-2026-10-01.md` — it records the code-quality angle (why the pattern is wrong, and that it was a same-line inconsistency between two rendering approaches for the same data) as the distinct value this review type adds beyond the black-box finding.
- Recommended fix direction (also noted in the bug file): replace the hand-built `"title=#{...}".html_safe` string with Rails's own attribute-building helpers (e.g. `tag.div(..., title: names)`), which HTML-escape automatically and cannot reproduce this class of defect.
