import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export type Role = 'admin' | 'manager' | 'developer' | 'qaEngineer' | 'client';

export interface Credentials {
  username: string;
  password: string;
}

const ROLE_ENV_KEYS: Record<Role, [string, string]> = {
  admin: ['ADMIN_USERNAME', 'ADMIN_PASSWORD'],
  manager: ['MANAGER_USERNAME', 'MANAGER_PASSWORD'],
  developer: ['DEVELOPER_USERNAME', 'DEVELOPER_PASSWORD'],
  qaEngineer: ['QA_ENGINEER_USERNAME', 'QA_ENGINEER_PASSWORD'],
  client: ['CLIENT_USERNAME', 'CLIENT_PASSWORD'],
};

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing "${name}" in automation/.env. Copy .env.example to .env and fill it in from ` +
        'QA_CREDENTIALS_LOCAL.md or QA_CREDENTIALS_FORGE.md — never hardcode credentials in test code.'
    );
  }
  return value;
}

export const baseURL = required('BASE_URL');

export function getCredentials(role: Role): Credentials {
  const [usernameKey, passwordKey] = ROLE_ENV_KEYS[role];
  return {
    username: required(usernameKey),
    password: required(passwordKey),
  };
}
