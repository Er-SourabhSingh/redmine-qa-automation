# Bug Report Template

- Bug ID: BUG-CRX-097
- Production Redmine Issue ID: #125963
- Title: "Update Report" silently fails to apply the report_type change shown in its own confirm card — only the linked run changes — while still reporting a misleading "✓ ... updated successfully"
- Redmine version: 6.0-bookworm (new local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, QA Agent, Test Case Management plugin domain)
- Plugin version: redmineflux_testcase_management 7.2.0 / crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-10-29

## Steps to reproduce

1. Create a report (fixture): "in the Crux QA Agent Test Project, can you create a testcase-type report called 'QA Report Update Check' covering the 'Sprint 2 Targeted Test' run?" — confirmed, created report #3, `report_type='testcase'`, `run_ids=[3]` (verified via DB).
2. Update it: "in the Crux QA Agent Test Project, can you update the 'QA Report Update Check' report to be a summary-type report covering the 'Bulk Status Fixture Run' run instead?"
3. Observe the confirm card, confirm it, then check the report's actual stored type and linked run via DB and the native Report detail page.

## Expected result

Both changes shown on the confirm card (`Report Type: summary`, `Run Ids: [7]`) should be applied together — the report should genuinely become a "summary" type report covering run #7.

## Actual result

Confirm card correctly showed `Project`, `Report: 3`, `Report Type: summary`, `Run Ids: [7]`. Confirming produced: *"✓ Report #3 'QA Report Update Check' updated successfully."* — a confident, unqualified success message. Verified via DB: `runs_testcase_reports` correctly updated to `run_id=7` (the run change DID apply), but `testcase_reports.report_type` for report #3 is **still `'testcase'`**, never changed to `'summary'` (`updated_at` timestamp confirms the row was genuinely touched at the time of this update, ruling out a stale read). The native report detail page (`/projects/.../testcase_reports/3`) independently confirms this: it still renders as a "Testcase Summary" (per-testcase breakdown) page — the real UI presentation for a `testcase`-type report, not the high-level `summary` type that was requested and confirmed.

## Evidence

### Console / log

- Confirm card (verbatim fields): `Project: Crux QA Agent Test Project`, `Report: 3`, `Report Type: summary`, `Run Ids: [7]`.
- Success message (verbatim): `"✓ Report #3 'QA Report Update Check' updated successfully."`
- DB before: `id=3, name='QA Report Update Check', report_type='testcase'`, linked run_id=3 (`runs_testcase_reports`).
- DB after confirm: `id=3, report_type='testcase'` (UNCHANGED), linked run_id=7 (changed correctly), `updated_at` matches the confirm timestamp (07:00:58).
- Native UI (`/projects/crux-qa-agent-test-project/testcase_reports/3`): heading "Testcase Summary", per-testcase Passed/Failed table for issues #6/#7 of run #7 — confirms `report_type` is still genuinely `testcase`, not `summary`.

## Duplicate check

- Duplicate found: Same general shape as `BUG-CRX-086` (silent partial write — a multi-field update where only some fields actually persist while the tool reports unqualified success) and the misleading-✓ family (`BUG-CRX-082`), but this is the **first instance on the Reports domain specifically**, and the first where the omitted field (`report_type`) is silently dropped with **no error raised at all** (BUG-CRX-086's silent loss was at least accompanied by a — false — error message; here there is no error of any kind, just a confident success claim covering a change that didn't fully happen).
