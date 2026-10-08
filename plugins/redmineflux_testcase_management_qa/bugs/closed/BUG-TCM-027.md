# BUG-TCM-027

> **CLOSED — 2026-10-06.** Production #121848 (https://flux.zehntech.com/issues/121848) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.

- Bug ID: BUG-TCM-027
- Production Redmine Issue ID: #121848
- Title: Removing a Requirement link via the issue Edit form's select2 widget does not persist — the requirement remains linked after submit
- Redmine version: 7.0.0
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.0.0
- Environment: Docker `localhost:3010` (project `test-project`)
- Browser: Chromium (Playwright MCP)
- User role: Administrator
- Date: 2026-10-01

## Summary

A test case's `/issues/:id/edit` form shows its linked Requirements as removable select2 "chips," each with an
**×** remove button. Clicking the × correctly clears the chip client-side (confirmed: the underlying
`<select name="issue[requirement_ids][]">` element's `selectedOptions` becomes empty immediately after the
click). Submitting the form afterward, however, **does not persist the removal** — reloading the issue shows the
requirement still linked, every time.

Reproduced 3 times, the last 2 using `form.requestSubmit()` directly (bypassing any possible click-interception
issue with the visible Submit button) to rule out a Playwright-specific interaction artifact — same result both
times: the form genuinely submits (URL redirects from `/issues/1021/edit` to `/issues/1021`), but the requirement
remains linked on reload.

## Steps to reproduce

1. Open an existing test case that has ≥1 linked Requirement (e.g. #1021, linked to `REQ-TC112 Create
   Requirement Test`).
2. Go to `/edit`. In the Requirements select2 widget, click the **×** on the linked requirement's chip.
3. Confirm the chip is gone and the underlying `<select>` has no selected options.
4. Submit the form (Submit button).
5. Reload the issue and check its Requirements field.

## Expected result

- Per `TESTCASE_MANAGEMENT_TEST_CASES.md` TC-TCM-117, clearing a case's requirement and saving should remove the
  link — the case should no longer appear against that requirement, and the RTM's coverage figure should decrease
  accordingly.

## Actual result

- After submitting, the issue still shows **"Requirements: REQ-TC112 Create Requirement Test"** — unchanged from
  before the removal attempt. Confirmed via a full page reload (not just checking the post-submit redirect page).
- Reproduced 3 times total: once via a normal Playwright `.click()` on the Submit button, twice via
  `form.requestSubmit()` called directly (confirmed via the URL correctly changing from `/edit` to the plain
  issue URL both times) — same negative result every time.

## Evidence

### Screenshot

![Issue #1021 still shows "Requirements: REQ-TC112 Create Requirement Test" after a chip-removal + submit attempt](../../screenshots/BUG-TCM-027/requirement-unlink-does-not-persist.png)

### Console / log

```
Before removal: select[name="issue[requirement_ids][]"] selectedOptions = ["REQ-TC112 Create Requirement Test"]
Click .select2-selection__choice__remove -> chip gone, selectedOptions = [] (confirmed client-side)
form.requestSubmit(submitBtn) -> page navigates /issues/1021/edit -> /issues/1021 (genuine submission, confirmed
  by URL change)
Reload /issues/1021 -> "Requirements: REQ-TC112 Create Requirement Test" still present, unchanged.
```

## Test case coverage

Found while executing `testcases/TESTCASE_MANAGEMENT_REQUIREMENTS_RTM.md`:
- TC-TCM-117 (Unlink a test case from a requirement) — **FAIL**, this is the blocking defect.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers Requirement unlinking specifically.
  Distinct from BUG-TCM-021 (Steps/Requirements wiped on the *New* Test Case form's re-render — a creation-time
  issue) — this is an *edit-time* persistence failure on an already-saved issue, a different code path entirely.

## Production report

Reported to production `ztflux` as **#121848** on 2026-10-01, assigned to Sheetal Sharma. Linked via
`report_defect` against testcase #121697 ("Sanity: Redmineflux Testcase Management — Final-Cycle Regression
2026-09-30") and run #592, environment "Window 11 + Chrome". Priority: Medium (priority_id 2); Defect custom
fields: Type=Functional, Severity=Medium-severity, Priority=Medium.

---

## Production history (synced from #121848 on 2026-10-08)

### 2026-10-06 08:25 UTC — Vaishnavi Bhawsar

Fixed. Removing a requirement's chip and saving was supposed to both drop the link AND clean up a little backlink note on the requirement's own page. The code that does the second part was accidentally also gating the first — so if the requirement didn't have any content/notes written on it yet, the actual unlink never happened at all, even though nothing looked wrong on screen.

Fix is committed and pushed (commit 883edc6).

I verified both cases directly: removing a requirement link when the requirement has NO content yet (previously silently failed, now works), and when it DOES have content (confirmed the link is removed AND the backlink note is correctly cleaned out of that content, with the requirement's other content left untouched).

For QA:
1. Link a Requirement to a test case, open the test case's Edit form, remove the Requirement via its × chip, and Submit.
2. Reload the test case and confirm the Requirement is genuinely gone (not just visually, but after a fresh reload).
3. Check the Traceability Matrix's coverage figure for that requirement updates accordingly.
4. Repeat with a Requirement that already has some written content, and confirm its other content is untouched after the unlink.

### 2026-10-06 13:32 UTC — Sourabh Singh

Retested 2026-10-06 against master 67631e0 — confirmed fixed via code read (commit 883edc6). The requirement-content cleanup helper no longer blocks the removal itself when the requirement has no saved text yet.
