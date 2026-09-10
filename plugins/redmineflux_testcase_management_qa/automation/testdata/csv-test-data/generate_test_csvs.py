#!/usr/bin/env python3
"""
Generates CSV test-data files for issue #118782 —
"Testcase management plugin: Enhance CSV Import to Support Test Steps and Expected Results".

Import format assumed (per the ticket's implementation note):
  - Core columns: Title, Description, Priority
  - Legacy single-step columns: Steps, Expected
  - New multi-step columns: "Step 1", "Expected Result 1", "Step 2", "Expected Result 2", ...
"""
import csv
import os

OUT_DIR = os.path.dirname(os.path.abspath(__file__))


def write_csv(filename, header, rows):
    path = os.path.join(OUT_DIR, filename)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if header is not None:
            writer.writerow(header)
        for row in rows:
            writer.writerow(row)
    print(f"wrote {filename}: {len(rows)} data row(s)")


def step_cols(n):
    cols = []
    for i in range(1, n + 1):
        cols += [f"Step {i}", f"Expected Result {i}"]
    return cols


def pad_row(core, step_pairs, max_steps):
    """core = [Title, Description, Priority]; step_pairs = [(step, expected), ...]"""
    row = list(core)
    for i in range(max_steps):
        if i < len(step_pairs):
            row += [step_pairs[i][0], step_pairs[i][1]]
        else:
            row += ["", ""]
    return row


# ---------------------------------------------------------------------------
# 1. Legacy single-step format (backward compatibility)
# ---------------------------------------------------------------------------
write_csv(
    "01_legacy_single_step_format.csv",
    ["Title", "Description", "Priority", "Steps", "Expected"],
    [
        ["Legacy - Login with valid credentials", "Baseline legacy import", "Normal",
         "Enter valid username and password, click Login", "User is redirected to the dashboard"],
        ["Legacy - Login with invalid password", "Baseline legacy import", "High",
         "Enter valid username and invalid password, click Login", "Error message 'Invalid credentials' is shown"],
        ["Legacy - Logout", "Baseline legacy import", "Normal",
         "Click the Logout button", "User is redirected to the login page"],
        ["Legacy - No steps at all", "Steps/Expected left blank on purpose", "Low",
         "", ""],
        ["Legacy - Step with no expected", "Only Steps filled, Expected blank", "Normal",
         "Open the settings page", ""],
    ],
)

# ---------------------------------------------------------------------------
# 2. 0 to 50 steps range — one row per step count, boundary sweep
# ---------------------------------------------------------------------------
MAX_STEPS = 50
header = ["Title", "Description", "Priority"] + step_cols(MAX_STEPS)
rows = []
for n in range(0, MAX_STEPS + 1):
    core = [f"Range test - {n} step(s)", f"Row with exactly {n} step/expected pair(s)", "Normal"]
    pairs = [(f"Step {i} action for {n}-step case", f"Expected result {i} for {n}-step case") for i in range(1, n + 1)]
    rows.append(pad_row(core, pairs, MAX_STEPS))
write_csv("02_zero_to_fifty_steps_range.csv", header, rows)

# ---------------------------------------------------------------------------
# 3. Steps only, no expected results at all (every step in every row)
# ---------------------------------------------------------------------------
header = ["Title", "Description", "Priority"] + step_cols(5)
rows = []
for n in [1, 2, 3, 4, 5]:
    core = [f"Steps-only case - {n} step(s)", "All Step columns filled, all Expected Result columns blank", "Normal"]
    pairs = [(f"Do action {i}", "") for i in range(1, n + 1)]
    rows.append(pad_row(core, pairs, 5))
write_csv("03_steps_only_no_expected.csv", header, rows)

# ---------------------------------------------------------------------------
# 4. Expected results only, no steps at all (every expected in every row)
# ---------------------------------------------------------------------------
header = ["Title", "Description", "Priority"] + step_cols(5)
rows = []
for n in [1, 2, 3, 4, 5]:
    core = [f"Expected-only case - {n} result(s)", "All Expected Result columns filled, all Step columns blank", "Normal"]
    pairs = [("", f"Result {i} should appear") for i in range(1, n + 1)]
    rows.append(pad_row(core, pairs, 5))
write_csv("04_expected_only_no_steps.csv", header, rows)

# ---------------------------------------------------------------------------
# 5. Mixed partial combinations within the same file
#    (full pairs / steps-only / expected-only / neither / partial-missing-mid-sequence)
# ---------------------------------------------------------------------------
header = ["Title", "Description", "Priority"] + step_cols(4)
rows = [
    pad_row(
        ["Mixed - fully paired, 3 steps", "Every step has a matching expected result", "Normal"],
        [("Open app", "App launches"), ("Log in", "Dashboard shown"), ("Open reports", "Report list shown")],
        4,
    ),
    pad_row(
        ["Mixed - steps only, 2 steps", "Steps filled, expected results blank", "Normal"],
        [("Click New", ""), ("Fill form", "")],
        4,
    ),
    pad_row(
        ["Mixed - expected only, 2 results", "Expected results filled, steps blank", "Normal"],
        [("", "Form is displayed"), ("", "Record is saved")],
        4,
    ),
    pad_row(
        ["Mixed - no step data at all", "No Step/Expected columns populated; core fields only", "Low"],
        [],
        4,
    ),
    pad_row(
        ["Mixed - missing expected mid-sequence", "Step 2's expected result is blank; Steps 1 and 3 are complete", "Normal"],
        [("Step 1 action", "Step 1 expected"), ("Step 2 action", ""), ("Step 3 action", "Step 3 expected")],
        4,
    ),
    pad_row(
        ["Mixed - missing step mid-sequence", "Step 2's action is blank; its expected result is filled", "Normal"],
        [("Step 1 action", "Step 1 expected"), ("", "Step 2 expected"), ("Step 3 action", "Step 3 expected")],
        4,
    ),
]
write_csv("05_mixed_partial_per_row.csv", header, rows)

# ---------------------------------------------------------------------------
# 6. Varying step counts within the same file (no confusing warnings for shorter rows)
# ---------------------------------------------------------------------------
MAX = 30
header = ["Title", "Description", "Priority"] + step_cols(MAX)
rows = []
for n in [1, 3, 7, 15, 30]:
    core = [f"Varying-length case - {n} steps", "Different step counts co-exist in one import", "Normal"]
    pairs = [(f"Step {i}", f"Expected {i}") for i in range(1, n + 1)]
    rows.append(pad_row(core, pairs, MAX))
write_csv("06_varying_step_counts_same_file.csv", header, rows)

# ---------------------------------------------------------------------------
# 7. Negative: oversized step text (> 2000 chars) -> whole test case should error/skip
# ---------------------------------------------------------------------------
long_step = "A" * 2500
header = ["Title", "Description", "Priority"] + step_cols(2)
rows = [
    pad_row(
        ["Negative - oversized step text (2500 chars)", "Step 1 text exceeds the 2000-char limit", "High"],
        [(long_step, "Should be rejected with a clear error"), ("Step 2 normal", "Expected 2 normal")],
        2,
    ),
]
write_csv("07_oversized_step_text_negative.csv", header, rows)

# ---------------------------------------------------------------------------
# 8. Boundary: exactly 2000 chars (valid) vs 2001 chars (invalid)
# ---------------------------------------------------------------------------
step_2000 = "B" * 2000
step_2001 = "C" * 2001
header = ["Title", "Description", "Priority"] + step_cols(1)
rows = [
    pad_row(["Boundary - step exactly 2000 chars (valid)", "Exactly at the limit, should be accepted", "Normal"],
            [(step_2000, "Accepted, exactly at boundary")], 1),
    pad_row(["Boundary - step exactly 2001 chars (invalid)", "One char over the limit, should error", "Normal"],
            [(step_2001, "Rejected, one char over boundary")], 1),
]
write_csv("08_boundary_2000_vs_2001_chars.csv", header, rows)

# ---------------------------------------------------------------------------
# 9. Large bulk import — 100 test cases x 3 steps each (matches the dev's own load test, x5)
# ---------------------------------------------------------------------------
header = ["Title", "Description", "Priority"] + step_cols(3)
rows = []
for i in range(1, 101):
    core = [f"Bulk case {i:03d}", "Generated for large-batch import testing", "Normal" if i % 3 else "High"]
    pairs = [(f"Step 1 for case {i}", f"Expected 1 for case {i}"),
             (f"Step 2 for case {i}", f"Expected 2 for case {i}"),
             (f"Step 3 for case {i}", f"Expected 3 for case {i}")]
    rows.append(pad_row(core, pairs, 3))
write_csv("09_large_bulk_import_100_rows.csv", header, rows)

# ---------------------------------------------------------------------------
# 10. Header only, zero data rows
# ---------------------------------------------------------------------------
write_csv("10_header_only_no_data_rows.csv", ["Title", "Description", "Priority"] + step_cols(3), [])

# ---------------------------------------------------------------------------
# 11. Completely empty file (0 bytes, no header at all)
# ---------------------------------------------------------------------------
empty_path = os.path.join(OUT_DIR, "11_completely_empty_file.csv")
open(empty_path, "w").close()
print("wrote 11_completely_empty_file.csv: 0 bytes")

# ---------------------------------------------------------------------------
# 12. Non-sequential step numbering in header (Step 1, Step 3, Step 5 — skips 2 and 4)
# ---------------------------------------------------------------------------
header = ["Title", "Description", "Priority",
          "Step 1", "Expected Result 1", "Step 3", "Expected Result 3", "Step 5", "Expected Result 5"]
rows = [
    ["Non-sequential step numbers", "Header skips Step 2/4 and Expected Result 2/4 entirely", "Normal",
     "First action", "First expected", "Third action", "Third expected", "Fifth action", "Fifth expected"],
]
write_csv("12_non_sequential_step_numbering.csv", header, rows)

# ---------------------------------------------------------------------------
# 13. Special characters & CSV escaping (commas, quotes, embedded newlines, unicode)
# ---------------------------------------------------------------------------
header = ["Title", "Description", "Priority"] + step_cols(2)
rows = [
    pad_row(
        ['Special chars - "quotes", commas, and emoji 🚀', "Tests CSV escaping of embedded quotes/commas", "Normal"],
        [('Click "Submit, Now" button', 'Dialog shows: "Success, saved!"'),
         ("Type café, naïve, 日本語, тест", "Unicode text is stored and displayed correctly")],
        2,
    ),
    pad_row(
        ["Special chars - embedded newline in step", "Tests multi-line field content within one CSV cell", "Normal"],
        [("Line one of the step\nLine two of the step", "Expected result\nalso spans two lines"),
         ("Normal step 2", "Normal expected 2")],
        2,
    ),
]
write_csv("13_special_characters_and_escaping.csv", header, rows)

# ---------------------------------------------------------------------------
# 14. Duplicate "Step 1" column header (malformed header)
# ---------------------------------------------------------------------------
header = ["Title", "Description", "Priority", "Step 1", "Expected Result 1", "Step 1", "Expected Result 1"]
rows = [
    ["Duplicate Step 1 header columns", "Header contains 'Step 1' twice — malformed template", "Normal",
     "First occurrence action", "First occurrence expected", "Second occurrence action", "Second occurrence expected"],
]
write_csv("14_duplicate_step_column_headers.csv", header, rows)

# ---------------------------------------------------------------------------
# 15. Header case & whitespace variations (robustness of column matching)
# ---------------------------------------------------------------------------
header = ["Title", "Description", "Priority", " step 1 ", "EXPECTED RESULT 1", "Step  2", "expected result 2"]
rows = [
    ["Header case/whitespace variations", "Column names use mixed case and extra whitespace", "Normal",
     "Action under a lowercase/padded header", "Result under an uppercase header",
     "Action under a double-spaced header", "Result under a lowercase header"],
]
write_csv("15_header_case_and_whitespace_variations.csv", header, rows)

# ---------------------------------------------------------------------------
# 16. Header structurally missing all Expected Result columns (Step columns only)
# ---------------------------------------------------------------------------
header = ["Title", "Description", "Priority", "Step 1", "Step 2", "Step 3"]
rows = [
    ["No Expected Result columns in header at all", "Header has Step 1/2/3 but no Expected Result columns", "Normal",
     "Action 1", "Action 2", "Action 3"],
]
write_csv("16_step_columns_without_expected_columns_in_header.csv", header, rows)

# ---------------------------------------------------------------------------
# 17. Header structurally missing all Step columns (Expected Result columns only)
# ---------------------------------------------------------------------------
header = ["Title", "Description", "Priority", "Expected Result 1", "Expected Result 2", "Expected Result 3"]
rows = [
    ["No Step columns in header at all", "Header has Expected Result 1/2/3 but no Step columns", "Normal",
     "Result 1", "Result 2", "Result 3"],
]
write_csv("17_expected_columns_without_step_columns_in_header.csv", header, rows)

print("\nDone.")
