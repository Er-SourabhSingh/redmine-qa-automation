import { test as setup } from '@playwright/test';
import { LoginPage } from './LoginPage';
import { getCredentials, Role } from '../utilities/env';

/**
 * Infrastructure, not a plugin test suite — runs once per role via the "setup" project
 * (see playwright.config.ts) and saves a reusable session to .auth/<role>.json.
 * Does not count as a spec file under the "one spec per testcases/<suite>.md" rule.
 */
const roles: Role[] = ['admin', 'manager', 'developer', 'qaEngineer', 'client'];

for (const role of roles) {
  setup(`authenticate as ${role}`, async ({ page }) => {
    const { username, password } = getCredentials(role);
    const loginPage = new LoginPage(page);
    await loginPage.login(username, password);
    await loginPage.assertLoggedIn();
    await page.context().storageState({ path: `.auth/${role}.json` });
  });
}
