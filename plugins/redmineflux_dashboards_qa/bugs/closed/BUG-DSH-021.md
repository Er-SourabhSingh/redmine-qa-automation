# Bug Report Template

- Bug ID: BUG-DSH-021
- Production Redmine Issue ID: #121287
- Title: A chart's User Filter dropdown discloses the full instance-wide user list (20 real accounts) to a role with maximally restricted issue visibility
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Analytics Dashboard (`redmineflux_dashboard`)
- Plugin version: 7.0.0
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Browser: Playwright MCP (Chromium)
- User role: **Summer Rain**, project role **"QA Own Visibility"** (restricted to only issues she authored/is
  assigned to)
- Date: 2026-09-24

## Steps to reproduce

1. Log in as `summer.rain` / `12345678`.
2. Open the project's Dashboard.
3. Open Chart Settings on "Total Spent Hours by Users" (or any widget offering a User Filter).
4. Read the Data Filters → User Filter's available/selected option lists.

## Expected result

- Per `TC-DSH-023`'s own documented concern: "Only values the user is entitled to see are listed. A filter list is
  an easy, overlooked enumeration path — for example disclosing the full user list of the instance."

## Actual result

- The User Filter control lists **20 real user accounts** across its available/selected option lists — Daisy
  Skye, Harmony Rose, Sourabh Singh, Summer Rain, Willow Belle (available), plus Autumn Grace, Briar Sunset,
  Celeste Dawn, Ember Lilac, Isla Moon, Ivy Skylark, Luna Blossom, Luna Meadow, Marigold Rayne, Nova Starling,
  Opal Sparrow, Redmine Admin, Sage Willow, Selene Frost, Serenity Bloom (selected/pre-populated) — this reads as
  the full seeded user roster of the instance, not a list scoped to what Summer Rain (a maximally
  restricted-visibility role, confirmed to see exactly 1 issue project-wide) is entitled to know about.
- This is exactly the enumeration risk this TC calls out by name: a low-privilege user can learn the full staff/
  account list of the Redmine instance through a chart filter control, independent of any issue-level data
  disclosure.

## Evidence

### Console / log

- As `summer.rain`, on widget 106 ("Total Spent Hours by Users") Settings → Data Filters → User Filter:
  `chartUserFilter_available` options: `["Daisy Skye","Harmony Rose","Sourabh Singh","Summer Rain","Willow
  Belle"]`; `chartUserFilter` (selected) options: `["Autumn Grace","Briar Sunset","Celeste Dawn","Ember
  Lilac","Isla Moon","Ivy Skylark","Luna Blossom","Luna Meadow","Marigold Rayne","Nova Starling","Opal
  Sparrow","Redmine Admin","Sage Willow","Selene Frost","Serenity Bloom"]` — 20 names total.

## Duplicate check

- Duplicate found: No — checked `bugs/_duplicates.md` and `bugs/_index.md`. Related to but distinct from
  `BUG-DSH-013` (that bug is about aggregate issue *counts*; this is about *user-account enumeration* via a
  filter control, a different disclosure surface).

## Retest — 2026-09-25

**FIXED.** Logged in as Summer Rain and opened Chart Settings → Data Filters → User Filter on "Total Spent Hours
by Users" (widget 106) on `redmine-docker-700` — the dropdown now lists exactly **7 names**: Daisy Skye, Harmony
Rose, Luna Blossom, Redmine Admin, Sourabh Singh, Summer Rain, Willow Belle. These are precisely test-project's
own 7 real members (Manager/Developer/Reporter/QA Read Only/QA Own Visibility roles), not the full 20-account
instance-wide roster from the original finding. The User Filter now correctly scopes to the current project's
membership. Confirmed FIXED, ready to close.
