#!/usr/bin/env node
/**
 * Generates CSV test-data files for the fix to issue "expected/step field limit
 * increased from 2000 to 40000 chars" (to allow migrating long Jira/Zephyr test
 * cases into Redmine). Companion to generate_test_csvs.py's files 07/08, which
 * were built against the OLD 2000-char limit and are kept as-is as a regression
 * check that short content still imports fine.
 *
 * New files here specifically target the NEW 40000-char limit:
 *   - exact boundary (40000 valid / 40001 invalid)
 *   - a realistic "migrated from Jira/Zephyr" long expected-result scenario,
 *     well above the old 2000 limit but comfortably within the new 40000 one
 */
const fs = require('fs');
const path = require('path');

const OUT_DIR = __dirname;

function csvEscape(value) {
  const s = String(value);
  if (/[",\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function writeCsv(filename, header, rows) {
  const lines = [];
  if (header) lines.push(header.map(csvEscape).join(','));
  for (const row of rows) lines.push(row.map(csvEscape).join(','));
  const outPath = path.join(OUT_DIR, filename);
  fs.writeFileSync(outPath, lines.join('\r\n') + '\r\n', 'utf8');
  console.log(`wrote ${filename}: ${rows.length} data row(s)`);
}

function stepCols(n) {
  const cols = [];
  for (let i = 1; i <= n; i++) cols.push(`Step ${i}`, `Expected Result ${i}`);
  return cols;
}

function padRow(core, stepPairs, maxSteps) {
  const row = [...core];
  for (let i = 0; i < maxSteps; i++) {
    if (i < stepPairs.length) row.push(stepPairs[i][0], stepPairs[i][1]);
    else row.push('', '');
  }
  return row;
}

// ---------------------------------------------------------------------------
// 21. Boundary: exactly 40000 chars (valid, new limit) vs 40001 chars (invalid)
// ---------------------------------------------------------------------------
{
  const step40000 = 'D'.repeat(40000);
  const step40001 = 'E'.repeat(40001);
  const header = ['Title', 'Description', 'Priority', ...stepCols(1)];
  const rows = [
    padRow(
      ['Boundary - step exactly 40000 chars (valid, new limit)', 'Exactly at the new limit, should be accepted', 'Normal'],
      [[step40000, 'Accepted, exactly at the new 40000-char boundary']],
      1
    ),
    padRow(
      ['Boundary - step exactly 40001 chars (invalid, new limit)', 'One char over the new limit, should error', 'Normal'],
      [[step40001, 'Rejected, one char over the new boundary']],
      1
    ),
  ];
  writeCsv('21_boundary_40000_vs_40001_chars.csv', header, rows);
}

// ---------------------------------------------------------------------------
// 22. Realistic Jira/Zephyr migration scenario: long expected-result text well
//     above the old 2000-char limit, comfortably within the new 40000 one.
//     This is the exact client-reported use case driving the fix.
// ---------------------------------------------------------------------------
{
  function longExpected(targetLen, label) {
    const paragraph = `Expected result migrated from Jira/Zephyr (${label}): the system shall validate every ` +
      'field, persist the record, and surface a confirmation to the user including all relevant audit trail ' +
      'entries, attachment references, linked issues, and historical comments carried over from the legacy tool. ';
    let text = '';
    while (text.length < targetLen) text += paragraph;
    return text.slice(0, targetLen);
  }
  const header = ['Title', 'Description', 'Priority', ...stepCols(3)];
  const rows = [
    padRow(
      ['Zephyr migration - 5,000 char expected result', 'Just above the old 2000-char limit, well within the new 40000', 'High'],
      [
        ['Execute the legacy Zephyr test step 1', longExpected(5000, '5k case')],
        ['Execute the legacy Zephyr test step 2', 'Short expected result for step 2'],
        ['Execute the legacy Zephyr test step 3', 'Short expected result for step 3'],
      ],
      3
    ),
    padRow(
      ['Zephyr migration - 15,000 char expected result', 'Mid-range long content, typical of a detailed legacy test case', 'High'],
      [
        ['Execute the legacy Jira test step 1', longExpected(15000, '15k case')],
        ['Execute the legacy Jira test step 2', 'Short expected result for step 2'],
        ['', ''],
      ],
      3
    ),
    padRow(
      ['Zephyr migration - 35,000 char expected result', 'Near the new 40000 ceiling, the largest realistic migrated case', 'High'],
      [
        ['Execute the legacy Zephyr test step 1', longExpected(35000, '35k case')],
        ['', ''],
        ['', ''],
      ],
      3
    ),
    padRow(
      ['Zephyr migration - long STEP text too (not just expected)', 'Step column itself also carries migrated long content', 'Normal'],
      [
        [longExpected(12000, 'step text 12k'), 'Short expected result'],
        ['', ''],
        ['', ''],
      ],
      3
    ),
  ];
  writeCsv('22_jira_zephyr_migration_long_expected.csv', header, rows);
}

console.log('\nDone.');
