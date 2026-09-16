import { defineConfig, devices } from '@playwright/test';
import { baseURL } from './utilities/env';

/**
 * Three chained setup stages run before any real test, each its own named
 * project (not all lumped into one "setup" project) so Playwright's
 * dependency graph — not file-name alphabetical luck — guarantees the order:
 *
 *   mailboxes  → ensures every fixture email has a real mailbox on the local
 *                mail server (tests/mailboxes.setup.ts)
 *   provision  → logs in as Admin, idempotently creates the roles/projects/
 *                agents/customers every fixture assumes exist (tests/provision.setup.ts)
 *   auth       → logs in as each of this plugin's 3 roles (Admin/Agent/Customer)
 *                using the accounts provision just ensured, saves .auth/<role>.json
 *                (tests/auth.setup.ts)
 *
 * This chain is what lets the suite bootstrap itself against a brand-new
 * container/server, not just the one environment it happened to be built
 * against — see provision.setup.ts's own header comment.
 *
 * Then one project per user role (Admin / Agent / Customer — this plugin's
 * real 3-tier model, corrected 2026-09-14), each depending on "auth" and
 * using the session it saved. Spec files pick a project (role) via
 * --project, or run against all roles by default.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'mailboxes', testMatch: /mailboxes\.setup\.ts/ },
    { name: 'provision', testMatch: /provision\.setup\.ts/, dependencies: ['mailboxes'] },
    { name: 'auth', testMatch: /auth\.setup\.ts/, dependencies: ['provision'] },

    {
      name: 'admin',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/admin.json' },
      dependencies: ['auth'],
    },
    {
      name: 'agent',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/agent.json' },
      dependencies: ['auth'],
    },
    {
      name: 'customer',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/customer.json' },
      dependencies: ['auth'],
    },
  ],
});
