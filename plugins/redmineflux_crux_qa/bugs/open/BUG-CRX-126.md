# Bug Report Template

- Bug ID: BUG-CRX-126
- Production Redmine Issue ID: #126733
- Title: Time Agent's "Core Update Time Entry" path consistently resolves "my time entry on [date]" to a completely unrelated time entry belonging to a different user, while the sibling "Core Delete Time Entry" path resolves the identical description correctly — reproduced 2/2
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Time Agent)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: `luna.blossom` (Manager — non-admin)
- Date: 2026-10-30

## Steps to reproduce

1. As `luna.blossom`, with a real time entry she owns (Time Entry #8: Luna Blossom, 2026-10-24, "development" activity, 4:00h, Crux PM Agent Test Project, no issue), in a chat pinned to the Time Agent, ask: "Please update my time entry on 2026-10-24 (4 hours, development, Crux PM Agent Test Project) to 5 hours instead."
2. Inspect the proposed `Core Update Time Entry` write's confirm table before confirming.
3. Verify the referenced Time Entry ID's real owner via the native edit form (`/time_entries/<id>/edit`).

## Expected result

- The proposed write should target Time Entry #8 — the caller's own entry, matching every detail she explicitly gave (date, hours, activity, project).

## Actual result

- The confirm table showed **`Time Entry: 1`**, not 8. Verified natively at `/time_entries/1/edit`: Time Entry #1 belongs to **Redmine Admin** (User field shows "Redmine Admin" selected, not Luna Blossom), dated 2026-10-26 (not 2026-10-24), Activity "Technical Support" (not "development"), 3:00h (not 4:00h) — every single field of the resolved entry mismatches what the caller described, and critically, it belongs to a completely different user.
- The write was never confirmed/executed (cancelled by the tester once the mismatch was spotted), so no bad write reached the database — but had it been confirmed (the normal user flow, since the agent gave no indication anything was wrong), a non-admin user's chat request would have silently modified an administrator's unrelated time entry, changing its hours from 3:00 to 5:00.
- This is the same wrong-ID-resolution defect class seen repeatedly this session on the Time Agent (BUG-CRX-122 wrong team ID, BUG-CRX-123 wrong user ID, BUG-CRX-124 wrong role value), now confirmed on time entry resolution specifically, and notably the most severe instance yet: a non-admin's request could silently cross into and modify an administrator's own data with zero fields matching.

## Evidence

### Console / log

- Chat confirm table: `Time Entry: 1`, `Hours: 5` (requested hours only, no other fields shown — the tool apparently updates by ID + hours only, meaning the ID resolution step is the sole point of failure here).
- Native `/time_entries/1/edit` form confirmed: User = Redmine Admin, Date = 2026-10-26, Activity = Technical Support, Hours = 3:00, Comment = "retry after approved hours + category set" — none of these match the caller's own described entry (Luna Blossom, 2026-10-24, development, 4:00h).

## Follow-up — reproducibility and scope (2026-10-30)

Per explicit user request ("update/delete by date and other unique attributes, not just numeric ID"), retested
both the Update and Delete paths using description-only phrasing (date + project + activity + hours, no numeric
ID), in a **brand-new chat** (no prior context contamination from the earlier session where the bug was first
found):

- **Update, by description, attempt 2** (fresh chat): "Please update my time entry on 2026-10-24 for the Crux PM
  Agent Test Project (development activity, 4 hours) to 6 hours instead." → again resolved to **`Time Entry: 1`**
  (the same wrong, admin-owned entry as the first reproduction) — **reproduced 2/2**, ruling out a one-off fluke
  tied to conversation history.
- **Delete, by description** (same fresh-chat session): "Please delete my time entry on 2026-10-24 for the Crux
  PM Agent Test Project (development activity, 4 hours)." → correctly resolved to **`Time Entry: 8`**, the real
  entry — confirmed correct on this path.

**Conclusion: the wrong-ID resolution defect is isolated specifically to the `Core Update Time Entry` tool path**
— the same descriptive identifying information (date, project, activity, hours), given in the same session,
resolves correctly for Delete but incorrectly for Update, every time tested (2/2 each). This rules out a general
"Time Agent can't match time entries by description" explanation — the underlying lookup/matching logic clearly
CAN resolve correctly (proven by Delete), but the Update tool's own resolution step has a specific, reproducible
defect.

## Duplicate check

- Duplicate found: No new root cause — same general wrong-ID-resolution class as BUG-CRX-122/123/124 (all found this session on Time Agent write flows), but the first instance on time-entry resolution specifically, and the most severe in consequence (a non-admin's request could silently modify an administrator's unrelated data). Kept as its own bug per the one-bug-per-concrete-finding convention.
