# Bug Report Template

- Bug ID: BUG-CRX-062
- Production Redmine Issue ID: #123104
- Title: Project Manager explicitly and confidently claims "removing a user from a project membership is not yet supported through this chat interface" — false; `redmineflux_core_delete_project_membership` is fully implemented in the MCP tool catalog
- Redmine version: 6.0-bookworm (new local Docker instance)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Project Manager agent)
- Plugin version: 0.62.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-10-10

## Steps to reproduce

1. As admin, with `luna.blossom` already a Reporter member of "Crux PM Agent Test Project" (membership id=3, added via native UI since BUG-CRX-060 blocks adding via chat), in a fresh Ask Crux chat: "Remove luna.blossom from the Crux PM Agent Test Project."
2. Observe Crux correctly identifies "Luna Blossom in the project as a Reporter (membership id=3)" — so it genuinely found the right membership — but then states deletion "is not yet supported through this chat interface... requires direct Redmineflux admin access or a different interface," and gives step-by-step native-UI instructions instead.
3. Independently confirm via MCP server source (`/app/src/tools/core.py:2156-2173`): `redmineflux_core_delete_project_membership(project_id, membership_id)` is fully implemented — calls `DELETE /memberships/{membership_id}.json`, returns `"Deleted membership id={membership_id}."` Not a stub, not disabled.
4. Confirm via native UI (`/projects/crux-pm-agent-test-project/settings/members`) that Luna Blossom is still listed as Reporter — unchanged.

## Expected result

- Since Crux had already resolved the exact membership id (3) needed, it should propose a genuine confirm card for `Core Delete Project Membership` with that id, and real Confirm/Cancel buttons.
- At minimum, if the tool genuinely weren't exposed to this agent for some policy reason, Crux should not assert it "is not yet supported" as a blanket technical fact — that phrasing tells the user/admin the capability doesn't exist in the product at all, when it demonstrably does.

## Actual result

Crux's reply: *"I found Luna Blossom in the project as a Reporter (membership id=3). However, **removing a user from a project membership is not yet supported through this chat interface.** The available tools cover reading project memberships and creating new ones, but deletion of an existing membership requires direct Redmineflux admin access or a different interface."* — followed by manual native-UI instructions.

Every factual claim in this message is wrong or contradicted by this session's own findings:
- "Deletion... is not yet supported" — **false**, confirmed via MCP source read (`redmineflux_core_delete_project_membership`, core.py:2156).
- "The available tools cover... creating new ones" — **also false**, per this session's BUG-CRX-060: creating a membership via chat does not work either (it stalls on a token-budget cutoff before ever calling `create_project_membership`).

So in one short message, Crux makes two confident, specific, and both-false claims about what its own tool surface can and cannot do — it both overstates one broken capability (create) and denies an actually-working one (delete) in the same breath.

## Retest — 2026-10-26 (STILL BROKEN, different failure shape)

Retested live on a freshly rebuilt instance (new laptop, Docker stack recreated from `C:\crux-redmine`, fresh pulled code; `luna.blossom` re-added as Reporter, membership id=1 this time, via native UI since BUG-CRX-060 still blocks adding via chat).

- Re-sent "Remove luna.blossom from the Crux PM Agent Test Project." — this time it did **not** reach the original "is not yet supported" false-denial text at all. Instead it stalled on BUG-CRX-060's per-turn token-budget cutoff: *"Now let me load the core group's write tools:(Stopped: this turn's token budget was reached; the answer above may be partial.)"*
- "Ask again" — stalled again, same shape, different sentence: *"Let me get the full list of available groups:(Stopped: this turn's token budget was reached; the answer above may be partial.)"* — 2/2.
- Independently confirmed via native UI (`/projects/crux-pm-agent-test-project/settings/members`) that Luna Blossom is still listed as Reporter — unchanged, no deletion occurred.

**Net effect: still broken, but via a different failure mode than originally documented** — the dev's fix attempt (if any) appears to have changed how this request fails rather than fixing it: it no longer confidently claims deletion "is not yet supported" (the originally-filed false statement), but it also never reaches a working confirm card — it now dies in BUG-CRX-060's tool-discovery stall before any answer is produced. This is consistent with BUG-CRX-060 and BUG-CRX-061/062 sharing a common upstream write-proposal-pipeline defect (as already hypothesized in BUG-CRX-060's file) — fixing one entity's resolution path can just make a different entity hit the shared stall instead of a shared false-denial.

Not reported as fixed — left in `bugs/open/`, no production status sync performed.

## Evidence

### Screenshot

![Crux's false "not yet supported through this chat interface" claim for deleting a membership](../../screenshots/BUG-CRX-062/false-denial-delete-membership-not-supported.png)

### Console / log

- MCP source (`/app/src/tools/core.py:2156-2173`), `redmineflux_core_delete_project_membership` — fully implemented, calls `DELETE /memberships/{membership_id}.json`.
- Native UI: `/projects/crux-pm-agent-test-project/settings/members` still lists Luna Blossom as Reporter after this exchange — confirms no write was attempted, consistent with the chat's own (false) claim that it can't do this.

## Retest — 2026-10-12 (STILL BROKEN)

Retested live after the Crux stack rebuild (fresh `mcp`/`crux-core` builds, confirmed healthy catalog).

- Re-sent "Remove luna.blossom from the Crux PM Agent Test Project." — still gets a false denial, now reworded to the same generic **"I couldn't find a tool for this here, so I can't do it from this chat..."** text seen on BUG-CRX-061's current wording (rather than the original "not yet supported through this chat interface").
- Confirmed via source grep that `redmineflux_core_delete_project_membership` still exists (`core.py:2182`) — the denial is still false.

![Retest — still a false denial, reworded text, tool confirmed to exist](../../screenshots/BUG-CRX-062/retest-2026-10-12-stillbroken.png)

Not reported as fixed — left in `bugs/open/`, no production status sync performed.

## Duplicate check

- Duplicate found: No — checked `bugs/_duplicates.md` and `bugs/_index.md`. Same false-capability-denial family as BUG-CRX-029/032/034/050/061, but this is the sharpest instance yet: a specific, confident, unhedged "not yet supported" assertion (not a vague "couldn't confirm" like BUG-CRX-061) for a tool that is not only present but was one call away from being used correctly (the agent had already found the right membership id). Also notable for being self-contradictory alongside BUG-CRX-060 in the same breath, claiming create "works" when this session already proved it doesn't.
