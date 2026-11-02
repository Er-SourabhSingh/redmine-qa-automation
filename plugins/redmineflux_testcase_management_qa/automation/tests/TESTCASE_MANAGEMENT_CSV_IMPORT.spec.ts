import { test, expect, Page } from '@playwright/test';
import { ImportPage, Preview } from './pages/ImportPage';
import { CustomFieldsPage } from './pages/CustomFieldsPage';
import { Fixture, expectedSteps, loadFixture, squash, writeFixture } from '../utilities/csv';
import { projectId } from '../utilities/env';

/**
 * Mirrors testcases/TESTCASE_MANAGEMENT_CSV_IMPORT.md (TC-TCM-021 … 037, 275 … 277, 279).
 * Every test imports a fixture from automation/testdata/csv-test-data/ through the real 4-step wizard,
 * then opens the created test cases and compares what was saved with what the CSV says should be saved.
 *
 * Each run tags the imported Titles with a unique suffix, so re-runs never see each other's test cases.
 */
const RUN = Date.now().toString(36);
let seq = 0;
const tag = () => `r${RUN}-${++seq}x`;

interface Outcome {
  fx: Fixture;
  preview: Preview;
  created: { id: number; subject: string }[];
}

/**
 * Wizard → preview → (confirm) → verify saved steps. A row the preview did not mark Error must exist afterwards
 * with exactly the steps `expectedSteps()` derives from its CSV row; an Error row must not exist at all.
 * `sample` limits how many rows get their saved steps opened (bulk files).
 */
async function importAndVerify(
  page: Page,
  name: string,
  opts: { confirm?: boolean; verifySteps?: boolean; sample?: number[]; wizard?: Parameters<ImportPage['upload']>[1] } = {}
): Promise<Outcome> {
  const imp = new ImportPage(page, projectId);
  const fx = loadFixture(name, tag());
  const preview = await imp.previewOf(fx.file, opts.wizard);
  expect(preview.rows).toHaveLength(fx.rows.length);
  if (opts.confirm === false) return { fx, preview, created: [] };

  await imp.confirmImport();
  const created = await imp.findCreated(`~${fx.tag}`);
  const bySubject = new Map(created.map((c) => [c.subject, c.id]));
  const descIdx = fx.header.findIndex((h) => h.trim().toLowerCase() === 'description');

  for (let i = 0; i < fx.rows.length; i++) {
    const id = bySubject.get(fx.subjects[i]);
    if (preview.rows[i].status === 'Error') {
      expect(id, `row ${i + 1} was an Error in the preview and must not be created`).toBeUndefined();
      continue;
    }
    expect(id, `row ${i + 1} (${fx.subjects[i]}) should have been created`).toBeDefined();
    if (opts.verifySteps === false || (opts.sample && !opts.sample.includes(i))) continue;
    const want = expectedSteps(fx.header, fx.rows[i]);
    const saved = await imp.readCase(id!);
    expect(saved.subject, `row ${i + 1} subject`).toBe(fx.subjects[i]);
    if (descIdx >= 0) expect(squash(saved.description), `row ${i + 1} description`).toBe(squash(fx.rows[i][descIdx] ?? ''));
    const got = saved.steps;
    expect(got.length, `row ${i + 1} step count`).toBe(want.length);
    got.forEach((g, k) => {
      expect(g.step, `row ${i + 1} step ${k + 1}`).toBe(squash(want[k].step));
      expect(g.expected, `row ${i + 1} expected ${k + 1}`).toBe(squash(want[k].expected));
    });
  }
  return { fx, preview, created };
}

test.describe('CSV Import — functional', () => {
  test('TC-TCM-021 - legacy single Steps/Expected columns import unchanged', async ({ page }) => {
    const { preview } = await importAndVerify(page, '01_legacy_single_step_format.csv');
    expect(preview).toMatchObject({ ok: 4, warnings: 1, errors: 0 });
  });

  test('TC-TCM-022 - legacy row with missing Expected is skipped with a warning, case still created', async ({ page }) => {
    const { preview, fx } = await importAndVerify(page, '01_legacy_single_step_format.csv');
    const expectedIdx = fx.header.findIndex((h) => h.trim().toLowerCase() === 'expected');
    const stepsIdx = fx.header.findIndex((h) => h.trim().toLowerCase() === 'steps');
    const gapRow = fx.rows.findIndex((r) => r[stepsIdx]?.trim() && !r[expectedIdx]?.trim());
    expect(gapRow, 'fixture 01 has a Steps-filled / Expected-blank row').toBeGreaterThanOrEqual(0);
    expect(preview.rows[gapRow].status).toBe('Warning');
    expect(preview.rows[gapRow].details.join(' ')).toMatch(/missing its expected result/i);
  });

  test('TC-TCM-023 - zero-step CSV (no Steps/Expected columns at all) creates cases with no steps', async ({ page }) => {
    const fx = writeFixture('zero-steps.csv', ['Title', 'Description', 'Priority'], [['Zero step A', 'd', 'High'], ['Zero step B', 'd', 'Low']], tag());
    const imp = new ImportPage(page, projectId);
    const preview = await imp.previewOf(fx.file);
    expect(preview.errors).toBe(0);
    await imp.confirmImport();
    const created = await imp.findCreated(`~${fx.tag}`);
    expect(created).toHaveLength(2);
    for (const c of created) expect(await imp.readSteps(c.id)).toEqual([]);
  });

  test('TC-TCM-024 - 0..50-step sweep: every row imports with its own steps, in order', async ({ page }) => {
    test.setTimeout(600_000);
    const { fx, preview } = await importAndVerify(page, '02_zero_to_fifty_steps_range.csv', { sample: [0, 1, 25, 50] });
    expect(preview.errors).toBe(0);
    expect(fx.rows).toHaveLength(51);
    expect(expectedSteps(fx.header, fx.rows[50])).toHaveLength(50);
  });

  test('TC-TCM-025 - steps-only / expected-only rows are skipped with a warning, case still created', async ({ page }) => {
    for (const name of ['03_steps_only_no_expected.csv', '04_expected_only_no_steps.csv', '05_mixed_partial_per_row.csv']) {
      const { preview } = await importAndVerify(page, name);
      expect(preview.errors, `${name}: no row may be an Error`).toBe(0);
      expect(preview.warnings, `${name}: incomplete steps must warn`).toBeGreaterThan(0);
    }
  });

  test('TC-TCM-026 - varying step counts in one file do not contaminate each other', async ({ page }) => {
    const { preview } = await importAndVerify(page, '06_varying_step_counts_same_file.csv');
    expect(preview.errors).toBe(0);
  });

  test('TC-TCM-027 - non-sequential numbering (Step 1/3/5) is saved renumbered 1, 2, 3', async ({ page }) => {
    const { created } = await importAndVerify(page, '12_non_sequential_step_numbering.csv');
    const steps = await new ImportPage(page, projectId).readSteps(created[0].id);
    expect(steps).toHaveLength(3);
  });

  test('TC-TCM-028 - special characters, unicode, emoji and embedded newlines are stored intact', async ({ page }) => {
    const { preview } = await importAndVerify(page, '13_special_characters_and_escaping.csv');
    expect(preview.errors).toBe(0);
  });

  test('TC-TCM-029 - header missing a whole column family: steps skipped, case still created', async ({ page }) => {
    for (const name of ['16_step_columns_without_expected_columns_in_header.csv', '17_expected_columns_without_step_columns_in_header.csv']) {
      const { preview } = await importAndVerify(page, name);
      expect(preview.errors, name).toBe(0);
    }
  });
});

test.describe('CSV Import — boundary / negative', () => {
  test('TC-TCM-030 - step text of 2000 chars imports (now well under the 40000 limit)', async ({ page }) => {
    const { preview } = await importAndVerify(page, '08_boundary_2000_vs_2001_chars.csv');
    expect(preview.rows[0].status).not.toBe('Error');
  });

  test('TC-TCM-031 - step text of 2001 chars is no longer rejected (superseded by 40000 limit, BUG-TCM-079)', async ({ page }) => {
    const { preview } = await importAndVerify(page, '08_boundary_2000_vs_2001_chars.csv');
    expect(preview.rows[1].status).not.toBe('Error');
    expect(preview.errors).toBe(0);
  });

  test('TC-TCM-032 - 2500-char step now imports (superseded by 40000 limit, BUG-TCM-079)', async ({ page }) => {
    const { preview } = await importAndVerify(page, '07_oversized_step_text_negative.csv');
    expect(preview.errors).toBe(0);
  });

  test('TC-TCM-033 - empty file and header-only file give a clean error, no crash', async ({ page }) => {
    const imp = new ImportPage(page, projectId);
    await imp.upload(loadFixture('11_completely_empty_file.csv', tag()).file);
    expect(await imp.flashErrorText()).toMatch(/does not contain any headers or data|No file uploaded/i);
    expect(await imp.stepText()).toBe('Step(1/4)');

    await imp.upload(loadFixture('10_header_only_no_data_rows.csv', tag()).file);
    expect(await imp.flashErrorText()).toMatch(/headers but no data rows/i);
    expect(await imp.stepText()).toBe('Step(1/4)');
  });

  test('TC-TCM-034 - 100 test cases x 3 steps import in one pass', async ({ page }) => {
    test.setTimeout(600_000);
    const { created, preview } = await importAndVerify(page, '09_large_bulk_import_100_rows.csv', { sample: [0, 49, 99] });
    expect(preview.errors).toBe(0);
    expect(created).toHaveLength(100);
  });

  test('TC-TCM-035 - padded header " step 1 " still maps and its value is saved', async ({ page }) => {
    const imp = new ImportPage(page, projectId);
    const fx = loadFixture('15_header_case_and_whitespace_variations.csv', tag());
    const preview = await imp.previewOf(fx.file);
    expect(preview.errors).toBe(0);
    await imp.confirmImport();
    const [c] = await imp.findCreated(`~${fx.tag}`);
    const steps = await imp.readSteps(c.id);
    const padded = fx.header.findIndex((h) => h.trim().toLowerCase() === 'step 1');
    expect(steps[0]?.step).toBe(squash(fx.rows[0][padded]));
  });

  test('TC-TCM-036 - duplicated "Step 1" header is announced on step 2 before import', async ({ page }) => {
    const imp = new ImportPage(page, projectId);
    await imp.upload(loadFixture('14_duplicate_step_column_headers.csv', tag()).file);
    expect(await imp.duplicateHeaderNotice()).toMatch(/Duplicate column names found.*Step 1/);
  });

  test('TC-TCM-037 - wide all-columns issue exports render step 4 (no 500 / CookieOverflow)', async ({ page }) => {
    const imp = new ImportPage(page, projectId);
    const cases: [string, Parameters<ImportPage['upload']>[1], number][] = [
      ['18_all_columns_export_118789.csv', { encoding: 'Windows-1252' }, 500],
      ['19_all_columns_export_118789_redmine6.csv', {}, 5],
    ];
    for (const [name, wizard, rowCount] of cases) {
      const preview = await imp.previewOf(loadFixture(name, tag()).file, wizard);
      expect(preview.rows, name).toHaveLength(rowCount);
    }
    const de = await imp.previewOf(loadFixture('20_all_columns_export_118789_redmine5.csv', tag()).file, { encoding: 'Windows-1252', separator: ';' });
    expect(de.rows).toHaveLength(25);
  });
});

test.describe('CSV Import — 40000-char limit (BUG-TCM-079 / BUG-TCM-093, PostgreSQL text columns)', () => {
  test('TC-TCM-275 - step/expected text of 5k / 15k / 35k chars imports with zero truncation', async ({ page }) => {
    const { preview } = await importAndVerify(page, '22_jira_zephyr_migration_long_expected.csv');
    expect(preview).toMatchObject({ ok: 4, errors: 0 });
  });

  test('TC-TCM-276 - 40000 chars imports, 40001 is rejected citing the 40000 limit', async ({ page }) => {
    const { preview } = await importAndVerify(page, '21_boundary_40000_vs_40001_chars.csv');
    expect(preview.rows[0].status).not.toBe('Error');
    expect(preview.rows[1].status).toBe('Error');
    expect(preview.rows[1].details.join(' ')).toMatch(/exceeds the maximum length of 40000 characters \(got 40001\)/);
  });

  test('TC-TCM-277 - short-content baseline import is unaffected by the column migration', async ({ page }) => {
    const { preview } = await importAndVerify(page, '01_legacy_single_step_format.csv');
    expect(preview).toMatchObject({ ok: 4, warnings: 1, errors: 0 });
  });
});

test.describe('CSV Import — post-import data integrity', () => {
  test('TC-TCM-333 - saved Subject, Description and step content equal the CSV after import', async ({ page }) => {
    test.setTimeout(300_000);
    // importAndVerify() opens every created case and compares Subject, Description, step text and expected text with its CSV row.
    for (const name of ['01_legacy_single_step_format.csv', '13_special_characters_and_escaping.csv', '22_jira_zephyr_migration_long_expected.csv']) {
      const { preview, created } = await importAndVerify(page, name);
      expect(preview.errors, name).toBe(0);
      expect(created.length, name).toBe(preview.rows.length);
    }
  });

  test('TC-TCM-334 - every saved case shows its steps in the saved order (BUG-TCM-129)', async ({ page }) => {
    test.setTimeout(600_000);
    // No sample: every row of these files is opened, and the step list must equal the CSV's order (the comparison is position by position).
    for (const name of ['05_mixed_partial_per_row.csv', '06_varying_step_counts_same_file.csv', '02_zero_to_fifty_steps_range.csv']) {
      await importAndVerify(page, name);
    }
  });
});

test.describe('CSV Import — required custom field', () => {
  const CF = `QA Import Required ${RUN}`;

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: '.auth/admin.json' });
    const page = await ctx.newPage();
    await new CustomFieldsPage(page).deleteIssueField(CF);
    await ctx.close();
  });

  test('TC-TCM-279 - a missing required custom field is a Warning, never an Error, and the case is still created', async ({ page }) => {
    await new CustomFieldsPage(page).createRequiredIssueField(CF, 'testcase');
    const { preview } = await importAndVerify(page, '01_legacy_single_step_format.csv');
    expect(preview).toMatchObject({ ok: 0, warnings: 5, errors: 0 });
    for (const row of preview.rows) {
      expect(row.details.join(' ')).toContain(`Required custom field '${CF}' is missing or empty; importing without it.`);
    }
  });
});
