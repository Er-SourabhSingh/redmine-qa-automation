# Bug Report Template

- Bug ID: BUG-CRX-079
- Production Redmine Issue ID:
- Title: QA Agent's Create Testcase guesses a hardcoded classic priority_id (3) instead of resolving the named priority via list_enumeration, failing deterministically on any instance whose priority enumeration doesn't use the classic 1-4 ID scheme — same wrong-ID-hallucination class as BUG-CRX-015/019/038/043/050/052
- Redmine version: 6.0-bookworm (new local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, QA Agent, Test Case Management plugin domain)
- Plugin version: redmineflux_testcase_management 7.2.0 / crux-core 0.128.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: non-admin (`luna.blossom`, "QA Full Access" role — all Testcase Management permissions + Add/Edit issues genuinely granted)
- Date: 2026-10-26

## Steps to reproduce

1. On a freshly seeded Redmine 6 instance where the Priority enumeration's real IDs are `[6=low, 7=medium, 8=high, 9=immediate]` (confirmed via DB) — not the "classic" Redmine seed IDs `[1=Low, 2=Normal, 3=High, 4=Urgent]` some older instances default to.
2. As `luna.blossom`, in a fresh Ask Crux chat (QA Agent), on "Crux QA Agent Test Project": "can you create a test case titled 'Verify login with valid credentials' with description '...', priority High, and two steps: ..."
3. Observe the resulting confirm card and its Priority field value.
4. Click Confirm.
5. Observe the failure, then click Confirm again (retry) to check whether it self-corrects.
6. Independently check the real Priority enumeration via DB (`SELECT id, name FROM enumerations WHERE type='IssuePriority'`).

## Expected result

The agent should resolve "High" to the real priority ID on **this** instance (8) by calling the genuinely-available `list_enumeration(kind='priorities')` (or `redmineflux_core_list_priorities`) tool first, the same way it already successfully resolves other named fields (Project, Subject) to their real values — not assume a fixed numeric ID from memory of a different, more commonly-seeded Redmine instance.

## Actual result

1. The confirm card's `Priority` field shows **`3`** — a numeric ID, not resolved via any `list_priorities`/`list_enumeration` call (the "Checked 1 thing" disclosure covers only 1 tool call, almost certainly just the project-name lookup — no priorities lookup was ever made).
2. Clicking **Confirm** genuinely attempts the write and fails with: **`Error: priority_id 3 not found. Valid IDs: [6, 7, 8, 9]. Use list_enumeration(kind='priorities') to see names.`** — the tool itself clearly expects the caller to resolve the name beforehand and says so explicitly in its own error message; the agent simply never did this.
3. **Clicking Confirm a second time (retry) reproduces the identical error** — the agent does not self-correct even after seeing its own tool's explicit remediation hint in the first failure; the stale, wrong `priority_id: 3` value is retried unchanged.
4. Independently verified via DB: no test case was ever created (`SELECT id FROM issues WHERE subject LIKE '%Verify login%'` → 0 rows) — the failure is honest, not a silent partial write.
5. Real priority enumeration on this instance: `6=low, 7=medium, 8=high, 9=immediate` — "High" should have resolved to `8`, not `3`.

## Evidence

### Screenshot

![Confirm card showing Priority: 3, and the resulting "priority_id 3 not found" error after confirming](../../screenshots/BUG-CRX-079/wrong-priority-id-guess-create-testcase.png)

### Console / log

- Confirm card detail table (verbatim): `Project: Crux QA Agent Test Project`, `Subject: Verify login with valid credentials`, `Priority: 3`, `Description: ...`, `Steps: [...]`.
- Post-confirm error (verbatim, reproduced identically twice): `Error: priority_id 3 not found. Valid IDs: [6, 7, 8, 9]. Use list_enumeration(kind='priorities') to see names.`
- Model/cost line on the initial proposal turn: `anthropic/claude-haiku-4.5 · 29,012 in / 339 out · $0.02`.

## Note for triage

This is the same wrong/hallucinated-ID resolution defect class already extensively documented in `CRUX_MEMORY.md` for the Project Manager agent (BUG-CRX-015/019/038/043, and BUG-CRX-050/052's Priority-field-specific "High→Urgent" sub-variant) — "never guess a numeric id from a name" — now confirmed on a **different agent** (QA Agent) and a **different plugin domain** (Test Case Management's `create_testcase` tool) for the very first time this session. The specific trigger condition here is a non-classic Priority enumeration (IDs 6-9 instead of 1-4), which this QA Agent's `create_testcase` flow apparently never accounts for — it appears to hardcode or assume a priority ID rather than ever calling the lookup tool, unlike some other flows in this suite that do call `list_priorities` correctly (see CRUX_MEMORY.md's Project Manager Priority note, where the lookup tool genuinely WAS called but the wrong value was still picked — a related but distinct sub-shape; here, no lookup call is made at all).

## Duplicate check

- Duplicate found: No, but same defect **class** as the already-documented wrong-ID-hallucination family (BUG-CRX-015/019/038/043/050/052) — recorded as a new bug per the repo's established precedent for the same pattern recurring on a new agent/tool combination. This is the first instance of this class confirmed on the QA Agent / Test Case Management domain.
