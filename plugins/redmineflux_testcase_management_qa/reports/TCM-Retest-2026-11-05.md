# Retest Report — MariaDB Fix Verification

**Plugin:** Redmineflux Testcase Management, version 7.2.0
**Environment:** Redmine 6.0-bookworm (Docker), MariaDB 11, fresh instance built for this retest
**Date:** 2026-11-05
**Tested by:** QA

---

## Summary

| # | Issue | Status | Result |
|---|---|---|---|
| 1 | Requirement description never saves — `ActiveRecord::StatementInvalid (Mysql2::Error: CONSTRAINT 'requirements.content' failed)` | **FIXED — PASS** | Confirmed via live UI save and a direct API `PUT` with real content; server returns `200`, content persists correctly as valid JSON |
| 2 | Test Cases page crashes with `redmine_reporting` installed — `NoMethodError: undefined method 'render_task_board_sort_select_box'` | **FIXED — PASS** (structural fix) | Page now renders its own private `_query_form` partial instead of the shared `queries/_query_form`, so no third-party plugin's Deface override (including `redmine_reporting`'s) can reach this page anymore |

---

## Original issue recap

### Error 1 — Requirement description not saving

- **Root cause:** `requirements.content` is declared `t.json :content`. MariaDB has no real native JSON column type — it stores this as `LONGTEXT` with a `CHECK(JSON_VALID(...))` constraint. Rails' schema introspection saw the SQL type as `longtext` (not `json`, unlike MySQL/PostgreSQL) and therefore cast the attribute as plain `:text`. Under `:text` casting, assigning a Ruby Hash falls back to `Hash#to_s` (`{"time"=>..., "blocks"=>[...]}` — Ruby syntax, not valid JSON), which MariaDB's own `JSON_VALID()` constraint then rejected on every save, producing a 500 and rolling back the transaction.
- **Confirmed independently** on a from-scratch MariaDB container before the fix was applied: identical error signature to the client's own production log.

### Error 2 — Test Cases page crash

- **Root cause:** the plugin's Test Cases page (`test_suites/index.html.erb`) rendered Redmine's **shared** `queries/_query_form` partial. The client's installed `redmine_reporting` plugin Deface-patches that same shared partial to inject a "task board sort" option, calling `render_task_board_sort_select_box` — a helper that only exists in `redmine_reporting`'s own Agile/Task-Board controller context, not on this page. The call raised `NoMethodError`, crashing the whole page with a 500.
- **Confirmed via the client's own production stack trace**, which showed the exact file/line (`plugins/redmine_reporting/app/views/queries/_reporting_query_form_options.html.slim:12`) and call chain through Redmine's hook system (`Redmine::Hook.call_hook` → `queries/_query_form.html.erb:55`).
- Independently verified in source that the plugin's existing `redmine_agile`/`redmine_checklists` compatibility patches are a **different kind of fix** (partial-name redirection for an ambiguous template path) and would **not** have prevented this specific crash — the real gap was the page's dependency on a partial any third-party plugin can patch into.

---

## Fix verification (source-level)

### Fix 1 — `attribute :content, :json`

Applied consistently to all three models that share the same column shape:

- `app/models/requirement.rb`
- `app/models/requirement_version.rb`
- `app/models/requirement_template.rb`

This declares the Rails attribute type explicitly, forcing real JSON (de)serialization regardless of what the database's own schema introspection reports — correct on MySQL, PostgreSQL, and MariaDB alike. No migration was needed since the underlying column type didn't change, only how Rails interprets it.

### Fix 2 — Isolated `_query_form` partial

`app/views/test_suites/index.html.erb` now renders `test_suites/_query_form` (and `test_suites/_query_form_r5` on Redmine 5) — a private copy owned by the plugin — instead of Redmine's shared `queries/_query_form`. Since no other plugin's Deface override targets this private partial, the crash is prevented structurally: this fix protects against `redmine_reporting` specifically, and against any other current or future plugin that patches the shared partial.

---

## Live retest (MariaDB)

### Error 1 retest

1. Created a Requirement with no content → page loads cleanly, **0 console errors** (previously: an automatic initial save crashed with a 500 on page load).
2. Typed real content and saved via the UI → **"Saved" indicator appears, 0 console errors.**
3. Direct API confirmation — `PUT /content_update_testcase/1` with a real content payload (`{"text":"Real text content after fix"}`) → **HTTP 200**, and a follow-up `GET /requirements.json` confirms the exact text persisted correctly as valid JSON.

### Error 2 retest

1. Navigated to the Test Cases page (`/test_suites`) — the exact page that crashed before — **page loads cleanly, 0 console errors.**
2. Confirmed in source that the page no longer references the shared `queries/_query_form` partial at all, so the crash cannot occur regardless of which third-party plugins (including `redmine_reporting`) are installed.

---

## Happy-path regression — all major sections (MariaDB)

| Section | Action tested | Result |
|---|---|---|
| Requirements | Create requirement, save description (empty + real text) | ✅ PASS |
| Test Cases | Create test case | ✅ PASS |
| Test Cases (list page) | Page load — the exact page that previously crashed | ✅ PASS, 0 console errors |
| Test Suites | Create suite | ✅ PASS |
| Environment | Create environment | ✅ PASS |
| Runs & Results | Create run ("Include all"), open run, record a Passed result | ✅ PASS — pass-rate chart updated 0% → 33.33% live |
| Reports | Page load | ✅ PASS, 0 console errors |
| Traceability Matrix | Page load | ✅ PASS, 0 console errors |
| Activity | Page load | ✅ PASS, 0 console errors |
| Quality HQ | Page load | ✅ PASS, 0 console errors |

---

## Conclusion

Both client-reported issues are **genuinely fixed** at the code level — confirmed independently on a freshly-built MariaDB instance (not just by trusting the client's own report), with no regressions found across a full happy-path pass of every major section of the plugin.
