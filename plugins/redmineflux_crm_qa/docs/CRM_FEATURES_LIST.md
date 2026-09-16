# Features List — Redmineflux CRM Plugin

> This file must be read before writing any test case. It defines the full feature scope for test coverage.
> Source: https://www.redmineflux.com/knowledge-base/plugins/crm/ (ingested 2026-09-15).

## Feature List

| # | Feature | Description | Covered by TC |
|---|---------|-------------|---------------|
| 1 | Installation | Folder `redmineflux_crm`, migrate, restart, grant permissions | TC-CRM-101 – 104 |
| 2 | Plugin settings | Default currency, deal stages, territories, lead statuses, lead sources | TC-CRM-105 – 108 |
| 3 | Configuration constraints | Keep Won/Lost and Qualified; never add Converted; changes are not retroactive | TC-CRM-109 – 113 |
| 4 | CRM workspace | Top-menu entry; Dashboard, Leads, Contacts, Companies, Deals, Analytics, Audit Log | TC-CRM-114, 115 |
| 5 | Dashboard | 9 summary panels, Quick Create, CSV/XLS export | TC-CRM-116 – 119 |
| 6 | Contact CRUD | 15 form fields incl. avatar, privacy, custom fields | TC-CRM-201 – 206 |
| 7 | Contact validation | First name + email required; email unique; phone/mobile 7–15 digits; tags case-insensitive | TC-CRM-207 – 211 |
| 8 | Contact avatar | Upload and remove; 2 MB limit | TC-CRM-212 – 214 |
| 9 | Contact–company link | From the contact form, or created from a company page with the company locked | TC-CRM-215, 216 |
| 10 | Helpdesk integration | Linked customer, recent issues, organization/SLA, products — when Helpdesk is installed | TC-CRM-217, 218 |
| 11 | Contact deletion cascade | Activities and issue links destroyed; deals kept with the reference cleared; company untouched | TC-CRM-219 |
| 12 | Company CRUD | 12 form fields | TC-CRM-301 – 304 |
| 13 | Company validation | Name required and unique | TC-CRM-305, 306 |
| 14 | Website normalisation | Bare domain gets `https://` | TC-CRM-307, 308 |
| 15 | Company deletion cascade | Activities destroyed; contacts and deals kept with the reference cleared | TC-CRM-309 |
| 16 | Deal CRUD | 18 form fields | TC-CRM-401 – 404 |
| 17 | Deal validation | Name + stage required; probability 0–100; lost reason required when Lost | TC-CRM-405 – 408 |
| 18 | Currency immutability | Set from the default; never changeable after creation | TC-CRM-409 |
| 19 | Forecast calculation | amount × probability ÷ 100 | TC-CRM-410, 411 |
| 20 | Pipeline board | Stage columns, territory filter, three headline totals | TC-CRM-412 – 416 |
| 21 | Drag-and-drop stage change | Updates stage and creates an activity note | TC-CRM-417, 418 |
| 22 | Closed-deal lock | Won/Lost cannot be dragged; endpoint rejects it | TC-CRM-419, 420 |
| 23 | Won / Lost handling | Excluded from open counts; both feed win rate | TC-CRM-421 – 423 |
| 24 | Territories | On the deal form and as a pipeline filter | TC-CRM-424 |
| 25 | Deal deletion cascade | Activities and issue links destroyed; contact and company untouched | TC-CRM-425 |
| 26 | Lead CRUD | 10 form fields | TC-CRM-501 – 504 |
| 27 | Lead validation | First name + email required; email unique; status defaults to New | TC-CRM-505 – 507 |
| 28 | Converted status is reserved | Cannot be set manually | TC-CRM-508 |
| 29 | Lead conversion | Qualified only; reuse contact by email; merge only blank fields; reuse or create company; optional deal | TC-CRM-509 – 517 |
| 30 | Converted leads are locked | Cannot re-convert or delete | TC-CRM-518, 519 |
| 31 | Activities | Note, Call, Meeting, Email, Task on all four entity types | TC-CRM-601 – 604 |
| 32 | Activity immutability | No edit function exists at all | TC-CRM-605 |
| 33 | Activity deletion rules | Author or admin only; auto-generated ones protected | TC-CRM-606, 607 |
| 34 | Email activities | Subject/from/to/content required; Sent and Failed states | TC-CRM-608 – 612 |
| 35 | Automatic activities | Creation, stage change, status change, assignee change, conversion | TC-CRM-613 – 615 |
| 36 | Email templates | Five templates with `%{first_name}` | TC-CRM-616 – 618 |
| 37 | CSV import — contacts | 12 columns; duplicate by email | TC-CRM-701 – 705 |
| 38 | CSV import — companies | 10 columns; duplicate by name **or** email | TC-CRM-706, 707 |
| 39 | CSV import — deals | 12 columns; match contact by email, company by name; duplicate by name+contact+company | TC-CRM-708 – 710 |
| 40 | CSV import — leads | 10 columns; duplicate by email | TC-CRM-711 |
| 41 | Import reporting | Imported, duplicate and invalid row counts | TC-CRM-712 – 716 |
| 42 | Exports | CSV/XLS for records and dashboard; CSV/PDF for analytics; all visible records | TC-CRM-717 – 721 |
| 43 | Analytics | 16 metrics, four period filters | TC-CRM-801 – 808 |
| 44 | Audit log | Searchable, filterable, **read-only for everyone** | TC-CRM-809 – 812 |
| 45 | Issue linking | One contact and one deal per issue; create from issue; unlink | TC-CRM-813 – 818 |
| 46 | Custom fields | On contacts, companies, deals, leads, and on the conversion form | TC-CRM-819 – 821 |
| 47 | Privacy controls | Admin sees all; non-admin sees public, own private, assigned private | TC-CRM-901 – 906 |
| 48 | Nine global permissions | Including Delete CRM Data as a separate grant | TC-CRM-907 – 914 |
| 49 | JSON API | Same permissions as the UI; `X-Redmine-API-Key` | TC-CRM-915 – 920 |
| 50 | Uninstallation | Migrate `VERSION=0`, remove folder, restart | TC-CRM-120 |

## Notes

- **Not yet executed.** Every TC was authored 2026-09-15 from the vendor KB; none has been run.
- **This KB publishes an unusually precise specification** — exact validation rules, exact deletion cascades, exact
  conversion rules, exact import columns. That makes most cases here genuinely falsifiable: a divergence is a
  defect against documented behaviour rather than a judgement call. It is worth exploiting that precision rather
  than writing vague "works as expected" checks.
- **The deletion cascades are the most valuable functional cases** (TC-CRM-219, 309, 425). Each one states
  precisely what is destroyed and what survives with a cleared reference. A cascade that deletes more than
  documented — for example removing a company's contacts rather than clearing their reference — destroys customer
  data irreversibly, and the plugin offers no undo.
- **Delete CRM Data as a separate permission** (TC-CRM-909) is this plugin's most distinctive boundary and is
  stated twice in the KB. A build where Manage Contacts implies deletion silently hands every sales rep the
  ability to destroy records, which the recommended role configuration explicitly withholds.
- **The closed-deal lock is a documented contract with an endpoint behind it** (TC-CRM-420). The KB says the
  update-stage endpoint *rejects* changes on Won/Lost deals — so it must be tested at the endpoint, not only by
  observing that a card will not drag. A deal reopened by a direct call would corrupt won-revenue and win-rate
  figures that a sales team reports on.
- **Lead conversion has seven stated rules** (TC-CRM-509 – 517). The subtlest is "merged in only where the contact
  fields are blank" — a conversion that overwrites existing contact data would silently destroy verified customer
  details with older lead data, and it would look like a successful conversion.
- **Privacy is count-affecting** (TC-CRM-906): the KB states dashboard and list counts reflect only visible
  records. That means two users legitimately see different totals — useful to know before filing a "wrong count"
  bug, and equally the place where a leak would show up as a count that is too high.
- **The audit log is stated to be undeletable by anyone, including administrators** (TC-CRM-812). That is a strong
  claim and the whole reason the log has evidentiary value; it deserves a direct endpoint test.
- **Activities cannot be edited at all** (TC-CRM-605) — no edit endpoint should exist. An editable activity would
  undermine the timeline's role as a record of what was actually said and when.
