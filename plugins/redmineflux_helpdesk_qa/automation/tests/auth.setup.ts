import { test as setup } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { getAdminCredentials } from '../utilities/env';
import { AGENTS, CUSTOMERS, MAIL_PASSWORD } from '../testdata/helpdesk.local.fixtures';

/**
 * Infrastructure, not a plugin test suite — runs once per role via the "setup" project
 * (see playwright.config.ts) and saves a reusable session to .auth/<role>.json.
 * Does not count as a spec file under the "one spec per testcases/<suite>.md" rule.
 *
 * Matches this plugin's real 3-tier role model — Admin / Agent / Customer —
 * corrected 2026-09-14 from an earlier generic Manager/Developer/QA/Client
 * scaffold that had nothing to do with this plugin's actual roles.
 */
setup('authenticate as admin', async ({ page }) => {
  const { username, password } = getAdminCredentials();
  const loginPage = new LoginPage(page);
  await loginPage.login(username, password);
  await loginPage.assertLoggedIn();
  await page.context().storageState({ path: '.auth/admin.json' });
});

setup('authenticate as agent', async ({ page }) => {
  const agent = AGENTS.lunaBlossom;
  const loginPage = new LoginPage(page);
  await loginPage.login(agent.login, MAIL_PASSWORD);
  await loginPage.assertLoggedIn();
  await page.context().storageState({ path: '.auth/agent.json' });
});

setup('authenticate as customer', async ({ page }) => {
  const customer = CUSTOMERS.alphaCustomer;
  const loginPage = new LoginPage(page);
  await loginPage.login(customer.login, MAIL_PASSWORD);
  await loginPage.assertLoggedIn();
  await page.context().storageState({ path: '.auth/customer.json' });
});
