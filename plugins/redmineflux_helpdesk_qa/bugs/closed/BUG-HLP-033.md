# Bug Report

- Bug ID: BUG-HLP-033
- Production Redmine Issue ID: 120022
- Title: The ticket list's SLA Status badge and the ticket's own SLA Information panel disagree on the same ticket's SLA condition — the detail panel has no "At Risk"/"Critical" concept and unconditionally shows "On Track" until the deadline is literally passed
- Redmine version: 6.1.3.stable
- Plugin name: redmineflux_helpdesk
- Plugin version: (see plugin registry — not independently re-checked this session)
- Environment: Local (redmine-docker-6, localhost:3012)
- Browser: Chromium (Playwright MCP)
- User role: Agent (`luna.blossom`, `view_helpdesk`)
- Date: 2026-09-03

## Steps to reproduce

1. Log in as an Agent. Open Helpdesk QA Alpha's ticket list (`/projects/helpdesk-qa-alpha/helpdesk/tickets`) with the SLA Status column shown.
2. Find a ticket whose SLA is currently between roughly 20% and 50% of its total response/resolution window remaining — e.g. ticket #34 ("TC-HLP-354 ticket assigned during the holiday itself test"), which showed **"13h 33m At Risk"** (amber dot) in the SLA Status column.
3. Open that same ticket (`/issues/34`) and click its **SLA Information** tab.

## Expected result

- The ticket's own SLA Information panel should reflect the same SLA health the list already reports for it — if the list says "At Risk" (or "Critical"), the detail panel should not simultaneously claim everything is fine.

## Actual result

- The SLA Information panel's header badge reads **"✓ On Track"** (green `hl-ok`) for the exact same ticket, at the exact same moment the list shows "At Risk" (amber). The panel's own Response SLA row even displays "⏱ about 14 hours left" — consistent timing with the list's "13h 33m" — yet the overall status pill still says "On Track."
- **Root-caused via source** (`docker exec` into `redmine-docker-6-redmine-1`):
  - The list's badge (`app/views/rf_helpdesk/_sla_timer.html.erb`) reads `issue.rf_issue_sla_status.sla_health_status`, a real model method (`app/models/rf_issue_sla_status.rb`) implementing the full, documented 7-state model: it computes `pct = seconds_remaining / total_window_seconds * 100` and returns `:on_track` if `pct > 50`, `:at_risk` if `pct > 20`, else `:critical` (breached/paused/resolved handled separately). This matches `HELPDESK_USER_GUIDE.md` §6's documented 7 badge states exactly.
  - The SLA Information detail panel (`app/views/issues/_sla_information.html.erb`) computes its own, **entirely separate**, binary `overall_health` local variable with only 5 possible values: `:breached`, `:overdue` (deadline already passed), `:done`, `:paused`, or — the fallback for literally everything else — `:ok` → **"On Track."** It has no percentage-of-window calculation and no "at_risk"/"critical" concept whatsoever; a ticket at 21% of its window remaining and a ticket at 99% remaining are both simply "On Track" here.
  - The two views never share the health-computation code — they are two independent implementations of "how healthy is this SLA," one matching the documented 7-state spec and one a coarser 5-state approximation that silently omits the At Risk/Critical tiers entirely.
- Real-world impact: an agent who checks a ticket's own SLA Information tab (arguably the more "official," detailed view) could reasonably believe there is no urgency ("On Track"), while the same ticket is flagged amber/red on every list view — exactly the kind of cross-screen inconsistency this suite's TC-HLP-050 is designed to catch.
- **Secondary, lower-severity finding from the same root cause**: for an already-breached ticket, the list correctly shows "⚠ Breached +Xh ago" (confirmed on ticket #36), but its SLA Information panel shows **"⚠ Needs Attention"**, not "✗ SLA Missed" — because the panel's `overdue` branch (computed from `deadline < now`) fires before its `breached` branch (which depends on separate `response_breached`/`resolution_breached` model flags that evidently aren't set for this ticket). Less severe than the At Risk/Critical case since both wordings correctly convey urgency, but it confirms the two implementations are entirely unsynced, not just missing a couple of states.
- **Confirmed NOT affected**: Resolved/Completed tickets (list "✓ Resolved" ↔ panel "✓ Completed", worded differently but not a false sense of safety) and Paused tickets both use shared boolean flags (`status == 'resolved'`, `is_paused`) read identically by both implementations, so those two states stay consistent between list and panel.

## Evidence

### Screenshot

![Bug evidence — ticket list shows "13h 33m At Risk" for #34](../../screenshots/BUG-HLP-033/BUG-list-sla-status-at-risk.png)

![Bug evidence — the same ticket's SLA Information tab simultaneously shows "✓ On Track"](../../screenshots/BUG-HLP-033/BUG-detail-sla-information-on-track.png)

### Console / log

- Source excerpt, `rf_issue_sla_status.rb#sla_health_status`:
  ```ruby
  if sla_started_at && active_deadline
    total_secs = (active_deadline - sla_started_at).to_i
    pct = total_secs > 0 ? (secs.to_f / total_secs * 100).round : 0
    return :on_track if pct > 50
    return :at_risk  if pct > 20
    :critical
  ```
- Source excerpt, `_sla_information.html.erb`'s `overall_health`:
  ```ruby
  overall_health =
    if any_breached                       then :breached
    elsif resp_overdue || resol_overdue   then :overdue
    elsif sla_status.status == 'resolved' then :done
    elsif sla_status.is_paused            then :paused
    else                                       :ok
    end
  ```

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Retest — Confirmed FIXED (2026-09-10)

- Production issue #120022 found marked "In QA" (developer checked in a fix), triggering this retest per the user's request to retest all checked-in Helpdesk bugs on `localhost:3012`.
- Created a fresh ticket (#78), assigned to `luna.blossom` (L1) to start its SLA clock on Alpha Escalation Test SLA, then directly engineered its `rf_issue_sla_status` row via `rails runner` (`sla_started_at`/`response_deadline` adjusted to a precise 1000s window with 300s remaining, i.e. exactly 30% — squarely in the documented "At Risk" range of >20% and ≤50%) so the test wasn't dependent on real-time timing luck.
- **List**: ticket #78's SLA Status column read **"4m At Risk"**, as expected.
- **Detail panel** (`/issues/78?tab=sla-information`): the panel header now reads **"⚠ At Risk"** — matching the list exactly, not the old unconditional "✓ On Track" fallback. The panel itself also appears substantially rebuilt (now shows an "SLA Overview" table, an "SLA Journey" stage table, and an "Activity Log"), consistent with the fix routing both surfaces through the same 7-state health model rather than two independent implementations.
- Production issue #120022 synced 2026-09-10: status In QA → Done, % done → 100 (approved).
