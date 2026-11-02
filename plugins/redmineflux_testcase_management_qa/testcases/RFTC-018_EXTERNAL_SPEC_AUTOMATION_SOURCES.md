> ⚠️ **EXTERNAL SOURCE — DO NOT MERGE WITH THIS PLUGIN'S OWN TC-TCM-xxx SUITES, AND SEPARATE FROM THE V1
> CYCLE FILE** ⚠️
>
> These test cases verify **production feature #123568** ("rftc-018 — Auto-group automation tests into
> \"sources\""), part of **Testcase Management plugin Release 7.3.0**. Out of
> `V1_7.1.0_EXTERNAL_RELEASE_CYCLE.md`'s scope.
>
> **ID prefix**: every case here is `RFTC018-<n>`.
>
> **Pre-release test DESIGN, not yet independently executed.** The feature's code lives on branch
> `release/7.3.0` (commit `329311d`) — **`master` does not have it yet**, and this repo's usual QA
> environment (Docker `localhost:3000`) runs `master`. Every case below was authored directly from the
> real implementation (`app/services/automation_source_resolver.rb`,
> `app/services/ci_result_ingest_service.rb`, `app/models/automation_source.rb`, the two new
> migrations, `API.md` §source field, and the developer's own `test/unit/automation_source_resolver_test.rb`
> + `test/unit/ci_result_ingest_service_test.rb` rftc-018 section), not from the ticket description
> alone — but no independent live/automated run has been performed yet. Every `Actual Result` below is
> intentionally left as **Not Executed**; this file's job is complete, accurate test design ahead of
> that execution pass. The developer's own planning doc
> (`backlog/planning/rftc-018-feature-automation-sources.md`) records their own Quality Gates as
> "manually verified live against the running dev instance" — that is the developer's self-check, not
> an independent QA pass, and is not treated as equivalent to execution here.
>
> **Written**: 2026-11-02, by reading the `release/7.3.0` branch source directly (not executed against
> a running instance this session).

# Test Cases — Redmineflux Testcase Management — rftc-018: Automation Sources (auto-grouping)

## Plugin
- Name: Redmineflux Testcase Management
- Version: branch `release/7.3.0`, commit `329311d` ("Add four roadmap features: automation sources,
  flaky-test detection, run comparisons, and exploratory sessions") — **not yet merged to `master`**
- Redmine version: 6.x (Docker `localhost:3000`, Postgres) once the branch is deployed there — not
  currently running this code; the container currently serves `master`
- Production ticket: #123568 (ztflux), done ratio 90%, status "In QA", Target Version "Testcase
  Management plugin Release 7.3.0 [04-11-2026]"

## Feature summary

Every CI-ingested result (via the existing `POST /testcase_ci/ingest_results.json`, rftc-016) is now
tagged with an auto-derived **`AutomationSource`** — a per-project catalog row representing "where a
batch of results came from" (a CI suite/job) — with **zero manual mapping step**.

`AutomationSourceResolver.derive_key` picks the most specific available signal, in strict precedence
order, and always produces a usable (non-blank) key:

1. an explicit **per-result** `source` field in that one result's payload
2. a **batch-level** `source` ingest param (applies to every result in the call that has none of its own)
3. the already-resolved **testsuite's name** (free — the suite is already resolved for matching)
4. the **namespace prefix** of the matched `automation_key` (drop the last segment split on `::`, `.`,
   or `/` — e.g. `com.app.LoginTests.test_x` → `com::app::LoginTests`; a key with no separator has no
   usable prefix and falls through)
5. final fallback: **`"CI / <environment>"`** — every result lands in *some* source, never blank

`AutomationSourceResolver.resolve!` is an idempotent find-or-create per `(project_id, key)`, guarded by
a Postgres advisory lock (`pg_advisory_xact_lock`, keyed on the literal project+key string — the same
technique `CiResultIngestService` already uses for defect-reuse) so two concurrent ingests that both
see a brand-new key for the first time cannot both insert and collide on the unique
`(project_id, key)` index. Each successful resolve bumps `last_seen_at` + `executions_count`.

Key design points worth testing explicitly:
- **Uniqueness is scoped per project** — the identical key string in two different projects is always
  two distinct `AutomationSource` rows, never shared.
- **`AutomationSource` validates `key` uniqueness case-insensitively** (`case_sensitive: false`), but
  `resolve!`'s own lookup (`AutomationSource.find_by(project_id:, key:)`) is a literal, case-sensitive
  match — see RFTC018-13 below for why this combination is worth a dedicated negative case.
- **A resolution failure never blocks the result write** — `resolve_source_for` in
  `CiResultIngestService` rescues `StandardError` around the whole resolve call; on failure the result
  is still written, just with `source_id` left `nil` ("ungrouped"), identical to any pre-rftc-018 row.
- **`has_many :issue_status_results, dependent: :nullify`** — if a source is ever removed (no admin UI
  exists yet to do this in v1, per the planning doc's Out of Scope), its linked executions must lose
  only their categorization, never be destroyed.
- No admin UI to create/rename/merge sources in v1 — sources are **ingest-time-only**, auto-created.

---

### RFTC018-1 (SACRED): Precedence 1 — an explicit per-result `source` wins over every other signal

**Priority:** P1 — this is the top of the precedence chain; if it's wrong, every lower level is moot
**Steps:** CI-ingest one result for a test case that also belongs to a named suite and has an
`automation_key` set, with the result payload carrying its own `source: "nightly-regression"` AND the
batch-level `source` param set to a different value (`"batch-source"`).
**Expected Result:** The result's own `source_name` is `"nightly-regression"` (not the batch value, the
suite name, or the automation_key prefix); the created `AutomationSource.kind` is `"explicit"`.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives
on branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC018-2: Precedence 2 — batch-level `source` applies when a result supplies none of its own

**Priority:** P1
**Steps:** CI-ingest a batch with `source: "ci-batch-7"` at the top level and a result with no
per-result `source` field, for a test case that also belongs to a named suite.
**Expected Result:** The result's `source_name` is `"ci-batch-7"`, not the suite's name — batch-level
beats testsuite-name.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives
on branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC018-3: Precedence 3 — falls back to the already-resolved testsuite's name

**Priority:** P1
**Steps:** CI-ingest a result with neither a per-result nor a batch-level `source`, for a test case that
belongs to exactly one suite (name e.g. `"Checkout"`) and has no `automation_key` match in play.
**Expected Result:** `source_name == "Checkout"` (the suite's own name); the created source's `kind` is
`"testsuite"`.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives
on branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC018-4: Precedence 4 — falls back to the `automation_key` namespace prefix when no suite name is available

**Priority:** P2 — a narrower path than RFTC018-3 (requires a suite-less match, which is itself an edge
case in `build_match_indexes`), but still a real documented precedence level
**Steps:** CI-ingest a result matched purely by `automation_key` (e.g. `com.app.LoginTests.test_valid`)
against a test case with no per-result/batch `source` and whose matched testsuite resolves to a blank
name scenario (or is otherwise unavailable to the resolver).
**Expected Result:** `source_name == "com::app::LoginTests"` (the namespace with the last segment
dropped, separators normalized to `::`); `kind == "automation_key_prefix"`.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives
on branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC018-5 (negative): An `automation_key` with no namespace separator has no usable prefix and falls through

**Priority:** P2 — confirms the prefix extraction is genuinely conditional, not a crash-and-fallback
**Steps:** CI-ingest a result matched by a bare `automation_key` with no `::`, `.`, or `/` in it (e.g.
`"test_valid"`), with no per-result/batch source and no suite name available.
**Expected Result:** `automation_key_namespace` returns `nil` (fewer than 2 segments after split), so the
resolver falls all the way through to the final fallback — `source_name == "CI / <environment>"`, not an
error and not an empty/garbage source name.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives
on branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC018-6 (SACRED): Precedence 5 — final fallback guarantees every result lands in *some* source

**Priority:** P1 — "no manual mapping step" only holds if this never produces a blank/nil source
**Steps:** CI-ingest a result with no per-result source, no batch source, no resolvable testsuite name,
and matched by raw numeric `id` or `subject` (not `automation_key`, so there is no automation-key prefix
candidate at all) — ingested against environment `"Staging"`.
**Expected Result:** `source_name == "CI / Staging"`; a real `AutomationSource` row is created with
`kind == "fallback"` — never a blank/nil source on any ingested result.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives
on branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC018-7 (SACRED): Idempotency — the same `(project, key)` resolves to ONE source across repeated ingests, never duplicated

**Priority:** P1 — this is the entire point of `find_or_create`; a duplicate here silently fragments
every rollup rftc-035's dashboard will ever show
**Steps:** CI-ingest result A with `source: "shared-suite"` in one call; in a **separate**, later ingest
call, submit a different test case's result also with `source: "shared-suite"` in the same project.
**Expected Result:** Exactly **one** `AutomationSource` row exists for `(project, "shared-suite")` after
both calls; its `executions_count` is `2` (not reset, not two separate rows at `1` each); the second
call's `source_id` in the response matches the first call's.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives
on branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC018-8 (SACRED/security): Cross-project isolation — the identical key string in two projects is always TWO distinct sources

**Priority:** P1 — a shared source row across projects would leak one project's automation health
rollup into another's dashboard (rftc-035)
**Steps:** CI-ingest a result with `source: "shared-key"` in Project A; CI-ingest a different result
with `source: "shared-key"` in Project B (a completely separate project).
**Expected Result:** `AutomationSource.where(key: "shared-key").count == 2` — two separate rows, scoped
by `project_id`, never reused across the project boundary, even though the literal key text is
identical.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives
on branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC018-9: The resolved `source_id` is actually persisted on the written execution row, not just in the response

**Priority:** P1 — the response payload reporting a `source_id` is not proof the DB row actually has it
**Steps:** CI-ingest one result with an explicit `source`; after the call, load the corresponding
`IssueStatusResult` row directly (e.g. via `rails runner` / DB query) rather than trusting the response.
**Expected Result:** `IssueStatusResult#source_id` on the persisted row equals the `source_id` reported
in the ingest response's `matched[].source_id` field.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives
on branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC018-10 (negative): A blank/empty-string `source` field in the payload is treated as absent, not as a literal empty key

**Priority:** P2 — `derive_key` strips and checks `.present?` at each level; an empty string must not
"win" the precedence slot it occupies
**Steps:** CI-ingest a result with `source: ""` (empty string) at the per-result level, while a valid
batch-level `source: "batch-value"` is also set.
**Expected Result:** The empty per-result string is treated as not-present (`explicit.present?` is
false after `.strip`), so the batch-level value `"batch-value"` is used instead — not an empty-string
source, not a crash.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives
on branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC018-11 (negative): Whitespace-only `source` values at every level are all correctly treated as blank

**Priority:** P3
**Steps:** CI-ingest a result where the per-result `source` is `"   "` (whitespace only) and the
batch-level `source` is also `"  "` (whitespace only), with a resolvable testsuite name available.
**Expected Result:** Both whitespace-only values are stripped to empty and treated as absent (same
`.present?` guard as RFTC018-10); resolution falls through to the testsuite-name level.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives
on branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC018-12 (SACRED/negative): A resolution failure never blocks the result write — the row is still written, just ungrouped

**Priority:** P1 — this is an explicit, deliberately-tested safety guarantee in the developer's own
suite (`test_source_resolution_failure_does_not_block_write`, stubbing `derive_key` to raise)
**Steps:** Force `AutomationSourceResolver` to raise an exception during resolution (e.g. simulate a DB
error, or reuse the developer's own stubbing technique if testing at the Ruby level is available) while
CI-ingesting an otherwise-valid result.
**Expected Result:** The ingest call still succeeds (`ok == true`); the result's `source_id` is `nil` in
both the response and the persisted row; no other part of the write (case status, defect linking,
duration) is affected. The failure is logged (`Rails.logger.error`), never raised to the caller.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives
on branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC018-13 (negative, FLAGGED AMBIGUITY — likely edge-case bug, not just an untested path): A same-name source differing only by case may silently fail to resolve instead of reusing the existing row

**Priority:** P2 — not confirmed as a bug (not independently executed), but the code paths below are
inconsistent with each other and worth a dedicated test before this ships
**Steps:** CI-ingest a result with `source: "Nightly"` (creates a source named exactly `"Nightly"`).
Then CI-ingest a second, different result with `source: "nightly"` (same text, different case) in the
**same project**.
**Expected Result:** Ambiguous by design intent — the model's own uniqueness validation
(`validates :key, ..., uniqueness: { scope: :project_id, case_sensitive: false }`) suggests `"Nightly"`
and `"nightly"` should be treated as the SAME logical source. But `resolve!`'s actual lookup
(`AutomationSource.find_by(project_id:, key: key)`) is a **literal, case-sensitive** match against the
new key `"nightly"`, which will not find the existing `"Nightly"` row. The following `create_source`
call will then raise `ActiveRecord::RecordInvalid` (blocked by the case-insensitive validator), get
rescued, and re-attempt `AutomationSource.find_by(project_id:, key: "nightly")` — which **also does not
match** the existing `"Nightly"` row (still case-sensitive) — returning `nil`. `resolve!` then returns
`nil`, meaning the second result silently gets **no source at all** (`source_id` stays nil, logged only
via the generic rescue in `resolve_source_for`), rather than either (a) reusing the existing `"Nightly"`
source, or (b) a clear "name collision" error. **This needs to be confirmed against the real running
code, not just the static read above** — record the actual observed behavior here when executed.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives
on branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.
This specific case is a **flagged code-reading finding**, not a confirmed bug — flag to the dev team for
confirmation regardless of this file's own execution status, since it may be worth fixing or clarifying
before merge to `master`.

---

### RFTC018-14 (SACRED/concurrency): Two concurrent ingests both seeing a brand-new key for the first time do not create two separate source rows

**Priority:** P1 — this is exactly what the Postgres advisory lock (`lock_source_scope!`) exists to
prevent; same risk shape as this repo's own RFTC009-F14 (concurrent bootstrap race) finding
**Steps:** Fire two CI ingest calls at the same project at effectively the same time, both using a
brand-new `source` key that has never been seen before in that project (e.g. two threads/processes
racing). Repeat the trial at least 3-5 times, not once — per this repo's own house lesson that a TOCTOU
window can pass cleanly on a single trial by luck (see `TESTCASE_MANAGEMENT_MEMORY.md`'s RFTC009-F14
entry).
**Expected Result:** Across every trial, exactly ONE `AutomationSource` row exists for that key in that
project afterward — the advisory lock serializes the two concurrent `resolve!` calls so the second one
finds the first one's row instead of racing it on the unique index.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives
on branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC018-15 (security/negative): A `source` string containing HTML/script content is stored safely and does not execute wherever it later renders

**Priority:** P1 — this plugin has a recent, confirmed history of exactly this failure class
(BUG-TCM-070, an ApexCharts chart executing an injected subject on the Most Failed Tests report) — any
new field that flows into a dashboard deserves the same scrutiny before it ships, not after
**Steps:** CI-ingest a result with `source: "<img src=x onerror=alert(1)>"` (or an equivalent payload
shaped like the already-confirmed BUG-TCM-070 vector). Separately, check how `source_name`/`source.name`
is rendered everywhere it reaches a page — at minimum rftc-035's Automation Dashboard
(`app/views/automation_dashboard/_source_table.html.erb:16`, `<td><%= source[:source_name] %></td>`,
plain ERB interpolation with no `raw`/`html_safe` found in a static read — expected to auto-escape, but
not yet independently confirmed live).
**Expected Result:** The source's `name`/`key` are stored verbatim (no server-side stripping is evident
in the resolver), but every rendering location escapes it as inert text — no `alert()` fires anywhere
the source name is displayed. **Cross-reference**: this exact source name also appears on rftc-035's
Automation Dashboard — the corresponding case there (see `RFTC-035`'s own file) must independently
re-verify the same payload on that page, not assume this case alone covers it.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives
on branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC018-16: `API.md`'s documented precedence order matches the actual code's precedence order exactly

**Priority:** P2 — a correct implementation with a wrong doc is still a real defect for any integrator
reading the API reference
**Steps:** Compare `API.md`'s "Automatic source grouping (rftc-018)" prose (listing the 5-step
precedence) line-by-line against `AutomationSourceResolver.derive_key`'s actual code order.
**Expected Result:** Both list, in the same order: (1) per-result `source`, (2) batch-level `source`,
(3) resolved `testsuite_id`'s name, (4) `automation_key` namespace prefix, (5) `"CI / <environment>"`
fallback. Confirmed matching on a static read of both files as of commit `329311d` — still worth a
quick re-confirmation at execution time in case either side drifts before merge.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives
on branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC018-17: A newly-created source's `name` defaults to its `key` when no separate display name is set

**Priority:** P3 — a model-level data-integrity nicety, not a user-facing flow, but worth confirming
since `name` (not `key`) is what every dashboard actually displays
**Steps:** Trigger `AutomationSourceResolver.create_source` (indirectly, via any first-time ingest for a
brand-new key) and inspect the created row's `name` column.
**Expected Result:** `name == key` exactly (the model's `before_validation :default_name_to_key` sets it
when `name.blank?`, and `create_source` itself also explicitly passes `name: key`) — never a blank name
on a freshly created source.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives
on branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC018-18 (negative/data-integrity): Deleting an `AutomationSource` must nullify, never destroy, its linked executions

**Priority:** P2 — no admin UI exists yet to do this in v1 (confirmed Out of Scope in the planning doc),
so this can currently only be exercised via direct console/DB deletion — still worth confirming the
association behaves as documented before any future admin UI is built on top of it
**Steps:** With at least one `IssueStatusResult` row carrying a real `source_id`, delete the
corresponding `AutomationSource` record directly (e.g. via `rails runner`, since no UI path exists).
**Expected Result:** The `AutomationSource` row is gone; the previously-linked `IssueStatusResult` row(s)
still exist, unchanged except `source_id` is now `nil` — confirmed by
`has_many :issue_status_results, dependent: :nullify` and the unit test
`test_automation_source_association_is_nullify_not_destroy` asserting exactly this reflection option.
Execution history must never be destroyed as a side effect of removing its grouping.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives
on branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

## Not Executed

Every case above is unexecuted — see the header note. In addition, the following could not be reasoned
about from a static code read alone and need a live pass:

- **RFTC018-13's actual observed behavior** (the case-sensitivity mismatch) — the write-up above is a
  prediction from reading three code paths together, not a confirmed trace through the real interpreter;
  it must be the first thing re-verified live, since if correct it represents a real (if narrow) silent
  data-loss-of-categorization bug.
- **RFTC018-14's concurrency outcome** — advisory-lock correctness under genuine concurrent load can only
  be confirmed by actually racing two real requests against a Postgres-backed instance, several times.
- **RFTC018-15's live XSS check** — the "ERB auto-escapes by default" expectation is standard Rails
  behavior but has NOT been independently confirmed by actually triggering a payload and watching for an
  `alert()`, the way this repo's own BUG-TCM-070 finding originally was.
- Any UI-level test (there is none — v1 has no admin UI for sources at all, confirmed Out of Scope in
  the planning doc; the only way this feature is visible to a user is indirectly, through the
  `source_name` the API response returns and through rftc-035's Automation Dashboard, covered in that
  file instead).

## Coverage Summary

**18 scenarios designed, 0 executed.** All 18 are derived directly from the real `release/7.3.0`
implementation (resolver, service integration, model, migrations, API docs, and the developer's own
unit tests) rather than from the ticket description alone. Covers all 5 precedence levels individually,
idempotency, cross-project isolation, persistence-on-the-row (not just the response), 3 distinct blank/
whitespace negative paths, the documented never-blocks-the-write failure guarantee, one concurrency/race
scenario, one security (XSS) scenario cross-referenced to rftc-035, a doc-vs-code accuracy check, a
model data-integrity default, and the nullify-not-destroy deletion guarantee. One finding (RFTC018-13)
is flagged as a likely real edge-case gap discovered purely from reading the code, independent of this
file's own execution status, and should be raised to the dev team for confirmation before `release/7.3.0`
merges to `master`.

## Live Verification Pass — 2026-11-02 (localhost:3000, branch release/7.3.0, commit 329311d)

Partial live verification performed this session (not all 18 designed scenarios executed — see remaining as
still "Not Executed" above):

- **Automation Dashboard (RFTC-035) correctly shows the "Ungrouped" bucket for pre-rftc-018 data** — confirmed
  live: project `rftc-016-ci-qa` shows 1 source ("Ungrouped"), 1325 executions, 30 failures, 97.74% pass rate —
  real historical data, not dropped. Cross-references RFTC-035's own Ungrouped-bucket test.
- **FAIL → BUG-TCM-125 (Open, Medium): case-sensitivity mismatch confirmed live.** Via `bin/rails runner`:
  resolving `"CaseTestXYZ"` then `"casetestxyz"` (same name, different case) for the same project — the second
  call returns `nil` instead of reusing the existing source, because `AutomationSource`'s uniqueness validation
  is case-insensitive but `AutomationSourceResolver#resolve!`'s lookup is case-sensitive. See
  `bugs/open/BUG-TCM-125.md` for full root-cause trace and evidence.

**Not yet live-verified this pass:** the other 4 precedence levels individually, idempotency under genuine
concurrent calls, the advisory-lock race guard, per-project uniqueness with two real projects, the
resolution-failure-never-blocks-write guarantee, and the XSS-in-source-name display check (cross-referenced to
RFTC-035). A future session should pick these up before this suite can be marked fully regressed.
