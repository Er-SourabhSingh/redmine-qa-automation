import { defineConfig, devices } from '@playwright/test';
import { baseURL } from './utilities/env';

/**
 * One project per user role. Each depends on the "setup" project, which logs in
 * as that role once and stores the session in .auth/<role>.json (see tests/auth.setup.ts).
 * Spec files pick a project (role) via --project, or run against all roles by default.
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
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    {
      name: 'admin',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/admin.json' },
      dependencies: ['setup'],
    },
    {
      name: 'manager',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/manager.json' },
      dependencies: ['setup'],
    },
    {
      name: 'developer',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/developer.json' },
      dependencies: ['setup'],
    },
    {
      name: 'qaEngineer',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/qaEngineer.json' },
      dependencies: ['setup'],
    },
    {
      name: 'client',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/client.json' },
      dependencies: ['setup'],
    },
  ],
});
