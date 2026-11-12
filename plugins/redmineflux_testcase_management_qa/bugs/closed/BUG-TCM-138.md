# Bug Report Template

- Bug ID: BUG-TCM-138
- Production Redmine Issue ID: #128057
- Title: An existing testcase's Steps and Expected Result can't be read or updated through the MCP or REST API
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: Redmineflux Testcase Management / Redmineflux MCP Server (BETA), Testcase Management tools
- Plugin version: 0.0.0-dev
- Environment: Local — `http://localhost:3015`
- Browser: Chromium (Playwright MCP) + direct REST calls
- User role: admin
- Date: 2026-11-11

## Steps to reproduce

1. Create a testcase with a structured Step and Expected Result via the native UI ("New Test Case" →
   "New Step" → fill Step + Expected) — fixture used: issue #62, "RETEST-RIT-API: steps/expected API
   read-write check", Step "Open the login page" / Expected "Login page loads ORIGINAL", in "Crux PM Agent
   Test Project".
2. Check the `redmineflux_testcases_management_update_testcase` MCP tool's own parameter schema for a way to
   change the Step/Expected rows.
3. Read the testcase back via `GET /issues/62.json` (native Redmine REST API).
4. Try plugin-style REST URLs: `GET /projects/<project>/testcases/62.json` and `GET /testcases/62.json`.
5. Confirm Administration → Settings → REST API has "Enable REST web service" checked (ruling out "API
   disabled" as the explanation for any 404/empty result).

## Expected result

- `update_testcase` should accept a `steps` parameter that replaces or edits the Step and Expected rows, the
  same way `create_testcase` accepts one on creation.
- `get_testcase` and the native REST API should return the Step and Expected rows, so external tools can read
  and sync them.
- A dedicated plugin REST route for testcases (or an equivalent documented path) should exist and return
  2xx/JSON, not 404.

## Actual result

- `update_testcase`'s own parameter schema only exposes `testcase_id`, `subject`, `description`, `priority_id`,
  `status_id`, and `uploads` — there is no `steps` parameter anywhere in the schema. Confirmed via direct tool
  schema inspection.
- `GET /issues/62.json` returns only `id`, `project`, `tracker`, `status`, `priority`, `author`, `subject`,
  `description` (empty, since the testcase's content lives in its Step/Expected rows, not the description),
  `custom_fields` (just "Automation Key"), and standard date fields — no Step or Expected data anywhere in the
  payload, even though the native UI (`/issues/62`) genuinely shows "Open the login page" → "Login page loads
  ORIGINAL" as a structured row.
- `GET /projects/crux-pm-agent-test-project/testcases/62.json` → **HTTP 404 Not Found**.
- `GET /testcases/62.json` → **HTTP 404 Not Found**.
- REST API is confirmed enabled instance-wide (Administration → Settings → API → "Enable REST web service" is
  checked), so the 404s are a genuinely missing route, not a disabled service.
- The only way to read or change the Step/Expected rows is the web UI's own testcase edit form — there is no
  API path in or out for this specific data, for either read or write.

## Evidence

### Screenshot

![Native issue JSON missing Step/Expected data](../../screenshots/BUG-TCM-138/issue-62-json-no-steps.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-TCM-138/retest-yyyy-mm-dd-pass.png)

### Console / log

- `update_testcase` schema (verbatim, relevant fields): `testcase_id`, `subject` (default ""), `description`
  (optional), `priority_id` (default 0), `status_id` (default 0), `uploads` (optional list) — no `steps` field.
- `GET /issues/62.json` (verbatim): `{"issue":{"id":62,"project":{"id":1,"name":"Crux PM Agent Test
  Project"},"tracker":{"id":4,"name":"Testcase"},"status":{"id":2,"name":"new","is_closed":false},
  "priority":{"id":6,"name":"low"},"author":{"id":1,"name":"Redmine Admin"},
  "subject":"RETEST-RIT-API: steps/expected API read-write check","description":"","start_date":"2026-11-11",
  "due_date":null,"done_ratio":0,"is_private":false,"estimated_hours":null,"total_estimated_hours":null,
  "custom_fields":[{"id":3,"name":"Automation Key","value":""}], ...}` — no `steps` key anywhere.
- `GET /projects/crux-pm-agent-test-project/testcases/62.json` → 404 Not Found.
- `GET /testcases/62.json` → 404 Not Found.
- Independent corroboration via Crux's own Testcase Agent (backed by this same local `redmineflux-mcp` server,
  not just a direct tool-schema read): asked "What are the Steps and Expected Result for testcase #62...?" —
  the agent's verbatim reply: *"Unfortunately, the available testcase tools in Redmineflux don't expose a
  dedicated endpoint that returns the steps and expected results in a structured format. The `get_testcase`
  call returns the testcase metadata (title, status, priority, dates) but the detailed step-by-step content
  and expected results are stored within the description field of the underlying Redmine issue."* The agent's
  own remediation guess (steps live "within the description field") is itself incorrect in our fixture — issue
  #62's Description is genuinely empty, confirming the agent has no real visibility into the Step/Expected data
  either, not even enough to know where it actually lives.

## Secondary check — Step/Expected character length (no limit enforced)

The original production report's "Suggested fix" section assumed a 255-character limit on Step/Expected
("same format and 255-character limit as create_testcase"). Tested the real limit natively on a fresh fixture
(issue #63, "RETEST-RIT-LEN"): set Step to exactly 4000 characters and Expected to 4001 characters via direct
field assignment, then submitted the native "New Test Case" form.

**Both saved successfully with no validation error and no truncation** — native-verified on the resulting
issue page: the saved Step content contains all 4000 characters, and the saved Expected content contains all
4001 characters, byte-for-byte. No server-side length rejection was triggered at either boundary. This means
there is currently no enforced character limit on these fields at all (at least up to 4001 characters) — a
separate, lower-severity observation from the main API-read/write gap, but worth recording since it
contradicts the 255-character assumption in the original report and shows the real fields allow substantially
longer content than that.

## Full CRUD matrix via Crux chat (Testcase Agent, local MCP)

Re-verified all four operations against Steps/Expected Result directly through Crux's own Testcase Agent (which
talks to this same local `redmineflux-mcp` server), not just by reading the tool schema or raw REST calls:

| Operation | Message sent | Result |
|---|---|---|
| **Create (write)** | "Create a new testcase... with one step: Step 'Open the dashboard', Expected 'Dashboard loads successfully'." | **Works.** Real `Testcases Management Create Testcase` confirm card correctly built the `steps` payload (`[{'step': 'Open the dashboard', 'expected': 'Dashboard loads successfully'}]`); confirmed, native-verified on the resulting issue #64 — Step 1 / Expected Result genuinely saved and visible. |
| **Read** | "What is the Step and Expected Result for testcase #64?" | **Not possible.** Agent's own admission: *"Testcase #64 exists, but the available tools return only the summary view. The step details... aren't surfaced in the standard read endpoints I have access to."* It only repeated back what the user had typed earlier in the same chat, not a fresh read. |
| **Update** | "Update testcase #64's Expected Result to 'Dashboard loads with the correct widgets visible'." | **Not possible.** Honest refusal: *"I couldn't find a tool for this here, so I can't do it from this chat. It can be done directly in Redmineflux; if you expected Crux to do it, an administrator can check this deployment's tool setup."* |
| **Delete** | "Delete the step from testcase #64, leaving no steps." | **Not possible.** Identical honest refusal as Update. |

**Conclusion:** only the create path can ever set Step/Expected content (and only once, at creation time) —
there is no way via Crux/MCP to read, correct, or remove that data afterward. Every subsequent change has to
go through the native web UI's own testcase edit form. This confirms the gap is total, not partial: it isn't
just "update is missing a parameter," the plugin has never exposed any post-creation API surface for this data
at all, for any of read/update/delete.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A — checked `bugs/_duplicates.md` and `bugs/_index.md`, no prior
  finding on `update_testcase`'s missing `steps` parameter or the plugin's missing REST testcase route exists
  in this suite.

## Notes

- This finding was first reported independently against production (`flux.zehntech.com`, project `ztzpp`
  id 699, suite #516, run #656; first seen 2026-08-19, still present as of 2026-11-04) — this QA repo had no
  local bug file for it yet. Re-verified here against a fresh local fixture (issue #62) on the local Docker
  instance (localhost:3015) to confirm it reproduces independently of the specific production project/suite,
  and to pin down the exact `GET /issues/<id>.json` payload and the two 404'd plugin REST URLs with concrete
  evidence rather than relying on the original report's prose alone.
- Real-world impact (from the original production report): 7 testcases in suite #516 needed new Expected
  Results after a requirement change; since there is no API to update them, the team had to add the new text
  to the Description field instead, leaving the real Expected Result field stale and the testcase catalog out
  of sync with the real requirements.

## Retest (2026-11-11, after `master` pull to commit `9785d2c`)

**CONFIRMED FIXED — full read/write API now exists**, re-verified live via real HTTP calls (API key auth)
against `localhost:3000`, project `rftc-016-ci-qa`, using a fresh 3-step fixture (issue #343):

1. **Read**: `GET /get_testcase/343` returns a `"steps"` array with `id`/`step`/`expected` for every step,
   matching the UI exactly (also re-confirmed on pre-existing issue #266, a 37-step case — all 37 rows present).
2. **Update — mixed edit/keep/remove/add in one call**:
   `PUT /edit_testcase/343` with `{"steps":[{"id":3024,"expected":"New expected text"},{"id":3025},{"step":"only a
   step","expected":"new added expected"}]}` →
   - Step 3024: text unchanged ("Step A"), Expected updated to "New expected text" ✓
   - Step 3025: completely unchanged (no fields sent) ✓
   - Step 3026: removed (not listed) ✓
   - New step added at the end with a new id (3027) ✓
   - Exactly matches the developer's own described behavior, verbatim.
3. **Validation**: a row with a blank Expected Result → `422 {"error":"Step 1: Expected cannot be blank"}`,
   and the testcase's steps were confirmed unchanged in a follow-up `GET` — nothing partially saved.
4. **Non-interfering updates**: `PUT` with only `{"issue":{"description":"x"}}` (no `steps` key) → description
   changed, all 3 steps left completely untouched.
5. **Permission enforcement**: same `PUT` attempted as a user without edit rights on the project (`aurora.wren`,
   via her own API key) → `403 {"error":"Unauthorized access"}`, and the step was confirmed unchanged afterward.
6. **Length limit**: a step with exactly 40,000-character Expected Result → saved successfully (confirmed via
   `GET`, full length intact); 40,001 characters → `422 {"error":"Step 1: Expected result exceeds the maximum
   length of 40000 characters"}`. Matches the developer's stated "40,000 characters per field" limit exactly —
   this also directly answers the bug's own "Secondary check" section (previously: no limit enforced at all, up
   to at least 4001 chars; now: a real, enforced 40,000-char boundary).

Developer's production comment (#128057) states this was fixed on `master` (commit `9785d2c`) via new
`GET /get_testcase/{id}` steps serialization and `PUT /edit_testcase/{id}` steps acceptance, with 14 new automated
tests — matches this session's independent live re-verification exactly, item for item. Note (per developer's own
comment, out of scope for this plugin-side fix): the MCP server's own `update_testcase` tool still needs a `steps`
parameter added on its side to actually call this new API — the plugin side is ready, the MCP wrapper is not yet
updated to use it.

## Retest #2 (2026-11-12, via Crux chat per user request — "crux use kr ke test karo")

Re-verified on this local instance (localhost:3015, fixture issue #62), this time through the actual end-user path
(Ask Crux's Testcase Agent chat) rather than direct HTTP calls, since the user specifically asked for the Crux-based
retest this plugin's own API fix was never checked against here:

1. Re-confirmed the plugin's REST API fix directly on this instance first (same as the other environment's retest):
   `GET /get_testcase/62.json` now returns a `steps` array; `PUT /edit_testcase/62.json` (via an admin API key)
   updates the Expected Result, native-verified on `/issues/62`.
2. Then asked Crux's Testcase Agent (routed via Auto) to read and update the same testcase's Step/Expected Result.
   Both failed — the agent incorrectly claimed Step/Expected Result would need to be custom fields, and
   `update_testcase`'s tool schema is unchanged (still only `subject`/`description`/`priority_id`/`status_id`/
   `uploads`, no `steps`).
3. Confirmed via the MCP server's own source (`services/redmineflux-mcp/src/tools/testcases_management.py`) that
   `get_testcase` never reads `issue.get("steps")` from its (now-fixed) API response, and `update_testcase` has no
   `steps` parameter to forward one.

**This exactly matches what Retest #1's note above already flagged** — the plugin-side fix is real and unaffected,
but the MCP tool layer was never updated to use it. Since that gap had only been left as a note rather than a
tracked item, filed it separately as **BUG-MCP-001**
(`plugins/redmineflux_mcp_qa/bugs/open/BUG-MCP-001.md`) so it doesn't get lost. BUG-TCM-138 itself stays closed —
the Testcase Management plugin's own REST API is genuinely fixed; the remaining gap belongs to the separate MCP
server codebase, tracked under its own bug code (`MCP`, renamed from `RFM` on 2026-11-12 per CLAUDE.md §4).
