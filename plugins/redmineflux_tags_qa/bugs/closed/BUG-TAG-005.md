# BUG-TAG-005

- Bug ID: BUG-TAG-005
- Production Redmine Issue ID: 120108
- Severity: Critical
- Title: Clicking a single tag row's "Delete" link deletes every checkbox-selected tag, not just the one clicked — silent unintended data loss
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Tags plugin (flux_tags)
- Plugin version: 7.0.0
- Environment: Forge — `https://flux-fczk00paf49.forge.zehntech.com/`
- Theme: Default (core Redmine)
- Language: German (Deutsch)
- Browser: Chromium (Playwright MCP)
- Resolution: Default viewport (not resolution-specific)
- User role: Admin
- Date: 2026-09-07

## Preconditions

- Admin permissions on the Redmineflux Tags plugin configuration page (`/settings/plugin/flux_tags?tab=issue`).
- At least 2 tags exist in the same tag-type tab.

## Steps to reproduce

1. Create two distinct tags, e.g. by adding `testkeepme` and `testdeleteme` to an issue's Tags field and saving.
2. Go to Administration > Plugins > Redmineflux Tags plugin > Issue Tags tab (`/settings/plugin/flux_tags?tab=issue`).
3. Check **both** row checkboxes (`testdeleteme` AND `testkeepme`).
4. Verify via DOM that each row's Delete link still carries its own distinct, correctly-scoped `onclick="showCustomConfirm(<id>, 'issue')"` (confirmed: id 10 for `testdeleteme`, id 9 for `testkeepme` — the links themselves are correctly scoped at this point).
5. Click only the **`testdeleteme`** row's own "Delete" link (not any bulk-action button — `testkeepme`'s Delete link is never touched).
6. In the confirmation modal ("Delete Tag" / "Are you sure you want to delete this tag?" — singular wording, referring to one tag), click "Delete" to confirm.

## Expected result

- Only `testdeleteme` (the tag whose Delete link was actually clicked) should be deleted. `testkeepme` should remain untouched — merely having its checkbox ticked is not an instruction to delete it, and the confirmation dialog's own singular wording ("this tag") promises exactly that.

## Actual result

**Both `testdeleteme` and `testkeepme` were deleted.** The list is left completely empty ("Nichts anzuzeigen" / Nothing to display) after confirming what the user was told was a single-tag deletion. The per-row Delete link's own `onclick` handler correctly identifies its specific target id, but whatever the confirm-and-submit step actually does appears to act on **all currently checkbox-selected rows** rather than (or in addition to) the specific id the clicked link was scoped to.

This reproduced the exact same way earlier in this session with a different tag pair (`qagermantwo`/`qagermanthree`) after they had been checkbox-selected for an unrelated context-menu test, then a delete was confirmed on what was believed to be an unrelated/nonexistent tag id — both real tags vanished at that point too, which is what first surfaced this bug (see the "false success" note in `BUG-TAG-003`, which should likely be re-read in light of this: the nonexistent-ID delete didn't just show a wrong message, it silently deleted whichever real tags happened to be checkbox-selected).

## Severity rationale

**Critical**: this is a genuine, silent, irreversible data-loss bug, not a cosmetic or translation defect. A user who checks several tags to review them (e.g. before editing, or while reading the list), then clicks a single, unrelated tag's "Delete" link expecting to remove only that one tag, will unknowingly delete every tag they had merely selected/checked — with a confirmation dialog that explicitly (and misleadingly) promises single-tag deletion. There is no way to know from the UI that checking a box changes the blast radius of an unrelated row's Delete action.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-TAG-005/both-tags-deleted-empty-state.png)

*(Shows the Issue Tags tab completely empty immediately after confirming what was presented as a single-tag delete for `testdeleteme` only.)*

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-TAG-005/retest-yyyy-mm-dd-pass.png)

### Console / log

- No related console errors — the deletion succeeds silently (over-broadly), it does not throw.

## Reconfirmation — 2026-09-08, new Forge server

Retested on a fresh Forge server (`https://flux-fyqnqkoqg49.forge.zehntech.com/`) with a new tag pair (`testdeleteme` unchecked, `testkeepme` checked via its own row checkbox). Clicked **only** the `testdeleteme` row's own "Delete" link (never touched `testkeepme`'s link), confirmed the (still-untranslated) modal.

**Result this time: `testkeepme` (the checkbox-selected tag) was deleted; `testdeleteme` (the row whose Delete link was actually clicked) survived** — the list afterward showed exactly 1 remaining tag, `testdeleteme` (1-1/1). This is a slightly different concrete outcome than the original report (which saw *both* tags deleted), but confirms the identical root defect: the delete action does not respect the specific tag id tied to the clicked link when another row is checkbox-selected — it acts on the checkbox-selected row(s) instead of (here) or in addition to (original report) the clicked one. Either way, the tag the user actually clicked "Delete" on is not reliably the tag that gets deleted, and a checkbox left ticked elsewhere silently redirects the deletion. **Reproduces — Critical, confirmed on a second, independent server.** Both remaining test tags cleaned up afterward via a subsequent single-tag delete (no other tags checked).

## Fix verified — 2026-09-08, new Forge server (branch updated)

Retested on a newly-provisioned Forge server (`https://flux-frtsiofsm49.forge.zehntech.com/`, per user: branch updated) under **both Standard and Lotus themes**, using the exact same reproduction steps: checked `testkeepme`'s row checkbox, left `testdeleteme` unchecked, then clicked only `testdeleteme`'s own "Löschen" link and confirmed.

**Result (both themes): only `testdeleteme` was deleted; `testkeepme` (checkbox-checked) survived untouched** — the list correctly showed exactly 1 remaining tag, `testkeepme`, after the delete. The delete action now correctly respects the specific tag id tied to the clicked link, regardless of any other row's checkbox state. **FIXED** — Critical data-loss bug confirmed resolved under both Standard and Lotus themes. Test tags cleaned up afterward.

## Duplicate check

- Duplicate found: No — related to but distinct from `BUG-TAG-003` (which documents the misleading "success" message for a nonexistent tag ID; this bug explains the likely *mechanism* behind that observation — real checked tags were probably being deleted in the background even then).
- Existing bug reference (if duplicate): N/A
