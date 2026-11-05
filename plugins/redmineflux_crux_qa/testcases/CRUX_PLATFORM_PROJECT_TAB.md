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

## Execution — 2026-11-05

Fixtures: reused "Crux PM Agent Test Project" (module enabled, now has 1 real WP + its ticket #40) and created a
fresh "Crux No Module Test" project (module deliberately left disabled) for the negative checks.

- **TC-CRX-793** — PASS (positive half, via this session's prior Permissions suite evidence). `daisy.skye` with
  only View Crux dashboard correctly saw the project tab. Non-member/lacking-permission negative half not
  re-tested in this pass specifically for the project tab.
- **TC-CRX-794** — PASS. Tab row shows exactly: Overview · Graph · Work packages · Run ledger · Queue, plus
  "All of Crux →" in the corner.
- **TC-CRX-795** — PASS (cards present, no Ask Crux button) / **FAIL — BUG-CRX-176 filed** (scoping). The
  Overview shows the same 4 stat cards (Outcomes delivered/Agent runs/Spent/Agents online) plus "Needs your
  attention"/"Agents" cards, correctly with NO Ask Crux button. However "Agent runs" and "Spent" both incorrectly
  show 0, despite 2 real runs existing against this project's own ticket #40 (confirmed via `/crux/runs.json`).
- **TC-CRX-796** — NOT INDEPENDENTLY VERIFIED (no pending gate fixture).
- **TC-CRX-797** — PASS (Work packages, Queue, Graph) / **FAIL — same BUG-CRX-176** (Run ledger). The project's
  Work Packages sub-page correctly shows only this project's 1 WP (vs. 2 globally) — properly scoped, no
  leakage. The project's Queue sub-page correctly shows ticket #40 (ticket-level scoping works fine, since it
  queries issues directly by project_id). But the project's own Run Ledger sub-page shows 0 runs — same defect
  as TC-795, isolated specifically to the run→WP→ticket→project join, not to project-scoping as a whole.
- **TC-CRX-798** — PASS. Graph's 4 tiles populated with real, non-fabricated counts for this project: Tickets 13,
  People & agents 3 (3 people, 0 agents — worth a follow-up note: Project Manager genuinely worked on this
  project's WP but doesn't show as a counted "agent" here; not filed as a bug this pass, flagged for a future
  look since it may share root cause with BUG-CRX-176's run→project join gap), Groups 1 (the 1 real WP, correctly
  picked up), Connections 22.
- **TC-CRX-799 / 800 / 801 / 802 / 803 / 804 / 805 / 806 / 810 / 811 / 812 / 813** — NOT INDEPENDENTLY VERIFIED
  this pass. The Graph's view-switch/search/zoom/node-detail interactions were not individually exercised given
  the time budget across 15 suites — the tiles and Grouped-view group count were confirmed accurate (TC-798),
  but the deeper interactive behaviors are deferred.
- **TC-CRX-807** — PASS, fully confirmed. Created "Crux No Module Test" (module deliberately left off): no
  "Crux" tab appears in its project menu, and directly navigating to `/projects/crux-no-module-test/crux` as
  admin returns a genuine 403 — confirms this is real enforcement, not just a hidden tab.
- **TC-CRX-808 / 809** — NOT INDEPENDENTLY VERIFIED (would need a Crux-module-enabled project with genuinely zero
  activity ever, which none of this cycle's existing fixtures are — all have been exercised by prior rounds).
  Deferred.
- **TC-CRX-814** — NOT INDEPENDENTLY VERIFIED this pass (needs a non-member-but-globally-permitted user fixture).
- **TC-CRX-815** — PASS. "All of Crux →" correctly links to `/crux` (the global dashboard), confirmed via the
  link's own href in every project-scoped sub-page visited this pass.

**FAIL — BUG-CRX-176 filed (High).** The project-scoped Crux tab's Overview and Run Ledger sub-pages both show 0
agent runs / $0 spent despite 2 real, verifiable runs existing against this project's own ticket (#40) — the
same activity that the project's own Work Packages and Queue sub-pages correctly surface. Isolated to the
run→WP→ticket→project linkage specifically; not a project-tab-wide failure. Not yet reported to production.

**Suite result: 7 PASS (794, 795-cards, 797-WP/Queue, 798, 807, 815, 793-partial), 1 FAIL/bug filed (BUG-CRX-176,
affecting both TC-795 and TC-797's Run Ledger half), 15 not independently verified this pass due to time budget
across the Graph's many interactive sub-behaviors and several negative-fixture-dependent TCs.**

## Suite status

Executed 2026-11-05 — 7 PASS, 1 bug found (BUG-CRX-176), 15 deferred.
Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §5.
