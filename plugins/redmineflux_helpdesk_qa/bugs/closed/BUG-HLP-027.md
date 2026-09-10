# BUG-HLP-027

- Bug ID: BUG-HLP-027
- Title: An Agent holding only `view_helpdesk` (no `manage_helpdesk`) never gets the "Helpdesk" link in Redmine's top application menu, contradicting the plugin's own documented Agent definition
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-02)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Agent (`luna.blossom`, role "Agent" — `view_helpdesk` checked, `manage_helpdesk` unchecked)
- Date: 2026-09-02

## Steps to reproduce

1. Confirm the "Agent" role (id 6) has `view_helpdesk` checked and `manage_helpdesk` unchecked (Administration → Roles and permissions → Agent).
2. Log in as `luna.blossom`, a real project Member of Helpdesk QA Alpha with role Agent (confirmed via her own "Issues assigned to me"/"Reported issues" blocks on My Page — a genuinely active agent, not a stale fixture).
3. Inspect Redmine's top application menu.
4. For contrast, open the project itself (`/projects/helpdesk-qa-alpha`) and inspect its own project-level tab bar.

## Expected result

Per `HELPDESK_USER_GUIDE.md` §4 (line 155): *"**Agent** | A member with `manage_helpdesk` (or `view_helpdesk`) on a helpdesk project"* — either permission is documented as sufficient to be a real Agent. The same guide's own tester checklist (§26 group B) lists *"Helpdesk appears in the top menu for an agent"* with no permission-tier qualifier, and TC-HLP-060's own precondition reads *"Agent has `view_helpdesk` **or** `manage_helpdesk`"*. So a `view_helpdesk`-only Agent should see "Helpdesk" in the top menu, same as a `manage_helpdesk` Agent.

## Actual result

`luna.blossom` (view_helpdesk only) sees **no "Helpdesk" entry anywhere in the top menu** — the menu shows only Home / My page / Projects / Time Tracker / Workloads / Help, identical to a user with zero helpdesk permission at all (confirmed side by side against a disposable no-permission user, `zero.perm.user`, whose menu looks the same). Her project-level access is unaffected — the project's own tab bar (`/projects/helpdesk-qa-alpha`) correctly shows a "Helpdesk" tab, and she can use it normally.

**Root cause confirmed by reading the plugin source** (`docker exec redmine-docker-6-redmine-1`, `/usr/src/redmine/plugins/redmineflux_helpdesk/init.rb`, lines 60–72):

```ruby
menu :top_menu, :helpdesk, { controller: 'rf_helpdesk', action: 'index' },
     caption: Proc.new { User.current.is_helpdesk_customer? ? I18n.t(:label_my_helpdesk) : I18n.t(:label_helpdesk_command_center) },
     if: Proc.new {
       User.current.logged? &&
         (User.current.admin? ||
          User.current.is_helpdesk_customer? ||
          User.current.allowed_to?(:manage_helpdesk, nil, global: true))
     }
```

The `if:` condition explicitly checks `manage_helpdesk` only — there is no `view_helpdesk` branch at all. A code comment directly above it even documents this as a deliberate prior fix ("before this, the condition named only admins, so a support lead holding `manage_helpdesk` had no menu entry at all") — but that fix only closed the gap for `manage_helpdesk`, never extended it to `view_helpdesk`, leaving exactly the class of user the guide calls an Agent (view-only) still without a menu entry.

## Evidence

### Screenshot

![Agent role's permission matrix: "View helpdesk" checked, "Manage helpdesk" unchecked](../../screenshots/BUG-HLP-027/agent-role-view-helpdesk-checked-manage-unchecked.png)

![luna.blossom's top menu after a fresh login — no "Helpdesk" entry anywhere](../../screenshots/BUG-HLP-027/luna-blossom-top-menu-no-helpdesk-link.png)

![Same user, same session — the project's own Helpdesk tab is present and correctly reachable](../../screenshots/BUG-HLP-027/luna-blossom-project-tab-helpdesk-present.png)

### Console / log

- N/A — not a runtime error. Confirmed via direct source read (`init.rb`) rather than a log/exception; the `if:` Proc simply never returns true for this permission combination.

## Duplicate check

- Duplicate found: No (checked `bugs/_duplicates.md` — empty register)
- Existing bug reference (if duplicate): —

## Notes

- **Not a security issue** — the underlying screens are still correctly gated by `view_helpdesk`/`manage_helpdesk` on the controller/permission level (confirmed: her project's Helpdesk tab and its screens work normally). This is purely a **discoverability gap**: a `view_helpdesk`-only Agent has no way to reach the Command Center from the global nav at all — they'd need to already know the `/helpdesk` URL, or navigate into a project first and use its own Helpdesk tab (which does NOT give access to the cross-project Command Center views — Reports/Organizations/Customers/Products/Settings aggregated across every project — only the one project's own scoped screens).
- Real-world impact: any Agent set up with the guide's own "minimal" permission (`view_helpdesk` alone, without `manage_helpdesk`) — a very plausible real configuration for a front-line support agent who shouldn't manage desk configuration — silently loses the entire cross-project Command Center experience the plugin is built around, with zero visible sign anything is missing (no broken link, no error — the menu item simply never renders).
- Suggested fix direction (not prescriptive, needs a product decision — see below): change the `if:` Proc's permission check from `allowed_to?(:manage_helpdesk, nil, global: true)` to also accept `allowed_to?(:view_helpdesk, nil, global: true)` (i.e. `manage_helpdesk` OR `view_helpdesk`), matching the guide's own documented Agent definition and TC-HLP-060/070's stated preconditions — **or** update `HELPDESK_USER_GUIDE.md` §4/§26 and TC-HLP-060/070's preconditions to say the top-menu link (and, per the same pattern, the project-level SLA/Organization/Settings tabs — see TC-HLP-065 below) require `manage_helpdesk` specifically, not "manage_helpdesk (or view_helpdesk)".
- **Important context found while investigating this further (still while executing this same suite, see TC-HLP-065)**: the project-level Helpdesk tab has an identical, but clearly *deliberate*, restriction — `RfProjectHelpdeskController`'s `before_action :require_manage_permission, only: [:organization, :products, :sla, :settings]` explicitly gates those 4 actions to `manage_helpdesk` regardless of what `init.rb`'s permission hash nominally lists for `view_helpdesk`, and confirmed via a live 403 when `luna.blossom` (view_helpdesk only) tried the SLA tab directly by URL. The top-menu `if:` Proc even carries a code comment explicitly reasoning about "who the sidebar [inside the Command Center] already treats as a manager" — i.e. the person who wrote this menu condition was consciously deciding manage_helpdesk should gate it, not an oversight. **This reframes the likely real defect**: the *code's* behavior (top-menu + most Command-Center/project-Settings screens require manage_helpdesk) looks internally consistent and probably intentional; it is `HELPDESK_USER_GUIDE.md`'s own Agent definition (line 155, "`manage_helpdesk` (or `view_helpdesk`)") and this suite's TC-HLP-060/070 preconditions that most likely have the wrong permission floor documented. Filing this either as "expand the code" or "fix the docs" is a genuine judgment call for whoever owns the plugin — reported here as a discrepancy, not a prescribed direction, matching this engagement's handling of the analogous BUG-HLP-013 (Portal Preview) code/doc mismatch.
- Found while executing `HELPDESK_NAVIGATION_WORKSPACES.md` TC-HLP-060, which explicitly names "Agent has `view_helpdesk` or `manage_helpdesk`" as its precondition — the discrepancy surfaced immediately upon logging in as a real `view_helpdesk`-only fixture rather than assuming admin's behavior (which has both, via `admin?`) generalizes to a real Agent.

## Closed — 2026-09-02, same day, retracted as Not a Bug

**User corrected TC-HLP-060's own precondition** from "`view_helpdesk` **or** `manage_helpdesk`" to "`view_helpdesk` **and** `manage_helpdesk`" — i.e. the real, intended requirement for the top-menu link (and the project-level SLA/Organization/Settings tabs) is the combination, not either permission alone. This resolves the judgment call left open in this bug's own Notes ("filing this either as 'expand the code' or 'fix the docs' is a genuine judgment call") in favor of **the code is correct as written; the documentation was wrong**.

- `manage.helpdesk.test` (a real fixture holding both `view_helpdesk` and `manage_helpdesk`, created in the same session) already demonstrates the corrected precondition working exactly as intended: top-menu link present, full 7-item Command Center rail, all 6 project Helpdesk sub-tabs. No code change needed.
- `luna.blossom`'s behavior (view_helpdesk only → no top-menu link, only 3 of 6 project sub-tabs) is **not a defect** — it's the plugin correctly enforcing that `manage_helpdesk` is required for the cross-project Command Center and desk-configuration screens, exactly as `RfProjectHelpdeskController`'s `require_manage_permission` and the top-menu `if:` Proc were deliberately written to do.
- **The actual, narrower defect was in this engagement's own documentation**, not the plugin: `HELPDESK_USER_GUIDE.md` §4's Agent definition ("A member with `manage_helpdesk` (or `view_helpdesk`)") and TC-HLP-060/070's original preconditions (both said "or") misdescribed the real requirement. Corrected directly in `HELPDESK_USER_GUIDE.md` and in the TC files themselves — no new bug ID filed for a documentation-wording fix, consistent with how other doc-only corrections have been handled in this engagement (e.g. the TC-300 SLA/Support-Level-target decoupling finding folded directly into `HELPDESK_REQUIREMENTS.md`).
- Closed per explicit user direction ("Retract as Not a Bug (Recommended)") after being presented with three options (retract / downgrade to doc-only bug / keep as-is).
