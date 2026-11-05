# Test Suite — Crux Platform: Project Crux Tab (Overview, Graph, scoped pages)

> Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §5. Plugin: redmineflux_crux. Redmine 6.0-bookworm,
> localhost:3015. URL: `/projects/<id>/crux`.
> TC range: TC-CRX-793 to TC-CRX-815.

## Fixtures needed

- A project with the Redmineflux Crux module enabled, with real Crux activity (runs, a Work Package, some
  people+agent activity) within the last 90 days.
- A second project WITHOUT the module enabled (for the "tab doesn't appear" negative check).
- A project large enough to possibly trigger the "large project, partial graph" banner (if feasible — else note
  as not exercised).
- A genuinely cross-project Work Package or ticket relationship, if one exists, to test "Spans projects…" in the
  Graph's side panel.

## Positive Cases — Overview, Work packages / Run ledger / Queue sub-pages

- **TC-CRX-793** — Project Crux tab requires module + membership + View Crux: confirm a project member with View
  Crux dashboard sees the tab; a non-member, or a member lacking the permission, does not.
- **TC-CRX-794** — Tab row shows exactly: Overview · Graph · Work packages · Run ledger · Queue, plus "All of
  Crux →".
- **TC-CRX-795** — Overview shows the same 5 cards as the global Dashboard, correctly scoped to just this
  project's data, with NO Ask Crux button (confirm it's genuinely absent, not just visually hidden).
- **TC-CRX-796** — Overview's Review button uses the project-level Approve permission (cross-reference
  TC-CRX-768 from the Work Packages suite).
- **TC-CRX-797** — Work packages / Run ledger / Queue sub-pages are correctly scoped to this project only — spot
  check against the global equivalents to confirm no cross-project leakage.

## Positive Cases — Graph

- **TC-CRX-798** — 4 summary tiles populate: Tickets, People & agents, Groups (work packages + versions),
  Connections — confirm counts are non-fabricated (cross-check against known fixture counts).
- **TC-CRX-799** — View switch Grouped/Focus/Table all render without error, and the Show-filters checkboxes
  (Tickets/People/Agents/Work packages/Versions) each correctly hide/show their category when unchecked.
- **TC-CRX-800** — Search with autocomplete: type a partial ticket/person/agent name, confirm suggestions appear,
  and picking one switches the view to Focus centered on that item.
- **TC-CRX-801** — Grouped view: one bubble per Work Package/version plus an "Other tickets" bucket; people shown
  on the left, agents on the right; clicking a bubble opens it with a working "All groups ›" breadcrumb back.
- **TC-CRX-802** — Focus view: the focused item is centered with real neighbours in a ring; clicking a neighbour
  re-centers focus on it; the breadcrumb correctly tracks up to 6 steps of navigation history.
- **TC-CRX-803** — Table view: a heat-map of people/agents × groups; clicking a cell lists the real tickets behind
  that intersection.
- **TC-CRX-804** — Side panel on node click: shows name/kind, "Spans projects…" only when genuinely true, a
  working "Open in Redmine →" link, up to 40 real connections, and working "Focus on this"/"Open this group"
  actions.
- **TC-CRX-805** — Zoom controls (+/−/Fit) work in Grouped and Focus views, and are absent/disabled in Table view.
- **TC-CRX-806** — 90-day default window: confirm activity older than 90 days is excluded from the graph by
  default (if a way exists to verify this without waiting 90 real days — e.g. via a deliberately old fixture
  record, or accept as a documented-only check if not independently verifiable).

## Negative / Boundary Cases

- **TC-CRX-807** — No module → no tab, not even for admin: confirm the project without the Crux module enabled
  shows no "Crux" tab in its project menu at all, even to a site admin.
- **TC-CRX-808** — No-activity banner: open the Graph for a project with zero Crux activity ever — confirm "No
  Crux activity in this project yet" (or equivalent), not a blank/broken page.
- **TC-CRX-809** — No-graph-yet banner: distinguish this from the no-activity case if the two are actually
  different messages per the dev reference — verify both exist and fire under their own correct conditions.
- **TC-CRX-810** — Large-project partial-graph banner: if achievable, confirm the "sent only part of its graph"
  banner appears for an oversized project graph; otherwise mark not exercised.
- **TC-CRX-811** — Search with no matches: type a nonsense string — confirm an honest "no matches" state, not a
  broken/empty dropdown with no feedback.
- **TC-CRX-812** — "Fit" zoom genuinely re-fits: zoom in/out manually, then click Fit — confirm the view resets to
  show the full graph, not a stale zoom level.
- **TC-CRX-813** — Unchecking all Show-filters checkboxes: confirm the graph becomes empty/shows nothing rather
  than ignoring the filters or crashing.
- **TC-CRX-814** — A non-member cannot open the project's Graph even with global View Crux: confirm project
  membership is required in addition to the global permission (module+membership+permission, all 3, per
  TC-CRX-793).
- **TC-CRX-815** — "All of Crux →" link correctly routes to the global `/crux` dashboard, not a project-scoped
  URL.

## Suite status

Drafted 2026-11-05, not yet executed. Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §5.
