# Bug Report Template

- Bug ID: BUG-CRX-157
- Production Redmine Issue ID: #127604
- Title: Support Agent's `create_product` tool documents `code` as optional, but the native `RfProduct` model
  requires it (`validates :code, presence: true`) — every "create a product" request that doesn't explicitly
  mention a product code fails, even though the agent correctly followed its own tool's documented contract
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Support Agent, Helpdesk plugin domain — redmineflux_helpdesk)
- Plugin version: 6.2.0 (Redmineflux Helpdesk plugin)
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-04

## Steps to reproduce

1. As admin, Support Agent pinned: "Add a new product called 'Mobile App' for project 12 so tickets can be
   tagged to it." (deliberately natural phrasing, no product code mentioned — a realistic way a real user would
   phrase this).
2. Confirm card correctly showed `Project: Crux Helpdesk Agent Test Project`, `Name: Mobile App` — no `code`
   field at all, matching `redmineflux_helpdesk_create_product`'s own docstring, which documents `code: str |
   None = None` as optional ("Short product code (optional)").
3. Confirmed → genuine server-side failure: *"Validation error: Product Code cannot be blank. Correct the
   value(s) above and try again."*
4. Root-caused in source: `plugins/redmineflux_helpdesk/app/models/rf_product.rb:29` —
   `validates :code, presence: true, uniqueness: { scope: :project_id, case_sensitive: false }, length: {
   maximum: 255 }` — the native model genuinely requires `code`, contradicting the MCP tool's own documented
   contract.
5. Native-verified: `/rf_products` still shows "No products yet" — clean failure, no data corruption.

## Expected result

Either (a) the MCP tool's docstring should accurately mark `code` as required (matching the real model
validation), so the agent knows to ask the user for one before proposing the write, or (b) the native model
validation should be relaxed/auto-generate a code when none is given, matching the tool's documented
"optional" contract. As it stands, the two layers disagree, and the agent — behaving exactly as its own tool
documentation instructs — cannot succeed on the single most natural phrasing of this request.

## Actual result

Every product-creation request that doesn't explicitly include a product code fails with a validation error the
agent had no way to anticipate from its own tool's interface. This isn't a wrong-value-resolution defect (the
agent proposed exactly the fields its tool said were needed) — it's a genuine mismatch between the MCP layer's
documented contract and the plugin's actual required-field set.

## Evidence

### Console / log

```
Validation error: Product Code cannot be blank Correct the value(s) above and try again.
```

- Tool docstring (`redmineflux-mcp/src/tools/helpdesk.py:3006,3016`): `code: str | None = None` — "Short
  product code (optional)."
- Model validation (`redmineflux_helpdesk/app/models/rf_product.rb:29`): `validates :code, presence: true, ...`
- Native-verified: no product record was created (`/rf_products` → "No products yet").

## Duplicate check

- Duplicate found: No. First finding of a documented-optional-vs-actually-required field mismatch on this
  agent. Distinct from the wrong-ID-hallucination family (BUG-CRX-079/102/153 — those guess a wrong *value* for
  a field the agent knows it needs) and from BUG-CRX-155 (an encoding bug sending `""` instead of omitting an
  optional field) — here the agent correctly omitted a field its own tool said was optional, and the omission
  itself is what causes the failure, not a resolution or encoding mistake.
