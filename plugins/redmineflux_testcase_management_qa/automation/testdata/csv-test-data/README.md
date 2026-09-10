# CSV Import Test Data — Issue #118782

Test data for verifying the Testcase Management plugin's enhanced CSV import
(Test Steps + Expected Results), per [issue #118782](https://flux.zehntech.com/issues/118782).

Assumed column format (per the dev's implementation note on the ticket):
- Core fields: `Title`, `Description`, `Priority`
- Legacy single-step columns: `Steps`, `Expected` (must keep working unchanged)
- New multi-step columns: `Step 1`, `Expected Result 1`, `Step 2`, `Expected Result 2`, ...

Regenerate all files anytime with `python generate_test_csvs.py`.

| # | File | Purpose | Expected outcome |
|---|------|---------|-------------------|
| 01 | `01_legacy_single_step_format.csv` | Backward compatibility — old single `Steps`/`Expected` columns, including blank-step and step-without-expected rows | Imports exactly as before the enhancement; no regression |
| 02 | `02_zero_to_fifty_steps_range.csv` | Full sweep: one row for every step count from **0 to 50** | Each row imports with exactly the right number of steps, in order; 0-step row imports with no steps |
| 03 | `03_steps_only_no_expected.csv` | Every row has Steps filled, Expected Result columns all blank | Each step shows a warning and is skipped; test case itself still imports |
| 04 | `04_expected_only_no_steps.csv` | Every row has Expected Result filled, Step columns all blank | Mirror of #03 — each result-without-step is warned & skipped |
| 05 | `05_mixed_partial_per_row.csv` | One file mixing: fully-paired rows, steps-only rows, expected-only rows, no-step-data rows, and rows with a missing step/expected **mid-sequence** (step 2 broken, steps 1 & 3 fine) | Each row handled independently per its own rules; a mid-sequence gap skips only that one step, not the whole case |
| 06 | `06_varying_step_counts_same_file.csv` | Rows with 1, 3, 7, 15, and 30 steps in the same import | No spurious warnings for shorter rows; each row gets exactly its own step count |
| 07 | `07_oversized_step_text_negative.csv` | Step 1 text is 2500 chars (over the 2000-char limit) | Whole test case flagged with an error and **not imported** |
| 08 | `08_boundary_2000_vs_2001_chars.csv` | Boundary check: step at exactly 2000 chars vs. 2001 chars | 2000-char row imports fine; 2001-char row errors out |
| 09 | `09_large_bulk_import_100_rows.csv` | Large batch: 100 test cases × 3 steps = 300 steps total | Import completes without timeout/perf issues; all rows land correctly |
| 10 | `10_header_only_no_data_rows.csv` | Header row only, zero data rows | Import completes with 0 test cases created, no crash |
| 11 | `11_completely_empty_file.csv` | Truly empty file (0 bytes) | Import handles gracefully with a clear "empty file" error, no crash |
| 12 | `12_non_sequential_step_numbering.csv` | Header only has Step/Expected Result **1, 3, 5** (skips 2 and 4) | Confirms whether the parser requires contiguous numbering or handles gaps sanely |
| 13 | `13_special_characters_and_escaping.csv` | Commas, quotes, emoji, unicode (café/日本語/тест), and an embedded newline inside a step | Values round-trip exactly; CSV quoting/escaping doesn't corrupt data |
| 14 | `14_duplicate_step_column_headers.csv` | Header has `Step 1` / `Expected Result 1` twice | Confirms behavior on a malformed/duplicate header (should not silently overwrite or crash) |
| 15 | `15_header_case_and_whitespace_variations.csv` | Headers with mixed case and stray whitespace (` step 1 `, `EXPECTED RESULT 1`, `Step  2`) | Confirms whether column matching is case/whitespace-tolerant |
| 16 | `16_step_columns_without_expected_columns_in_header.csv` | Header has Step 1/2/3 but no Expected Result columns at all | Confirms graceful handling when a whole column family is structurally absent |
| 17 | `17_expected_columns_without_step_columns_in_header.csv` | Mirror of #16 — Expected Result columns only, no Step columns | Same as above, opposite direction |

## Suggested run order
1. Start with **01** (regression baseline) and **02** (core new feature, full range) — these must pass for the feature to be considered working.
2. Run **03–06** to validate partial/mismatched data handling described in the dev's note.
3. Run **07–08** to confirm the 2000-char validation boundary.
4. Run **09–11** for scale and empty-input robustness.
5. Run **12–17** as exploratory/edge-case coverage — these aren't explicitly promised in the ticket, so a failure here is a finding to discuss with the dev, not necessarily a blocking bug.
