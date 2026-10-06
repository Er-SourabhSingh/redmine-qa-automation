import { test as setup } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { getAdminCredentials } from '../utilities/env';

/**
 * Infrastructure, not a plugin test suite — runs once via the "auth" project
 * (see playwright.config.ts) and saves a reusable session to .auth/admin.json.
 * REPORTS.md's own TCs are written against an undifferentiated QA/Manager/
 * Admin role — this plugin's real role-permission boundaries are already
 * fully covered by TESTCASE_MANAGEMENT_PERMISSIONS.md, so only Admin is
 * needed here. Add more setup() blocks (+ matching playwright.config.ts
 * projects) if a later suite's specs need a different role.
 */
setup('authenticate as admin', async ({ page }) => {
  const { username, password } = getAdminCredentials();
  const loginPage = new LoginPage(page);
  await loginPage.login(username, password);
  await loginPage.assertLoggedIn();
  await page.context().storageState({ path: '.auth/admin.json' });
});
