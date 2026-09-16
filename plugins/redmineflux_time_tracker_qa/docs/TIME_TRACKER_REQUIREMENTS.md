# Plugin Requirements — Redmineflux Time Tracker Plugin

> Source: https://www.redmineflux.com/knowledge-base/plugins/time-tracker/ (official vendor knowledge base,
> ingested 2026-09-15). Anything marked *(to confirm)* is an inference to verify on the running instance.

## Overview

A real-time time-tracking plugin. Users start and stop a live timer against a project/issue, or log time manually,
and manage the resulting entries from a list, a calendar, an activity view with an optional map, and three report
types. It adds its own tag vocabulary and ships a browser extension that drives the timer from outside Redmine.

Two things set it apart from ordinary Redmine time logging and carry most of the risk: **a running timer is
stateful server-side work that must survive navigation and browser closure**, and **the plugin can require browser
location access and plot users on a map** — which is employee-location data.

## Key Features

1. **Live timer** — select Project, Issue, Tag and Activity, then Start; Stop prompts for a comment and any
   required custom fields and saves the entry.
2. **Manual time log** — start time, end time and date entered directly. Must be enabled by an admin.
3. **Inline entry editing** — comment, tag, activity, start time, end time and date, edited in place and saved
   with Enter.
4. **Duplicate an entry** — via the entry's three-dot context menu. **Entries with the same data on the same day
   are automatically combined.**
5. **Delete an entry** — from the same context menu, with confirmation.
6. **Calendar view** — add entries for a selected time range; drag entry edges to resize; double-click to edit;
   drag and drop to move between dates.
7. **Activity view** — logs for all users, filtered by project, user and custom date range, with a **Map View**
   showing user locations where location data exists.
8. **Three reports** — Summary (grouped by project/user/activity, with charts, exportable to **PDF, CSV, XML**),
   Detailed, and Weekly.
9. **Tags** — create, edit, delete; filter by Used / Unused.
10. **Browser extension** — configured with a Base URL and API Key, with a Test Connection step; starts and stops
    the timer from the browser, running in the background.
11. **Three page layouts** — Modern Card, Compact Layout, Detailed Expanded, previewable before selection.

## Configuration options (Administration → Plugins → Configure)

| Option | Behaviour |
|---|---|
| **Require Location Permission** | Users must allow location access to start or stop the timer. Specific users can be named; **if none are selected, it applies to all users.** |
| **Enable Manual Time Entry** | Allows manual entries with custom start and end times |
| **Google Maps API Key** | Required for the map view to display locations |
| **Time Tracker Page Design** | Modern Card / Compact Layout / Detailed Expanded |

## Permissions Matrix

The KB names three plugin permissions and references a fourth core capability:

| Permission | What it covers |
|---|---|
| **View Time Tracker Activity** | Access the activity module |
| **View Time Tracker Reports** | Access all reports in the plugin |
| **Manage Time Tracker Tags** | Create, edit and delete tags |
| *(core)* View others' time entries | Referenced in Troubleshooting as a permission to verify |

Notably, **no permission is listed for running the timer or logging time itself** — that presumably follows
Redmine's own "log time" permission. The matrix below must be established empirically, and the gap is worth
confirming rather than assuming.

| Action | Admin | Manager | Developer | QA | Reporter | Non-member | Anonymous |
|--------|-------|---------|-----------|-----|----------|------------|-----------|
| Open Time Tracker | | | | | | | |
| Start/stop the timer | | | | | | | |
| Log time manually | | | | | | | |
| Edit own entries inline | | | | | | | |
| Edit others' entries | | | | | | | |
| View Activity | | | | | | | |
| See Map View / others' locations | | | | | | | |
| View Reports / export | | | | | | | |
| Manage Tags | | | | | | | |
| Change plugin configuration | | | | | | | |

## Known Constraints

- **If location tracking is required and the user denies access, the timer will not start.** This is a hard block,
  not a warning — and it means a browser-level permission decision can prevent someone working.
- **Require Location Permission with no users selected applies to everyone.** An empty selection is the broadest
  setting, not the narrowest — an easy and consequential misconfiguration.
- **Manual time entry is unavailable unless an admin enables it.**
- The **Map View needs a valid Google Maps API Key** with the right services enabled.
- **Duplicated entries with identical data on the same day are automatically combined**, so duplication is not
  always additive — the KB states this explicitly.
- Licensing: changing domains requires updating the domain URL in the Redmineflux account's Order section and
  re-entering the **License Key** and **Security Key** *(a licence enforcement path no other plugin in this set
  documents — worth noting, though licence testing is likely out of scope)*.
- Declared compatibility: Redmine 5.0.x, 5.1.x, 6.0.x (not 4.x).

## Installation Prerequisites

1. Working Redmine 5.0+.
2. Plugin folder uploaded to `Redmine/plugins` with its **name unchanged** — the KB flags a renamed folder as a
   specific failure mode.
3. `bundle install`; `RAILS_ENV=production bundle exec rails redmine:plugins:migrate`; restart.
4. For map testing: a valid Google Maps API key with the required services enabled.
5. For location testing: a browser where location permission can be granted **and denied** deliberately, and ideally
   HTTPS — browsers refuse geolocation on insecure origins, which will otherwise look like a plugin defect.
6. For extension testing: the browser extension installed, plus an API key and the REST API enabled in Redmine.
