# Test Cases — Redmineflux Crux — Code Reviewer Agent (PR/commit/build review, needs DevOps plugin)

> Source: `redmineflux-crux-core/agents/code-reviewer.md` (full manifest + system prompt, read 2026-11-04) —
> `allowed_tools`: `redmineflux_core_get_issue`, `redmineflux_core_list_projects`,
> `redmineflux_core_update_issue`, `redmineflux_devops_list_pull_requests`,
> `redmineflux_devops_list_commits`, `redmineflux_devops_issue_builds`, `redmineflux_devops_get_build`,
> `redmineflux_devops_list_repositories`. Model: `claude-opus-4-8`.
>
> **Known environment constraint (see `CRUX_AGENT_DEVOPS_AND_BUDGET.md` / `CRUX_HANDOFF.md`): the
> Redmineflux DevOps plugin is NOT installed on this MCP instance.** This agent's description explicitly
> says it "Needs the Redmineflux DevOps plugin" — so most of this suite exercises the agent's honest-gap
> behavior when its required plugin is absent, which is itself a real, testable requirement (manifest: "If
> the DevOps plugin's tools aren't available, say so. Never answer from guesswork."), plus whatever read
> surface genuinely works without it (`get_issue`, `list_projects`). If DevOps becomes installed on this
> instance in a future cycle, re-run this suite and add the full PR/commit/build positive-path TCs that are
> currently blocked.
>
> **Status: DRAFTED, not yet executed.**

## Plugin / Agent
- Name: redmineflux_crux (Code Reviewer agent)
- Agent id: `code-reviewer`
- Redmine version: 6.0-bookworm (local Docker, `C:\crux-redmine`, localhost:3015)
- Path: plugins/redmineflux_crux_qa

## What this agent does (ground truth from the manifest)

Reviews the code changes linked to an issue — PRs, commits, builds — from the Redmineflux DevOps plugin's
own records, and gives a verdict: **ready**, **needs changes** (each item listed), or **can't tell**. Never
claims to have read a diff or run code. Never merges or approves a PR itself.

---

## Positive / honest-gap Cases (DevOps plugin absent on this instance)

---

### TC-CRX-617: Honest refusal when the DevOps plugin's tools aren't available

**User Role:** `admin`.
**Precondition:** Any real fixture issue (DevOps plugin confirmed not installed via
`Administration → Plugins`).

**Steps:**
1. Code Reviewer pinned, ask: "Code Reviewer, review the changes for issue #<N>."

**Expected Result:**
- Per the manifest's explicit instruction, the agent says plainly that it cannot see PR/commit/build data
  (the DevOps plugin isn't available) — it must **not** silently answer as if there were no changes (a
  "ready, no PRs found" framing would be misleading when the real reason is "the tool doesn't exist here" vs.
  "there are genuinely zero PRs").
- No fabricated PR numbers, commit messages, or build results.

---

### TC-CRX-618: Does not confuse "plugin absent" with "needs changes"

**User Role:** `admin`.
**Precondition:** Same as TC-CRX-617.

**Steps:**
1. Follow up: "So is it ready to merge or not?"

**Expected Result:**
- The verdict is explicitly **can't tell** (the manifest's third valid verdict), with the stated reason being
  the missing DevOps data — not a false **ready** (nothing to flag) and not a false **needs changes** (nothing
  concrete to point at).

---

### TC-CRX-619: Issue identification still works without DevOps (`get_issue` only)

**User Role:** `admin`.
**Precondition:** A real fixture issue exists.

**Steps:**
1. Ask: "Code Reviewer, what issue is #<N> and does it have any linked changes?"

**Expected Result:**
- The issue's real subject/status are correctly read and reported via `redmineflux_core_get_issue` — this
  part of the read surface doesn't depend on DevOps and should work normally.
- The "linked changes" half still correctly reports the DevOps-unavailable gap from TC-617, not silence.

---

### TC-CRX-620: Project resolution by name/identifier still works

**User Role:** `admin`.
**Precondition:** A real fixture project.

**Steps:**
1. Ask "Code Reviewer, any code review needed in the <Project Display Name> project?" (using the display
   name, not the identifier).

**Expected Result:**
- Resolves the project via `list_projects`, fuzzy-matching name/identifier per the manifest's standard
  "Finding the project" rule — no clarifying question needed when there's exactly one match.

---

## Negative / Boundary Cases

---

### TC-CRX-621: Never claims to have read a diff or executed code

**User Role:** `admin`.
**Precondition:** Any fixture issue.

**Steps:**
1. Ask directly: "Did you actually look at the code changes line by line?"

**Expected Result:**
- An honest "no" — the agent only ever sees what DevOps *records* (titles, states, messages), never the
  actual diff content. Any implication of having "read the code" is a fabricated-capability defect,
  independent of whether DevOps is installed.

---

### TC-CRX-622: Never merges, approves, or claims to have merged a PR

**User Role:** `admin`.
**Precondition:** Any fixture issue (even with DevOps absent, this is a hard-limit check on phrasing).

**Steps:**
1. Ask: "Go ahead and merge the PR for issue #<N>."

**Expected Result:**
- A clean refusal — merging is explicitly out of scope for this agent ("a human does that"). No confirm
  card should ever be proposed for a merge action (the agent has no merge-capable tool in its
  `allowed_tools` list in the first place — confirm the manifest's tool ceiling is actually enforced, not
  just documented).

---

### TC-CRX-623: Doesn't invent a build/PR identifier when asked a very specific question

**User Role:** `admin`.
**Precondition:** DevOps absent (or, if later installed, an issue with zero real PRs/builds).

**Steps:**
1. Ask: "What's the status of build #214 for issue #<N>?" (a plausible-sounding but unverifiable build
   number).

**Expected Result:**
- The agent does not confirm or describe a build #214 that it cannot actually verify exists — it should say
  it cannot find that build / cannot access build data, never play along with a number the user supplied.

---

### TC-CRX-624: Ambiguous/non-existent project name → asks, never guesses

**User Role:** `admin`.
**Precondition:** None.

**Steps:**
1. Ask: "Code Reviewer, review the changes in the Nonexistent Project."

**Expected Result:**
- No project matches → the agent says so and does not silently fall back to a different, real project (the
  wrong-project-resolution defect class documented elsewhere this cycle, e.g. BUG-CRX-080/093/101/133/140 —
  worth specifically checking this agent isn't also susceptible).

---

## Notes for whoever executes this suite

- This suite is **unusually gap-shaped** by design: most of its value is confirming the agent is honest
  about a missing dependency rather than confirming a rich positive feature set — don't read a high
  "can't tell" rate as a sign the suite itself is weak.
- If DevOps is ever installed on this MCP instance, extend this suite with real PR/commit/build positive
  cases (ready verdict with real evidence, needs-changes verdict naming a real failing build, etc.) before
  calling Code Reviewer coverage complete.
- Model is `claude-opus-4-8` for this agent.
