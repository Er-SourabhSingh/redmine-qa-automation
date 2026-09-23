# Bug Report

- Bug ID: BUG-INE-006
- Production Redmine Issue ID: #121113 (ztflux, https://flux.zehntech.com/issues/121113) — linked as a defect to Test Case #121042, Run #577, Test Suite #146, Environment "Window 11 + Chrome"
- Title: Issue-list view shows an edit pencil for a workflow-Read-only custom field and reports "Changes saved successfully." even though the write is silently dropped
- Redmine version: 7.0.0
- Plugin name: Redmineflux Inline Editor
- Plugin version: 7.0.0
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Browser: Chromium (Playwright MCP)
- User role: Developer (`willow.belle`)
- Date: 2026-09-23

## Steps to reproduce

1. Precondition: a custom field (`cf_69`, "QA Workflow Field") has a Workflow → Fields permissions rule making it
   **Read-only** for role Developer / tracker Bug at status **New**.
2. As a Developer-role user, create a fresh Bug-tracker issue (status defaults to New) — issue #1559 in this repro.
3. On the issue's **detail page**, confirm `cf_69` correctly shows **no** inline-edit pencil (this part is correct
   — see Evidence).
4. On the **issue list** (`/projects/test-project/issues`, with the `cf_69` column added), find the same issue's
   `cf_69` cell.
5. Click its pencil (it is present, unlike the detail page), type a value, and press Enter.

## Expected result

- Either the pencil should not appear at all on the list view either (matching the detail page's correct
  behavior), or, if it does appear, submitting a value should be refused with a visible error — consistent with
  how the endpoint already protects the underlying data (see Actual result: the value is *not* actually written).
- The user should never see a "saved" confirmation for a change that did not take effect.

## Actual result

- The list view's `cf_69` cell **does** render an inline-edit pencil at status New, despite the same
  Workflow → Fields permissions rule correctly suppressing it on the detail page for the same issue and role. This
  is a genuine surface inconsistency, not present on the detail page.
- Submitting a value through this incorrectly-shown pencil sends `PUT /issues/1559/update_field.json`, which
  returns `200 OK`. The server **does** protect the actual data — the response's own echoed `custom_fields` array
  confirms `cf_69`'s value is `""` (the attempted value was silently dropped, not persisted; confirmed again via a
  full page reload) — so this is not a data-integrity breach.
- However, the client displays a `rf-toast rf-toast--success` toast reading **"Changes saved successfully."** —
  a false-positive success message for a write that silently did nothing. A user acting on this field would
  reasonably believe their change was saved when it was not, with no indication anything is wrong.
- Reproduced twice in a row (two separate attempts, same result both times): pencil present, `200`, empty value
  persisted, "Changes saved successfully." shown.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-INE-006/false-success-toast-readonly-field-list.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-INE-006/retest-yyyy-mm-dd-pass.png)

### Console / log

- Detail page (correct): `cf_69`'s attribute row has **zero** `.rf-edit-icon` elements at status New.
- Issue list (incorrect): same issue, same field, same status — `.cf_69` cell **does** have a `.rf-edit-icon`.
- `PUT /issues/1559/update_field.json` → `200 OK`, response body:
  `{"id":69,"name":"QA Workflow Field","value":""}` (attempted value `"attempt3-for-screenshot"` was not applied).
- Toast captured: `{"className":"rf-toast rf-toast--success","text":"Changes saved successfully."}`.
- Reload confirms `cf_69` remains blank — the underlying data is safe; only the UI is wrong (wrong affordance +
  misleading success message).

## Additional scope confirmed 2026-09-23 (same root cause, not filed separately)

The false-success half of this bug is not limited to the issue list or to custom fields. Whenever Redmine core
silently filters a disallowed attribute out of an `update_field.json` request, the endpoint still answers `200`
and the plugin shows "Saved successfully.". Confirmed on the **issue detail page** with editors opened while
the change was still allowed, then submitted after admin removed the permission (two isolated browser contexts):

| Case | TC | Request | Response | Data | Toast |
|---|---|---|---|---|---|
| Core field (Subject) made workflow Read-only at the current status | TC-INE-057 / TC-INE-094 | `{"subject":…}` on #1559 | 200, subject echoed unchanged | Unchanged | "Saved successfully." |
| Custom field `cf_69` made workflow Read-only at the current status | TC-INE-006 step 3 | `{"custom_field_values":{"69":…}}` on #1559 | 200, `cf_69` echoed `""` | Unchanged | none seen at a check ~2 s after the save (may have faded) |
| Status transition Feedback → Resolved removed from the Developer workflow | TC-INE-095 | `{"status_id":"3"}` on #1560 | 200, status echoed Feedback | Unchanged | "Saved successfully." |

The server enforces the rule in every case; the data is safe. The defect is that the refusal is never reported.
The suggested fix is the same for all of them: have the endpoint return 422/403 when a requested attribute is
not applied, or have the client compare the echoed value with what was sent.

A permission-revocation variant that goes through a different save path is filed separately as `BUG-INE-008`.

**Production note:** production issue #121113 was filed before this extra scope was known. Updating its
description is a production write and needs explicit approval.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Production report

- Reported on `flux.zehntech.com` (project `ztflux`) as issue **#121113**, 2026-09-23.
- Linked as a defect to Test Case **#121042** ("Sanity: Inline date editor auto-save timing fix"), Run **#577**,
  Test Suite **#146**, Environment "Window 11 + Chrome" (the run's actual label — note it omits the "s") —
  testcase now correctly shows **Failed** with defects `[121112, 121113, 121114]` in the run, along with
  BUG-INE-005 and BUG-INE-007 (all 3 bugs from this session relate to the same testcase, per explicit user
  instruction).
- Priority: Medium | Defect Severity: Medium-severity | Defect priority: Medium | Defect Type: Functional | Assignee: Vaishnavi Bhawsar.
