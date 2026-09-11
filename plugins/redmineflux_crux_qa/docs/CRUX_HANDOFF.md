# Handoff — Redmineflux Crux

## Last Session

- Date:
- Redmine Version:
- Environment:

## Completed This Session

## In Progress

## Blockers

- **2026-09-10 (resolved — env found):** QA env setup was found locally at `C:\Crux-Redmine-Docker` (4 components: `redmineflux-crux-core`, `redmineflux_crux` plugin, `redmineflux-mcp`, plus its own dedicated `crux-redmine` Docker Redmine instance — see Environment Notes below for full detail). Stack verified up and healthy (`docker ps`, `GET /api/health` → 200). Still open: no LLM provider key configured (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY` all blank in `.env`) — chat currently only returns the canned echo-provider fallback, which blocks any meaningful "Ask Crux" / CRX-46 functional testing until at least one key is added. `CRUX_REQUIRE_USER_KEY` currently `0` (default/shared-key mode) — must be flipped to `1` specifically for CRX-12 per-user-key testing (see `.env`), and a second, restricted-privilege Redmine test user + their own API key still needs to be created on `crux-redmine` for that test.
- **2026-09-10 (resolved — docs drafted):** `CRUX_REQUIREMENTS.md` / `CRUX_FEATURES_LIST.md` / `CRUX_USER_GUIDE.md` drafted from source: `redmineflux-crux-core/README.md` + `docs/API.md` + `RELEASE-NOTES.md`, `redmineflux_crux/README.md` + `init.rb` (menus/permissions), and all 9 relevant `agents/*.md` manifests. **Not yet reviewed by the dev team or walked through live** — marked as drafts in each file's header. Key finding: 7 of the 9 agents in #117162 (all except DevOps and Budget/Audit, which have a narrower single-write-action domain) already carry full create/update/delete tool access in their spec files at crux-core v0.92.0 — this looks substantially further along than the ticket description's own "Not started — planning/spec stage" line suggests, and lines up better with the tracker's Status = In QA / 70% done. A note was posted on both production tickets (#116773, #117162) on 2026-09-10 asking Prashant Chaurasia to confirm/clarify — still unanswered as of this session; consider a short follow-up comment noting the env was found locally and docs are now drafted from source, pending dev confirmation.

## 2026-09-11 — Dev reply received (`REPLY-TO-QA-2026-09-11.md`, local QA stack folder)

Prashant replied in full to `CRUX_DEV_REQUEST.md`. Summary of what changed:

- **Q1 (status contradiction):** Confirmed — ticket description was stale, tracker (In QA/70%) is accurate. Dev will correct the description. Tool-in-manifest ≠ verified-end-to-end was confirmed as a real concern — but dev separately ran a full live propose→confirm→verify sweep on all 9 agents on 2026-09-10/11 (see Q3) specifically to close that gap.
- **Q2 (Session Artifacts):** Confirmed **intentionally v1-scoped** — core leg (save/list/read/version) fully shipped; attach-to-Flux is a **deliberate scope cut, no ETA**. `CRUX_CHAT_CAPABILITIES_KEEP_SHARE_ARTIFACTS.md` updated: TC-CRX-056/057 (attach-to-project/ticket) retired as out-of-scope; TC-CRX-055 rescoped to core-leg only.
- **Q3 (CRUD verified end-to-end?):** Yes — dev ran a real sweep against all 9 agents (helpdesk, crm-sales, agile-scrum, testcases-qa, timesheet, invoice-billing, knowledge-base, workload-capacity, project-manager), each with a real create/write + verify + cleanup. All passed; timesheet's `approve` correctly **refused** a self-approval (honest failure, not faked success) — direct evidence the honest-failure fix works for real. **2 new bugs found+fixed during the sweep** (confirm-fabrication guard: case-sensitivity + trailing-commentary gaps, commit `4771db6`) — added as regression TC-CRX-033/034 in `CRUX_WRITE_CONFIRM_GATE.md`. TC-CRX-032 updated with the `_looks_like_failure()`/`generic_write` detail.
- **Q4 (default role permissions), Q5 (`use_ask_crux` membership design intent), Q6 (target sign-off environment):** All three **still pending** — dev will follow up separately. Do not treat `CRUX_REQUIREMENTS.md`'s Permissions Matrix as confirmed until Q4 lands.
- **§2 API/credentials:** Split (QA provisions LLM key + 2nd test user) confirmed correct. Shared org key TBD — don't block on it.
- **§3 Docs:** Dev will review our 3 drafted docs and send corrections. `SETUP-INSTRUCTIONS.md` will be checked into the actual repo (not left as a local-only handoff doc).
- **§4 Environment:** `redmineflux-mcp`'s 2 unpushed commits (`ae0d83c`, `84e234f`) — **now pushed** to `origin/crux_development`. `redmineflux-crux-core` master was also 2 commits ahead locally (the Q3 bugfixes) — **also now pushed**. `pyjwt[crypto]` gap — **confirmed real**, dev raising with team for a proper fix (lazy-import vs. accepted dependency); our workaround stays fine to use meanwhile. `CRUX_COMPONENT_CF=1` — acknowledged correct-for-this-env-only, no action needed.
- **§5 Seed data — big finding:** Done for 6/9 plugins (CRM, Workload, Test Case Mgmt, Timesheet, Invoice, KB) — real, professional test data already created on the local stack. **DevOps and Budget/Audit are NOT installed on this MCP instance at all** (12/14 plugins detected — DevOps needs a connected git repo it lacks here, Budget/Audit isn't detected) — flagged by dev as a **separate infrastructure task**, blocking, not a seed-data question. `CRUX_AGENT_DEVOPS_AND_BUDGET.md` updated with this as a hard blocker — do not attempt to execute until resolved, and don't file the gap as a product bug.
- **§5 safety caution** (`trigger_build`/`send_invoice` real-world effects): acknowledged, dev will follow up with a confirmed safe test repo/branch and QA-controlled test email — still pending, do not improvise.

**Also fixed this session:** the local `.env` file at `C:\Crux-Redmine-Docker\.env` had gone missing (only `.env.example` remained) after the folder was refreshed with the dev's updated files — the running containers still had the old values in memory, but a future `docker compose up -d`/restart would have silently broken with blank Redmine credentials. Recovered the real values directly from the running `crux-core` container (`docker inspect`) and recreated `.env` — confirmed matches: `REDMINE_API_KEY=1ce...`, `CRUX_PROJECT=crux-qa`, `REDMINE_PUBLIC_URL=http://localhost:3014`. LLM key fields are still blank — that part of `.env` was never filled in.

## 2026-09-11 (later same day) — LLM key added, real chat now working, `CRUX_SECRET` root cause found + fixed, BUG-CRX-001 filed

User provided an OpenRouter key (`sk-or-v1-...`). Full chain, in order:

1. **First attempt (wrong placement):** key was placed in `ANTHROPIC_API_KEY` — wrong, since it's OpenRouter format, not Anthropic's. Corrected understanding: the 3 env-var fields (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`) only feed the 3 **built-in** providers' native APIs.
2. **Discovered a pre-existing "openrouter" custom provider** already configured in crux-core's provider registry (`GET /api/providers`, id `openrouter`, `base_url: https://openrouter.ai/api/v1`, `default_model: anthropic/claude-haiku-4.5`) — and the exact same key already registered in the managed keystore (`GET /api/llm_keys`, `key-005`, added by "admin" on 2026-08-19, last4 `2ea5` — matched the key the user gave, confirming it's the same one). **No env var was actually needed.**
3. **But a real `POST /api/chat` call still 401'd.** Root-caused fully (see `docs/BUG-CRX-001` filed below for the bug found along the way, and the paragraph below for the actual root cause):
   - crux-core obfuscates stored keys at rest via an HMAC keystream derived from `CRUX_SECRET` (`crux_core/store/keystore.py` — explicitly documented as "obfuscation, not real cryptography").
   - The code **refuses to store a real key while `CRUX_SECRET` is the built-in dev default** — so `key-005` could only have been stored under a real, custom `CRUX_SECRET` set in `.env` back on 2026-08-19.
   - The 2026-09-11 folder refresh (see the "env found" entry above) silently dropped that custom `CRUX_SECRET` along with the rest of `.env`. The container was running on the dev-default secret, which doesn't match — decrypting the stored key produced garbage, sent as the Bearer token on every real chat call → 401.
   - Confirmed the key itself was completely valid by calling OpenRouter's real chat completions endpoint directly with it — worked immediately.
   - **The 3 agent-identity keys (`key-002/003/004`, provisioned 2026-07-15 for builder-1/builder-2/test-author, CRX-48) are almost certainly broken the same way** — same keystore, same lost secret, never re-provisioned. Flag to dev if CRX-48 agent-identity testing becomes relevant; will need fresh provisioning.
4. **Fix applied:** generated a real `CRUX_SECRET`, added it to `.env`, wired it through `docker-compose.yml`'s `crux-core` environment block (it wasn't forwarded there before at all — a genuine gap in the refreshed compose file), restarted. Old `key-005` was deleted (permanently undecryptable, original secret unknown/lost) and re-added fresh under the new real secret.
5. **Verified working:** `POST /api/chat` now returns a real model reply — `"I'm Claude, made by Anthropic."`, `provider: openrouter`, `model: anthropic/claude-haiku-4.5`, real token/cost usage. Chat is genuinely live.
6. **BUG-CRX-001 filed** (High, `bugs/open/BUG-CRX-001.md`) for a separate, real product bug found along the way: `POST /api/provider/test` ("Test Connection") reports false-positive success regardless of whether the stored key actually works — proven by confirming OpenRouter's `/models` endpoint returns HTTP 200 with no `Authorization` header at all, and even with a deliberately fake key. The test doesn't meaningfully validate anything. Not yet reported to production — pending approval.

**Net effect: the LLM-key blocker is resolved.** All suites that were only waiting on this (10 of the 11 previously-blocked suites) are now executable. `CRUX_AGENT_DEVOPS_AND_BUDGET.md` stays blocked regardless (separate infra gap, DevOps/Budget-Audit plugins not installed on this MCP instance). CRX-12 suite still needs `CRUX_REQUIRE_USER_KEY=1` + a second restricted test user.

## 2026-09-11 (later still) — real UI walkthrough via Playwright, second infra bug found+fixed, BUG-CRX-002 filed

User provided admin credentials (`admin`/`12345678` on `crux-redmine` localhost:3014) and asked for the OpenRouter setup to be verified through the actual UI, not just the API. Logged in and walked through it live:

- **TC-CRX-001 confirmed fully live**: bubble, greeting text, starter prompts, "Open full view" link, no stray top-menu entry, AND a real end-to-end chat exchange — asked "What are the agents working on?", got a genuine grounded reply (27 agents online, 11 gates across 6 real Work Packages, real `wp-` ids) with real model attribution (`anthropic/claude-haiku-4.5`, real token/cost usage `$0.0548 est.`). This is definitive proof chat is genuinely live end-to-end, not just at the API layer.
- **Second real infra bug found (not filed as a product bug — a documented, expected setup step that just hadn't been done):** the Crux plugin's "Crux core service URL" setting (Settings page, `/crux/admin/settings`) was still at its default `http://localhost:8787` — wrong for Docker, since `localhost` from inside the `crux-redmine` container means itself, not the `crux-core` container. This broke the dashboard entirely ("⚠ crux-core unreachable... Connection refused") and left "Chat agents" showing "No agents found". **Fixed via the UI** (TC-CRX-082): changed to `http://crux-core:8787`, saved, confirmed the agent roster populated immediately (26 agents) with no restart needed.
- **BUG-CRX-001 (Test Connection false positive) reproduced through the real UI**, not just curl — same `ok · 454ms` false-positive result on the actual Providers & Keys page. Confirms it's a genuine backend bug, not a raw-API-only artifact.
- **BUG-CRX-002 filed (Medium):** the Settings page's "Chat agents" picker shows persona descriptions for 6 of the 9 #117162-scoped agents (DevOps, Budget, Scrum, Time, Invoicing, Capacity) that explicitly claim read-only/never-writes behavior — directly contradicting their real `allowed_tools` CRUD capability already confirmed from source this session, and contradicting the dev's own live-sweep verification (e.g. Time Agent's text says "never approves one" while dev's sweep specifically exercised `timesheet approve`). Only QA Agent's text correctly reflects full CRUD; Sales/KB Agent's text is neutral. Looks like stale copy never updated when #117162's CRUD work landed on these 6.
- **Open bug count now 2** (BUG-CRX-001 High, BUG-CRX-002 Medium). Neither reported to production yet.

**All of Navigation & Permissions TC-CRX-001 and Agent Roster & Admin TC-CRX-078/082 now have CONFIRMED LIVE evidence recorded directly in their suite files.**

## Next Session Start Point

- **2026-09-11: full test case authoring complete** (138 TCs, 16 suites) — see `docs/CRUX_FEATURES_LIST.md` Suite Index. Dev reply received same day and Q1–Q3 answered; Q4–Q6 still pending (see section above) — do not treat the Permissions Matrix as confirmed.
- **Execute the 3 suites that need no environment fix first** (in this order): `CRUX_NAVIGATION_AND_PERMISSIONS.md` (TC-CRX-001–010), `CRUX_DASHBOARD_GRAPH_PIPELINE.md` (TC-CRX-062–069), `CRUX_AGENT_ROSTER_ADMIN.md` (TC-CRX-074–084 — TC-CRX-078 here is itself how the LLM-key gap gets fixed). Correct `CRUX_USER_GUIDE.md` immediately wherever a TC's real result contradicts the source-code-derived draft; leave the Permissions Matrix itself alone until Q4 lands from dev.
- TC-CRX-005/007/008 (Navigation suite) and several agent-CRUD TCs need extra test roles/users with specific permission combinations — create as part of execution, record in a future `automation/testdata/CRUX_TESTDATA_LOCAL.xlsx` once that's warranted.
- **LLM key blocker resolved 2026-09-11 (later same day)** — real chat confirmed working via OpenRouter. 10 of the 11 previously-blocked suites are now executable: Ask Crux Chat Core, Write Confirm Gate (now including TC-CRX-033/034 regression checks), Project Creation/Improve Wand, Chat Capabilities (rescoped — core-leg only), and 6 of the 9 per-agent CRUD suites (CRM, Workload, Agile, QA/Testcases, Timesheet, Invoice, KB — all have real seed data already per dev). Start execution with these next session. **`CRUX_AGENT_DEVOPS_AND_BUDGET.md` stays blocked regardless** — those two plugins aren't installed on this MCP instance at all; separate infra task, not ours to unblock. **Per-User Key CRX-12 suite stays blocked** on its own separate requirements below.
- CRX-12 suite additionally needs `CRUX_REQUIRE_USER_KEY=1` + a restarted stack + a second, restricted-privilege Redmine test user with their own API key.
- Follow up with dev on the 3 still-open items (Q4 role matrix, Q5 membership-design-intent, Q6 sign-off environment) and the 2 still-pending safety confirmations (safe test repo/branch for `trigger_build`, QA-controlled test email for `send_invoice`) if no reply has arrived by next session.

## Production Redmine (ztflux) linkage

- **Test Suite "Crux"** created 2026-09-11 on `flux.zehntech.com` project `ztflux` (id 122) — **production Test Suite ID 374**, top-level, no parent.
- **16 production testcases created 2026-09-11, one per local suite file** (not one per individual TC — 138 individual TCs would be too many production records). Each production testcase has the full suite `.md` file attached as-is; the local file remains the actual source of truth (steps, evidence, CONFIRMED LIVE markers). Mapping:

| Production Testcase # | Suite file | Local TC range |
|---|---|---|
| 120481 | CRUX_NAVIGATION_AND_PERMISSIONS.md | TC-CRX-001–010 |
| 120483 | CRUX_ASK_CRUX_CHAT_CORE.md | TC-CRX-011–021 |
| 120484 | CRUX_WRITE_CONFIRM_GATE.md | TC-CRX-025–034 |
| 120485 | CRUX_PER_USER_KEY_CRX12.md | TC-CRX-037–042 |
| 120486 | CRUX_PROJECT_CREATION_AND_IMPROVE_WAND.md | TC-CRX-043–052 |
| 120487 | CRUX_CHAT_CAPABILITIES_KEEP_SHARE_ARTIFACTS.md | TC-CRX-053–060 |
| 120488 | CRUX_DASHBOARD_GRAPH_PIPELINE.md | TC-CRX-062–069 |
| 120489 | CRUX_AGENT_ROSTER_ADMIN.md | TC-CRX-074–084 |
| 120490 | CRUX_AGENT_CRM_SALES.md | TC-CRX-085–092 |
| 120491 | CRUX_AGENT_WORKLOAD_CAPACITY.md | TC-CRX-093–100 |
| 120492 | CRUX_AGENT_DEVOPS_AND_BUDGET.md | TC-CRX-101–107 |
| 120493 | CRUX_AGENT_AGILE_SCRUM.md | TC-CRX-108–113 |
| 120494 | CRUX_AGENT_QA_TESTCASES.md | TC-CRX-114–120 |
| 120495 | CRUX_AGENT_TIMESHEET.md | TC-CRX-121–126 |
| 120496 | CRUX_AGENT_INVOICE_BILLING.md | TC-CRX-127–132 |
| 120497 | CRUX_AGENT_KNOWLEDGE_BASE.md | TC-CRX-133–138 |

All 16 are added to suite 374. **When a local suite file's evidence is updated (a TC executed, a bug filed, dev feedback incorporated), re-upload the updated `.md` as a new attachment on the matching production testcase** (`upload_file` + `update_testcase` with the new token) so production stays in sync with the local source of truth — the old attachment is not deleted automatically, so note in the testcase which attachment is current if this happens more than once.

## Source exploration pass before execution (2026-09-11)

Before starting live execution, did a full read of `redmineflux_crux`'s `config/routes.rb`, `init.rb`, and every controller in `app/controllers/` to check for missing/incorrect test coverage. Real findings, all now reflected in the suite files:

1. **TC-CRX-001 and TC-CRX-010 were factually wrong** — `lib/redmineflux_crux/hooks/view_hooks.rb` proves the Ask Crux bubble (+ Improve wand, mention-poll trigger, WP badge) IS server-side gated by `use_ask_crux || admin`, entirely absent from the DOM for unpermitted users — not "unconfirmed" or "not permission-gated" as originally drafted. Both TCs corrected in place; new TC-CRX-139 added to test this precisely (DOM-absence, not CSS-hidden).
2. **`view_crux` does NOT actually restrict the GLOBAL dashboard, pipeline board, or agent roster** — confirmed via controller code + explicit code comments ("any logged-in user can look"). Only the PROJECT-scoped tab/graph/runs genuinely enforce `view_crux` + membership (via Redmine's standard `authorize`). This directly contradicted the original TC-CRX-064 and the rationale in TC-CRX-068/076 — all three corrected. Added to `CRUX_REQUIREMENTS.md` Known Constraints as an architectural fact, and flagged as worth an explicit dev confirmation (not currently treated as a bug — the source comments call it deliberate).
3. **An entire feature had zero test coverage**: the Run Ledger "View All" pages (`/crux/runs`, `/projects/:id/crux/runs`) — added as TC-CRX-142/143 in `CRUX_DASHBOARD_GRAPH_PIPELINE.md`, plus TC-CRX-144 for the Crux project-module-disabled case (tab absence + direct-URL blocking).
4. **`crux/gate_evidence` was never tested independently** despite sharing the exact same permission gate as `approve_gate` — added TC-CRX-141.
5. **`crux_ask`'s dual authorization behavior** (page action → Redmine's own access-denied page; JSON actions → JSON 403) was untested — added TC-CRX-140.
6. **`crux_agents#retire` and `#upload` had zero coverage** despite requiring `manage_crux_agents` exactly like `create`/`pause`/`provision` — neither appears in `init.rb`'s visible permission-action list at all (enforced only via the controller's own `require_manage_agents`), a real risk of future drift since it's invisible in Administration → Roles. Added TC-CRX-145/146 in `CRUX_AGENT_ROSTER_ADMIN.md`, and corrected TC-CRX-076's rationale.

**Net new/changed:** 9 new TCs (139–146, spread across 3 suite files) + 5 corrected TCs (001, 010, 064, 068, 076). **Production testcases #120481, #120488, #120489 now have stale attachments** — re-upload the updated `.md` files to production before/while executing these suites (needs your approval, same as any production write).

## Production Test Run + defect reports (2026-09-11)

- **Run #569 "Crux QA Run 1"** created in `ztflux`, scoped to suite 374 only, all 16 testcases. Environment: Window 11 + Chrome (env id 6). Assignee: Sourabh Singh (user id 683). Start 2026-09-11, due 2026-09-18, state New. **Run type "Functional" could not be set via MCP** (no run_type param on `create_run`/`update_run`, and `list_run_types` needs admin access this API key doesn't have) — needs setting manually in the Redmine UI.
- **Both local bugs reported to production**, both linked to testcase **#120489** (CRUX_AGENT_ROSTER_ADMIN) in run #569, both marking that testcase **Failed**:
  - BUG-CRX-001 → production issue **#120514** (High)
  - BUG-CRX-002 → production issue **#120515** (Medium)
- Local bug files (`bugs/open/BUG-CRX-001.md`, `BUG-CRX-002.md`) and `bugs/_index.md` updated with the production issue IDs per CLAUDE.md §5.
- **Reminder for session end / bug closure:** per CLAUDE.md §5, when either bug is eventually closed locally (moved to `bugs/closed/`), the matching production issue must also be updated (status In QA → Done, % done → 100) — write-approval required, same as any other production change.

## Open Bugs Found

- **BUG-CRX-001** (High) — LLM provider "Test Connection" reports false-positive success regardless of key validity. `bugs/open/BUG-CRX-001.md`. Not yet reported to production.

## Run History

> One row per test run / regression pass. Replaces the old changelog.md.

| Date | Redmine Version | Environment | Tested By | Summary |
|------|-----------------|-------------|-----------|---------|
