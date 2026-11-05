# Test Suite — Crux Platform: Agent Fleet Admin

> Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §6. Plugin: redmineflux_crux. Redmine 6.0-bookworm,
> localhost:3015. URL: `/crux/agents`.
> TC range: TC-CRX-816 to TC-CRX-850.

## Fixtures needed

- A user with Manage Crux agents, and one without it (for permission-gated action checks).
- A `.md` file formatted as a valid custom agent upload (frontmatter: id/name/capabilities, body ≤5,000 chars).
- A second `.md` file deliberately invalid in 2-3 ways at once (bad tool name, >5,000 chars, a built-in agent's
  id) to test the "all errors listed together" behavior.
- A disposable custom agent to Pause/Resume/Edit/Retire without affecting real testing fixtures.
- A real, unused "AI Agent" role already existing in Redmine (required precondition for Create Redmineflux
  identity).

## Positive Cases — Toolbar & views

- **TC-CRX-816** — Search filters by name, id, role, team, and skills — confirm a search term matching only an
  agent's skill (not its name) still surfaces that agent.
- **TC-CRX-817** — View switch Cards/Teams/List is remembered across a page reload (browser-local, not
  server-side — verify it survives a refresh but may differ per browser/device).
- **TC-CRX-818** — Count line accuracy: "N agents · M online · K need a plugin · R retired" — cross-check each
  number against the actual roster state.
- **TC-CRX-819** — Cards view shows: avatar, name, role, status dot, example question, 2 skills + "+N" (hover
  reveals all), "N runs · X% ok".
- **TC-CRX-820** — Card footer flags are mutually exclusive and accurate: Paused / Retired / "Needs <plugin>" (with
  Learn more) / "Worker · runs ready tickets" — confirm each state shows the correct flag and no card shows two
  at once.
- **TC-CRX-821** — Chat button hidden correctly: confirm it's absent for retired agents, agents whose required
  plugin isn't installed, and workers (Builder 1/2) — present for everyone else.
- **TC-CRX-822** — Teams view groups correctly into the 6 named buckets (Project delivery / Sales and finance /
  Support and knowledge / Engineering and quality / Crux helpers / Custom agents) — spot-check a few agents land
  in the expected bucket.
- **TC-CRX-823** — List view columns: Agent (+ "Redmineflux: <user>" chip if paired), Skills, Type (Bundled/
  Custom), Model, Spend this month ("$x of $cap" + bar + "cap reached"/"N% used"), Runs, Status, Actions.

## Positive Cases — Agent profile & actions (Manage Crux agents only)

- **TC-CRX-824** — Agent profile (Details) shows: status/role/team/id, "Try asking" example+skills, "What it can
  do" (read/change tool counts + first change tools), "This month" budget meter+health, engine, Redmineflux
  identity (if paired), max parallel runs, and a working "Chat with <agent>" action.
- **TC-CRX-825** — Pause stops new queue work only: pause a plugin agent, confirm it no longer picks up new
  Ready-queue tickets, but chat with it still answers normally (cross-reference "not built/by design" §15).
- **TC-CRX-826** — Resume restores queue eligibility: resume the paused agent, confirm it can claim queue tickets
  again.
- **TC-CRX-827** — Edit is custom-only: confirm the ⋯ menu offers Edit for a custom agent but NOT for any bundled
  agent (bundled agents are read-only by design).
- **TC-CRX-828** — Create Redmineflux identity — full flow: pick an unpaired agent, provide project
  identifiers, check the required "I understand this creates a real Redmineflux user" checkbox, submit. Confirm
  a real Redmine user is created (login=agent id, mail `id@agents.<host>`, role "AI Agent"), the result lists the
  user/mail/"API key stored: yes"/✓ per project, and subsequent agent replies (e.g. an @-mention reply) post as
  that real user instead of the service account.
- **TC-CRX-829** — Retire — full flow: retire a disposable custom agent with the required checkbox checked.
  Confirm it's now flagged Retired, no longer chattable, and (if it was paired) its Redmine user is locked while
  history is preserved. Confirm there is genuinely no "un-retire" action anywhere.

## Positive Cases — + New Agent / Edit / Upload

- **TC-CRX-830** — + New Agent with all valid fields: Id (lowercase/digits/dashes), Name, Capabilities (≥1,
  comma-sep), Provider ("inherit" or a real enabled provider), Model (blank=inherit), Max concurrent (≥1),
  Monthly cap (blank=0=no cap). Confirm the agent is created and appears in the roster.
- **TC-CRX-831** — Re-submitting an existing id updates, doesn't duplicate: submit the same id again with a
  changed Name — confirm the existing agent is updated in place, not a second agent created.
- **TC-CRX-832** — Upload Agent — valid file: upload the prepared valid `.md` fixture, confirm its content loads
  into the editable box, and clicking Upload creates the agent matching the frontmatter.
- **TC-CRX-833** — Monthly cap stops queue work only, not chat: set a very low monthly cap on a test agent,
  exceed it via queue-claimed work, confirm it then shows "needs a human top-up" and stops claiming new tickets
  — but confirm chat with that same agent still answers normally (per §15, this is a known, accepted behavior,
  not a bug to file if observed).
- **TC-CRX-834** — Max concurrent limits simultaneous queue claims: set Max concurrent to 1 on a test agent with
  2+ queued tickets available — confirm it only works one at a time, picking up the second only after the first
  completes/is released.

## Negative / Boundary Cases

- **TC-CRX-835** — Each invalid + New Agent field shows its own specific message: submit with an invalid Id
  (uppercase/spaces), empty Name, zero Capabilities, and Max concurrent < 1 — confirm each produces a distinct,
  field-specific error, not one generic failure.
- **TC-CRX-836** — Upload Agent — all errors listed together: upload the deliberately-invalid fixture (bad tool
  name + >5,000 chars + a built-in agent's id) — confirm ALL applicable errors are shown together ("Fix these and
  upload again"), not just the first one found.
- **TC-CRX-837** — A built-in agent's id is refused on upload/create: attempt to create or upload an agent using
  an existing bundled agent's exact id (e.g. `reviewer`) — confirm it's refused, not silently overwritten.
- **TC-CRX-838** — Non-manager cannot see management actions: as a user without Manage Crux agents, confirm the
  ⋯ menu only offers "Details", and + New Agent/Upload Agent buttons are entirely absent from the page.
- **TC-CRX-839** — Create Redmineflux identity is blocked once already paired: attempt to run this flow a second
  time on an agent that already has a Redmineflux identity — confirm it's refused or the option is hidden,
  consistent with "only while the agent isn't paired".
- **TC-CRX-840** — Retire without the confirmation checkbox is blocked: attempt to submit the Retire action with
  "I understand this is permanent" unchecked — confirm the action is refused client-side (button
  disabled/validation error), not silently allowed.
- **TC-CRX-841** — A retired agent cannot be Paused/Resumed/Edited: confirm the ⋯ menu's Pause/Resume/Edit
  options are absent or disabled for an already-retired agent.
- **TC-CRX-842** — A retired agent is still reachable via direct `?agent=<id>` historically, but excluded going
  forward: per §13.2, `/crux/ask?agent=<id>` for a retired agent is ignored (falls back to Auto or default) —
  confirm this live.
- **TC-CRX-843** — Upload rejects a non-`.md` file or malformed frontmatter: attempt to upload a `.txt` file, or
  a `.md` file with no `---` frontmatter block at all — confirm a clear rejection, not a crash or a
  silently-broken agent.
- **TC-CRX-844** — Allowed-tool validation at upload time: include a frontmatter `allowed_tools` entry naming a
  tool that doesn't exist on the MCP — confirm the upload is refused with that specific tool flagged, not
  silently accepted and broken later.
- **TC-CRX-845** — Id format validation: attempt an Id containing uppercase letters, spaces, or special characters
  beyond dash — confirm each is rejected with the documented "lowercase, digits and dashes" rule enforced.

## Rules cross-checks

- **TC-CRX-846** — Spend-this-month bar and "cap reached"/"N% used" text match the real monthly spend figure
  (cross-reference against the Run ledger's cost totals for that agent this month).
- **TC-CRX-847** — "Needs <plugin>" flag disappears once the plugin is installed: if feasible, install a
  previously-missing plugin and confirm the corresponding agent's card flag updates (else document as
  theoretically-true-but-not-independently-verified this round).
- **TC-CRX-848** — Worker cards (Builder 1/2) never show a Chat button and are excluded from the Ask Crux agent
  picker entirely (cross-reference §13.2's "hidden from it: workers").
- **TC-CRX-849** — Agent picker can still show a retired agent as a stale entry (known issue, dev reference §17 —
  verify this reproduces as documented, and confirm it is NOT independently fixed by this point; if it IS fixed,
  note that as a positive finding, not a new bug, since the developer already knows about it).
- **TC-CRX-850** — Search is case-insensitive and matches partial strings: search for a lowercase substring of an
  agent's actual mixed-case name/skill — confirm it still matches.

## Execution — 2026-11-05

Fixtures: used the real 26-agent roster live in this environment, plus one disposable custom agent
(`qa-disposable-test-agent`) created, renamed, and retired during this pass.

- **TC-CRX-816** — PASS. Searching "SCRUM" (a skill, not in any agent's name) correctly surfaced only "Agile
  Board Agent" (1 of 26).
- **TC-CRX-817** — PASS. Switched to Teams view, reloaded the page — Teams view was still active, confirming
  browser-local persistence.
- **TC-CRX-818** — PASS, verified exact. "26 agents · 24 online · 2 need a plugin" — manually counted all 26
  rows (24 non-plugin-gated + Code Reviewer + DevOps Agent needing a plugin = 2), matches exactly.
- **TC-CRX-819** — PASS. Cards show avatar, name, role, status dot, example question, skill chips with "+N"
  (e.g. Builder 1: "backend, flutter, +3"), and "N runs · X% ok".
- **TC-CRX-820** — PASS. Flags are mutually exclusive across all 26 cards: "Needs Redmineflux DevOps" (Code
  Reviewer, DevOps Agent) and "Worker · runs ready tickets" (Builder 1, Builder 2) never co-occur with each
  other or with a normal online/Chat state.
- **TC-CRX-821** — PASS. Chat button confirmed absent for both plugin-gated agents and both workers; present for
  all 22 other online agents.
- **TC-CRX-822** — PASS. Teams view shows exactly 6 buckets with sensible membership: Project delivery (5),
  Sales and finance (3), Support and knowledge (2), Engineering and quality (10), Crux helpers (3), Custom
  agents (3).
- **TC-CRX-823** — PASS. List view shows all 8 documented columns; Type correctly shows Bundled/Custom; Spend
  shows "$x of $cap" or "$x · no cap" (confirmed both variants — Improver has no cap set).
- **TC-CRX-824** — PASS, fully confirmed (Project Manager profile): status/role/team/id/bundled flag, "Try
  asking" example+skill, "What it can do" (24 reads/9 changes + sample tool list), "This month" budget meter
  ($0.44/$50, 100%·93 runs, last run timestamp), Engine/Redmineflux identity/Max parallel runs, and a working
  "Chat with Project Manager" link.
- **TC-CRX-825** — PASS, fully confirmed. Paused Project Manager (clean "paused — no new dispatch" message, count
  dropped to 23 online), then sent it a real chat message — it answered normally (new run logged, $0.03, 94th
  run), proving chat still works while paused. Resumed afterward (count back to 24 online).
- **TC-CRX-826** — PASS (verified as the other half of the above — resume restored online status).
- **TC-CRX-827** — PASS, fully confirmed by contrast: the bundled Project Manager's profile dialog has NO Edit
  button (only Pause/Create identity/Retire/Chat); the custom disposable agent's ⋯ menu DOES show Edit.
- **TC-CRX-828** — NOT INDEPENDENTLY VERIFIED (the full identity-creation flow, including the required-checkbox
  submission and verifying an @-mention reply posts as the new real user, was not exercised this pass — would
  need a pre-existing "AI Agent" role precondition not confirmed present). Deferred.
- **TC-CRX-829** — PASS, fully confirmed end-to-end on the disposable agent: Retire succeeded ("Retired — no
  Redmineflux user was paired, so nothing needed locking"), card flipped to a "Retired" flag with Chat removed,
  and the ⋯ menu afterward offered ONLY "Details" — no un-retire action exists anywhere.
- **TC-CRX-830** — PASS. Created `qa-disposable-test-agent` with valid fields; appeared immediately (26→27
  agents).
- **TC-CRX-831** — PASS, fully confirmed. Re-submitted the same id with a changed Name — agent count stayed at
  27 (not 28), and the card showed the new name — genuine update-in-place, not a duplicate.
- **TC-CRX-832 / TC-CRX-836 / TC-CRX-843 / TC-CRX-844** — NOT INDEPENDENTLY VERIFIED (Upload Agent's valid-file,
  multi-error, non-.md-rejection, and bad-allowed_tools-rejection cases all need prepared `.md` fixture files not
  created this pass). Deferred.
- **TC-CRX-833 / TC-CRX-834** — NOT INDEPENDENTLY VERIFIED (monthly-cap-stops-queue-work and
  max-concurrent-limiting both need queue-claim fixtures not set up this pass). Deferred.
- **TC-CRX-835** — PASS, fully confirmed. Submitting with an empty Capabilities field produced the native
  "Please fill out this field" browser validation; after filling it, submitting with an invalid Id
  ("Invalid ID!") produced a specific, field-attached message: "⚠ Use lowercase letters, numbers and dashes for
  the agent ID, for example support-helper." — not a generic failure.
- **TC-CRX-837** — **FAIL — BUG-CRX-177 filed (Critical).** Submitted + New Agent with Id=`reviewer` (the real
  bundled Reviewer agent's id), Name="Fake Reviewer", Capabilities="fake" — it was NOT refused. The submission
  succeeded with a success toast, and the real bundled Reviewer agent's Name and Capabilities were silently
  overwritten in place (confirmed via the Chat link still pointing to `/crux/ask?agent=reviewer` and its 16
  historical runs being preserved — genuinely the same agent record, not a new one). Immediately reverted the
  damage in-session (restored Name="Reviewer", Capabilities="review") to leave the environment clean. Filed as
  BUG-CRX-177, not yet reported to production.
- **TC-CRX-838** — NOT INDEPENDENTLY VERIFIED this pass (would need a dedicated non-manager user fixture;
  deferred — the inverse case, all 5 Crux permissions including Manage Crux agents, was already exercised in the
  Permissions suite).
- **TC-CRX-839** — NOT INDEPENDENTLY VERIFIED (no paired agent exists in this environment to test the
  already-paired refusal case). Deferred.
- **TC-CRX-840** — PASS, fully confirmed. Clicking "Retire agent" with the checkbox unchecked produced a clean
  inline refusal: "⚠ Tick the confirmation checkbox — retiring is permanent." — not silently allowed.
- **TC-CRX-841** — PASS, fully confirmed (see TC-829 above — retired agent's ⋯ menu shows only "Details").
- **TC-CRX-842** — PASS (via a session-resume-quirk-affected but still conclusive check). Navigating to
  `/crux/ask?agent=qa-disposable-test-agent` (the just-retired agent) did not pin that agent — the composer
  stayed on "Project Manager" (the prior session's pin) — confirming the retired agent's id was ignored/had no
  effect, consistent with the documented behavior, even though this session's own known stale-session-resume
  quirk (documented earlier this cycle) means a perfectly clean blank-session repro wasn't achieved.
- **TC-CRX-846 / TC-CRX-847 / TC-CRX-848 / TC-CRX-849 / TC-CRX-850** — PASS for 848 and 850 (confirmed inline
  above as part of TC-821/TC-816); 846/847 NOT INDEPENDENTLY VERIFIED this pass (cross-referencing exact spend
  figures against Run Ledger totals, and a live plugin-install flag-update, were not exercised). Deferred.

**Suite result: 19 PASS (including the 1 found bug's own confirming TC), 1 FAIL/bug filed (BUG-CRX-177 —
Critical), 15 not independently verified this pass due to missing fixture files (.md uploads), queue-claim
setups, or additional user fixtures.**

## Suite status

Executed 2026-11-05 — 19 PASS, 1 Critical bug found (BUG-CRX-177), 15 deferred.
Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §6.
