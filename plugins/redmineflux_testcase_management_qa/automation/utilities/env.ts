import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export interface Credentials {
  username: string;
  password: string;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing "${name}" in automation/.env. Copy .env.example to .env and fill it in from ` +
        "the repo root's QA_CREDENTIALS.md — never hardcode credentials in test code."
    );
  }
  return value;
}

export const baseURL = required('BASE_URL');
export const projectId = required('PROJECT_ID');

export function getAdminCredentials(): Credentials {
  return { username: required('ADMIN_USERNAME'), password: required('ADMIN_PASSWORD') };
}
