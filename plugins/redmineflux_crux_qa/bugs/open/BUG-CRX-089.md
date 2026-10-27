# Bug Report Template

- Bug ID: BUG-CRX-089
- Production Redmine Issue ID:
- Title: QA Agent's "To Do" answer substitutes generic assigned-open-issues for the plugin's actual To-Do feature (pending/incomplete Runs) and falsely claims an empty list for admin despite 3 real pending runs — supersedes this suite's earlier "honest fallback, no bug" assessment of the same feature
- Redmine version: 6.0-bookworm (new local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, QA Agent, Test Case Management plugin domain)
- Plugin version: redmineflux_testcase_management 7.2.0 / crux-core 0.128.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin-equivalent (`luna.blossom`, "QA Full Access" role)
- Date: 2026-10-27

## Steps to reproduce

1. As `luna.blossom`, with 3 genuinely incomplete/pending runs in the project, each assigned to Luna Blossom and each with real testcases (confirmed via the plugin's own native `/testcase_todos?project_id=...` page — a dedicated "To Do" dashboard showing "Total Runs: 3", listing "Bulk Status Fixture Run (Staging)" — 2 testcases, 100% done but state "New" (not closed); "Sprint 2 Targeted Test (Staging)" — 0 testcases, untested; "Sprint 1 Regression (Staging)" — 1 testcase, 100% done but state "New").
2. In Ask Crux chat (QA Agent): "in the Crux QA Agent Test Project, what's on my To Do list?"
3. Observe the reply.

## Expected result

The agent should answer based on the plugin's own real "To Do" concept — pending/open Runs assigned to the current user, exactly as the native `/testcase_todos` page defines it — ideally by calling `list_runs` (which does exist, confirmed via MCP source) filtered to runs assigned to the caller that are still open, and reporting their state/testcase-completion status.

## Actual result

The agent replied: *"Your To Do list in the Crux QA Agent Test Project is empty — you have no open issues assigned to you right now."* This is **false on its own substituted terms** (there genuinely are no Redmine issues of any kind assigned to `luna.blossom` — confirmed, `assigned_to_id` is blank on all 4 testcase issues) and **wrong on the actual feature's terms** — the plugin's real To-Do dashboard shows 3 runs, all assigned to Luna Blossom, none closed. The agent checked the wrong data model entirely (generic issue `assigned_to`) instead of the real "To Do" concept this plugin defines (incomplete Runs by assignee).

## Evidence

### Console / log

- Exact reply (verbatim): `"Your To Do list in the Crux QA Agent Test Project is empty — you have no open issues assigned to you right now."`
- Native UI ground truth (`/testcase_todos?project_id=crux-qa-agent-test-project`): a "Total Runs: 3" bar chart plus a "Test Runs" table listing all 3 runs with columns `Run Name`, `State`, `Assignee` (all "Luna Blossom"), `Total Testcases`, `Status` — directly contradicting the chat's "empty" claim.
- MCP source check: `redmineflux_testcases_management_list_runs` exists and could answer this correctly; no `todo`-named tool exists anywhere in `testcases_management.py` (0 matches on `grep -in 'todo'`).

## Note for triage

This **supersedes** this suite's own earlier finding on TC-CRX-342 (originally logged as "Capability gap, not a bug — honest, graceful fallback" after a non-admin repro gave a plausible-looking substitute answer with an explicit caveat). Re-testing as admin reveals the substitution isn't a graceful, clearly-flagged fallback at all — it's a **wrong data model silently presented as a confident, specific negative claim** ("your To Do list is empty"), which is strictly worse than the non-admin repro's hedged "there don't appear to be any... would you like me to search further?" phrasing. Both repros share the same root cause (no tool maps to the plugin's actual "To Do" = pending-Runs-by-assignee concept), but the severity assessment and "no bug filed" conclusion from TC-CRX-342 should be treated as retracted — filing this as a proper bug instead.

## Duplicate check

- Duplicate found: No new defect class — same false-capability/wrong-substitution family as BUG-CRX-029/032/034/050/061/062/065/066-069 (confident wrong/false answers about a real capability), but the first instance where the agent substitutes an entirely different, unrelated data model (generic issue assignment) for a well-defined native feature (Run-based To-Do) rather than simply denying or stalling. Not a duplicate of BUG-CRX-087 (that's a run-scoped read fabricating an extra row; this is answering an entirely different question than what was asked, using the wrong underlying data).
