# RedmineFlux Platform — Tester's Guide

For someone testing this build who has not worked on it before. Read sections
1–4 before writing any test case; the rest is reference.

---

## 1. Why this plugin exists

Before the platform, **every RedmineFlux plugin kept its own copy of the same
records.**

- Workload had its own teams table. Timesheet had another one. Shift
  Management had a third.
- CRM called a row in its table a **Company**. Helpdesk called the very same
  kind of row an **Organization**. Invoice called a contact a **Customer**.
- Helpdesk had a holiday calendar. Workload had a different holiday calendar.
  Neither knew about the other's holidays.
- Each plugin wrote its own audit log, so "who changed this team?" had to be
  asked in three places.

What that cost, in practice:

| Symptom | Example |
|---|---|
| The same thing entered twice | "Support Engineers" in Workload and "Support engineers" in Timesheet — two rows, two ids, no link |
| Plugins disagreeing on facts | A public holiday added in Helpdesk, while Workload still planned capacity for that day |
| Two words for one thing | The customer is a "Company" on one screen and an "Organization" on the next |
| No single history | Three audit logs, three formats, none complete |

**The platform is the one place those shared records now live.** One teams
table, one organizations table, one holiday calendar, one audit trail, one set
of permissions, one vocabulary. The other plugins read and write *those* rows
instead of keeping their own.

---

## 2. THE MOST IMPORTANT THING TO UNDERSTAND: it is the same data, not a copy

If you already created data in a plugin — teams in Workload, companies in
CRM, customers in Invoice — **that data is already in the platform.** Nothing
was duplicated, nothing needs re-entering, nothing was migrated into a second
place.

It is one row in one table, shown on more than one screen.

Test it in both directions:

- Create a team in **Platform → Teams**, then open **Workload → Teams** and
  **Timesheet → Teams**. The same team is there, immediately, without any
  sync step.
- Open **CRM → Companies** and look at a company that existed before this
  build. It appears in **Platform → Organizations** as well — same record.
- Rename it in the platform, reload the CRM screen: the new name is there.
  (This is the intended behaviour, not a bug. One record, one name.)

So when you write test cases, treat "created in plugin A, visible and
editable in plugin B" as the expected result everywhere in the table below —
**never** "plugin B has its own copy".

### Who shares what

| Platform entity | Plugins that read/write the same rows |
|---|---|
| **Teams** | Workload, Timesheet, Shift Management |
| **Organizations** | CRM (as "Companies"), Helpdesk |
| **Contacts** | CRM, Invoice |
| **Holidays** / **Holiday Schemes** | Workload, Helpdesk, Shift Management |
| **Leave Types**, **Leaves** | Workload, Shift Management |
| **Audit events** | Timesheet, Shift Management |
| **Settings** (working hours, company identity) | every plugin that converts days to hours or prints company details |

---

## 3. What you can install: the platform is required

| Combination | Works? |
|---|---|
| Platform **alone** | ✅ Yes — all of its own screens work with no other plugin installed |
| Platform **+ one** plugin (say Workload) | ✅ Yes |
| Platform **+ several** plugins | ✅ Yes — this is the normal case |
| A consumer plugin **without** the platform | ❌ No — the shared tables it reads belong to the platform |

**The platform plugin is a requirement, not an option.** Consumer plugins
(Workload, Timesheet, CRM, Helpdesk, Shift Management, Invoice) depend on its
tables and models.

What changes as you add plugins:

- **More entities become meaningful.** Leave Types and Leaves exist in the
  platform on their own, but Shift Management and Workload are what act on
  them. With neither installed the screens still work — they just have fewer
  consumers.
- **Consumer plugins add panels to platform screens.** For example a team's
  detail page can gain extra sections contributed by Workload or Timesheet.
  Those sections disappear cleanly when the plugin is not installed.
- **The platform's own screens never depend on a consumer plugin being
  present.** If you find a platform screen that errors because a plugin is
  missing, that is a bug — report it.

### After installing or updating any plugin, always

```bash
# from the Redmine root
bundle exec rake redmine:plugins:migrate RAILS_ENV=production
# then restart Redmine (docker compose restart redmine)
```

This matters. A real defect found in testing was caused by three platform
migrations never having been run: deleting an organization returned **HTTP
500** because a table the model expected did not exist. If you see a 500 on a
delete or a save, **check migrations first** and say so in the bug report.

Also **hard-refresh the browser** (Ctrl+F5) after an update — the CSS and JS
are cached under a content hash.

---

## 4. Where everything is

Navigation is the **icon rail down the left side**. Hover an icon for its
name. On a screen narrower than 900px the rail moves into the **☰ menu** in
the header (Redmine does this with its own sidebar; the platform's items
appear there with names).

| Screen | URL |
|---|---|
| Overview (landing page, counts + samples) | `/redmineflux_platform` |
| Teams | `/redmineflux_platform/teams` |
| Any shared entity's list | `/redmineflux_platform/list/<key>` |
| Create | `/redmineflux_platform/list/<key>/new` |
| Record detail | `/redmineflux_platform/list/<key>/<id>` |
| Edit | `/redmineflux_platform/list/<key>/<id>/edit` |
| Possible duplicate organizations | `/redmineflux_platform/organizations/duplicates` |
| Plugin settings (admin only) | `/settings/plugin/redmineflux_platform` |

`<key>` is one of: `holiday_schemes`, `holidays`, `leave_types`, `leaves`,
`organizations`, `contacts`, `audit_events`.

**API** (needs an API key header, not a browser session):

```bash
curl -H "X-Redmine-API-Key: YOUR_KEY" \
     http://127.0.0.1:8091/redmineflux_platform/api/v1/info
```

| Endpoint | Purpose |
|---|---|
| `/api/v1/info` | which features/entities are available |
| `/api/v1/teams`, `/api/v1/teams/:id` | teams, **read-only** |
| `/api/v1/working_days?from=&to=` | working days in a range |
| `/api/v1/working_days/check?date=` | is this date a working day |

Expected: no key → **401**; valid key without the permission → **403** naming
the permission; `POST` to teams → **404** (writes are deliberately not
offered yet).

---

## 5. Permissions — what each kind of user should see

Two levels, and both have to pass:

1. `view_rf_platform` — may open the platform section at all.
2. `view_rf_platform_<entity>` / `manage_rf_platform_<entity>` — per entity,
   e.g. `view_rf_platform_teams`, `manage_rf_platform_holidays`.

Admin-only, with no permission to grant: **Audit events** and **Settings**.

| User | Expected |
|---|---|
| Not logged in | Redirected to the login page |
| Logged in, no platform permission | **403** on every platform URL |
| `view_rf_platform` + `view_rf_platform_teams` | Teams list opens; **no** New / Edit / Delete / bulk controls; another entity (e.g. Holidays) still **403** |
| …plus `manage_rf_platform_teams` | New / Edit / Delete appear and work |
| Any non-admin, even with manage | Audit events **403** |

⚠️ **Testing tip:** hiding a button is not the same as refusing the action.
For every "user must not be able to X" case, also paste the direct URL into
the address bar (e.g. `/redmineflux_platform/teams/new`) and confirm you get
**403**, not a form.

---

## 6. Create / edit: dialogue or full page

Short forms open in a dialogue over the list (you keep your place, your
search and your scroll position). Long forms open as their own page.

| Entity | Fields | Create/edit opens as |
|---|---|---|
| Teams | 1 | Dialogue |
| Holiday Schemes | 3 | Dialogue |
| Leaves | 7 | Page |
| Holidays | 10 | Page |
| Leave Types | 11 | Page |
| Organizations | 12 | Page |
| Contacts | 21 | Page |

Both are real URLs. With JavaScript blocked, a dialogue trigger opens the
full page instead — that is deliberate, and worth one test case.

---

## 7. Suggested test areas

Each bullet is one or more test cases.

**Lists**
- Search finds a record by name; a search matching nothing shows an
  explanation and a way to clear it.
- A `%` typed into the search box is treated as literal text, not a wildcard
  (should return no rows, not everything).
- Sorting by a column header; paging; the S.No. column keeps counting across
  pages (page 2 starts at 26, not 1).
- An empty list shows a useful empty state, and a "create" button only for
  somebody allowed to create.

**Create / edit / delete**
- Required field left blank → refused with the field marked.
- Duplicate name (e.g. two teams called the same) → refused with a message,
  inside the dialogue, with what you typed still there.
- Delete asks for confirmation and **names the record** in the question.
- Cancel really cancels — nothing saved.

**Teams and members**
- Add several members at once; the users picker filters as you type and shows
  chips for who is chosen.
- Permissions ticked on the form (Manage workload / Approve leave) show on
  the member's row.
- Submitting with nobody selected → "Select at least one user."
- Remove a member; remove the last member → empty state.
- Bulk delete: header checkbox ticks all rows, confirmation names the action.

**Leaves**
- Approve, Reject and Cancel appear only while a request is still pending.
- **Reject requires a reason** — confirming with an empty box must be
  refused, and the reason must appear on the record afterwards.
- A decided request no longer offers Approve.

**Cross-plugin (section 2) — the highest-value cases**
- Create in the platform → visible in the consumer plugin.
- Create in the consumer plugin → visible in the platform.
- Rename in one → renamed in the other.
- Delete in one → gone in the other (or refused, if something still uses it).

**Audit trail** (admin)
- Every create, update and delete appears, with who and when.
- A **deleted** record still shows its name, not a class name and a number.
- Searching a name from the Record column finds it.
- Audit rows cannot be edited or deleted — the trail is append-only. That is
  correct behaviour, not a missing feature.

**Settings** (admin)
- Working hours per day and company identity save and come back.
- Other plugins pick up the working-hours value.

**Browser / UX**
- Escape closes a dialogue and focus returns to the button that opened it;
  clicking the dark backdrop also closes it.
- At phone width (≈390px) nothing overflows sideways and the platform's
  screens are reachable through the ☰ menu.
- Tags on Organizations/Contacts: chips, suggestions from tags already in
  use, `×` removes one, Enter or a comma adds one.

---

## 8. Known issues and expected behaviour (do not raise these as new bugs)

| What you see | Why |
|---|---|
| Saving **plugin settings** shows a 500 error page, but the value *is* saved | Caused by `redmineflux_testcase_management`, whose settings hook connects to Redis; Redis is not running in this build. It affects every plugin's settings screen, not just the platform. |
| Audit rows cannot be deleted | By design — an audit trail that can be rewritten is not evidence of anything |
| Editing a record in the platform changes it in the consumer plugin too | By design — see section 2 |
| A 500 right after a plugin update | Migrations have probably not been run — see section 3 |

---

## 9. Fixed in this build — worth regression cases

| Was | Now |
|---|---|
| Deleting an organization returned HTTP 500 | Works (the missing migrations are applied) |
| Rejecting a leave accepted an empty reason and stored none | The reason is required; the box is outlined and focused if empty |
| Audit trail: deleted records shown as `RedminefluxPlatform::Team #10` | The record's real name |
| Audit trail: searching a name from the Record column found nothing | Finds it |
| Audit list ran 80 database queries (other lists: 32) | 42 |
| On a phone there was no way to navigate between platform screens | The screens are in the ☰ menu, with names, at 44px tap targets |
| Teams table row checkboxes unreadable to a screen reader | Each names its team |
| Teams API refusal said "requires an authenticated user" when the key was fine | Names the missing permission |

---

## 10. Reporting a bug

Please include:

1. **URL** and which user (and their exact permissions / admin?).
2. **Which plugins are installed** — this matters more than usual here.
3. Steps, expected, actual.
4. **Were migrations run and Redmine restarted after the last update?**
5. For a 500: the matching lines from the server log —
   `docker logs --tail 80 redmine-700-redmine-1`.
6. Browser width if it is a layout issue (the rail changes below 900px).

A screenshot of the whole window, not a crop — the rail, the header and the
breadcrumb are often part of the story.
