# Bug Report Template

- Bug ID: BUG-CRX-003
- Production Redmine Issue ID: #120574 (ztflux, flux.zehntech.com — reported 2026-09-14, linked to testcase #120481 in run #569 "Crux QA Run 1")
- Title: Global-dashboard gate approval (`approve_gate`/`gate_evidence`) has no project-scoping logic at all — now confirmed live against a real cross-project Work Package (2026-09-15), not just code-level
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux
- Plugin version: 0.39.0 (plugin) / crux-core 0.92.0
- Environment: Local — `http://localhost:3014`, crux-core `http://localhost:8787`
- Browser: Chromium (Playwright MCP)
- User role: `luna.blossom` — member of the `crux-qa` project only (role "Manager", which grants `approve_crux_gates`)
- Date: 2026-09-14

## Steps to reproduce

1. Read `CruxDashboardController#authorize_gate_approval` (`app/controllers/crux_dashboard_controller.rb`): `return if User.current.admin? || User.current.allowed_to_globally?(:approve_crux_gates)`. No `@project`, `find_project`, or any per-project lookup exists anywhere in this controller.
2. As a live demo: log in as a user who is a member of exactly one project, with a role granting `approve_crux_gates` there (e.g. `luna.blossom`, member of `crux-qa` only). Open the global dashboard (`/crux`) and approve a pending gate on any Work Package shown there (e.g. `wp-013`'s `send-approve`).

## Expected result

- Per `init.rb`, `approve_crux_gates` is declared `require: :member`, which implies gate approval should require the approver to be a member of the specific project the gate's Work Package belongs to — not just hold the permission via membership somewhere else. If the WP is tied to a real project the user isn't a member of, the action should be refused (403).

## Actual result

- The approval **succeeds unconditionally** — confirmed live: `luna.blossom` successfully approved `wp-013`'s `send-approve` gate; the dashboard toast confirmed "gate 'send-approve' approved by luna.blossom" and the pipeline advanced.
- **Important correction (2026-09-14, caught on review):** the initial write-up of this bug implied a genuine cross-project data/access leak (i.e. "user has no relationship to project X, but was still allowed to act on X's data"). Following up on that framing, I checked whether `wp-013`'s issue (`#999004`) — or any of the other dashboard Work Packages' referenced issues (`#12`, `#34`, checked directly) — actually exist as real Redmine records on this instance: **all return `404`**. None of the dashboard's seeded Work Packages correspond to real Redmine issues/projects on this specific environment; they're crux-core's own internal demo data, disconnected from real Redmine records here.
- **What this bug actually is, precisely stated:** the controller performs **zero project-scoping** before authorizing a gate approval — a code-level fact, confirmed by reading the source, independent of any specific WP. The live test proves the check is genuinely global (`allowed_to_globally?`, not a per-project `authorize`), but it does **not** prove a real cross-project leak, since the WP tested against has no real project attached at all. A live demonstration against a WP tied to a genuinely real Redmine project (one the approving user is provably not a member of) has not been done on this environment, because no such linkage currently exists in the seed data here. Treat the finding as "no project-scoping exists in this code path" rather than "cross-project approval was demonstrated with real data."
- This is still worth dev triage as a real behavioral gap between the permission's declared scoping intent (`require: :member`) and its actual runtime enforcement, for a sensitive **write** action — not a read-only view like the already-confirmed-by-design global dashboard visibility (TC-CRX-064/068/142). Given CRX-9/CRX-35's stated design goal is that "no agent write executes without deliberate human confirmation," a controller with no project-scoping at all would weaken that guarantee **if** a WP were ever tied to a real project — worth confirming with dev whether that linkage is expected to exist in a real deployment (unlike this local demo environment).

## Evidence

### Screenshot

Not captured — no UI rendering defect, this is a permission-logic finding confirmed via the dashboard's own toast/state change (see steps above). Screenshot can be added if requested.

### Console / log

- Dashboard toast text: `gate 'send-approve' approved by luna.blossom`
- Pipeline cell updated from `🚦 send-approve` to `✓ send-approve` (attributed to `luna.blossom`) with `collect-approve` now the active gate.
- `GET /issues/999004`, `/issues/12`, `/issues/34` (direct navigation, admin session) → all `404 Not Found` on this Redmine instance — confirms none of the dashboard's seeded WPs map to real records here.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## 2026-09-15 update — live-confirmed against a real cross-project Work Package (TC-CRX-029)

The original finding (above) was correctly caveated as "code-confirmed only" because every seeded WP on this environment mapped to synthetic/nonexistent issues. During `CRUX_WRITE_CONFIRM_GATE.md` execution, a genuine test WP was created via `POST /api/workpackage` bound to **issue #1**, a real issue in the **`crux-qa-private`** project — a project `luna.blossom` is confirmed NOT a member of (only a member of `crux-qa`; `crux-qa-private` was built in an earlier session specifically as the non-member-isolation fixture).

- Created `wp-crx029` (`{"id": "wp-crx029", "members": [1], "autonomy": "execute-with-approval", ...}`), confirmed via `GET /api/workpackages` to genuinely bind to real issue #1 in `crux-qa-private`.
- As `luna.blossom`, on the real `/crux` dashboard UI, clicked "approve" on `wp-crx029`'s `requirements-approve` gate. A real confirm dialog appeared ("Approve gate 'requirements-approve' for WP #wp-crx029?") — clicked Approve.
- **The approval succeeded unconditionally**, despite `luna.blossom` having zero membership or role in `crux-qa-private`. Verified via a direct re-read of `GET /api/workpackages`: `"approved_by": "luna.blossom", "approved_at": "2026-09-15T08:48:23+00:00"` — a real, attributed, persisted approval.
- This removes the previous caveat entirely: this is now a live-demonstrated cross-project gate-approval bypass against real Redmine project-membership data, not just a source-code reading. Severity should be reconsidered as **High** (from Medium) given this directly contradicts `init.rb`'s declared `require: :member` intent using real project-isolation data, not synthetic WPs.
- **Communicated to production 2026-09-15** — posted as a follow-up comment on #120574, priority raised Medium → High via `update_issue`.

## 2026-09-15 (same day) — dev already closed this as intentional BEFORE my comment landed; unresolved dispute, flagged, no further production action taken

Reading the issue back after posting confirmed it already had prior activity I hadn't seen: **Prashant Chaurasia investigated on 2026-09-15T07:15:20Z** (before my follow-up comment), checked `GET /api/dashboard` on the production instance, and found **zero project-ish keys across all 10 live Work Packages** there — concluding *"a Work Package in this system has no Redmine-project affiliation at all... 'per-project membership scoping' isn't an unimplemented feature — it's not a coherent check that could exist given the current data model."* He added a permanent code comment recording this and pushed commit `bb85499` (repo `redmineflux-crux-plugin`, branch `master`). Issue status is now **In QA**, no functional code change made.

**This conflicts with what was just demonstrated locally, and with the codebase's own precedent:**
- The local test WP (`wp-crx029`) genuinely had a `members: [1]` field naming a real Redmine issue — so at least on this local build, a WP *can* carry a real issue linkage.
- `redmineflux-crux-core/crux_core/askcrux/proposals.py`'s `_frozen_target()` (the function backing TC-CRX-031's frozen-rule check) **already resolves a project from a member issue**: `match = redmine.issues_by_ids([iid])[0]`, `project: match.get("project")`. This is the exact capability Prashant's investigation says doesn't exist — it's just never wired into gate-approval's authorization check specifically.
- Prashant's investigation checked production's *current live data* (which may simply not have any issue-linked WPs today) rather than the underlying code's *capability* to derive a project when a WP does have member issues, which is exactly what my local WP demonstrated.

**Status: unresolved, deliberately not escalated further this session.** Presented this conflict to the user; explicit instruction was to flag it only and make no further production writes on #120574 this session (no rebuttal comment posted, no reopen attempted). Leaving the production issue exactly as dev closed it (In QA, "intentional design") until the user or a future session decides how to proceed — possibly with dev, pointing specifically at `_frozen_target()` as the counter-evidence.

## 2026-09-16 retest — FIXED, confirmed live

Dev's `CHANGES.md` handoff added real per-project scoping to `authorize_gate_approval` in `crux_dashboard_controller.rb`: it now resolves the WP's member issues' project(s) via `Issue.where(id: member_issue_ids).distinct.pluck(:project_id)` and requires `approve_crux_gates` in every one of those projects (falling back to the honest global check only when a WP has no resolvable member issues).

**Retest steps:**
1. Restarted `crux-redmine`/`mcp`/`crux-core` to load the dev's updated files (separate session task — see `CRUX_HANDOFF.md`). Verified real LLM chat working post-restart.
2. Since crux-core's Work Package state is in-memory and was lost on restart, recreated the exact scenario live: as admin, via Ask Crux chat ("PM, start the Bug fix pipeline work package for issue #1"), created `wp-001` bound to real issue #1 (`PRIVATE-MARKER-7f3a`, project `crux-qa-private`) — confirmed via the chat's own "Tickets: #1" proposal table before confirming.
3. Logged out of admin, logged in as `luna.blossom` (member of `crux-qa` only, NOT a member of `crux-qa-private`).
4. On the real `/crux` dashboard, clicked "approve" on `wp-001`'s `fix-approve` gate, then clicked "Approve" in the resulting confirm dialog.

**Result:** Both the evidence fetch (`GET /crux/gate_evidence`) and the approval POST (`POST /crux/gate`) returned `403 Forbidden`. The dialog surfaced a clear, correct, user-facing message: **"⚠ approval requires the approve_crux_gates permission in the project(s) this work package touches"**. The gate remained unapproved — pipeline stage stayed at `reproduce`, `🚦 fix-approve` still shows the unapproved icon. This is the exact opposite of the original bug's outcome (unconditional silent success).

**Verdict: FIXED.** Retested against the original scope only (per `[[feedback_retest_verdict_against_original_scope]]`) — the admin-bypass path (`return if User.current.admin?`) was not separately re-verified live this session but is an unchanged, pre-existing, intentional code path, not part of the original defect. Recommend closing BUG-CRX-003 / production #120574, pending user approval for the production status update.

## Note for triage

This may be an intentional design choice (consistent with the global dashboard's other "any logged-in/any-permission-holder" scoping — see `docs/CRUX_HANDOFF.md`), in which case `init.rb`'s `require: :member` comment/declaration is misleading rather than the runtime being wrong. **Additionally, and more importantly:** since none of this environment's seeded Work Packages map to real Redmine issues, this finding could not be live-tested against genuine cross-project data — it rests on the controller source showing zero project-scoping logic, not on an observed real-world leak. Ask the dev specifically: (1) is a WP always expected to map to a real Redmine issue/project in production usage, and (2) if so, should `approve_gate`/`gate_evidence` resolve that issue's project and check membership there, the way `CruxProjectController`'s project-scoped actions already do (confirmed pattern, see `CRUX_DASHBOARD_GRAPH_PIPELINE.md` TC-CRX-143). Ideally re-tested against a real project-linked WP first if one becomes available.

Reported to production 2026-09-14 as issue **#120574** in `ztflux`, via `redmineflux_testcases_management_report_defect` (user approval obtained). Linked to testcase #120481, Run #569 "Crux QA Run 1", Environment "Window 11 + Chrome". Testcase #120481 marked Failed. This bug MD file attached to #120574 (2026-09-14, via `upload_file` + `update_issue`).

Assigned to **Prashant Chaurasia** (user id 410) on production, 2026-09-15.
