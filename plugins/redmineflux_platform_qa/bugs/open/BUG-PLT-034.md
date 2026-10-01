# Bug Report Template

- Bug ID: BUG-PLT-034
- Production Redmine Issue ID: #121867
- Title: Any Contact created from Platform's own screen crashes CRM's native Contact detail page with a 500 error — `author_id` is never set on Platform's create path, and CRM's view calls `@contact.author.name` with no nil guard
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_platform (create path) / redmineflux_crm (crashing view)
- Plugin version: `redmineflux_platform` branch, current tip
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, post-upgrade)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-10-01

## Steps to reproduce

1. Create a Contact from Platform's own screen (`/redmineflux_platform/list/contacts/new`) — fill Name and Email, submit.
2. Open that same contact's detail page from CRM's own native screen: `/contacts/<id>`.

## Expected result

- Per `PLATFORM_CROSS_PLUGIN_CRUD_MATRIX.md`'s own premise (a shared entity must work correctly from every consumer plugin's screen, regardless of which origin created the row), CRM's own Contact detail page should render normally for a Platform-created contact, the same way it does for a CRM-created one.

## Actual result

CRM's `/contacts/<id>` page **crashes with a genuine HTTP 500**, confirmed via Playwright's own navigation status (not just visual inspection). Reproduced twice on `PLT-CRUD-Contact-Platform` (id 504, created via Platform's screen). By contrast, `PLT-CRUD-Contact-CRM` (id 505, created via CRM's own `/contacts/new` in the same session, same fields) opens fine (`200`) on the identical `/contacts/505` URL — isolating the defect to *how the contact was created*, not the view itself being broken outright.

### Root cause (confirmed from source and DB)

Server log:
```
ActionView::Template::Error (undefined method 'name' for nil):
    412:                   <div class="rf_crm_detail_value"><%= @contact.author.name %></div>
plugins/redmineflux_crm/app/views/contacts/show.html.erb:412
```

DB comparison, the two contacts created in this same session:
```
id   first_name                   author_id
504  PLT-CRUD-Contact-Platform    NULL
505  PLT-CRUD-Contact-CRM         1
```

`RedminefluxPlatform::EntitiesController` (the shared controller behind Platform's own Create screen for every entity, including Contact) never sets `author_id` anywhere in its `create` action — confirmed via source (`grep -n "author_id" app/controllers/redmineflux_platform/entities_controller.rb` returns no assignment). CRM's own `/contacts/new` controller path, by contrast, does set it (to the current user) on create. `rf_crm_contacts.author_id` is nullable at the DB level, so Platform's create path succeeds without error — the row is saved with `author_id = NULL`. The crash only surfaces later, the first time anyone opens that specific contact via CRM's own `show.html.erb`, which assumes `@contact.author` is always a real `User` and calls `.name` on it unconditionally, with no `&.name` safe-navigation or presence check.

## Evidence

### Screenshot

![CRM's own Contact detail page crashing with a 500 for a Platform-created contact](../../screenshots/BUG-PLT-034/crm-contact-detail-500-nil-author.png)

### Console / log

```
Completed 500 Internal Server Error in 59ms
NoMethodError (undefined method 'name' for nil)
  plugins/redmineflux_crm/app/views/contacts/show.html.erb:412
```
Reproduced twice on the same contact (id 504); a CRM-created contact (id 505) with `author_id` set opens cleanly on the identical URL pattern, confirmed in the same session.

## Duplicate check

- Duplicate found: No — not the same as any previously filed bug in this cycle. Related in spirit to the general class of "a field one origin's create form never populates breaks another origin's screen that assumes it," but a fresh, distinct instance (a genuine crash, not a display/propagation gap).

## Production report

Reported to production `ztflux` as **#121867** on 2026-10-01, assigned to Prashant Chaurasia. Linked via `report_defect` against testcase #121704 ("Cross-Plugin CRUD Matrix", Feature #120043) and run #586, environment "Win + Chrome + Ver6" — testcase marked Failed. Priority: High (priority_id 3); Defect custom fields: Type=Functional, Severity=High-severity, Priority=High.
