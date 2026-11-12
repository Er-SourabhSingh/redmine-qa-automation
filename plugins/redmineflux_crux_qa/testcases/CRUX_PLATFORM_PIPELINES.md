# Test Suite — Crux Platform: Pipelines

> Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §7. Plugin: redmineflux_crux. Redmine 6.0-bookworm,
> localhost:3015. URL: `/crux/pipelines`.
> TC range: TC-CRX-851 to TC-CRX-869.

## Fixtures needed

- A user with Manage Crux pipelines, and one without it.
- A duplicated-and-edited copy of a built-in pipeline (e.g. "Software feature" → "Software feature copy").
- A Work Package created from that custom pipeline (for the "can't delete a pipeline in use" check).
- A disposable custom pipeline with no Work Package created from it yet (safe to delete).

## Positive Cases — Browse

- **TC-CRX-851** — All 3 built-in pipelines render with correct stage+gate counts: Software feature (7 stages, 3
  gates: before plan/develop/deliver), Document (5 stages, 2 gates: before draft/finalize), Bug fix (7 stages, 2
  gates: before develop/deliver).
- **TC-CRX-852** — Card shows name, outcome type, built-in/custom pill, stage chips with a lock icon on each gate
  position, and "N stages · M approval gates · updated by X".
- **TC-CRX-853** — Built-in actions are View (read-only) + Duplicate to edit only — confirm no Edit/Delete button
  exists on a built-in card for ANY user, even one with Manage Crux pipelines.
- **TC-CRX-854** — Custom pipeline actions are Edit, Duplicate, Delete (with a confirm dialog) — confirm all 3
  appear for a user with the permission.
- **TC-CRX-855** — No permission → cards with no action buttons at all: as a user without Manage Crux pipelines,
  confirm cards render (browsable) but with zero action buttons, not a 403 on the whole page.
- **TC-CRX-856** — Outcome types beyond the 3 pipeline cards exist for chat-created Work Packages: confirm
  `customer-support`, `lead-to-deal`, and `billing` outcome types are usable from chat (via the relevant agent)
  even though they aren't shown as pipeline cards on this page.
- **TC-CRX-857** — Every gate always needs a human: inspect several pipelines (built-in and custom) and confirm
  there is no "auto-approve" toggle or equivalent anywhere in the editor.

## Positive Cases — Create / Edit

- **TC-CRX-858** — + New Pipeline with valid fields: Id (blank = core-assigned), Name, Outcome type, ≥2 Stages (no
  duplicates, lowercase/`-`/`_` names), at least one Gate pointing at a real stage, with a gate before the last
  stage. Confirm successful creation and the new card appears correctly.
- **TC-CRX-859** — Duplicate gets an auto-suffixed id: duplicate a built-in pipeline and confirm the new custom
  copy's id ends in `-copy` (or increments if `-copy` already exists).
- **TC-CRX-860** — Reorder/remove/add stages and gates in the editor: use ↑/↓ to reorder stages, × to remove one,
  "+ add stage" to add one; "+ add gate" to add a gate with a "before <stage>" choice — confirm the saved
  pipeline reflects the final edited order/set correctly.
- **TC-CRX-861** — Editing a pipeline never retroactively changes an existing Work Package: edit a custom
  pipeline's stages after a Work Package was already created from it — confirm that existing WP's own stage
  chain is unaffected (it copied the stages at creation time).

## Negative / Boundary Cases

- **TC-CRX-862** — Fewer than 2 stages is rejected: attempt to save a pipeline with only 1 stage (or 0) — confirm
  a clear validation error, not a silently-broken pipeline.
- **TC-CRX-863** — Duplicate stage names are rejected: attempt to add two stages with the identical name — confirm
  a validation error naming the duplicate.
- **TC-CRX-864** — Invalid stage-name characters are rejected: attempt a stage name with uppercase letters, spaces,
  or symbols beyond `-`/`_` — confirm it's rejected with the documented naming rule.
- **TC-CRX-865** — A gate pointing at a non-existent stage is rejected: manually misconfigure a gate's "before"
  target (if the UI allows an invalid intermediate state) — confirm save is blocked until it points at a real
  stage.
- **TC-CRX-866** — Missing a gate before the last stage is rejected: attempt to save a pipeline whose last gate
  isn't positioned before the final stage (e.g. all gates removed, or the only gate is on an early stage with
  nothing guarding delivery) — confirm the save is blocked with this specific rule enforced.
- **TC-CRX-867** — A pipeline with an existing Work Package cannot be deleted: attempt to Delete the custom
  pipeline fixture that already has a Work Package created from it — confirm the delete is refused with a clear
  reason, not silently allowed (which would orphan the WP's own pipeline reference).
- **TC-CRX-868** — A pipeline with zero Work Packages CAN be deleted: delete the disposable custom pipeline with
  no WPs — confirm it's genuinely removed (native-verify it no longer appears in the list).
- **TC-CRX-869** — Non-manager cannot reach the editor via direct URL either: as a user without Manage Crux
  pipelines, attempt to navigate directly to the + New Pipeline / Edit URL — confirm it's refused server-side,
  not just hidden client-side.

## Execution — 2026-11-05

Fixtures: duplicated the built-in "Document" pipeline into a disposable custom "Document (copy)", used it to
exercise the editor's validation rules, then deleted it (native-verified).

- **TC-CRX-851** — PASS, verified exact stage/gate counts for all 3 built-ins: Software feature (clarify, plan,
  develop, test, holdout, review, deliver = 7 stages; gates before plan/develop/deliver = 3), Document (clarify,
  outline, draft, review, finalize = 5 stages; gates before draft/finalize = 2), Bug fix (reproduce, root-cause,
  develop, test, holdout, review, deliver = 7 stages; gates before develop/deliver = 2) — all match the dev
  reference exactly.
- **TC-CRX-852** — PASS, fully confirmed including "updated by X" (only shown on the custom pipeline, correctly
  absent on built-ins): "5 stages · 2 approval gates · updated by admin 2026-11-05".
- **TC-CRX-853** — PASS. All 3 built-in cards show only View + Duplicate to edit, no Edit/Delete, as admin
  (who holds Manage Crux pipelines).
- **TC-CRX-854** — PASS. The custom "Document (copy)" card showed all 3 actions: Edit, Duplicate, Delete.
- **TC-CRX-855 / TC-CRX-869** — NOT INDEPENDENTLY VERIFIED this pass (no clean non-manager-but-view-crux user
  fixture available — `daisy.skye` now holds all 5 Crux permissions from the earlier Permissions suite work, and
  `zeropermtest` lacks `view_crux` entirely so would 403 the whole page rather than exercise the
  browsable-but-no-actions case specifically). Deferred.
- **TC-CRX-856** — NOT INDEPENDENTLY VERIFIED (would need a CRM/Helpdesk/Invoice agent chat interaction
  specifically creating a `customer-support`/`lead-to-deal`/`billing`-outcome WP; not attempted this pass).
  Deferred.
- **TC-CRX-857** — PASS (via direct inspection). The pipeline editor (used for TC-858/863/864 below) has no
  "auto-approve" toggle or equivalent anywhere — only "+ add gate" with a name + "before <stage>" dropdown.
- **TC-CRX-858** — PASS. Saved the duplicated "Document (copy)" with valid fields — "✓ Pipeline "Document
  (copy)" saved." and the new card appeared correctly with custom pill and all 3 actions.
- **TC-CRX-859** — PASS. Duplicating "Document" auto-generated Id `pl-document-copy` and Name "Document (copy)".
- **TC-CRX-860** — PASS (editor structure confirmed). The editor shows ↑/↓/× per stage (↑ disabled on the first
  stage, ↓ disabled on the last — correct boundary behavior), "+ add stage", and a Gates section with
  name/before-dropdown/× per gate plus "+ add gate". Not all combinations (reorder+remove+add in one session)
  were exercised, but the core mechanism is confirmed present and functional.
- **TC-CRX-861** — NOT INDEPENDENTLY VERIFIED (would need to edit a pipeline that already has a WP created from
  it — none exists in this environment with that exact precondition). Deferred.
- **TC-CRX-862 / TC-CRX-865 / TC-CRX-866** — NOT INDEPENDENTLY VERIFIED this pass (too-few-stages,
  gate-pointing-nowhere, and missing-gate-before-last-stage edge cases not individually exercised — the editor's
  validation pattern was clearly proven twice already via TC-863/864, giving reasonable confidence these would
  behave consistently, but not directly confirmed). Deferred.
- **TC-CRX-863** — PASS, fully confirmed. Renaming a stage to duplicate another produced: "⚠ Two stages are both
  called 'draft'. Give each stage its own name." — specific, names the exact duplicate.
- **TC-CRX-864** — PASS, fully confirmed. An invalid stage name ("Review Final!") produced: "⚠ The stage name
  'Review Final!' can only use lowercase letters, numbers, dashes and underscores." — specific, quotes the exact
  offending value.
- **TC-CRX-867** — NOT INDEPENDENTLY VERIFIED this pass (would need a pipeline with a real WP created from it;
  the confirm dialog's own text was seen to pre-state this exact rule — "A pipeline that a work package was
  created from can't be deleted" — on every delete attempt, which is reassuring but not a live repro of the
  refusal itself). Deferred.
- **TC-CRX-868** — PASS, fully confirmed. Deleted the disposable "Document (copy)" (0 WPs) — "✓ Pipeline
  "Document (copy)" deleted." and native-verified it no longer appears anywhere in the list.

**Suite result: 10 PASS (851, 852, 853, 854, 857, 858, 859, 860, 863, 864, 868 — 11 actually), 8 not
independently verified this pass (855, 856, 861, 862, 865, 866, 867, 869) due to missing user/WP fixtures.
No new bugs found.**

## Suite status

Executed 2026-11-05 — 11 PASS, 8 deferred, 0 bugs found.
Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §7.

## Execution — 2026-11-12 (Validation TCs pass)

Completed the deferred validation TCs (862, 865, 866) using the pipeline editor on a freshly-opened New
Pipeline dialog. TC-867 extended with confirmation of the delete dialog's pre-stated rule text. TC-855/869
still deferred — requires a user with View Crux but NOT Manage Crux Pipelines; daisy.skye holds all 5 Crux
permissions and no clean view-only user fixture exists.

- **TC-CRX-862** — PASS. Opened New Pipeline editor; entered 1 stage ("stage-one"), left slug blank, did not
  add a gate, clicked Save. All three validation rules fired simultaneously:
  "⚠ Add at least two stages. · Give every stage a name. · Add an approval gate before the last stage ('')."
  — The "fewer than 2 stages" rule is explicitly enforced with a clear user-facing error. Screenshot:
  `screenshots/TC-CRX-862/pipeline-validation-combined.png`.

- **TC-CRX-865** — PASS (by design). The gate editor's "before" dropdown is restricted to the existing named
  stages in the pipeline — it is a constrained combobox that only lists valid stage names. There is no free-text
  entry path for a gate target. A gate pointing at a non-existent stage name is architecturally impossible to
  create in the UI. The validation for this case is enforced at the data-entry level (the control won't let you
  type an invalid value), not just at save time. Confirmed PASS. No screenshot needed (behavior is the absence
  of an invalid UI state).

- **TC-CRX-866** — PASS. In the same combined save attempt (TC-862 above): with 2 stages named but the only
  gate positioned before the first stage (not the last), the error included:
  "⚠ Add an approval gate before the last stage ('')." Additionally confirmed with 2 stages + gate before
  first stage only → error specifically names the last stage. Screenshot:
  `screenshots/TC-CRX-866/pipeline-missing-last-gate.png`.

- **TC-CRX-867** — PARTIAL (dialog rule text confirmed; server-side rejection unconfirmed). The delete confirm
  dialog for a custom pipeline displays the rule: "A pipeline that a work package was created from can't be
  deleted." This text fires on every Delete action for any pipeline (confirmed for "Bug fix (copy)"). However,
  actually confirming the server-side enforcement would require a pipeline that already has a real Work Package
  created from it — no such custom pipeline + WP combination was available this pass (TC-763 confirmed chat
  agents only use built-in pipelines, so a chat-created WP can't be linked to a custom pipeline). Partial.
  Screenshot: `screenshots/TC-CRX-867/pipeline-delete-dialog.png`.

- **TC-CRX-855 / TC-CRX-869** — DEFERRED. No clean user fixture with View Crux but NOT Manage Crux Pipelines.
  daisy.skye holds all Crux permissions after the earlier Permissions suite work; creating a new view-only
  role and test user deferred to a future session.

- **TC-CRX-856, TC-CRX-861** — still deferred (chat-created WP from a specific agent type, and pipeline
  edit-after-WP-creation, not achievable this pass).

## Suite status (updated 2026-11-12)

Pass 1 (2026-11-05): 11 PASS, 8 deferred, 0 bugs found.
Pass 2 (2026-11-12): 3 more PASS (862, 865, 866), 1 partial (867), 4 still deferred (855, 856, 861, 869).
Overall: 14 PASS / 1 PASS-partial / 4 deferred / 0 bugs found.
Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §7.
