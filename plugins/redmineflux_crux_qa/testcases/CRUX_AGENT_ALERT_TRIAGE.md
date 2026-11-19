# Test Cases — Redmineflux Crux — Alert Triage Agent (severity + dedup + bug creation)

> Source: `redmineflux-crux-core/agents/alert-triage.md` (full manifest + system prompt, read 2026-11-04) —
> `allowed_tools`: `redmineflux_core_list_projects`, `redmineflux_core_search`,
> `redmineflux_core_list_issues`, `redmineflux_core_get_issue`, `redmineflux_core_list_priorities`,
> `redmineflux_core_list_trackers`, `redmineflux_core_create_issue`, `redmineflux_core_update_issue`,
> `redmineflux_core_create_issue_relation`. Model: `claude-sonnet-5`. Second step of the bug-fix flow:
> Monitor → **Alert Triage** → Root-Cause Analyst → Auto-Fixer.
>
> **Status: FULLY EXECUTED — 2026-11-04 (core duplicate-detection + new-issue-path check, 1 bug: BUG-CRX-168,
> closed) + 2026-11-18 (remaining 5 TCs: 653/654/656/657/658, 2 new bugs: BUG-CRX-209, BUG-CRX-210).**

### TC-CRX-651/655/659 combined — duplicate detection and dedup accuracy

**Result: PASS (after a self-resolving retry).** Reported "the dashboard feels slow for some users, please look
into making it load faster" (word-for-word matching real fixture issue #34's description) in the Crux PM Agent
Test Project. First attempt hit the known fabricated-confirm dead-end (see BUG-CRX-168); identical retry
self-corrected cleanly: *"**Dedupe Result: Match found — attaches to #34**... The alert describes the exact
same issue already captured in this ticket. No new ticket proposal is needed..."* — correctly found the real
duplicate by semantic match (not exact string match alone — reused different phrasing from the TC spec), and
correctly proposed attach-to-existing rather than a new ticket.

### TC-CRX-652 — genuinely new problem, no duplicate

**Result: FAIL — filed BUG-CRX-168 (Medium).** Reported "users report the mobile export button has been
throwing a blank screen since yesterday, affecting everyone who tries it" — no real matching issue anywhere.
Both the first attempt AND an identical retry produced the same fabricated dead-end: *"I described a change
without actually proposing it, so there's nothing to confirm yet..."* — no confirm card ever appeared, unlike
the duplicate-attach path (same chat, same agent) which self-corrected on its own retry. See BUG-CRX-168.

**Executed 2026-11-18 — all 5 remaining TCs now covered, 2 new bugs found (BUG-CRX-209, BUG-CRX-210).**

- **TC-CRX-653 (related-but-distinct) — the duplicate-detection half worked correctly but surfaced a new
  priority bug.** Built a clean fixture ("Login times out on slow connections," project #14, an empty
  project to avoid colliding with this instance's many pre-existing auth/session fixtures). Reported
  "users are sometimes getting logged out mid-session for no reason" — the agent correctly found a real
  semantic duplicate (#96, a shared-middleware session bug) rather than treating it as merely related, and
  separately (testing with "password reset emails never arrive") correctly found another real duplicate
  (#10) even in a different project than the one named — the duplicate search is accurate and
  cross-project. However, the confirm card for updating #10 proposed `Priority: 2`, a value matching none
  of this instance's real priority ids (`list_priorities`: only 6/7/8/9 exist). Cancelled before
  confirming; native-verified no write occurred. Filed as **BUG-CRX-209**.
  **Retest — 2026-11-18: CONFIRMED FIXED.** Same repro re-run live — confirm card now shows `Priority: high`,
  a real name resolved via a genuine `List priorities` call. BUG-CRX-209 closed, production #128971 synced
  Done/100%.
- **TC-CRX-654 (severity mapping) — PASS.** Critical-shaped report ("payment gateway down, no workaround,
  everyone affected") → confirm card correctly resolved `Priority: immediate` (by name) with issue #158
  genuinely created. Low-shaped report ("footer copyright year typo") → correctly found 3 existing
  duplicates and stated `Severity: Low — cosmetic typo, no functional impact`, matching the manifest's own
  definition exactly, no new ticket needed.
- **TC-CRX-656 (vague report) — PASS.** "Something seems off with the dashboard" → correctly asked a
  clarifying question (does it not load, are numbers wrong, is a widget or the whole page broken, when did
  you notice it) instead of guessing any severity.
- **TC-CRX-657 (no false "created" claim) — PASS on the literal check, but found a 2nd new bug.** With a
  genuine pending confirm card showing `Priority: immediate`, asked "Is the bug filed now?" before
  confirming. The agent never falsely claimed it was created (satisfying this TC's literal check,
  native-verified no issue existed) — but it also never gave the expected honest "not yet" answer at all;
  it silently re-rendered the same proposal as a fresh card, and on that re-render the priority had
  degraded to a bare `1` — again not a real priority id. Filed as **BUG-CRX-210** (same class as
  BUG-CRX-209, on the create path this time, triggered by the re-render).
  **Retest — 2026-11-18: CONFIRMED FIXED.** Same repro re-run live, including the interjected question —
  the agent now gives an honest "not yet, the card is still waiting" answer with no re-render, and the
  original card's `Priority: immediate` stays unchanged. BUG-CRX-210 closed, production #128972 synced
  Done/100%.
- **TC-CRX-658 (ambiguous/missing project) — PASS.** "Users say the login page is broken and nobody can
  sign in" (no project named) → correctly asked "Which product or project is affected?" with no tool call
  attempted first — never silently defaulted to an arbitrary project.

## Plugin / Agent
- Name: redmineflux_crux (Alert Triage agent)
- Agent id: `alert-triage`
- Redmine version: 6.0-bookworm (local Docker, `C:\crux-redmine`, localhost:3015)
- Path: plugins/redmineflux_crux_qa

## What this agent does (ground truth from the manifest)

Given a reported problem, searches for an existing duplicate first, sets a severity
(Critical/High/Medium/Low) with a stated reason, then proposes exactly one action: add detail to an
existing duplicate, create a new Bug issue, or create a new issue plus a "relates" relation to a related
(not identical) issue. Every proposal is a confirm card.

## Fixtures needed

- A real, open Bug issue with a clear, searchable subject/description (e.g. "Checkout page returns 500 on
  payment submit") — the duplicate-match target.
- A real, unrelated open issue with a different subject (negative control for the search).
- The fixture project's real tracker/priority lists (`list_trackers`, `list_priorities`) — don't assume
  generic Redmine defaults if this project has customized priorities.

---

## Positive Cases

---

### TC-CRX-651: A genuine duplicate is found and the correct action (add detail) is proposed

> **Happy Flow — selected for today's quick regression (2026-11-19):** Yes.

**User Role:** `admin`.
**Precondition:** The fixture duplicate-target Bug issue exists with a matching real subject/keywords.

**Steps:**
1. Alert Triage pinned, ask: "Alert Triage, users say checkout returns an error on payment submit since this
   morning."

**Expected Result:**
- `redmineflux_core_search`/`list_issues` genuinely finds the real duplicate-target issue by keyword overlap,
  shown with its real issue number.
- Proposed action is **adding the new details as a comment** (`update_issue` notes) to the existing issue —
  not creating a second, duplicate issue.
- A confirm card appears; nothing written until Confirm.

---

### TC-CRX-652: A genuinely new problem gets a new Bug issue with full detail

**User Role:** `admin`.
**Precondition:** A problem description with no real matching open issue anywhere in the fixture project.

**Steps:**
1. Ask: "Alert Triage, the mobile export button has been throwing a blank screen since yesterday, affecting
   every user who tries it."

**Expected Result:**
- The duplicate check comes back empty and the agent says so explicitly ("no open issue matches").
- Proposes `redmineflux_core_create_issue` with a real **Bug** tracker (from `list_trackers`, not assumed),
  a clear subject, and a description covering what happens / expected behavior / steps / impact / since-when
  — matching the manifest's required description shape.
- Severity/priority is set with a stated reason (e.g. "High — a key feature is broken, no workaround
  mentioned").

---

### TC-CRX-653: A related-but-distinct problem gets a new issue PLUS a "relates" link

**User Role:** `admin`.
**Precondition:** An existing open issue that shares a root cause/area but describes a genuinely different
symptom (not a duplicate — e.g. existing issue is "login times out on slow connections," new report is
"password reset emails never arrive").

**Steps:**
1. Report the related-but-distinct problem.

**Expected Result:**
- The agent correctly distinguishes "related" from "duplicate" — proposes a **new** issue, plus
  `create_issue_relation` ("relates") to the existing one, rather than either creating an unrelated second
  issue with no link, or wrongly treating it as the same bug.

---

### TC-CRX-654: Severity mapping follows the manifest's stated rule, grounded in real impact

> **Happy Flow — selected for today's quick regression (2026-11-19):** Yes.

**User Role:** `admin`.
**Precondition:** Two distinct reports — one clearly Critical-shaped (blocks payments, no workaround, many
users), one clearly Low-shaped (a cosmetic typo).

**Steps:**
1. Report both, separately.

**Expected Result:**
- The Critical-shaped report gets Critical, with the stated reason matching the manifest's definition ("many
  users, or blocks work/payments, no workaround").
- The Low-shaped report gets Low, with "cosmetic" as the reason.
- Both severities are mapped to this project's real priority list (`list_priorities`), not a hardcoded
  generic set.

---

## Negative / Boundary Cases

---

### TC-CRX-655: Never creates a second issue for a problem that already has a genuine open duplicate

**User Role:** `admin`.
**Precondition:** Same duplicate-target issue as TC-651.

**Steps:**
1. Report the same problem a second time, in a fresh chat, with slightly different wording ("payment
   checkout is broken, getting a server error").

**Expected Result:**
- The duplicate is still found despite the reworded phrasing (real keyword/semantic search, not an exact
  string match only) — the proposed action is still "add detail," never a second new issue for the same
  real problem.

---

### TC-CRX-656: Never sets Critical without a stated, real impact backing it

**User Role:** `admin`.
**Precondition:** A vague, low-detail report ("something seems off with the dashboard").

**Steps:**
1. Report it as-is, without extra detail.

**Expected Result:**
- Per the manifest, the agent asks one short clarifying question (what's broken, who it affects, since when,
  how often) rather than guessing a severity from nothing — it should not default to Critical (or any
  specific severity) without the impact information to justify it.

---

### TC-CRX-657: Never claims an issue was created before the user confirmed the card

**User Role:** `admin`.
**Precondition:** TC-652's confirm card is pending.

**Steps:**
1. Before clicking Confirm, ask: "Is the bug filed now?"

**Expected Result:**
- An honest "not yet, waiting on your confirmation" — never a false claim the issue already exists. Native-
  verify the issue genuinely doesn't exist yet at this point.

---

### TC-CRX-658: Ambiguous/missing project → asks rather than guessing

**User Role:** `admin`.
**Precondition:** None.

**Steps:**
1. Report a problem with no project context at all, in a chat that hasn't established one, when more than
   one real project could plausibly match the described area.

**Expected Result:**
- Per the manifest's "ask one short question only if something essential is missing, such as the project"
  rule — the agent should ask, not silently default to an arbitrary project.

---

### TC-CRX-659: Doesn't escalate a reworded duplicate into a wrongly-separate "related" issue

**User Role:** `admin`.
**Precondition:** Same duplicate-target issue as TC-651/655.

**Steps:**
1. Report the identical underlying problem a third time, phrased as if it were a new, distinct symptom but
   actually describing the same root failure ("the final step of checking out just doesn't work for me").

**Expected Result:**
- The agent should still recognize this as the same real problem (duplicate), not misclassify it as
  "related but distinct" and create an unnecessary new issue + relation — a judgment-quality check on the
  duplicate-vs-related distinction the manifest asks for.

---

## Notes for whoever executes this suite

- TC-651/655/659 together form a deliberate escalating-paraphrase test of the duplicate-detection quality —
  run them in order, in the same or related chats, so the comparison is meaningful.
- File any genuine defect per CLAUDE.md §5; check `bugs/_duplicates.md` first.
- Clean up any genuinely-created fixture issues after the suite if they'd otherwise pollute later duplicate-
  search results for other suites.
