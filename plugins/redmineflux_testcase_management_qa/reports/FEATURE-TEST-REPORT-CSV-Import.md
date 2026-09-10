# Feature Test Report — CSV Import: Test Steps & Expected Results

**Feature ticket:** [#118782](https://flux.zehntech.com/issues/118782) — Testcase Management plugin: Enhance CSV Import to Support Test Steps and Expected Results
**Plugin / version tested:** Redmineflux Testcase Management v7.0.0
**Test environment:** Docker instance `localhost:3010` (project: `test-project`)
**Tracked test case:** [#119797](https://flux.zehntech.com/issues/119797), run [#559](https://flux.zehntech.com/runs/559?project_id=ztflux) — **Failed**
**Bugs filed:** [#119817](https://flux.zehntech.com/issues/119817), [#119818](https://flux.zehntech.com/issues/119818)

---

## 1. Feature under test

The Testcase Management plugin's CSV import previously supported only a single `Steps` / `Expected` column pair per test case. The enhancement adds support for multiple numbered step columns (`Step 1`/`Expected Result 1`, `Step 2`/`Expected Result 2`, ...), while preserving backward compatibility with the legacy single-column format, and adds validation for:

- A step with a missing pair partner (expected-without-step or step-without-expected) → warning, that one step is skipped, rest of the test case still imports.
- Step text over 2000 characters → error, whole test case not imported.

Import happens through a 4-step wizard: **(1)** upload CSV + settings → **(2)** map CSV columns to testcase fields → **(3)** map field values (e.g. Priority) → **(4)** preview per-row status (OK / Warning / Error) before confirming import.

## 2. Test approach

Since the plugin doesn't expose a CSV template via its own tools, the column schema (`Title`, `Description`, `Priority`, `Steps`/`Expected` legacy columns, `Step N`/`Expected Result N` new columns) was inferred from the developer's implementation notes on #118782, then confirmed against the live import wizard's auto-mapping.

17 purpose-built CSV files were generated to cover the full test matrix, stored in [`csv-test-data/`](csv-test-data/) (see its `README.md` for the full file-by-file breakdown). Each file was:
1. Run through all 4 wizard steps on the live Docker instance.
2. Actually imported (not just previewed).
3. The resulting test case(s) opened and inspected to confirm real saved data — not just the wizard's preview claims.
4. Screenshotted as evidence into [`testcase import image/`](testcase%20import%20image/).

## 3. Results

### Working correctly
| Area | Finding |
|---|---|
| Legacy backward compatibility | Old `Steps`/`Expected` columns import unchanged; a step with a missing expected result is skipped, case still created |
| 0–50 step range | Verified 0-step (no Step section at all) through 50-step (all steps present, correctly numbered/ordered) cases |
| Steps-only / expected-only rows | Every step correctly skipped with a warning; test case still created |
| Varying step counts in one file | A 30-step case imported with all steps intact; no cross-contamination between rows of different lengths |
| Oversized step text (2500 chars) | Whole test case correctly rejected — "No testcases to import," zero created |
| 2000/2001-char boundary | Exact validation boundary confirmed: 2000 chars imports, 2001 chars errors with a precise message |
| Large bulk import (100 cases × 3 steps) | Completed in one pass, no timeout or crash |
| Empty file / header-only file | Clean, specific error messages, no crash |
| Non-sequential step numbering (Step 1/3/5) | Columns map and import correctly (renumbered 1,2,3 in the saved case) |
| Special characters, unicode, emoji, embedded newlines | Verified via raw DOM inspection to be stored correctly (a screenshot font-rendering artifact had initially suggested otherwise — false alarm, corrected after re-checking) |
| Header structurally missing one whole column family (Step-only or Expected-only) | All steps skipped gracefully, test case still created |

### Bugs found
1. **[#119817](https://flux.zehntech.com/issues/119817)** — A step column header with leading/trailing whitespace (e.g. `" Step 1 "`) is correctly *matched* to the right field in the mapping UI, but its **value is not read** during actual import processing. The step is wrongly reported as "missing" and skipped, and the final saved test case ends up with the wrong step content silently promoted into its place. Non-padded headers (any case, internal double-spacing) work fine — only leading/trailing whitespace triggers this.
2. **[#119818](https://flux.zehntech.com/issues/119818)** — A CSV with a duplicated column header (`Step 1` appearing twice) silently keeps only the **first** occurrence's data; the second is discarded with **no warning or error** anywhere in the wizard.

### Notable (non-bug) behavior
When a step is skipped, the **final saved test case renumbers the surviving steps contiguously** (1, 2, 3...), while the **import preview** displays them under their original CSV column numbers with a visible gap. This mismatch between preview and final result isn't wrong, but could confuse someone reviewing the preview before confirming the import.

## 4. Redmine tracking

- Test case **#119797** in run **#559** (project `ztflux`) marked **Failed**, with both bugs linked as defects (via `report_defect`, so they render directly in the run's defect view).
- Both bug reports include full repro steps, expected vs. actual behavior, a root-cause hypothesis, and attached screenshots proving the behavior.

## 5. Reference material

- [`csv-test-data/`](csv-test-data/) — all 17 test CSV files + generator script + README describing each file's purpose and expected outcome
- [`testcase import image/`](testcase%20import%20image/) — 20 screenshots, one set per file tested, each showing the actual saved test case (not just the wizard preview)
