# BUG-HLP-028

- Bug ID: BUG-HLP-028
- Title: The Command Center's header reads "Helpdesk" instead of the documented "Helpdesk Support"
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-02)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Agent (`manage.helpdesk.test`, real `manage_helpdesk` permission via a real project Membership, not admin)
- Date: 2026-09-02

## Revision History (2026-09-02, same day, corrected per user observation)

**Original scope was wrong and has been narrowed.** The original write-up claimed Redmine's application menu is not hidden in the Command Center, based on checking the wrong DOM element: the `<ul class="scarlet-topmenu-managed">` bar (Home/My page/Projects/Flux Gantt/Helpdesk Command Center/Time Tracker/Timesheet/Workloads/Administration/Help) — this is Redmine's `:top_menu`, present on every single page including the login screen, and was never the menu the guide's "Redmine's application menu is hidden here" claim refers to.

The user pointed at a real Redmine `/projects` screenshot showing a **second**, distinct nav bar underneath the top one — `Projects / Activity / Issues / Spent time / Gantt / Calendar / News` — and asked whether this was the element actually meant. Re-verified via direct DOM inspection (`browser_evaluate`, enumerating every `<ul>` on the Command Center page): this second bar is Redmine's real `:application_menu` (the same menu that becomes a project's own tab bar — Overview/Activity/Issues/.../Helpdesk/Settings — when a project is the current context). **On the Command Center (`/helpdesk`), no `<ul>` containing this menu's content exists in the DOM at all** — it is genuinely, completely absent, not merely CSS-hidden, replaced entirely by the Helpdesk icon rail (`<ul class="rf_helpdesk_sidebar_nav">`). So the guide's "Redmine's application menu is hidden here" claim is **correct** — confirmed, not a defect. Only the header-text half of the original claim ("*the header reads Helpdesk Support*") remains a genuine mismatch, and this bug has been rewritten to scope to that alone.

## Steps to reproduce

1. Log in as an Agent holding real `manage_helpdesk` (confirmed via a genuine project Membership + custom role — not the `admin?` bypass).
2. Click "Helpdesk Command Center" in the top menu, landing on `/helpdesk`.
3. Inspect the page's `<h1>` heading text.

## Expected result

Per `HELPDESK_USER_GUIDE.md` §16 (lines 400–404): *"...the header reads *Helpdesk Support*..."* TC-HLP-148's own Expected Result states the header should read "Helpdesk Support".

## Actual result

`document.querySelector('h1').textContent` → **`"Helpdesk"`**, not "Helpdesk Support". Confirmed via direct DOM inspection, not just the accessibility snapshot.

The icon rail (Dashboard/Tickets/Reports/Organization/Customers/Products/Settings) is correctly present and works as the primary navigation, and Redmine's real `:application_menu`/project-tab-bar is correctly, completely absent (see Revision History above) — so both of the Command Center's other two documented chrome promises hold. This bug is narrowly about the header text only.

## Evidence

### Screenshot

![A plain /projects page showing Redmine's real :application_menu bar — Projects/Activity/Issues/Spent time/Gantt/Calendar/News — underneath the top menu](../../screenshots/BUG-HLP-028/projects-page-real-application-menu-present.png)

![The same bar is completely absent on the Command Center (/helpdesk) — replaced entirely by the Helpdesk icon rail, confirming the guide's "application menu is hidden" claim is correct](../../screenshots/BUG-HLP-028/command-center-application-menu-correctly-absent.png)

![Command Center header reads "Helpdesk", not "Helpdesk Support" — the one remaining real mismatch](../../screenshots/BUG-HLP-028/command-center-app-menu-not-hidden-header-not-helpdesk-support.png)

### Console / log

- N/A — confirmed via `browser_evaluate` DOM inspection (`h1` text content; enumerated every `<ul>` on the page and its `textContent`/`className`/`offsetParent` to positively identify which menu is genuinely absent vs. which one is merely a different, universally-present bar), not a console error.

## Duplicate check

- Duplicate found: No (checked `bugs/_duplicates.md` — empty register)
- Existing bug reference (if duplicate): —

## Notes

- **Purely a cosmetic text mismatch, not a functional defect.** Every screen the Command Center promises is reachable and works correctly via the icon rail, and its chrome correctly replaces Redmine's real application menu/project-tab-bar as documented. The only thing that doesn't match the guide is the literal header string.
- **This engagement's own earlier write-up of this bug was itself wrong** — flagged and corrected the same day after the user pointed at a real screenshot showing the actual `:application_menu` bar, which this session had not distinguished from the always-present `:top_menu` bar. Worth remembering for any future Redmine-chrome test: Redmine core actually registers (at least) two separate named menus — `:top_menu` (universal, every page) and `:application_menu` (contextual — global Projects/Activity/Issues/... when no project is active, a project's own tab bar when one is) — and a claim like "the application menu is hidden" should be checked against the specific menu Redmine itself calls by that name, not assumed to mean the top bar.
- Suggested fix direction (not prescriptive): change the Command Center's header partial to render "Helpdesk Support" instead of "Helpdesk" for staff users (the `label_helpdesk_command_center` vs `label_my_helpdesk` caption split in `init.rb`'s `menu :top_menu` registration suggests the underlying locale/label infrastructure for a staff-specific string already exists) — **or** update `HELPDESK_USER_GUIDE.md` §16 to describe the real header text, whichever the plugin owner intends as correct.
- Found while executing `HELPDESK_NAVIGATION_WORKSPACES.md` TC-HLP-148, using a purpose-built fixture (`manage.helpdesk.test`, role "Agent ManageHelpdesk Test") created specifically to test the Command Center as a genuine `manage_helpdesk`-holding Agent rather than admin.

## Closed — 2026-09-02, same day: Rejected, Not a Bug

Closed per explicit user direction, with the fix-direction question from this bug's own Notes resolved in favor of the documentation:

- Redmine's application menu is correctly hidden. ✅ (confirmed in this bug's own Revision History above.)
- The Helpdesk icon rail is correctly displayed. ✅
- The **"Helpdesk" header is intentional, per Product Owner request.** ✅ — not a rendering defect; the plugin is behaving exactly as designed.
- **`HELPDESK_USER_GUIDE.md`'s "Helpdesk Support" text is outdated** and has been corrected directly (§16, and TC-HLP-148's Expected Result) to state the real, intended header text — no code change needed, no bug remains open.

This closes the "expand the code vs. fix the docs" question this bug's Notes left open — the docs were the side that needed to change, confirmed by the product's own owner rather than inferred.
