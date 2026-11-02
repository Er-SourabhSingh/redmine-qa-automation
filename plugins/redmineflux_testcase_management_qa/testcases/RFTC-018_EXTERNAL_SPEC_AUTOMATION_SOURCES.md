> ⚠️ **EXTERNAL SOURCE — DO NOT MERGE WITH THIS PLUGIN'S OWN TC-TCM-xxx SUITES, AND SEPARATE FROM THE V1
> CYCLE FILE** ⚠️
>
> These test cases verify **production feature #123568** ("rftc-018 — Auto-group automation tests into
> \"sources\""), part of **Testcase Management plugin Release 7.3.0**. Out of
> `V1_7.1.0_EXTERNAL_RELEASE_CYCLE.md`'s scope.
>
> **ID prefix**: every case here is `RFTC018-<n>`.
>
> **FULLY EXECUTED 2026-11-02 — 17/18 PASS, 1 FAIL (BUG-TCM-125).** The branch (`release/7.3.0`, commit
> `329311d`) was checked out into the local Docker instance (`localhost:3000`), its 4 pending migrations
> run, and the app restarted. All 18 cases below were independently executed this session — RFTC018-1
> through 12 and 17 directly against `AutomationSourceResolver`/`AutomationSource` via `bin/rails runner`
> (the pure precedence/idempotency/model logic), RFTC018-9/12 via a real `CiResultIngestService` call
> against an existing run, RFTC018-14 via a genuine 5-trial concurrent-thread race, RFTC018-15 via a real
> CI ingest + live Playwright check of the Automation Dashboard, RFTC018-16 via a direct diff of `API.md`
> against the code, and RFTC018-18 via the model's own association-reflection options (same check the
> developer's own unit test asserts). Only RFTC018-13 failed — confirmed as a real bug, filed as
> **BUG-TCM-125** (see `bugs/open/BUG-TCM-125.md`). This is independent QA execution, not the developer's
> own "Quality Gates" self-check recorded in `backlog/planning/rftc-018-feature-automation-sources.md`.

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
**Actual Result:** ✅ **PASS** (2026-11-02, `bin/rails runner`). `derive_key(result_source: 'nightly-regression',
batch_source: 'batch-source', testsuite_name: 'SomeSuite', automation_key: 'com.app.LoginTests.test_x',
environment: 'ci')` returned exactly `["nightly-regression", "explicit"]`.

---

### RFTC018-2: Precedence 2 — batch-level `source` applies when a result supplies none of its own

**Priority:** P1
**Steps:** CI-ingest a batch with `source: "ci-batch-7"` at the top level and a result with no
per-result `source` field, for a test case that also belongs to a named suite.
**Expected Result:** The result's `source_name` is `"ci-batch-7"`, not the suite's name — batch-level
beats testsuite-name.
**Actual Result:** ✅ **PASS** (2026-11-02, `bin/rails runner`). `derive_key(result_source: nil,
batch_source: 'ci-batch-7', testsuite_name: 'SomeSuite', automation_key: 'com.app.LoginTests.test_x',
environment: 'ci')` returned exactly `["ci-batch-7", "explicit"]`.

---

### RFTC018-3: Precedence 3 — falls back to the already-resolved testsuite's name

**Priority:** P1
**Steps:** CI-ingest a result with neither a per-result nor a batch-level `source`, for a test case that
belongs to exactly one suite (name e.g. `"Checkout"`) and has no `automation_key` match in play.
**Expected Result:** `source_name == "Checkout"` (the suite's own name); the created source's `kind` is
`"testsuite"`.
**Actual Result:** ✅ **PASS** (2026-11-02, `bin/rails runner`). `derive_key(result_source: nil,
batch_source: nil, testsuite_name: 'Checkout', automation_key: nil, environment: 'ci')` returned exactly
`["Checkout", "testsuite"]`.

---

### RFTC018-4: Precedence 4 — falls back to the `automation_key` namespace prefix when no suite name is available

**Priority:** P2 — a narrower path than RFTC018-3 (requires a suite-less match, which is itself an edge
case in `build_match_indexes`), but still a real documented precedence level
**Steps:** CI-ingest a result matched purely by `automation_key` (e.g. `com.app.LoginTests.test_valid`)
against a test case with no per-result/batch `source` and whose matched testsuite resolves to a blank
name scenario (or is otherwise unavailable to the resolver).
**Expected Result:** `source_name == "com::app::LoginTests"` (the namespace with the last segment
dropped, separators normalized to `::`); `kind == "automation_key_prefix"`.
**Actual Result:** ✅ **PASS** (2026-11-02, `bin/rails runner`). `derive_key(result_source: nil,
batch_source: nil, testsuite_name: nil, automation_key: 'com.app.LoginTests.test_valid', environment: 'ci')`
returned exactly `["com::app::LoginTests", "automation_key_prefix"]`.

---

### RFTC018-5 (negative): An `automation_key` with no namespace separator has no usable prefix and falls through

**Priority:** P2 — confirms the prefix extraction is genuinely conditional, not a crash-and-fallback
**Steps:** CI-ingest a result matched by a bare `automation_key` with no `::`, `.`, or `/` in it (e.g.
`"test_valid"`), with no per-result/batch source and no suite name available.
**Expected Result:** `automation_key_namespace` returns `nil` (fewer than 2 segments after split), so the
resolver falls all the way through to the final fallback — `source_name == "CI / <environment>"`, not an
error and not an empty/garbage source name.
**Actual Result:** ✅ **PASS** (2026-11-02, `bin/rails runner`). `derive_key(result_source: nil,
batch_source: nil, testsuite_name: nil, automation_key: 'test_valid', environment: 'staging')` returned
exactly `["CI / staging", "fallback"]` — no error, no blank key.

---

### RFTC018-6 (SACRED): Precedence 5 — final fallback guarantees every result lands in *some* source

**Priority:** P1 — "no manual mapping step" only holds if this never produces a blank/nil source
**Steps:** CI-ingest a result with no per-result source, no batch source, no resolvable testsuite name,
and matched by raw numeric `id` or `subject` (not `automation_key`, so there is no automation-key prefix
candidate at all) — ingested against environment `"Staging"`.
**Expected Result:** `source_name == "CI / Staging"`; a real `AutomationSource` row is created with
`kind == "fallback"` — never a blank/nil source on any ingested result.
**Actual Result:** ✅ **PASS** (2026-11-02, `bin/rails runner`). `derive_key(result_source: nil,
batch_source: nil, testsuite_name: nil, automation_key: nil, environment: 'Staging')` returned exactly
`["CI / Staging", "fallback"]`.

---

### RFTC018-7 (SACRED): Idempotency — the same `(project, key)` resolves to ONE source across repeated ingests, never duplicated

**Priority:** P1 — this is the entire point of `find_or_create`; a duplicate here silently fragments
every rollup rftc-035's dashboard will ever show
**Steps:** CI-ingest result A with `source: "shared-suite"` in one call; in a **separate**, later ingest
call, submit a different test case's result also with `source: "shared-suite"` in the same project.
**Expected Result:** Exactly **one** `AutomationSource` row exists for `(project, "shared-suite")` after
both calls; its `executions_count` is `2` (not reset, not two separate rows at `1` each); the second
call's `source_id` in the response matches the first call's.
**Actual Result:** ✅ **PASS** (2026-11-02, `bin/rails runner`, project `rftc-016-ci-qa`). Called
`resolve!(key: "QA-shared-suite-test")` twice — both calls returned the SAME row id, and after the
second call `executions_count == 2` exactly.

---

### RFTC018-8 (SACRED/security): Cross-project isolation — the identical key string in two projects is always TWO distinct sources

**Priority:** P1 — a shared source row across projects would leak one project's automation health
rollup into another's dashboard (rftc-035)
**Steps:** CI-ingest a result with `source: "shared-key"` in Project A; CI-ingest a different result
with `source: "shared-key"` in Project B (a completely separate project).
**Expected Result:** `AutomationSource.where(key: "shared-key").count == 2` — two separate rows, scoped
by `project_id`, never reused across the project boundary, even though the literal key text is
identical.
**Actual Result:** ✅ **PASS** (2026-11-02, `bin/rails runner`, projects `rftc-016-ci-qa` + `alpha-web`).
Resolved `"QA-shared-key-test"` in both real projects — two distinct `AutomationSource` ids returned,
`AutomationSource.where(key: "QA-shared-key-test").count == 2` confirmed.

---

### RFTC018-9: The resolved `source_id` is actually persisted on the written execution row, not just in the response

**Priority:** P1 — the response payload reporting a `source_id` is not proof the DB row actually has it
**Steps:** CI-ingest one result with an explicit `source`; after the call, load the corresponding
`IssueStatusResult` row directly (e.g. via `rails runner` / DB query) rather than trusting the response.
**Expected Result:** `IssueStatusResult#source_id` on the persisted row equals the `source_id` reported
in the ingest response's `matched[].source_id` field.
**Actual Result:** ✅ **PASS** (2026-11-02, real `CiResultIngestService` call against Run #8 "Jenkins CI
Build 1", project `rftc-016-ci-qa`). Ingested `test_login_valid` with `source: "QA-persist-test"` —
response reported `source_id=6`; loading the actual `IssueStatusResult` row directly confirmed
`source_id == 6`, an exact match, not just a response-payload claim.

---

### RFTC018-10 (negative): A blank/empty-string `source` field in the payload is treated as absent, not as a literal empty key

**Priority:** P2 — `derive_key` strips and checks `.present?` at each level; an empty string must not
"win" the precedence slot it occupies
**Steps:** CI-ingest a result with `source: ""` (empty string) at the per-result level, while a valid
batch-level `source: "batch-value"` is also set.
**Expected Result:** The empty per-result string is treated as not-present (`explicit.present?` is
false after `.strip`), so the batch-level value `"batch-value"` is used instead — not an empty-string
source, not a crash.
**Actual Result:** ✅ **PASS** (2026-11-02, `bin/rails runner`). `derive_key(result_source: '',
batch_source: 'batch-value', testsuite_name: nil, automation_key: nil, environment: 'ci')` returned
exactly `["batch-value", "explicit"]` — the blank string never "won" its precedence slot.

---

### RFTC018-11 (negative): Whitespace-only `source` values at every level are all correctly treated as blank

**Priority:** P3
**Steps:** CI-ingest a result where the per-result `source` is `"   "` (whitespace only) and the
batch-level `source` is also `"  "` (whitespace only), with a resolvable testsuite name available.
**Expected Result:** Both whitespace-only values are stripped to empty and treated as absent (same
`.present?` guard as RFTC018-10); resolution falls through to the testsuite-name level.
**Actual Result:** ✅ **PASS** (2026-11-02, `bin/rails runner`). `derive_key(result_source: '   ',
batch_source: '  ', testsuite_name: 'Checkout', automation_key: nil, environment: 'ci')` returned exactly
`["Checkout", "testsuite"]` — both whitespace-only values correctly treated as blank.

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
**Actual Result:** ✅ **PASS** (2026-11-02, real `CiResultIngestService` call, `derive_key` monkey-patched
to raise `"Simulated resolver failure"`). The ingest call still returned `ok=true`, `status=ok`,
`test_login_valid` was matched and written with `case_status_id` set correctly, and `source_id` was
`nil` in the response — the write was entirely unaffected by the forced failure. The exact expected log
line appeared: `"CI ingest: automation source resolution failed for key=test_login_valid: Simulated
resolver failure"`.

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
**Actual Result:** ❌ **FAIL → BUG-TCM-125 (Open, Medium), confirmed live** (2026-11-02, `bin/rails
runner`). Resolving `"CaseTestXYZ"` then `"casetestxyz"` (same name, different case) for the same
project: the first call created the source correctly (`id=1`); the second call returned **`nil`** exactly
as predicted — the result would silently get no source at all instead of reusing `"CaseTestXYZ"`. This
is now a confirmed defect, not just a code-reading prediction. See `bugs/open/BUG-TCM-125.md` for the
full root-cause trace and evidence.

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
**Actual Result:** ✅ **PASS, 5/5 trials** (2026-11-02, `bin/rails runner`, two real Ruby threads racing
`resolve!` on a brand-new key each trial). Row count after both threads joined: `[1, 1, 1, 1, 1]` across
5 independent trials — the advisory lock held every time, no duplicate ever created.

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
**Actual Result:** ✅ **PASS** (2026-11-02, real CI ingest + live Playwright). Ingested a real result with
`source: "<img src=x onerror=alert('rftc018-xss')>"` against Run #8 — the Automation Dashboard
(`/projects/rftc-016-ci-qa/automation_dashboard`) rendered the payload as literal escaped text in the
Source column, zero `alert()` fired, dashboard correctly showed 2 Sources / 1325 Executions after the
ingest. Cross-reference confirmed: this is the same live check RFTC-035's own file also records.

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
**Actual Result:** ✅ **PASS** (2026-11-02, direct re-read of both files on `release/7.3.0`). `API.md`
line 1259-1263 ("Automatic source grouping (rftc-018)") lists the identical 5-step order as
`AutomationSourceResolver.derive_key`'s actual code — no drift found.

---

### RFTC018-17: A newly-created source's `name` defaults to its `key` when no separate display name is set

**Priority:** P3 — a model-level data-integrity nicety, not a user-facing flow, but worth confirming
since `name` (not `key`) is what every dashboard actually displays
**Steps:** Trigger `AutomationSourceResolver.create_source` (indirectly, via any first-time ingest for a
brand-new key) and inspect the created row's `name` column.
**Expected Result:** `name == key` exactly (the model's `before_validation :default_name_to_key` sets it
when `name.blank?`, and `create_source` itself also explicitly passes `name: key`) — never a blank name
on a freshly created source.
**Actual Result:** ✅ **PASS** (2026-11-02, `bin/rails runner`). Resolved a brand-new key
`"QA-NameDefaultTest"` — the created row's `name == "QA-NameDefaultTest"` exactly, matching the key.

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
**Actual Result:** ✅ **PASS** (2026-11-02, `bin/rails runner`, same check the developer's own unit test
asserts). `AutomationSource.reflect_on_association(:issue_status_results).options[:dependent]` returned
exactly `:nullify`.

---

## Not Executed

Nothing — all 18 scenarios were independently executed 2026-11-02 (see each case's own Actual Result
above). No admin UI exists for sources in v1 (confirmed Out of Scope in the planning doc), so there are
no UI-driven test cases to add — the feature is only reachable via the ingest API response and rftc-035's
Automation Dashboard, both of which were exercised directly.

## Coverage Summary

**18/18 scenarios executed — 17 PASS, 1 FAIL.** All 5 precedence levels individually confirmed correct,
idempotency and cross-project isolation both hold, the resolved `source_id` is genuinely persisted on
the row (not just claimed in the response), all 3 blank/whitespace negative paths correctly fall through,
the never-blocks-the-write failure guarantee holds (confirmed via a forced-exception test, including the
exact expected log line), the concurrency/advisory-lock guard held across 5 real-thread race trials, the
XSS/security case is confirmed safe via a real ingest + live dashboard check, `API.md` matches the code
exactly, and both model data-integrity guarantees (name-defaults-to-key, nullify-not-destroy) hold. The
one failure, **RFTC018-13** (case-sensitivity mismatch), is a confirmed real defect — filed as
**BUG-TCM-125** (Open, Medium) — not merely a code-reading prediction anymore.

## Live Verification Pass — 2026-11-02 (localhost:3000, branch release/7.3.0, commit 329311d)

Full execution pass, superseding the earlier partial pass recorded in this section. Environment: branch
`release/7.3.0` checked out locally, 4 pending migrations run via the container's own
`/docker-entrypoint.sh` (avoids the known `SECRET_KEY_BASE`/`docker exec` gap), web + Sidekiq containers
restarted. Methods used: `bin/rails runner` for the pure precedence/idempotency/model-reflection cases
(1-8, 10, 11, 17, 18), a real `CiResultIngestService` call against Run #8 "Jenkins CI Build 1" for the
persistence and failure-isolation cases (9, 12), a genuine 5-trial two-thread race for the concurrency
case (14), a real CI ingest + live Playwright check of the Automation Dashboard for the XSS case (15),
and a direct file diff for the documentation case (16). Full detail is recorded inline against each case
above; summary: **17 PASS, 1 FAIL (BUG-TCM-125)**.

### Genuine CI/CD-driven re-confirmation (RFTC018-1, RFTC018-2) — 2026-11-02

The pass above used `bin/rails runner`/direct service calls, not a real external CI tool. Per explicit
user follow-up ("isme real ci cd tool use kiya kya tumne" — did you actually use a real CI/CD tool), the
two precedence-order cases most representative of this feature's real-world entry point were re-verified
through an actual Jenkins pipeline, not a Ruby-level shortcut:

- Reused the existing `tcm-forge-demo-jenkins` container (`tcm-ci-jenkins:local` image, already has the
  `redmineflux-tcm` CLI wheel baked in from the earlier 7.2.0 demo work), connected to `localhost:3000`
  via `http://host.docker.internal:3000` (confirmed reachable, `HTTP 200` on `/login`).
- Added a new Jenkins credential (`tcm-local-api-key`, Secret text) holding this local instance's real
  admin API key.
- Created a new Jenkins Pipeline job (`rftc018-local-verification`) with 3 stages, each making a real
  `curl` HTTP call (not through the CLI, since it has no `--source` flag yet — a minor gap worth noting
  to the dev team separately) to the actual `/testcase_ci/bootstrap_run.json` and
  `/testcase_ci/ingest_results.json` endpoints: (1) bootstrap a fresh run, (2) ingest a result with an
  explicit per-result `source` alongside a different batch-level `source` (RFTC018-1), (3) ingest a
  second result with only a batch-level `source` (RFTC018-2).
- **Triggered a real build ("Build Now") — `Finished: SUCCESS`.** Build #1 genuinely bootstrapped
  **Run #194** ("RFTC-018 Jenkins Verification Build 1") and both ingest calls returned the expected
  `source_name` (`"jenkins-explicit-source"` for RFTC018-1's explicit-beats-batch check,
  `"jenkins-batch-source-2"` for RFTC018-2's batch-level check) — confirmed directly from the real HTTP
  response bodies in the Jenkins console log, not inferred.
- **Independently cross-checked on the Automation Dashboard** (not just trusting the Jenkins console):
  reloaded `/projects/rftc-016-ci-qa/automation_dashboard` afterward — both `jenkins-explicit-source` and
  `jenkins-batch-source-2` appear as real rows with `Last Seen` timestamps matching the actual Jenkins
  build time (`11/02/2026 08:09 AM`), proving the data genuinely flowed from a real external CI
  pipeline's HTTP call through to the UI, not a shortcut.

This upgrades RFTC018-1 and RFTC018-2 from "verified via direct Ruby call" to "verified via a real,
independently-triggered Jenkins pipeline making real HTTP requests" — the same rigor standard this repo
already holds rftc-038/009's CI-platform claims to.
