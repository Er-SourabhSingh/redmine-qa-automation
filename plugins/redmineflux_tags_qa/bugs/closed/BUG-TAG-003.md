# BUG-TAG-003

- Bug ID: BUG-TAG-003
- Production Redmine Issue ID: 120106
- Severity: High
- Title: Admin Tag configuration page's browser-tab title leaks a raw, unresolved Ruby-style hash literal instead of a real page title; deleting a nonexistent tag falsely reports success
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

- Redmine system default language and the admin account's own language both set to German (Deutsch).
- Admin permissions (page requires re-confirming password, core Redmine security feature — unrelated, works correctly and is itself fully translated).

## Steps to reproduce

1. Log in as admin (German language active).
2. Navigate to Administration > Plugins > Redmineflux Tags plugin ("Konfigurieren" link), or directly `/settings/plugin/flux_tags`.
3. Re-confirm password if prompted.
4. Look at the browser tab / `document.title` on this page and any of its tabs (`?tab=general`, `?tab=issue`, `?tab=time_entry`, `?tab=project`).

## Expected result

- The page title should be a clean, readable string, e.g. "Redmineflux Tags plugin - Plugins - Konfiguration - Administration - Redmine" (matching the pattern every other admin page uses).

## Actual result

The `<title>` renders as:

```
Redmineflux Tags plugin - Plugins - Konfiguration - {delete_success: "Tag deleted successfully", delete_failure: "Tag not found"} - Redmine
```

Confirmed via `document.title` in the DOM (not just the accessibility tree). A raw, unprocessed Ruby-hash-style literal — apparently JS confirm-dialog message strings meant for the tag Delete action — is being concatenated directly into the page's `<title>` instead of a resolved title string. This reproduces identically on every tab of this settings page (`general`, `issue`, `time_entry`, `project`), confirming it is not a one-off render glitch but a structural bug in how this controller/view builds its title.

This is a code-level defect (a data structure being serialized into a title string), not merely a missing translation — it would show the same broken title even in English, though it was discovered during German-language testing.

## Related finding — the "Tag not found" branch of this same hash is unreachable and masks real failures

While investigating whether `delete_failure: "Tag not found"` ever actually renders, its onclick handler was called directly with a deliberately invalid tag ID (`showCustomConfirm(999999, 'issue')`, tag 999999 does not exist) and the delete confirmed:

- **Actual result:** the flash message still read **"Tag deleted successfully"** (confirmed via `#flash_notice` DOM content) — a false-positive success message for a delete that could not have succeeded.
- This means the `delete_success`/`delete_failure` hash referenced in the broken title is very likely dead/unreachable code — the controller appears to always report success regardless of whether the tag actually existed or was deleted, which is a data-integrity concern beyond the cosmetic title bug (an admin has no reliable signal that a delete actually failed).
- Because this error path could not be triggered, "Tag not found"'s own German translation status could not be independently confirmed live — it is still known to be untranslated only via the raw string visible in the broken `<title>` (see above).
- **Update:** a follow-up investigation found the likely real mechanism behind this false-success behavior — see `BUG-TAG-005` (Critical). At the time this nonexistent-ID delete was performed, two real, existing tags happened to be checkbox-selected in the list; per BUG-TAG-005, the delete-confirm action appears to act on all checkbox-selected rows rather than being scoped to the specific tag id passed to the confirm dialog. So the "success" shown here was likely genuine — it just silently deleted the two checked real tags instead of the nonexistent one requested. This does not rule out that the `delete_failure` branch is separately unreachable/dead code, but the false-success behavior itself is now explained by BUG-TAG-005, not purely a missing existence-check.

## Severity rationale

High: visibly broken on every load of a page an admin is likely to visit repeatedly (tag management); indicates a genuine templating/controller bug rather than a cosmetic translation gap; and the related false-success-on-failure behavior means this defect has a real functional/data-integrity dimension, not just cosmetic — an admin cannot trust the delete outcome message.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-TAG-004/admin-tag-list-untranslated.png)

*(Screenshot shows the affected page; the broken `<title>` itself is browser-tab/DOM-level and cannot be captured in a viewport screenshot — see the "Page Title:" value recorded via Playwright MCP in the steps above, and reproduce via `document.title` in devtools.)*

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-TAG-003/retest-yyyy-mm-dd-pass.png)

### Console / log

- No related console errors — the broken title renders without throwing.

## Reconfirmation — 2026-09-08, new Forge server

Retested on a fresh Forge server (`https://flux-fyqnqkoqg49.forge.zehntech.com/`). `document.title`/Page Title still reads exactly `Redmineflux Tags plugin - Plugins - Konfiguration - {delete_success: "Tag deleted successfully", delete_failure: "Tag not found"} - Redmine` on both the general and Issue Tags tabs. **Reproduces identically.**

## Fix verified — 2026-09-08, new Forge server (branch updated)

Retested on a newly-provisioned Forge server (`https://flux-frtsiofsm49.forge.zehntech.com/`, per user: branch updated) under **both Standard and Lotus themes**. `document.title`/Page Title now reads cleanly: `Redmineflux Tags plugin - Plugins - Konfiguration - Markierungen - Redmine` — the raw hash literal is gone, replaced with the resolved German word "Markierungen" ("Tags"). **FIXED** under both themes.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A
