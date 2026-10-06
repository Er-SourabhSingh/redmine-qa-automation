# BUG-TCM-038

- Bug ID: BUG-TCM-038
- Production Redmine Issue ID: #122094
- Title: QA Milestone update/delete have no server-side permission check at all — any project member can edit or delete a milestone regardless of role (UI button-hiding is the only gate)
- Severity: High
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.1.0
- Environment: Docker `localhost:3015` (project `qa-demo`)
- Browser: Chromium (Playwright MCP)
- User role: Reporter (`reporter`, holds neither `edit_milestone` nor `delete_milestone`)
- Date: 2026-10-05

## Summary

`TestcaseMilestonesController#update` and `#destroy` perform no authorization check whatsoever — no
`allowed_to?`, no `rftc_authorize_*`, nothing. The Edit/Delete links are conditionally hidden in the view based on
`allowed_to?(:edit_milestone, ...)` / `allowed_to?(:delete_milestone, ...)`, but that is a **UI-only** gate: the
underlying controller actions accept the request from anyone who can reach the route, regardless of role.
Confirmed live: `reporter` (whose role has neither `edit_milestone` nor `delete_milestone`) successfully renamed
and then deleted a milestone via direct requests to the same endpoints the UI buttons would call, with the
buttons never visible to this role in the first place.

## Steps to reproduce

1. As a role lacking `edit_milestone`/`delete_milestone` (e.g. Reporter), with a milestone already created by a
   privileged user:
2. `PATCH /projects/<project_id>/testcase_milestones/<id>` with `testcase_milestone[name]=<new name>`.
3. `DELETE /projects/<project_id>/testcase_milestones/<id>`.

## Expected result

- Both requests are rejected (403) since this role holds neither `edit_milestone` nor `delete_milestone`; the
  milestone's name and existence are unchanged.

## Actual result

- Both requests succeeded. The client-side `fetch()` call received a `404` (an artifact of the response's
  redirect-following behavior — the underlying action's own redirect target 404s), **but the mutation had already
  happened server-side before that redirect**:
  ```
  $ rails runner 'm=TestcaseMilestone.find(1); puts m.name'
  Hacked By Reporter   # renamed by the PATCH, as reporter

  $ rails runner 'puts TestcaseMilestone.where(id:1).exists?'
  false   # deleted by the subsequent DELETE, as reporter
  ```
- Root-caused by reading the controller source: `update` and `destroy` have zero `allowed_to?`/`authorize`
  calls. The only place `edit_milestone`/`delete_milestone` are referenced at all in this feature is the view
  layer (`index.html.erb`/`_open.html.erb`), which conditionally renders the Edit/Delete links — hiding a button
  is not the same as the action being authorized, and this reproduces exactly that gap.

## Evidence

### Console / log

```
$ fetch('/projects/1/testcase_milestones/1', {method:'PATCH', body: 'testcase_milestone[name]=Hacked By Reporter', ...})
  -> 404 (client-visible; misleading — see below)

$ rails runner 'puts TestcaseMilestone.find(1).name'
Hacked By Reporter

$ fetch('/projects/1/testcase_milestones/1', {method:'DELETE', ...})
  -> 404 (client-visible; misleading)

$ rails runner 'puts TestcaseMilestone.where(id:1).exists?'
false
```

## Test case coverage

Found while executing TC-REPORT-07-01 (P2, `docs/qa/V1-TEST-CYCLE-7.1.0.md`) — the test case's own grounded
source-code reading predicted exactly this gap and asked to confirm it live before filing, rather than treating
a "not visible in the UI" result as proof the action is actually blocked.

## Additional note (2026-10-05, found while executing TC-REPORT-07-01's QA Manager-side legs)

There is **no delete control in the UI at all for a milestone, for any role** — not just hidden for
under-privileged roles. Checked both the Open/Closed milestone list rows and the milestone's own detail page as
both `qa.manager` and `admin`; neither shows any Delete action or link anywhere. The only way to delete a
milestone at all, for any user including an Administrator, is a direct request to the unprotected
`DELETE /projects/:project_id/testcase_milestones/:id` endpoint — confirmed working as `admin` the same way it
worked as `reporter` above. This reframes the bug slightly: it isn't that a permission check is missing on an
otherwise-reachable action — the delete endpoint appears to have been left wired up from development/testing
with no corresponding UI ever built for it, and nobody since has gated it. Still the same root defect (no
authorization check on `destroy`), just confirming the UI-hiding half of the design doesn't even exist for this
specific action, only for update.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers `TestcaseMilestonesController`'s
  update/destroy authorization.

## Production report

Reported to production `ztflux` as #122094 on 2026-10-06, assigned to Vaishnavi Bhawsar, target version "Testcase Management plugin Release 7.1.0". Created as a standalone bug issue (no production Run/Testcase created).
