# Bug Report Template

- Bug ID: BUG-PLT-031
- Production Redmine Issue ID: #121864
- Title: Audit Events search-by-name can never find a "created"/"updated" row for a record that still exists — the search query only matches `action`, `auditable_type` and `metadata`, and `metadata` is null until the record is deleted
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_platform
- Plugin version: `redmineflux_platform` branch, current tip
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, post-upgrade)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-10-01

## Steps to reproduce

1. Create any shared entity — an Organization, a Team, a Holiday, etc. — and do NOT delete it (e.g. `PLT-PERF-Org-150`, `PLT-PERF-Team-100`, both still live on this environment).
2. Open Redmineflux Platform → Audit events (`/redmineflux_platform/list/audit_events`).
3. Search for the record's exact name in the search box (e.g. `PLT-PERF-Org-150`).

## Expected result

- Per this suite's own `TC-PLT-132` ("Searching a name from the Audit trail's Record column finds the right entries") and the Audit Events screen's documented purpose, searching by a record's name should find that record's `created` (and any `updated`) audit row(s) — this is the single most common real-world use of an audit-search box: looking up the history of something you still have and care about, not something you already deleted.

## Actual result

The search returns **"No record matches"** for both a fresh Organization (`PLT-PERF-Org-150`, created this session, never deleted) and a fresh Team (`PLT-PERF-Team-100`, same) — even though each one's `created` audit row genuinely exists in `rf_audit_events` (confirmed via direct DB query: `auditable_type='RedminefluxPlatform::Organization'`, `action='created'`, row present).

### Root cause (confirmed from source)

`lib/redmineflux_platform/shared_entities.rb`'s `audit_events` entry defines search as:

```ruby
search: ->(rel, term) do
  rel.where('LOWER(rf_audit_events.action) LIKE :t OR ' \
            'LOWER(rf_audit_events.auditable_type) LIKE :t OR ' \
            'LOWER(rf_audit_events.metadata) LIKE :t', t: term)
end
```

It only ever matches 3 columns: `action` (e.g. `"created"`), `auditable_type` (e.g. `"RedminefluxPlatform::Organization"`), and `metadata`. A record's actual **name** is never one of these for a `created` or `updated` row — confirmed via direct query: `rf_audit_events.metadata IS NULL` for every `created` row checked. Per `BUG-PLT-021`'s own root-cause trace (already filed, production `#121711`), `metadata` is populated **only** by the `destroy` lifecycle hook (`rf_audit_destruction` → `rf_audit_identity`) — `rf_audit_creation` and `rf_audit_changes` never call it, so their `metadata` stays `nil` for the entire life of the record.

**This means the search box can only ever find a `created`/`updated` row by name in exactly one circumstance: the record has since been *deleted*** (because only the `deleted` row's own `metadata` ever got a name written into it). For every record that is still live — which is the overwhelming majority of rows in any real system, since most records are never deleted — the search is completely non-functional for its own stated purpose.

**This is a distinct, broader defect from `BUG-PLT-021`, not the same bug restated**: `BUG-PLT-021` is about the **displayed label** on an already-matched row regressing to `"ClassName #ID"` after the record is deleted. This bug is about the **search query itself** never being able to match a `created`/`updated` row by name in the first place, independent of deletion or display — a row for a record that is still perfectly alive, with a perfectly good name, is simply unreachable by searching for that name. `TC-PLT-132` (this suite, executed 2026-09-30) only tested the one case where this happens to partially work (searching for an already-deleted record's name, which finds the `deleted` row via its destroy-hook-populated `metadata`) and concluded "not a separate defect in the search itself" — that conclusion was based on an incomplete test; the live-record case was never tried.

## Evidence

### Screenshot

![Search finds nothing for a live, undeleted Organization](../../screenshots/BUG-PLT-031/search-no-match-live-record.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-031/retest-yyyy-mm-dd-pass.png)

### Console / log

- No error, no exception — a silent zero-result search, confirmed correct per the query's own logic (DB query directly confirms `metadata IS NULL` for the rows in question).
- Found incidentally while executing `PLATFORM_PERFORMANCE.md` TC-PLT-227 ("Audit Events list stays responsive... including search-by-name"), which asked to confirm TC-PLT-132's search-by-name "still performs acceptably at this volume, not just correctly" — checking correctness surfaced this.

## Duplicate check

- Duplicate found: No — related to `BUG-PLT-021` (same root cause family: `metadata` only ever populated by the destroy hook, never by create/update), but a distinct defect (search matching, not display-label fallback) with a much broader real-world impact (every live record, not just deleted ones). Not re-filing `BUG-PLT-021` itself.

## Production report

Reported to production `ztflux` as **#121864** on 2026-10-01, assigned to Prashant Chaurasia. Linked via `report_defect` against testcase #121856 ("Performance", Feature #120043 — newly created this session) and run #586, environment "Win + Chrome + Ver6" — testcase marked Failed. Priority: High (priority_id 3); Defect custom fields: Type=Functional, Severity=High-severity, Priority=High.
