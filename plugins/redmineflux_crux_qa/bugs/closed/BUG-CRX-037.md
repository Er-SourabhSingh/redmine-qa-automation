# Bug Report Template

- Bug ID: BUG-CRX-037
- Production Redmine Issue ID: #121510
- Title: "Retire agent" popup doesn't close automatically after a successful retirement — success message renders inside the still-open dialog, requiring a manual Cancel/Close click
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux (Agent Fleet admin page)
- Plugin version: crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP)
- User role: `admin` (Redmine Administrator)
- Date: 2026-09-29

## Steps to reproduce

1. Go to `/crux/agents` (Agent Fleet page).
2. Create a throwaway agent via **+ New Agent** (any id/name/capability), Save.
3. On that agent's row, click **Retire**.
4. In the "Retire agent" confirmation dialog, check **"I understand this is permanent"**, then click **Retire agent**.
5. Observe the dialog after the action completes.

## Expected result

- The retire action succeeds and the dialog closes automatically (or at minimum shows a clear, dismissible success state that doesn't require an extra manual step) — consistent with a normal confirm-and-close modal pattern.

## Actual result

- The retirement genuinely succeeds — the "Retire agent" button becomes disabled and the row/table correctly reflects "retired" status in the background (confirmed via the fleet table).
- However, the dialog **does not close on its own**. Instead, the success message *"Retired — no Redmine user was paired, so nothing needed locking."* renders **inside the still-open dialog**, below the "I understand this is permanent" checkbox. Waited 5+ seconds — no auto-dismiss.
- The only way to close the dialog is to click **Cancel** (which, post-success, functions as a "Close" button rather than an actual cancel) or the **×** icon in the dialog header. There is no dedicated "Close"/"OK" affordance that matches the post-success state — the user is left looking at a "Cancel" button after a successful, permanent action, which is also mildly confusing wording (nothing left to cancel at that point).
- This is a related but distinct pattern from **BUG-CRX-035** (success/error messages render as a plain inline banner instead of a toast) — that bug is about *where on the page* success messages appear; this bug is about a *modal dialog's own lifecycle* not completing (open → success → auto-close) and instead stranding the user in a stale dialog state.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-CRX-037/retire-popup-stuck-open.png)

### Console / log

```
[Created throwaway agent "BUG-CRX-037 Retire Test Agent" via + New Agent]
Agent "BUG-CRX-037 Retire Test Agent" saved.

[Clicked Retire on that row -> dialog opened]
Retire agent
Permanently retires "BUG-CRX-037 Retire Test Agent". It has no paired Redmine user yet, so nothing
is locked -- this only marks it retired (stops dispatch for good). There is no un-retire from here.
[x] I understand this is permanent
[Cancel] [Retire agent]

[Checked the box, clicked "Retire agent"]
-> Retire agent button becomes disabled
-> New text appears INSIDE the still-open dialog:
   "Retired -- no Redmine user was paired, so nothing needed locking."
-> Dialog remains open, waited 5s, no auto-close.
-> Fleet table (background, same page) already shows this agent's Status as "retired" --
   the action genuinely completed; only the dialog's own close behavior is broken.
-> Had to click "Cancel" to dismiss the dialog.
```

## Duplicate check

- Duplicate found: No — related to BUG-CRX-035 (inline banner instead of toast) but a distinct defect class: BUG-CRX-035 is about message placement on a page, this is about a modal dialog failing to auto-close/transition to a proper closed/success state after its action succeeds.

## Production report

Reported to production 2026-09-29 as **#121510** (project `ztflux`, tracker Bug, Priority Low, Defect Type Usability, Defect Severity Low-severity, Defect priority Low, assigned Prashant Chaurasia). Linked via `report_defect` to testcase #120489 (`CRUX_AGENT_ROSTER_ADMIN`) / Run #569 / environment "Window 11 + Chrome" — testcase result marked Failed with defect #121510 attached, confirmed via `get_issue`.
- Existing bug reference (if duplicate): BUG-CRX-035 (related pattern, not a duplicate)

## 2026-10-01 retest — CONFIRMED FIXED

Dev's fix (`redmineflux_crux`, branch `master`, commit `fb6b639` — `retire()` now closes `crux-retire-panel` and shows the success line via the page-level `crux-agents-msg` banner instead of inside the dialog; confirmed present in the local git checkout). Retested the original repro exactly: created a fresh throwaway agent ("BUG-CRX-037 Retest Agent 2"), clicked Retire, checked "I understand this is permanent", clicked "Retire agent". Verified via direct DOM inspection: the `#crux-retire-panel` dialog is genuinely closed (`display: none`) immediately after the action, and the success text *"Retired — no Redmine user was paired, so nothing needed locking."* now renders in the page-level banner, not stranded inside the dialog. Fleet table confirms the agent's Status is genuinely "retired". Screenshot captured. **Verdict: CONFIRMED FIXED.** Recommend closing.
