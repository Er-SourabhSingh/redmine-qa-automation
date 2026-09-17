# Bug Report Template

- Bug ID: BUG-CRX-019
- Production Redmine Issue ID: #120706
- Title: Leave Create silently resolves an unrecognized username to User ID 0 instead of erroring or asking — a bad ID reaches the confirm card looking syntactically valid
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux (Capacity Agent, Workload plugin domain)
- Plugin version: crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP)
- User role: `admin` (Redmine Administrator)
- Date: 2026-09-16

## Steps to reproduce

1. In an Ask Crux chat session where "luna.blossom" has already been referenced/resolved successfully earlier in the same session (e.g. a prior `Workload Leave Create` for the same username correctly resolved to `User: 5`).
2. Send a new leave-create request in a single combined message, naming the user by username again and supplying every other field in the same turn: "Workload, create a leave request for luna.blossom from 2026-10-01 to 2026-10-02, leave type sick, reason 'Flu'."
3. Observe the resulting confirm card's `User` field.

## Expected result

- The confirm card's `User` field should show `5` (luna.blossom's real Redmine user ID, as correctly resolved for the exact same username earlier in this session), or the agent should ask for clarification if it genuinely cannot resolve the name — it should never silently substitute a placeholder/invalid ID.

## Actual result

- The confirm card showed `User: 0` — not luna.blossom's real ID (5), not an error, not a clarifying question. The card otherwise looked completely legitimate (correct Leave Type: sick, correct Start/End dates, correct Reason: Flu) which makes the wrong User field easy to miss for anyone not deliberately checking every field before clicking Confirm.
- This is worse than earlier username-resolution bugs (BUG-CRX-015/017) which produced an honest failure ("doesn't exist"/"not a member"). Here the agent produced a plausible-looking, ready-to-confirm write proposal with a silently wrong foreign key. Had this been confirmed, it would have created a leave record with an invalid/nonexistent user reference.
- Cancelled instead of confirming. Retried the identical request but with the raw numeric ID instead of the username ("Workload, create a leave request for user ID 5 from 2026-10-01 to 2026-10-02, leave type sick, reason 'Flu'.") — this immediately produced a correct card (`User: 5`) and completed successfully ("✓ Leave created: #2 | Crux Manager | Sick Leave | 2026-10-01 → 2026-10-02 (2.0 days) | Status: pending").

## Evidence

### Screenshot

Not captured — confirmed via live chat transcript text; the bad-ID confirm card was cancelled rather than confirmed, so no downstream production data was affected.

### Console / log

```
C: Workload, create a leave request for luna.blossom from 2026-10-01 to 2026-10-02, leave type sick, reason "Flu".
-> asking the Capacity Agent...
I'll do this (Workload Leave Create) -- confirm?
WRITE
Workload Leave Create
Leave Type    sick
Start Date    2026-10-01
End Date      2026-10-02
Reason        Flu
User          0        <-- WRONG. Should be 5 (luna.blossom).
[Cancelled -- not confirmed]

C: Workload, create a leave request for user ID 5 from 2026-10-01 to 2026-10-02, leave type sick, reason "Flu".
-> asking the Capacity Agent...
I'll do this (Workload Leave Create) -- confirm?
WRITE
Workload Leave Create
Leave Type    sick
Start Date    2026-10-01
End Date      2026-10-02
Reason        Flu
User          5        <-- correct
[confirmed] Leave created: #2 | Crux Manager | Sick Leave | 2026-10-01 -> 2026-10-02 (2.0 days) | Status: pending
```

Note: earlier in the same session, the very first leave-create request also used the bare username "luna.blossom" (across two turns: name+dates first, then type+reason) and correctly resolved to `User: 5` — so the failure is not 100% reproducible for every username reference, but it did occur on a request that packed the username together with all other fields in a single message.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): — (related to, but distinct from, BUG-CRX-015 and BUG-CRX-017, which are username-resolution failures that surface as an honest "doesn't exist"/"not a member" error; this bug instead silently substitutes an incorrect placeholder ID (0) into an otherwise normal-looking confirm card, which is a more dangerous failure mode since it is much easier for a real user to miss before confirming)

## 2026-09-16 retest — STILL REPRODUCES, not fixed

Not part of today's `CHANGES.md` — no Workload/Capacity agent or tool files were touched.

**Retest (exact original repro):** New session → `Workload, create a leave request for luna.blossom from 2026-11-01 to 2026-11-02, leave type sick, reason 'Flu'.` (name + all fields combined in one message).

**Result:** Confirm card rendered with `User: 0` — the exact same silent bad-ID substitution as the original bug, all other fields (Leave Type, Start/End Date, Reason) correctly populated. Cancelled rather than confirmed.

**Verdict: NOT FIXED.** No change needed to this bug's status; remains open.

## Production report

Reported to production as issue **#120706** (`ztflux`, Tracker Bug, Priority High, assigned to Prashant Chaurasia — user id 410), 2026-09-16. Textile description, no attachments (per updated §4.3a policy). Found via TC-CRX-095 (`CRUX_AGENT_WORKLOAD_CAPACITY.md`) — testcase marked Passed (with findings).
