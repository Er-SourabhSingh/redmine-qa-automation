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

## Suite status

Drafted 2026-11-05, not yet executed. Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §7.
