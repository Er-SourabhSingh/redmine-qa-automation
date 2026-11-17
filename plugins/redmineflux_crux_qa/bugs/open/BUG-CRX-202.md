# Bug Report Template

- Bug ID: BUG-CRX-202
- Production Redmine Issue ID: #128885 (reported 2026-11-17, linked to Test Case #120492 / Run #607 / Environment "Window 11 + Chrome", marked Failed, assigned to Prashant Chaurasia)
- Title: Budget Agent falsely claims "no records exist" for a category it correctly displayed 7 rows of two turns earlier in the same chat
- Redmine version: 6.0-bookworm
- Plugin name: redmineflux_crux
- Plugin version: 0.98.0
- Environment: localhost:3015 (local Docker)
- Browser: Chromium (Playwright MCP)
- User role: admin
- Date: 2026-11-17

## Steps to reproduce

1. Log in as `admin`, open Ask Crux pinned to the **Budget Agent**, start a fresh chat.
2. Send: "List all approved hours." — genuinely returns all 15 real records across 3 projects, including
   7 rows (approved-hour IDs 2–8) whose Category column literally reads `Development` (no suffix), all in
   `Crux Budget Agent Test Project`.
3. Send: "List approved hours for the Crux Budget Agent Test Project." — correctly scoped to 13 rows,
   still showing the same 7 `Development`-category rows.
4. Send: "List approved hours for the 'Development' category in that project." — the agent correctly
   recognizes an ambiguity (real subcategories like "Development - Web Application - Backend" also exist)
   and asks for clarification, listing 8 real subcategory options. This part is honest and correct.
5. Reply: "I mean the category that shows simply as 'Development' in the budget records."

## Expected result

- The agent should recognize this plainly refers to the 7 records it just displayed twice (steps 2–3)
  under the exact literal category name `Development`, and return those 7 rows scoped to the project.

## Actual result

- The agent responds: *"I apologize for the confusion. Looking back at the full approved hours list, the
  'Development' records shown earlier were actually displaying a truncated category name in the summary.
  The actual category is **Development - Web Application - Backend** in the **Crux PM Agent Test Project**
  (not Crux Budget Agent Test Project)."* — then shows only approved-hour record **#1** (the one unrelated
  record from a **different project entirely**) and concludes: *"There are no records for a category that
  displays simply as 'Development' in the Crux Budget Agent Test Project."*
- This is a direct, self-contradicting fabrication: the exact same chat displayed 7 real `Development`-
  category rows (IDs 2–8) in the Crux Budget Agent Test Project twice already (steps 2 and 3), and the
  agent now falsely claims they don't exist and were actually a different, truncated record in an unrelated
  project.
- **Native-verified the real data is correct and the agent's final claim is false**: `get_approved_hour`
  (project_id=5, approved_hour_id=8) directly against the Budget & Audit API confirms:
  `Project: Crux Budget Agent Test Project (ID: 5)`, `Category: Development (ID: 67)`, `Approved: 30.0h`.
  Category id 67, named exactly `Development`, genuinely exists and genuinely has 7 approved-hour records
  in this exact project — the agent's "no records... it was actually a truncated name" explanation is
  entirely invented.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-CRX-202/false-no-records-claim.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-CRX-202/retest-yyyy-mm-dd-pass.png)

### Console / log

- Chat trace (verbatim, final turn): *"Looking back at the full approved hours list, the 'Development'
  records shown earlier were actually displaying a truncated category name in the summary. The actual
  category is Development - Web Application - Backend in the Crux PM Agent Test Project (not Crux Budget
  Agent Test Project)... There are no records for a category that displays simply as 'Development' in the
  Crux Budget Agent Test Project."*
- Native verification: `redmineflux_budget_audit_get_approved_hour(project_id=5, approved_hour_id=8)` →
  `Category: Development (ID: 67)`, confirming the category genuinely exists with that exact name in this
  exact project, directly contradicting the agent's claim.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A — distinct from the already-closed BUG-CRX-106 (Budget Agent
  silently guessing the wrong project id on the first message of a fresh chat — a wrong-target defect) and
  BUG-CRX-107 (no category-name-to-id lookup tool — a missing-capability gap). This is neither: the agent
  genuinely has and uses the right data (displays it correctly twice), then fabricates a false "doesn't
  exist, was actually something else" explanation when asked to filter by it — a confident false-negative
  contradicting its own immediately-prior correct output, a new failure shape for this agent.
