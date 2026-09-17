# Per-Domain-Agent Chat Permission Matrix — Redmineflux Crux

> Scope: for each of the 9 #117162 domain agents, how a chat write/read request behaves under
> three tiers — **no relevant domain permission** (but `Use Ask Crux` granted), **with the
> relevant domain permission**, and **admin**. This is broader than
> `CRUX_NAVIGATION_AND_PERMISSIONS.md` (which covers the dashboard/agents/pipelines *pages*
> themselves) — this matrix is about each domain agent's own chat-level write actions.
>
> **Status: partially live-verified.** 2 of 9 agents were live-probed before the local stack's
> OpenRouter key ran out of credit (`HTTP 402 Payment Required`, confirmed persistent via retry,
> 2026-09-16). Per explicit user decision, the remaining 7 are documented from the domain agent's
> own `allowed_tools`/manifest (`redmineflux-crux-core/agents/<id>.md`) plus the KB rules in
> `CRUX_EXTERNAL_KB_NOTES.md`, **not live-confirmed** — marked clearly below. Live-verifying these
> 7 (and confirming the two ambiguous/ open questions below) is the next-session priority once the
> provider key is resolved.

---

## Fixture design (reusable, no new users needed)

The existing `luna.blossom` (Manager role) / `daisy.skye` (Reporter role) / `admin` fixtures
already cover this matrix with minimal setup, discovered via Administration → Roles →
**Permissions report** (2026-09-16):

- `luna.blossom` already holds **all 5 Crux permissions** + **full CRM permissions**, but
  **zero** Timesheet / Workload / Invoice / Knowledge Base / Testcase Management / Budget /
  DevOps permissions — she is a ready-made "no domain permission, but can chat" subject for 7 of
  the 9 agents with no setup.
- `daisy.skye` has zero permissions everywhere (the established baseline for
  `CRUX_NAVIGATION_AND_PERMISSIONS.md`) — granting her `Use Ask Crux` temporarily makes her the
  "no domain permission" subject for CRM (where `luna.blossom` already has full access) and
  Agile Board (which has no dedicated permission group at all — see below). **Revert this grant
  immediately after use** — several existing bug repros (BUG-CRX-012 etc.) rely on her staying at
  zero Crux permissions as a documented baseline. (Done and reverted this session.)
- "With permission" tier: grant the one specific missing permission to `luna.blossom`'s Manager
  role, probe, then leave granted or revert per what the next session needs.
- Admin: no setup, `admin` bypasses the permission system entirely.

## Important nuance surfaced this pass

`Use Ask Crux` (the Crux-level chat gate) and a domain plugin's own permission (e.g. CRM's
`Manage Deals`, Workload's `Manage teams and skills`) are **two independent gates**. A user can
have the first without the second — this is exactly what "no domain permission" means in this
matrix, and it's the normal, expected state for most real users (chat access is commonly broader
than full domain-write access). The interesting question per agent is: when a user has the first
but not the second, does the agent (a) honestly refuse at the real Redmine/plugin permission
layer, (b) silently succeed anyway (a security bug), or (c) fabricate a plausible-looking
success/failure without ever really checking (a different, deception-class bug)?

---

## 1. Time Agent (Timesheet) — LIVE-VERIFIED, inconclusive

**No-permission tier** (`luna.blossom`, lacks `Manage timesheet`): `Time Agent, show me the
approval dashboard for pending timesheets.` → real tool call (`redmineflux_timesheet_approval_dashboard`),
returned "There are currently no timesheets pending your approval."

**Open question, not resolved this pass:** this local Redmine instance has **no timesheet data at
all** yet (no submissions ever created here), so an empty result is consistent with either (a) a
correctly-scoped, genuinely-empty read, or (b) the tool not checking `Manage Timesheet` at all and
just returning an empty result set regardless. **Cannot tell which from this probe alone** — needs
a real fixture (a submitted timesheet from a different user) before/after granting `Manage
Timesheet` to `luna.blossom`, to see whether the *same* submission becomes visible only after the
grant. Flagged as the top candidate for `testcase-gap-writer` + live follow-up once OpenRouter is
back.

**With-permission / Admin tiers:** not probed (blocked by the 402 before reaching them).

---

## 2. Capacity Agent (Workload) — LIVE-VERIFIED, real bug evidence found

**No-permission tier** (`luna.blossom`, lacks `manage_rf_teams`): `Capacity Agent, create a team
called "Permission Matrix Test Team".` → proposal rendered (pre-confirm has no permission check,
expected), Confirm clicked → **honestly refused**: `"✓ Access denied: Requires 'manage_rf_teams'
permission or admin. Ask your Redmine administrator to grant the Manage Workload role."` Real
enforcement held — no team was created. **But** the refusal is prefixed with the same green "✓"
used for genuine successes (screenshot-confirmed) — this is the same root-cause defect
`BUG-CRX-018` already documents (see that bug's 2026-09-16 supplementary-evidence entry), now
confirmed to fire on a *permission*-denial path too, not just the ID-contract 404 it was
originally found on. Not filed as a new bug — folded into BUG-CRX-018 as broader evidence.

**With-permission / Admin tiers:** not probed (blocked by the 402 immediately after).

---

## 3–9. Remaining 7 agents — NOT LIVE-VERIFIED, documented from manifest + KB only

Everything below is the *expected* behavior per each agent's own `allowed_tools` file and the
corresponding KB page — **not yet confirmed live**. Each row states the specific permission
boundary to probe and the exact fixture-ready probe to run once OpenRouter is restored.

| Agent | Domain permission to test | No-perm subject (ready now) | Probe (no setup beyond login) | What "with-permission" needs |
|---|---|---|---|---|
| **Sales Agent** (CRM) | (`luna.blossom` already has full CRM — use `daisy.skye` + temp `Use Ask Crux` for no-perm) | `daisy.skye` (temp-grant `Use Ask Crux`, revert after) | "Sales Agent, show me the CRM pipeline." | None — `luna.blossom` already has it |
| **Invoicing Agent** (Invoice) | `View invoices` / `Manage invoices` | `luna.blossom` | "Invoicing Agent, show me the invoice dashboard for crux-qa." (got this far live before the 402 hit — proposal-stage not yet reached) | Grant `View invoices`+`Manage invoices` to Manager role |
| **KB Agent** (Knowledge Base) | `Manage knowledgebase spaces`/`content` | `luna.blossom` | "KB Agent, create a page called 'Permission Matrix Test' in [space]." (needs an existing space first — check `list_spaces` as admin first) | Grant `Manage knowledgebase content` |
| **QA Agent** (Testcase Mgmt) | `Create run` (or similar) | `luna.blossom` | "QA Agent, create a test run called 'Permission Matrix Test'." | Grant `Create Run` |
| **Scrum Agent** (Agile Board) | No dedicated permission group — relies on core `Edit issues` | `daisy.skye` (has `Add issues` but not `Edit issues`) | "Scrum Agent, move card #[id] to a different column." | `luna.blossom` already has `Edit issues` (Manager role) |
| **DevOps Agent** | `Trigger builds` (currently `0` for every role incl. Manager — only admin bypass) | `luna.blossom` | "DevOps Agent, trigger a build for [repo/branch]." — expect this to surface either a permission refusal OR the pre-existing "no safe test repo" infra blocker (TC-CRX-102) — the two need to be told apart, which is exactly why this probe matters | Grant `Trigger builds` to Manager role |
| **Budget Agent** (Budget/Audit) | `Manage approved hours` (currently `0` for every role incl. Manager) | `luna.blossom` | "Budget Agent, set the budget cap for crux-qa to $10,000." | Grant `Manage approved hours` to Manager role |

---

## Cleanup performed this session

- `daisy.skye`'s temporary `Use Ask Crux` grant (added for the planned CRM no-permission probe,
  never used due to the 402) was **reverted** before session end — confirmed via the Permissions
  report (`Use Ask Crux` row: Manager=true, Developer/Reporter/AI Agent/Non member=false).
- No fixture data was left behind — the one write attempt (`Permission Matrix Test Team`) was
  genuinely refused, no team exists.

## Next session priority

1. Resolve the OpenRouter 402 (top up, or switch provider — user declined both this session,
   chose to stop live probing instead).
2. Re-run the Time Agent probe with a real timesheet-submission fixture to resolve the open
   question above (genuine permission-scoping vs. an unscoped empty read).
3. Complete the 7 remaining agents' live matrix per the table above.
4. Feed all live-confirmed findings (plus the already-written `CRUX_EXTERNAL_KB_NOTES.md` gaps)
   into `testcase-gap-writer` for the final TC drafts.
