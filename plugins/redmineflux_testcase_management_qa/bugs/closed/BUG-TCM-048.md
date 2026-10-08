# BUG-TCM-048

> **CLOSED — 2026-10-07.** Production #122681 (https://flux.zehntech.com/issues/122681) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.
> The original local bug file was lost (system reformatted before it was pushed); this file is rebuilt from the
> production issue's description and journal.

- Bug ID: BUG-TCM-048
- Production Redmine Issue ID: #122681 (https://flux.zehntech.com/issues/122681) — created 2026-10-06, assigned to Vaishnavi Bhawsar, Priority Medium, Defect Severity Medium-severity
- Title: "Link existing defect" bulk panel shows zero feedback on failure — a rejected request looks identical to a silent no-op
- Severity: Medium
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.1.0
- Target version: Testcase Management plugin Release 7.1.0 [07-10-2026]
- Defect Type: Functional
- Defect priority: Medium
- Reported by: Sourabh Singh
- Date: 2026-10-06
- Status: Closed (production: Done, 2026-10-07)

## Summary

The bulk "Link existing defect" panel on the Run execution grid (rftc-008, confirmed otherwise-working in #122104/BUG-TCM-044) renders **no error feedback whatsoever** when the server rejects a link request — the panel just sits there, visually indistinguishable from a successful no-op. Two genuinely different rejection causes were found to produce this exact same silent symptom:

1. **Pasting/typing a defect reference with a leading "#"** (e.g. "#101", copied naturally from an issue's own title "Bug #101") — the controller does `Issue.find_by(id: params[:defect_issue_id].to_i)`, and Ruby's `"#101".to_i` evaluates to `0`, so the lookup always fails (422) even though the defect genuinely exists and is visible. Confirmed: plain "101" -> 201 Created; "#101" -> 422, same test case, same defect, only the string differs.
1. **Selecting a test case that isn't currently Failed/Blocked** — correctly rejected per the panel's own stated rule ("A defect can only be linked to a failed or blocked execution"), but again with zero visible message confirming that's what happened.

In both cases the only observable difference between "it worked" and "it was silently rejected" is whether the grid's "Defect ID's" column updates — no toast, no inline error, nothing in the DOM indicating a 422 occurred.

## Issue and resolution (product decision, 2026-10-06)

This plugin currently has two separate, inconsistent places to link a defect to a test case — the Add Result popup's own Defects field, and this standalone bulk panel. The bulk panel duplicates what Add Result is supposed to do, and its existence is itself a source of confusion (see BUG-TCM-014/047 for the related Add Result fixes needed).

**Resolution:** remove this bulk "Link existing defect" panel entirely. Consolidate onto the existing **Add Result** flow as the one and only place to link a defect — when a tester marks a test case Failed/Blocked, the Defects field should let them search for an existing bug already in the project (per BUG-TCM-014's fix) or create a new one via "Report Defect" (per BUG-TCM-047's fix), with the defect linked and visible directly from the test case immediately, no separate bulk step required. This bug (048) does not need its own silent-failure fix — it's superseded once the panel itself is removed; filing it here mainly so the removal has a documented reason on record.

## Steps to reproduce

1. Select a test case whose current result is not Failed/Blocked. Type a valid defect ID and click "Link existing defect." No error appears.
1. Separately: select a Failed/Blocked test case, type an existing defect's ID prefixed with "#" (e.g. "#101"). No error appears either — identical to step 1 and to a genuine success.

## Expected result

Per the resolution above, this panel is intended to be removed rather than fixed in place.

## Actual result

Both rejection causes return a real 422 (confirmed via network log) with `document.body.innerText` containing no error/failure-related text anywhere on the page, both times.

## Environment

Docker `localhost:3015` (project `qa-demo`), plugin v7.1.0, Chromium (Playwright MCP).

---

## Production history (synced from #122681 on 2026-10-08)

### 2026-10-06 14:06 UTC — Vaishnavi Bhawsar

Resolved per the product decision recorded on this ticket: the bulk "Link existing defect" panel has been removed entirely, rather than given its own error messages. Add Result's own Defects field (fixed under BUG-TCM-014/047) is now the one and only place to link a defect, so this duplicate, silently-failing entry point is gone instead of patched.

Verified: the bulk action bar on a Run's execution grid now shows only "Bulk Update Result" and "Clear" -- the defect-link input and button are gone. The per-defect unlink (x) control is unaffected and still works, since removing it was never part of this change. Zero console errors.

For QA: select two or more rows on a Run's execution grid and confirm the bulk action bar no longer shows any "Link existing defect" control -- only the bulk status-update button and Clear. Confirm linking a defect is now done through Add Result, and that removing an already-linked defect (the x on its chip) still works.

### 2026-10-07 06:59 UTC — Sourabh Singh

Resolved by removal, as the resolution note on this ticket requested: the bulk "Link existing defect" panel no longer exists on master `4b5a7a7` -- confirmed both client-side (zero trace of it anywhere on the run execution grid) and server-side (its endpoint now 404s). The replacement path (Add Result's own Defects field, BUG-TCM-014/047) was independently confirmed working first. Closing.
