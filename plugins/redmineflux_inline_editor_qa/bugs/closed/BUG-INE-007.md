# Bug Report

- Bug ID: BUG-INE-007
- Production Redmine Issue ID: #121114 (ztflux, https://flux.zehntech.com/issues/121114) — linked as a defect to Test Case #121042, Run #577, Test Suite #146, Environment "Window 11 + Chrome"
- Title: After an inline Status change, a field's edit pencil can stay stuck hidden even though the new status makes it editable — only a full page reload fixes it
- Redmine version: 7.0.0
- Plugin name: Redmineflux Inline Editor
- Plugin version: 7.0.0
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Browser: Chromium (Playwright MCP)
- User role: Admin (reproduces regardless of role — see Notes)
- Date: 2026-09-23

## Steps to reproduce

1. Precondition: Workflow → Fields permissions (role Developer, tracker Bug) has **Subject** marked **Read-only**
   at status "In Progress" only (no rule at any other status).
2. Open a Bug-tracker issue at status "New" (issue #1559 in this repro) — confirm the Subject heading shows its
   inline edit pencil (correct: no rule applies at New).
3. Inline-change Status to "In Progress" via the Status widget, then **reload the page** — confirm Subject's
   pencil is now correctly absent (the Read-only rule applies at this status).
4. **Without reloading again**, inline-change Status back to "New" via the Status widget.
5. Observe the Subject heading.

## Expected result

- Subject's inline edit pencil should reappear immediately once Status returns to "New", matching the pencil
  state a fresh page load at "New" shows (confirmed in step 2). The field genuinely has no Read-only restriction
  at this status.

## Actual result

- Subject's pencil **stays hidden** immediately after the inline Status change back to "New" — the field looks
  permanently un-editable even though the new status has no restriction on it. A full page reload is the only way
  to make the pencil reappear correctly.
- Reproduced consistently (3 times) with this exact sequence: reload while the field is genuinely read-only at
  the current status, then inline-transition Status away to a status where the field should become editable
  again. The pencil only correctly re-appears via inline transition when the page was never reloaded while the
  field was in its read-only state — i.e. the plugin appears to cache whether a field is currently editable at
  page-load time and does not always correctly re-evaluate that cached state after an inline Status change,
  specifically in this "reload-while-restricted, then transition-away-via-AJAX" sequence.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-INE-007/subject-pencil-stuck-hidden-after-status-change.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-INE-007/retest-yyyy-mm-dd-pass.png)

### Console / log

- Step 2 baseline (fresh load, Status=New): `document.querySelector('.subject h3').querySelector('.rf-edit-icon')` → truthy.
- Step 3 (fresh load, Status=In Progress, after establishing the Read-only rule applies): same query → `null`.
- Step 4→5 (inline AJAX Status change back to New, no reload): same query → **`null`** (bug — should be truthy).
- Reloading the page at Status=New immediately after: same query → truthy again (confirms the underlying
  permission state is correct; only the client's live DOM update is stale).

## Notes

- **This appears specific to standard/core fields, not custom fields.** `INLINE_EDITOR_CUSTOM_FIELD_CONFIGURATION.md`
  TC-INE-006/007 already exercised the identical sequence (reload while `cf_69` — a custom field — is read-only
  at "New", then inline-transition Status to "In Progress" where it's editable) and found the pencil correctly
  **appears immediately**, no reload needed. Subject (a core field) fails the same sequence. This suggests two
  different code paths: custom fields re-evaluate their editable/read-only state live after an inline Status
  change, while core/standard fields (confirmed: Subject) rely on a stale page-load-time flag that an inline
  Status change doesn't refresh.
- **Reproduces as Admin**, who is documented elsewhere this session (see `INLINE_EDITOR_MEMORY.md`) as exempt
  from workflow field permissions for **custom** fields. For this **standard/core** field (Subject), Admin is
  **not** exempt — the reload-rendered page hides Subject's pencil for Admin too at "In Progress". This may be a
  separate, orthogonal finding (core fields not receiving the same admin-bypass custom fields get) worth a look
  alongside the main stuck-pencil defect above, but is noted here rather than filed as its own bug since it
  wasn't the focus of this repro and needs its own dedicated verification across more core fields/roles.
- Found via a specific reproduction sequence the user walked through live (reconfiguring Workflow → Fields
  permissions on Tracker/Subject and asking to verify behavior directly) rather than from a written test case.
  Now codified as **TC-INE-107** in `INLINE_EDITOR_CUSTOM_FIELD_CONFIGURATION.md` (added 2026-09-23, right
  alongside TC-INE-006 as its direct core-field counterpart) so this "reload-while-restricted, then
  AJAX-transition-away" sequence is covered by the regular suite going forward, not just this bug report.

## Retest

**Result: FIXED, confirmed 2026-09-24** — after pulling commit `b57e71e` and precompiling assets. Reproduced the
exact original sequence on issue #1559 (Subject Read-only at "In Progress" for Developer/Bug): at "New" (later
"Feedback", since "New" has no outgoing transition from Developer directly back to it from "In Progress"),
Subject's pencil is present; inline-transitioned Status to "In Progress" (with `cf_69` filled to satisfy its
own Required-at-this-status rule) — pencil correctly absent, confirmed by reload; inline-transitioned Status
back to "Feedback" **without reloading** — the pencil **reappeared immediately**, no reload needed. Reconfirmed
again after an actual reload for consistency (still present). The new `syncSubjectEditor()` call after each
inline status-driven form refresh works as intended.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Production report

- Reported on `flux.zehntech.com` (project `ztflux`) as issue **#121114**, 2026-09-23.
- Linked as a defect to Test Case **#121042** ("Sanity: Inline date editor auto-save timing fix"), Run **#577**,
  Test Suite **#146**, Environment "Window 11 + Chrome" (the run's actual label — note it omits the "s") —
  testcase now correctly shows **Failed** with defects `[121112, 121113, 121114]` in the run, along with
  BUG-INE-005 and BUG-INE-006 (all 3 bugs from this session relate to the same testcase, per explicit user
  instruction).
- Priority: Medium | Defect Severity: Medium-severity | Defect priority: Medium | Defect Type: Functional | Assignee: Vaishnavi Bhawsar.
