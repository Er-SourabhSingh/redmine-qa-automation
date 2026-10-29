# Bug Report Template

- Bug ID: BUG-CRX-099
- Production Redmine Issue ID: #126120
- Title: QA Agent gives a factually incorrect architectural explanation for why Run Type can't be changed via chat — claims it "is not a property of individual runs" when `runs.run_type_id` genuinely is a per-run column, settable on the native Edit Run form
- Redmine version: 6.0-bookworm (new local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, QA Agent, Test Case Management plugin domain)
- Plugin version: redmineflux_testcase_management 7.2.0 / crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-10-29

## Steps to reproduce

1. Fixture ground truth: native "Edit Run" modal for run #1 "Sprint 1 Regression" (opened via the Runs & Results grid's row Action menu → Edit Run, a `data-remote="true"` AJAX link to `GET /runs/1/edit`) genuinely renders a `Run Type` dropdown — `<select name="run[run_type_id]">` with options Functional/Regression/Smoke/Integration/Performance/Security/User Acceptance, submitting via `PATCH /runs/1`. DB confirms `runs.run_type_id` is a real column on the `runs` table (`SELECT id, name, run_type_id FROM runs` → run #1 and #8 both have `run_type_id=1`).
2. Fresh chat, QA Agent (pinned), admin: "in the Crux QA Agent Test Project, can you change the Run Type of the 'Sprint 1 Regression' run to Regression?"

## Expected result

The agent should correctly explain that Run Type **is** a per-run field (it has its own column on `runs` and its own field on the native Edit Run form), but that the `update_run` MCP tool it has access to simply doesn't expose a `run_type_id` parameter — an honest tool-coverage gap, matching the already-documented Create-time gap (Scope note, TC-CRX-329).

## Actual result

The agent correctly declined to fabricate a change (no bad write occurred — this part is fine), but its stated *reason* was wrong: *"the 'Run Type' is a shared reference configuration in the plugin (like 'Smoke,' 'Regression,' 'Sanity'), not a property of individual runs."* This is false — Run Type is genuinely a per-run field (`runs.run_type_id`), directly settable on the native Edit Run form, not merely a shared lookup list with no per-run assignment. The agent appears to have correctly identified that the `update_run` tool it has lacks a `run_type_id` parameter, but then invented an incorrect architectural justification for that gap instead of just stating the tool limitation plainly (as it did perfectly correctly for Requirements CRUD, Report scheduling, and Run Type at *create* time elsewhere in this suite, with no inaccurate side-claims).

## Evidence

### Console / log

- Chat reply (verbatim, relevant portion): *"I understand what you're asking, but I need to clarify: the 'Run Type' is a shared reference configuration in the plugin (like 'Smoke,' 'Regression,' 'Sanity'), not a property of individual runs. What you're actually asking to do — change Run #1's type to 'Regression' — would typically be managed through the run's update operation. However, looking at the `update_run` tool available to me, it doesn't have a `run_type_id` parameter. The available run update fields are: `name`, `state`, `suite_testcase_map`, `include_testcase`, and `run_assignments`."*
- Native Edit Run modal source (fetched via `GET /runs/1/edit` with Rails-UJS headers, `Accept: text/javascript`): contains `<label for="run_run_type_id">Run Type</label><select name="run[run_type_id]" id="run_run_type_id"><option selected="selected" value="1">Functional</option><option value="2">Regression</option>...</select>` inside the same `<form ... action="/runs/1?project_id=..." method="post">` (with `_method=patch`) that also submits Name, Notes, State, Start/Due Date, and Run Assignments — i.e., Run Type is submitted exactly like every other genuinely per-run field on this form, not sourced from a separate shared-config picker.
- DB: `SELECT id, name, run_type_id FROM runs;` → run #1 `run_type_id=1`, run #8 `run_type_id=1`, runs #3/#4/#7 `run_type_id` NULL — proving different runs independently carry (or don't carry) their own Run Type value, which a "shared config, not per-run" model could not produce.

## Duplicate check

- Duplicate found: No. Distinct from the already-closed-as-expected Create-time Run Type gap (TC-CRX-329, Scope note) — that one is a correct, accurate honest disclosure with no wrong reasoning attached. This bug is specifically about the **update-time** response containing a confidently stated but factually incorrect architectural claim, a new sub-shape not seen elsewhere in this suite's "honest capability gap" findings (BUG-CRX-029/032/034/050 family concerns *false denial of a capability that exists*; this is the reverse — *honest denial of a capability gap, but for a fabricated reason*).
