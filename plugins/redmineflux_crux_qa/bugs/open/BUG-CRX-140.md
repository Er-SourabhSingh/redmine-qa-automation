# Bug Report Template

- Bug ID: BUG-CRX-140
- Production Redmine Issue ID:
- Title: KB Agent's `delete_space` confirm card genuinely targets the WRONG space — a real, named space with real content ("Engineering Docs", space #1) is proposed for deletion instead of the space the user explicitly named and which was already correctly resolved earlier in the same chat ("Release Notes", space #2) — reproduced 2/2
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, KB Agent) / redmineflux_knowledgebase (native plugin)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-03

## Steps to reproduce

1. In a single chat, KB Agent pinned: create a space "Release Notes" (becomes space #2 — space #1
   "Engineering Docs" already exists with real content from this chat's own earlier fixture setup).
2. In the same chat, genuinely update the "Release Notes" space's description — confirm card and result both
   correctly reference `Space #2`, name `'Release Notes'` (native-verified correct).
3. In the same chat: "Delete the Release Notes space." The agent first asks an explicit yes/no pre-check
   naming "Release Notes" correctly, then (after "Yes, delete it.") shows the real `Kb Delete Space` confirm
   card.
4. Inspect the confirm card's `Space` field before confirming.

## Expected result

The confirm card's `Space` field should genuinely be `2` (Release Notes) — matching the space named in the
request and already correctly resolved as space #2 earlier in the identical chat.

## Actual result

Reproduced **2 of 2 times** (once via "Yes, delete it." follow-up, once via a fresh repeat of "Delete the
Release Notes space." in the same chat): the confirm card's `Space` field genuinely shows **`1`** — the real
`Engineering Docs` space, which holds this suite's actual fixture content (2 pages including a published page
with real content, 1 folder) — not space #2 (`Release Notes`, empty) which is what was actually requested and
named. Had this been confirmed without checking, it would have permanently deleted the wrong, real,
content-bearing space — "This will delete the space AND every folder, page, and version history within it.
This action cannot be undone," per the agent's own prior warning text in the same turn.

**Secondary, compounding observation**: the `Project` field on the same confirm card shows yet another
inconsistent value across attempts — `crux-knowledge-base-agent-test-project` (a fabricated, nonexistent
slugified-from-display-name identifier; the project's real identifier is `crux-kb-agent-test-project`) on one
attempt, and `crux-kb-agent-test` (a different, truncated, also-nonexistent identifier) on another — neither
matches the real project identifier, despite this exact chat having already used the correct identifier
(`crux-kb-agent-test-project`) successfully on an earlier `create_space` call in the same session. This
project-identifier instability is a related but distinct symptom from the wrong-`Space`-id defect — both point
to the KB Agent's write-tool argument construction not reliably reusing already-correctly-resolved IDs from
earlier in the same chat, instead re-deriving (and getting wrong) a fresh guess on later write calls.

Both deletion attempts were caught and cancelled before any data loss — verified natively on
`/projects/crux-kb-agent-test-project/knowledgebase` that both `Engineering Docs` (space #1) and `Release
Notes` (space #2) still genuinely exist, untouched.

## Evidence

### Screenshot

![Delete-space confirm card showing Space: 1 (Engineering Docs) instead of the requested Release Notes (space 2), and a wrong project identifier](../../screenshots/BUG-CRX-140/wrong-space-delete-confirm-card.png)

### Console / log

- Prior turn (correct): confirm card + result for `update_space` on "Release Notes" — *"✓ Space #2 updated.
  Name: 'Release Notes'."* — space #2 correctly resolved in this exact chat, moments before the delete attempt.
- Delete confirm card (attempt 1, verbatim): `Project: crux-knowledge-base-agent-test-project`, `Space: 1`.
- Delete confirm card (attempt 2, fresh repeat in same chat, verbatim): `Project:
  crux-knowledge-base-agent-test-project`, `Space: 1` (identical wrong Space id both times; Project string
  varied across the session's several confirm cards — see Secondary observation above).
- Native verification, `/projects/crux-kb-agent-test-project/knowledgebase`: both `Engineering Docs` (2 Pages,
  1 Folder) and `Release Notes` (0 Pages, 0 Folders) genuinely still exist after cancelling both attempts.

## Duplicate check

- Duplicate found: No. This is the first confirmed instance on the KB Agent of a write tool's confirm card
  resolving a completely different, real **target record id** (not just a wrong project) for a **destructive**
  action — distinct from the already-documented wrong-*project*-resolution family (BUG-CRX-080/093/101/133,
  which substitutes the wrong *project* but the record id itself, once scoped to a project, is usually
  correct or cleanly "not found"). Here, the project field is unstable AND the actual record id targeted is a
  different, real, unrelated record within whichever project ends up resolved — meaning even a user who
  correctly reads the (admittedly wrong) project name on the confirm card could still be misled, because nothing
  on the card names the space by its real title ("Engineering Docs") — only a bare numeric id a user has no
  easy way to recognize as wrong without separately checking. Given this is a **destructive, irreversible**
  action (cascade-deletes all nested content) targeting the wrong real record, this is one of the more severe
  findings of this QA cycle — kept as its own bug given the distinct mechanism (wrong target *record*, not
  just wrong project) and severity (Critical: destructive + silent + reproducible).
