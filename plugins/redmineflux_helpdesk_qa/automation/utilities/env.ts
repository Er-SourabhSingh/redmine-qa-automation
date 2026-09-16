import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * This plugin's real role model is Admin / Agent / Customer — NOT a generic
 * Manager/Developer/QA-Engineer/Client taxonomy (that was an earlier, wrong
 * scaffold copied before this plugin's actual roles were known; corrected
 * 2026-09-14). Agent and Customer credentials are fixed local fixtures (see
 * testdata/helpdesk.local.fixtures.ts) — only Admin's password is
 * environment-supplied, since it gets rotated by the forced-change flow on a
 * fresh instance and is the one credential every environment is guaranteed
 * to have.
 */
export interface Credentials {
  username: string;
  password: string;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing "${name}" in automation/.env. Copy .env.example to .env and fill it in from ` +
        'the repo root\'s QA_CREDENTIALS.md — never hardcode credentials in test code.'
    );
  }
  return value;
}

export const baseURL = required('BASE_URL');

export function getAdminCredentials(): Credentials {
  return { username: required('ADMIN_USERNAME'), password: required('ADMIN_PASSWORD') };
}
