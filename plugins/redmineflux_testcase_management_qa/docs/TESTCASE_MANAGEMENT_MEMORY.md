# Plugin Memory — Redmineflux Testcase Management

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- CSV import: when a step is skipped (missing pair / malformed), the final saved test case renumbers surviving steps contiguously (1, 2, 3...), but the import **preview** still shows original CSV column numbers with a gap. Not a bug, just a preview/final mismatch worth knowing about when reviewing a preview before confirming. See `docs/TESTCASE_MANAGEMENT_CSV_IMPORT_REPORT.md`.
- CSV import header matching is not whitespace-safe: a header with leading/trailing spaces matches correctly during column mapping but its value is silently not read at import time (BUG-TCM-001). Duplicate headers silently keep only the first occurrence with no warning (BUG-TCM-002).

## Confirmed Working

- CSV import: legacy single `Steps`/`Expected` columns, 0–50 step range, varying step counts per row, non-sequential step numbering (renumbered on save), unicode/emoji/embedded-newline content, 2000-char step boundary, 100×3-step bulk import, empty/header-only file handling — see `testcases/TESTCASE_MANAGEMENT_CSV_IMPORT.md`.

## Recurring Issues

## Environment Notes

- CSV import testing was done against Docker `localhost:3010` (project `test-project`), plugin v7.0.0.
