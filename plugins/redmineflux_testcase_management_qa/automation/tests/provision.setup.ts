import { test as setup, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { getAdminCredentials, projectId } from '../utilities/env';

export const EMPTY_PROJECT_ID = 'tcm-permissions-private-test';
export const SCOPE_CHECK_PROJECT_ID = 'helpdesk-service-desk';

/**
 * Infrastructure, not a plugin test suite — makes the suite self-bootstrapping.
 * REPORTS.md's own preconditions (>=1 run with executed results, >=1
 * requirement with linked cases, >=1 defect) are already abundantly satisfied
 * by `test-project`'s accumulated manual-testing history, so this step
 * mostly verifies reachability rather than building fixtures from scratch.
 *
 * TWO extra projects are reused for the "empty project" and "second project"
 * preconditions, kept DELIBERATELY SEPARATE:
 *  - `tcm-permissions-private-test` — Permissions suite's own fixture, has
 *    the module enabled and ZERO Runs. Reused as-is for TC-TCM-095's own
 *    "no runs or results" precondition and MUST be left with zero Runs
 *    forever — see BUG-TCM-028 (found via this exact scenario: creating ANY
 *    report in a zero-run project is blocked by a "Runs must have at least
 *    one selected" validation error, even with the default "Include all
 *    test run" option).
 *  - `helpdesk-service-desk` — a real, pre-existing project (the Helpdesk
 *    plugin's own QA project) that already has the Testcase Management
 *    module enabled with 2 real Runs. Reused as TC-TCM-097's "Project B" for
 *    the project-scope check. A from-scratch second project was attempted
 *    first but hit a chain of unrelated environment issues (a sudo-mode
 *    password-reconfirm gate on adding a project Member, then a "Test case"
 *    tracker not enabled by default blocking Test Suite creation, then
 *    global custom fields — QA Bug-Only Tracker Field / QA Required Readonly
 *    Field — reported as required on save but not rendered on the New
 *    Testcase form for a brand-new project, making it impossible to create
 *    a test case via the UI at all). Reusing an existing, independent,
 *    already-functional project avoids all of that and is a strictly better
 *    fixture for a scope-isolation check anyway (genuinely different real
 *    data, not synthetic).
 */
setup('verify environment', async ({ page }) => {
  const { username, password } = getAdminCredentials();
  const loginPage = new LoginPage(page);
  await loginPage.login(username, password);
  await loginPage.assertLoggedIn();

  await page.goto(`/test_suites/releases?project_id=${projectId}`);
  await expect(page.getByRole('link', { name: 'Reports' })).toBeVisible();

  const resp = await page.goto(`/runs/new?project_id=${SCOPE_CHECK_PROJECT_ID}`);
  expect(resp?.status()).toBeLessThan(400);
  await expect(page.locator('table.rf_testcase_management_table tbody tr').first()).toBeVisible();
});
