# Bug Report Template

- Bug ID: BUG-CRX-109
- Production Redmine Issue ID: #126474
- Title: Auto-mode routing silently misroutes ambiguously-phrased Budget questions to Project Manager instead of Budget Agent — 2/2 reproduced
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Auto-mode routing)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-10-30

## Steps to reproduce

1. Fresh chat, Crux mode set to **Auto** (not pinned to any specific agent).
2. Ask a Budget/Audit-domain question phrased without the words "budget," "approved," or "hours":
   - Attempt 1: *"Is the Development category in project ID 5 over its limit right now?"*
   - Attempt 2 (fresh chat): *"How's project 5's spending looking lately? Is it under control?"*
3. Observe which agent answers (shown via the agent avatar/name in the response).

## Expected result

Per this repo's established baseline for Auto-mode routing on this plugin (Scrum Agent, TC-CRX-397, PASS —
2 ambiguous phrasings both correctly routed to Scrum Agent, no misroute), ambiguously-phrased budget/spend
questions about a category's cap or a project's spending should route to the **Budget Agent**, which already
has the exact data cached and can answer immediately and accurately (confirmed working correctly in the same
test session via a control question with the word "budget" explicitly — the Budget Agent answered with full
Approved/Spent/Remaining/Over-Budget detail per category, matching DB exactly).

## Actual result

**Both attempts silently misrouted to Project Manager, not Budget Agent — 2/2 reproduction.**

- **Control (routes correctly):** "What's the approved budget status for project ID 5?" → routed to
  **Budget Agent**, answered immediately and accurately: `Total approved: 82.0h`, `Total spent: 103.0h`,
  `Total remaining: -21.0h`, full per-category breakdown including the correct over-budget flag on
  "Development."
- **Attempt 1 (misroute):** "Is the Development category in project ID 5 over its limit right now?" →
  routed to **Project Manager**, which correctly explained it doesn't know of any "limit" concept on issue
  categories and asked the user to clarify whether they meant workload capacity, a custom field, or
  "Time/budget tracking" — an honest non-answer, not a fabrication, but the wrong agent entirely: a direct
  answer was one tool call away via the Budget Agent, which this question is squarely about.
- **Attempt 2 (misroute):** "How's project 5's spending looking lately? Is it under control?" → again routed
  to **Project Manager**, which used core time-entry tools to list the 4 raw time entries (103h total) and
  then correctly admitted *"Without knowing the project's budget cap or approved allocation, I can't say
  whether this is 'under control'..."* — again an honest admission of its own limitation, but never handed
  off to or even mentioned the Budget Agent, which could have answered the actual question directly and
  accurately in one call (as the control question proves).

Unlike the Scrum Agent (TC-CRX-397, no misroute found on 2 similarly ambiguous phrasings), the Budget Agent
domain genuinely does exhibit the Auto-mode misrouting defect class already confirmed on the QA Agent/Test
Case Management domain (BUG-CRX-094) and the CRM/Sales Agent domain (BUG-CRX-096) — both of which also
misrouted ambiguous phrasing to Project Manager. In this instance, Project Manager's own responses are
honest (it never fabricates budget data or falsely claims no budget tooling exists) rather than a false
denial or wrong-data fabrication — a milder failure mode than BUG-CRX-094/096's — but it still means a real
user asking a natural, unprefixed budget question in Auto mode gets a useless or partial answer and must
either rephrase with an explicit "budget" keyword or manually pin the Budget Agent to get a real answer.

## Evidence

### Console / log

- Control question (routes correctly): *"Budget Agent ... Project ID 5 Budget Status Summary: Project Crux
  Budget Agent Test Project is currently over budget by 21 hours. Overall: Total approved: 82.0h, Total
  spent: 103.0h, Total remaining: -21.0h ..."*
- Attempt 1 (misroute): *"Project Manager ... I can see there is a 'Development' category (id=67) in project
  5. However, issue categories in Redmineflux don't have capacity limits or thresholds ... Could you clarify
  what you mean by 'over its limit'? ... Time/budget tracking on Development work?"*
- Attempt 2 (misroute): *"Project Manager ... Project 5 (Crux Budget Agent Test Project) has 103.0 hours
  logged so far across 4 time entries: 50h on #17 ..., 1h on #17 ..., 50h on #18 ..., 2h on #18 ... Without
  knowing the project's budget cap or approved allocation, I can't say whether this is 'under control' ..."*

## Duplicate check

- Duplicate found: No new root cause — same defect class and shape as **BUG-CRX-094** (QA Agent/Test Case
  Management Auto-routing) and **BUG-CRX-096** (CRM/Sales Agent Auto-routing), both already filed and
  reported to production. This is the first confirmed instance on the **Budget Agent/Budget & Audit
  domain**. Contrasts with the Scrum Agent (TC-CRX-397), where the identical style of test found no
  misrouting — so this is domain-specific, not a universal Auto-mode failure.
