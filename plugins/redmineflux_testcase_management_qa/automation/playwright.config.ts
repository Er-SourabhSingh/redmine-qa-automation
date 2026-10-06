import { defineConfig, devices } from '@playwright/test';
import { baseURL } from './utilities/env';

/**
 * Two chained setup stages run before any real test, each its own named
 * project so Playwright's dependency graph guarantees the order:
 *
 *   provision → logs in as Admin, idempotently ensures the fixtures this
 *               suite's specs assume exist (tests/provision.setup.ts)
 *   auth      → logs in as Admin, saves .auth/admin.json (tests/auth.setup.ts)
 *
 * REPORTS.md's own TCs are written against a QA/Manager/Admin-undifferentiated
 * role ("User Role: QA / Manager"), and this plugin's actual role-permission
 * boundaries are already fully covered by TESTCASE_MANAGEMENT_PERMISSIONS.md —
 * so this suite only needs one role (Admin) for now. Extend with more
 * projects/roles here if a later suite's specs need them.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 60_000,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    acceptDownloads: true,
  },

  projects: [
    { name: 'provision', testMatch: /provision\.setup\.ts/ },
    { name: 'auth', testMatch: /auth\.setup\.ts/, dependencies: ['provision'] },

    {
      name: 'admin',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/admin.json' },
      dependencies: ['auth'],
    },
  ],
});
