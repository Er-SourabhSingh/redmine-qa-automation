# Dev Request — Redmineflux Crux QA (#116773, #117162)

> Compiled 2026-09-11 by QA (Sourabh Singh). Purpose: everything currently blocking or limiting test execution across the 138 test cases already written in `testcases/CRUX_*.md` (see `docs/CRUX_FEATURES_LIST.md` Suite Index). Send this to Prashant Chaurasia (assignee on both tickets) — it supersedes the informal note already left on #116773/#117162 on 2026-09-10, which is still unanswered as of this document.

---

## 1. Open questions only the dev team can answer

These block trusting the test *results*, not just running the tests — please answer before QA sign-off is treated as final either way.

1. **#117162's status contradiction.** The ticket description's own "Status" section says *"Not started — planning/spec stage,"* but the Redmine tracker shows **Status = In QA, Done ratio = 70%**, and source code on the local QA stack (`redmineflux-crux-core` v0.92.0) shows 7 of the 9 named agents already carry full create/update/delete tools in their spec files (`agents/*.md`). Which is accurate? If code is ahead of the ticket description, please update the description; if the tools being *listed* doesn't mean they *work end-to-end*, please say so explicitly so QA doesn't over-trust the source-code inference.
2. **Session Artifacts implementation status.** #117162 lists Session Artifacts as one of three chat capabilities needing write-turn regression coverage, alongside Keep and Share. We've confirmed Keep and Share are done (per your own 2026-07-18 journal note on #116773), but found no equivalent confirmation for Session Artifacts. `redmineflux-crux-core/docs/API.md`'s own "Artifacts — CRX-27" section is annotated *"core leg; no attach-to-Flux yet"* — does this mean the feature is only half-built (saves in crux-core, but can't yet attach to a Redmine project/ticket)? If so, is that expected to land before QA is expected to verify it, or should we test only the core-leg part for now?
3. **Which of the 7 "CRUD-ready" agents have actually been exercised live end-to-end** (proposal → confirm card → real Redmine/plugin write → honest success/failure report), versus just having the right tools wired into `allowed_tools`? #116773 already found and fixed one real bug where a tool being *callable* didn't mean it *reported outcomes honestly* (403/404/409/422 responses recorded as fabricated success) — was that fix applied uniformly across all write paths, or only to the two it was originally found in (`create_project`, `improve`)?
4. **Intended default role permissions.** `docs/CRUX_REQUIREMENTS.md`'s Permissions Matrix is currently filled in from source code only (`init.rb`) — the actual Admin/Manager/Developer/QA/Client/Non-member default grants for the 5 Crux permissions (`view_crux`, `approve_crux_gates`, `use_ask_crux`, `manage_crux_agents`, `manage_crux_pipelines`) aren't confirmed. Is there an intended default role matrix, or is this left to each deployment's own choice?
5. **`use_ask_crux` not requiring project membership** — is this intentional (chat is meant to be usable org-wide, with actual data access still scoped by the user's own Redmine permissions), or an oversight? We've written a specific test (TC-CRX-006) to verify data access stays correctly scoped either way, but want to know if the membership-free access itself is by design before treating any related finding as a bug vs. expected behavior.
6. **Target QA sign-off environment.** Is the local Docker QA stack (`C:\Crux-Redmine-Docker`, Redmine 7.0.0) the environment QA should sign off against, or is production `flux.zehntech.com` the real target once local testing passes? This affects whether bugs found locally need to be independently re-verified against production before closing.

---

## 2. API / credentials needed

| Item | Who provides it | Status |
|---|---|---|
| LLM provider key (`ANTHROPIC_API_KEY` recommended — crux-core's agents default to `claude-sonnet-5`; `OPENAI_API_KEY`/`GEMINI_API_KEY` also supported, no others) | **QA to obtain ourselves** (Anthropic Console / OpenAI Platform / Google AI Studio) — not a dev deliverable, listed here only so the dev team knows this is the reason ~100 of our 138 written test cases can't execute yet | Not yet added to `C:\Crux-Redmine-Docker\.env` |
| A second, restricted-privilege Redmine test user + their own API key (for CRX-12 per-user-key enforcement testing) | **QA to create ourselves** on the local `crux-redmine` instance (we have admin access) | Not yet created |
| **Question for dev:** does the team have an existing shared/org LLM provider key we should use instead of QA provisioning our own (for cost tracking / consistency with how dev tested #116773's own live verification)? | Dev to answer | Open question |

---

## 3. Missing or unconfirmed documentation

| Doc | Status |
|---|---|
| `CRUX_REQUIREMENTS.md`, `CRUX_FEATURES_LIST.md`, `CRUX_USER_GUIDE.md` | Drafted by QA from source code (READMEs, `init.rb`, `docs/API.md`, `agents/*.md`) — **not yet reviewed or confirmed by dev.** Please review, especially the Permissions Matrix (open question #4 above) and the per-agent CRUD tool tables in `CRUX_FEATURES_LIST.md`. |
| Official QA/UAT setup guide | We found `C:\Crux-Redmine-Docker\SETUP-INSTRUCTIONS.md` (thank you — this unblocked us) but it's informal/handed-off rather than a checked-in doc. Worth adding to the repo itself (`redmineflux-crux-core` or the umbrella repo) so future QA cycles don't depend on a one-off local folder. |
| Session Artifacts spec/docs | Not found anywhere — see open question #2. |

---

## 4. Environment / infrastructure gaps

1. **`redmineflux-mcp` is on branch `crux_development`, 2 commits ahead of GitHub** (per `SETUP-INSTRUCTIONS.md`'s own "Known gaps" section) — these 2 unpushed bug fixes are the most correct/up-to-date code, but if QA (or anyone) `git pull`s a fresh copy, those fixes won't be there. **Please push these 2 commits** so the QA stack isn't the only place carrying them.
2. **`pyjwt[crypto]` gap** — `crux_core/surfaces/teams.py` imports `jwt`/`PyJWKClient`, which isn't stdlib and violates the project's own "zero pip installs" Crux Constitution rule; the stock `python:3.12-alpine` image crashes with `ModuleNotFoundError` without it. We worked around this in our `docker-compose.yml` by installing it at container start, but flagging it as a real gap against the stated constitution, per your own team's design principle.
3. **`CRUX_COMPONENT_CF`/`CRUX_COMPONENT_CF_IDS`** placeholder default (`1`) happened to match the real "Crux Capability" custom field ID on our local Redmine — confirmed correct for this environment, but this is environment-specific and should be re-verified on any other target Redmine instance (including production) before assuming it's always `1`.

---

## 5. Test data / seed data needed for meaningful agent CRUD testing

Once an LLM key is added, the 9 per-agent CRUD suites (`CRUX_AGENT_*.md`, ~85 test cases) need each underlying Redmineflux plugin to have some real seed data to query against and modify:

| Plugin | Data needed |
|---|---|
| CRM | At least a few contacts, companies, deals (multiple pipeline stages), leads |
| Workload | At least 2 teams, several members, an existing allocation/workload, a holiday scheme |
| DevOps | At least one tracked repository with commit/PR/build history (real infra — see caution below) |
| Budget/Audit | An existing budget cap + approved-hours records on at least one project |
| Agile | A project board with columns, a sprint, a few backlog items/epics |
| Test Case Management | Existing test cases/suites/runs (separate from — do not confuse with — this QA project's own manual `testcases/*.md` files) |
| Timesheet | Submitted timesheets pending approval, an existing schema/team |
| Invoice | A test customer, project with logged time, existing team rates |
| Knowledge Base | At least one existing space/page with version history |

**Caution flagged for dev:** the DevOps Agent's `trigger_build` write has a real infrastructure effect (starts an actual CI run) and the Invoicing Agent's `send_invoice` has a real communication effect (emails a customer). Please confirm a safe test repository/branch and a QA-controlled test customer email address before we execute TC-CRX-102 and TC-CRX-129 — we do not want to trigger a real production build or email a real customer by accident.

---

## 6. Summary — what QA can do right now vs. what's waiting on this document

**Executable today, no dev input needed:** `CRUX_NAVIGATION_AND_PERMISSIONS.md`, `CRUX_DASHBOARD_GRAPH_PIPELINE.md`, `CRUX_AGENT_ROSTER_ADMIN.md` (53 test cases).

**Waiting on this document (or QA's own follow-through on §2):** the remaining 12 suites (~85 test cases) — chat, confirm-gate content, CRX-12, project creation, Improve wand, Keep/Share/Artifacts, and all 9 agents' CRUD.
