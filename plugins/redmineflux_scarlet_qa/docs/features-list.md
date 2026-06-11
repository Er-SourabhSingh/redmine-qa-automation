# Features List — Redmineflux Scarlet Theme

> This file must be read before writing any test case. It defines the full feature scope for test coverage.

## Feature List

| # | Feature | Description | Covered by TC |
|---|---------|-------------|---------------|
| 1 | Login / Logout | Theme applied to login page, error states | |
| 2 | Top Navigation | Logo, menu items, search bar, user menu | |
| 3 | Sidebar / Project Menu | Left nav, module links, active states | |
| 4 | My Page | Dashboard blocks, add/remove/rearrange | |
| 5 | My Account | Profile form, password change, preferences, API key | |
| 6 | Administration — Users | List, create, edit, lock, delete | |
| 7 | Administration — Roles & Permissions | Create, edit, delete, permission matrix | |
| 8 | Administration — Groups | Create, edit, delete, members | |
| 9 | Administration — Trackers | Create, edit, delete | |
| 10 | Administration — Issue Statuses | Create, edit, delete | |
| 11 | Administration — Custom Fields | Create, edit, delete, module association | |
| 12 | Administration — Enumerations | Priorities, Activities, Document Categories | |
| 13 | Administration — Workflows | Status transitions, role mapping | |
| 14 | Administration — Settings (all tabs) | General, Display, Authentication, API, Projects, Issues, Time Tracking, Repositories, Notifications | |
| 15 | Projects — List | Project cards/list, filter, search | |
| 16 | Projects — Create | New project form, identifier, modules, members | |
| 17 | Projects — Edit | Settings tabs: Info, Modules, Members, Versions, Categories | |
| 18 | Projects — Archive / Unarchive | Archive and restore flow | |
| 19 | Projects — Close / Delete | Close and delete confirmation | |
| 20 | Issues — List | Filter bar, columns, sort, pagination | |
| 21 | Issues — Create | New issue form, all attributes | |
| 22 | Issues — Edit | Edit form, status transitions | |
| 23 | Issues — Delete / Copy / Move | Confirmation dialogs | |
| 24 | Issues — Bulk Edit / Bulk Delete | Multi-select actions | |
| 25 | Issues — Notes / Attachments / Relations / Watchers | All tabs in issue detail | |
| 26 | Issues — Saved Queries | Save, edit, delete public/private query | |
| 27 | Gantt | View, filters, PDF/PNG export | |
| 28 | Calendar | Month view, navigation, filters | |
| 29 | Roadmap | Versions, progress bars, completed issues | |
| 30 | Time Tracking — Add / Edit / Delete | Time entry form | |
| 31 | Time Tracking — Reports | User and project reports | |
| 32 | Documents | Create, edit, delete, attachment download | |
| 33 | Files | Upload, download, edit, delete | |
| 34 | Wiki — Pages | Create, edit, rename, delete | |
| 35 | Wiki — History / Compare | Version history, diff view | |
| 36 | Forums — Forum CRUD | Create, edit, delete forum | |
| 37 | Forums — Messages | New topic, reply, edit, delete, quote | |
| 38 | News | Create, edit, delete, comments | |
| 39 | Members | Add, edit roles, remove | |
| 40 | Versions | Create, edit, close, delete | |
| 41 | Categories | Create, edit, delete | |
| 42 | Repository | Browse, commits, revision view, diff | |
| 43 | Search | Cross-module search results page | |
| 44 | Theme Consistency | Color, font, icon, spacing on all pages | |
| 45 | Responsive Layout | No horizontal scroll, no overflow on 1280/1440/1920px | |

## Notes

- All UI element types must be verified: buttons, dropdowns, checkboxes, radio, date pickers, RTE, tooltips, breadcrumbs, modals, pagination
- Every action must verify success/error/warning messages are visible and correctly styled
