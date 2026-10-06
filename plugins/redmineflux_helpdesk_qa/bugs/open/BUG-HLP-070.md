- Bug ID: BUG-HLP-070
- Production Redmine Issue ID: 122006
- Title: Every page crashes for an anonymous visitor on a fresh/default install (`NoMethodError: undefined method 'is_helpdesk_customer?' for an instance of AnonymousUser`)
- Redmine version: 7.0.0
- Plugin name: redmineflux_helpdesk
- Plugin version: 6.2.0
- Environment: Local, freshly provisioned instance (`redmine-docker-tcmqa`, `localhost:3015`), default settings (`Setting.login_required = false`, the out-of-the-box Redmine default)
- Browser: Any (server-side 500, browser-agnostic)
- User role: Anonymous (not logged in)
- Date: 2026-10-05

## Steps to reproduce

1. Install `redmineflux_helpdesk` on a fresh Redmine 7.0.0 instance (new DB, default settings — do **not** enable "Authentication required" under Settings > General).
2. Without logging in, open the application root `/` (or any other page — see Root Cause below, this is not specific to the welcome page).

## Expected result

- The Welcome/homepage renders normally for an anonymous visitor, same as stock Redmine with no plugin installed.

## Actual result

- 500 Internal Server Error on every single page:
  ```
  ActionView::Template::Error (undefined method 'is_helpdesk_customer?' for an instance of AnonymousUser)
  Caused by: NoMethodError (undefined method 'is_helpdesk_customer?' for an instance of AnonymousUser)

  plugins/redmineflux_helpdesk/lib/redmineflux_helpdesk/hooks/view_hooks.rb:69:in 'RedminefluxHelpdesk::Hooks::ViewHooks#view_layouts_base_html_head'
  lib/redmine/hook.rb:66:in 'block (2 levels) in Redmine::Hook.call_hook'
  app/views/layouts/base.html.erb:17
  ```

### Root cause

`view_hooks.rb:69` (inside `view_layouts_base_html_head`) calls `User.current.is_helpdesk_customer?` directly,
with no existence guard. For any unauthenticated request, `User.current` is a Redmine core `AnonymousUser`
instance, and this method is not safely callable on it in this code path.

This is not an isolated slip — the exact same unguarded pattern also exists at `view_hooks.rb:6`
(`view_layouts_base_body_bottom`), which would crash identically. Both hooks are wired into
`app/views/layouts/base.html.erb`, the shared layout every page renders through, so **this is not limited to the
homepage** — it breaks every single page (including `/login` itself) for an anonymous visitor.

Notably, the plugin's own codebase is otherwise well aware of this exact hazard: at least 10 other call sites
(`lib/redmineflux_helpdesk/patches/issue_patch.rb:54`, `.../mail_handler_patch.rb` (5 sites),
`.../reply_assignment.rb:39`, `.../ticket_filter.rb:167`, and others) defensively check
`user.respond_to?(:is_helpdesk_customer?)` before calling it. `view_hooks.rb` lines 6 and 69 are the two places
that pattern was missed.

### Why this hasn't surfaced before

It only manifests when `Setting.login_required` is `false` — which is Redmine's own default on a brand-new
install. Every previously tested instance in this QA history already has `login_required = true` set (confirmed:
`localhost:3010` → `1`), which 302-redirects anonymous traffic to `/login` *before* the base layout — and the
broken hook inside it — ever renders. So the defect has been silently masked on every instance tested so far,
purely by that one already-flipped setting, and would hit any genuinely fresh customer installation on its very
first anonymous page view, before an admin has gone in and enabled "Authentication required."

### Suggested fix

Match the guard pattern already used elsewhere in this same plugin, e.g.
`User.current.respond_to?(:is_helpdesk_customer?) && User.current.is_helpdesk_customer?` (or `&.is_helpdesk_customer?`
if a `nil`-safe call is also wanted), at both `view_hooks.rb:6` and `view_hooks.rb:69`.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-HLP-070/anonymous-root-internal-error.png)

### Console / log

```
I, [...] Started GET "/" for ... 
I, [...] Processing by WelcomeController#index as HTML
I, [...]   Current user: anonymous
I, [...] Completed 500 Internal Server Error in 26ms
F, [...] FATAL -- :
ActionView::Template::Error (undefined method 'is_helpdesk_customer?' for an instance of AnonymousUser)
```

Confirmed root cause via `Setting.login_required` comparison between two instances:
- `localhost:3010` (established QA environment): `Setting.login_required` → `1` (crash masked)
- `localhost:3015` (fresh instance, this repro): `Setting.login_required` → `0` (crash reproduces)

## Duplicate check

- Duplicate found: No — checked `bugs/_index.md` and `bugs/_duplicates.md` for `is_helpdesk_customer`,
  `view_hooks`, `anonymous`, `login_required`; no prior entry. `BUG-HLP-024` touches a different part of the same
  file (a confirm-modal render, already closed) but is unrelated to this defect.
- Existing bug reference (if duplicate): n/a

## Scope note

Found incidentally while standing up an isolated environment for unrelated `redmineflux_testcase_management`
(TCM) QA work for the 2026-10-07 release — this defect belongs to `redmineflux_helpdesk`, a different plugin,
and does not block or relate to the TCM release testing in progress.

## Production report

Reported 2026-10-05 as production issue **#122006** on `ztflux` (project id 122):
- Tracker: Bug
- Priority: High
- Category: Helpdesk Plugin
- Assigned to: Vaishnavi Bhawsar (id 192)
- Custom fields: Defect Type = Functional, Defect Severity = **High-severity**, Defect priority = High
- Description written in Textile, full root-cause/evidence content, no attachments (per standing convention — screenshot stays local only, referenced by file path in the description)

Note on severity: the user asked for severity "Blocker." The Defect Severity custom field on the Bug tracker
only accepts a fixed list (confirmed via trial: `Low-severity` / `Medium-severity` / `High-severity` are valid
on Bug; `Critical-severity` is valid only on the Test Case tracker's own field config, not on Bug — there is no
`Blocker-severity` option on either). **High-severity** was used as the closest available match to "Blocker" on
this tracker.

Also note: this issue was originally scaffolded as testcase #122005 in suite #19 (Helpdesk) with a dedicated
run (#596, since deleted by the user) to attach the defect via `report_defect`, matching this session's usual
pattern. Redmine rejected an in-place tracker change ("Tracker cannot be changed for testcase issues"), so per
instruction the testcase scaffold was abandoned and **#122006** was created fresh as a standalone Bug instead —
it is not linked to any testcase/run.
