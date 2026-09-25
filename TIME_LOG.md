# Time Log — QA Activities (all plugins)

> Rules: `CLAUDE.md` §14. One row per activity, appended **as soon as the activity ends** — not reconstructed
> later. Start/End come from the system clock (`date '+%Y-%m-%d %H:%M'`), never estimated.
>
> Every row names the **testcase the time is logged against** and a **comment** saying what the time was for.
> Logging to production (Redmine time entry on the testcase) happens **only when the user explicitly says so**,
> each time — then fill in the last two columns.

## Which testcase to log against

| Activity | Log the time against |
|---|---|
| Testing — executing a TC | That TC |
| Regression — re-running a TC | That TC |
| Retesting a bug | The TC the bug is linked to (the bug file's related TC / the TC it was reported on in the run) |
| Bug reporting — writing the local bug MD, screenshots, production report, linking to the run | The TC the bug was found on |
| Writing / updating a test case | That TC |
| Setup / investigation done for a specific TC (fixtures, roles, data) | That TC |
| Work not tied to one TC (environment down, general setup) | `—` — say why in the comment; ask the user which TC to put it on before logging |

## Comment format

`<Activity>: <what was done> — <result>`, for example:
- `Testing: TC-CHK-015 create checklist via Actions → New checklist — PASS`
- `Retest: BUG-CHK-005 checklist CRUD on closed issue — FIXED`
- `Bug reporting: BUG-DSH-023 local MD + screenshot + ztflux report`
- `Regression: CHECKLIST_TEMPLATES suite after BUG-CHK-005 fix — 23 TCs PASS` (one row per TC, same comment prefix)

## Entries

> Newest date at the bottom. Duration as `h:mm` plus decimal hours (Redmine time entries take decimal hours).

| Date | Start | End | Duration | Activity | Plugin | Log against (TC) | Bug | Comment | Prod TC issue # | Logged to prod (time entry #) |
|------|-------|-----|----------|----------|--------|------------------|-----|---------|-----------------|-------------------------------|

## Daily summary

> Filled at the end of each session from the Entries table; this is what gets reported to the user.

| Date | Plugin | Testing | Retesting | Bug reporting | Regression | TC writing | Other | Total |
|------|--------|---------|-----------|---------------|------------|------------|-------|-------|
