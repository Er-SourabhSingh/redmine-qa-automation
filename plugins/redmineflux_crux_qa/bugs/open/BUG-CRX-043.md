# Bug Report Template

- Bug ID: BUG-CRX-043
- Production Redmine Issue ID: #121819
- Title: Sales Agent's `update_deal_stage` always fails with "Stage cannot be blank" on confirm — MCP tool sends `{"crm_deal": {"stage": ...}}` (nested) but the Rails `update_stage` API action reads `params[:stage]` (flat, top-level), so the real stage value never reaches the controller
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux (Sales Agent, CRM plugin domain) / redmineflux_crm (API controller)
- Plugin version: crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP)
- User role: `admin`
- Date: 2026-10-01

## Steps to reproduce

1. In an Ask Crux chat session, create a real deal (e.g. "CRM, create a deal called BUG-013 Retest 1001 worth $5000 at stage Qualified." → confirm → real deal created).
2. In the same or a fresh session, ask the Sales Agent to move that deal to a different valid stage: "CRM, move the [deal name / deal ID] deal to the Proposal stage."
3. Observe the proposal — a genuine `Crm Update Deal Stage` confirm card is produced, correctly showing the target Stage value (e.g. "Proposal").
4. Click Confirm.
5. Observe the failure.

## Expected result

- Per the Sales Agent's documented `update_deal_stage` capability, confirming a correctly-rendered stage-change proposal should actually update the deal's stage and return a success message — the value shown in the proposal (e.g. "Proposal") is exactly what should be written.

## Actual result

- Confirming always fails with: *"Validation error: Stage cannot be blank. Correct the value(s) above and try again."* — despite the proposal table explicitly showing the correct, non-blank target Stage value.
- Verified via native `/deals` page both times: the deal's real stage is unchanged (still "Qualified") — no silent write, no data corruption, just a hard failure.
- Reproduced 2/2 (100%) across two independent chat sessions and two different deals (deal ID 3 during BUG-CRX-013's original 2026-09-28 retest, and deal ID 6 during this 2026-10-01 retest) — not a one-off glitch.

### Root cause (confirmed via source inspection)

- `redmineflux-mcp/src/tools/crm.py`, function `redmineflux_crm_update_deal_stage`, sends:
  ```python
  deal_stage_data: dict[str, Any] = {"stage": stage}
  if lost_reason:
      deal_stage_data["lost_reason"] = lost_reason
  result = await client.put(
      f"/api/deals/{deal_id}/update_stage.json",
      json={"crm_deal": deal_stage_data},
  )
  ```
  i.e. the body is `{"crm_deal": {"stage": "Proposal"}}` — **nested** under `crm_deal`. An inline comment attributes this nesting to a *different*, prior bug: `# BUG-CRM-011: plugin expects {'crm_deal': {'stage':..., 'lost_reason':...}}`.
- `redmineflux_crm/app/controllers/api/deals_controller.rb`, action `update_stage` (lines ~132-146), reads the value as:
  ```ruby
  def update_stage
    new_stage = params[:stage].to_s.strip
    ...
    if @deal.update(stage: new_stage)
  ```
  This is a **flat, top-level** `params[:stage]` lookup — not `params[:crm_deal][:stage]`. This is asymmetric with the sibling `update` action in the same controller, which correctly uses `deal_params` → `params.require(:crm_deal).permit(*permitted)` (nested, matching what the MCP tool sends for *that* endpoint).
- Net effect: the MCP tool's nested payload never reaches `update_stage`'s flat lookup. `params[:stage]` is always `nil` → `.to_s.strip` → `""` → fails the model's presence validation with "Stage cannot be blank" — even though the MCP tool, the proposal UI, and the user's intent all correctly carried a real, non-blank stage value the entire time.
- Fix is on one side or the other: either the MCP tool should send `{"stage": ..., "lost_reason": ...}` flat (matching what `update_stage` actually reads), or the controller's `update_stage` action should read from `params[:crm_deal]` (matching the sibling `update` action's convention and the tool's current nested payload). Either fix alone resolves it; the two sides currently disagree with each other.

## Evidence

### Screenshot

Not captured — confirmed via live chat transcript text and cross-checked against the real `/deals` page (stage unchanged) both times.

### Console / log

```
[Session 1, admin, deal ID 6 "BUG-013 Retest 1001"]
C: CRM, move the BUG-013 Retest 1001 deal to the Proposal stage.
-> asking the Sales Agent...
I'll do this (Crm Update Deal Stage) -- confirm?
[Write] Deal: BUG-013 Retest 1001, Stage: Proposal
[Confirm clicked]
"Validation error: Stage cannot be blank. Correct the value(s) above and try again."

[Verification] /deals -> deal 6 still shows Stage "Qualified" (unchanged)

[Retry, same proposal, confirm again] -> identical failure

[Session 2, fresh chat, admin]
C: CRM, move deal 6 to the Proposal stage.
-> asking the Sales Agent...
I'll do this (Crm Update Deal Stage) -- confirm?
[Write] Deal: BUG-013 Retest 1001 (ID 6), Stage: Proposal
[Confirm clicked]
"Validation error: Stage cannot be blank. Correct the value(s) above and try again."

[Verification] /deals -> deal 6 still shows Stage "Qualified" (unchanged)
```

Source evidence:
- `redmineflux-mcp/src/tools/crm.py` (lines ~816-870): sends `json={"crm_deal": {"stage": stage, ...}}`.
- `redmineflux_crm/app/controllers/api/deals_controller.rb` (lines ~104-105, 216-222): sibling `update` action correctly uses `params.require(:crm_deal).permit(...)`.
- `redmineflux_crm/app/controllers/api/deals_controller.rb` (lines ~132-146): `update_stage` action reads flat `params[:stage]` — the mismatch.

## Duplicate check

- Duplicate found: No — distinct from BUG-CRX-013 (that bug is about the agent failing to produce any real proposal at all; this bug is about a real, correctly-rendered proposal failing on confirm due to an API parameter-shape mismatch). Also distinct from the "BUG-CRM-011" referenced in the MCP tool's own inline comment, which appears to document a *previous* nested-payload requirement that no longer matches `update_stage`'s actual flat implementation (or never did for this specific action).
- Existing bug reference (if duplicate): — (found while retesting BUG-CRX-013, 2026-10-01)

## Production report

Reported to production as issue **#121819** (`ztflux`, Tracker Bug, Priority High, Defect Type Functional, Defect Severity High-severity, Defect priority High, assigned Prashant Chaurasia — user id 410), 2026-10-01. Textile description, no attachments. Linked via `report_defect` to Run #569, testcase #120490 (`CRUX_AGENT_CRM_SALES.md`) / Suite #374 / environment "Window 11 + Chrome" — testcase marked Failed.
