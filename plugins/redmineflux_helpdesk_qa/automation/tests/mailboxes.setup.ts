import { test as setup } from '@playwright/test';
import { execSync } from 'node:child_process';
import { AGENTS, CUSTOMERS, MANAGERS, PROJECTS, MAIL_PASSWORD } from '../testdata/helpdesk.local.fixtures';

/**
 * Infrastructure, not a plugin test suite — ensures every fixture email in
 * helpdesk.local.fixtures.ts has a real mailbox on the local Docker mail
 * server (see reference_docker_mail_server.md memory) BEFORE provision.setup.ts
 * creates the matching Redmine accounts, so any email-flow test that logs into
 * webmail for one of these addresses always finds a real, working mailbox —
 * not just a Redmine user record with an unreachable email.
 *
 * Confirmed live 2026-09-14: `docker exec local-mail-server setup email list`
 * already showed every AGENTS/CUSTOMERS/PROJECTS support address as an
 * existing mailbox EXCEPT `ivy.sterling@test.local` (the MANAGERS fixture) —
 * proving this had never actually been run before; the Manager fixture was
 * created as a Redmine User but its mailbox was simply never provisioned.
 *
 * No browser needed — this is a plain Node script wrapped as a Playwright
 * test purely so it participates in the same setup/dependency chain as
 * auth.setup.ts and provision.setup.ts (see playwright.config.ts).
 */
const MAIL_CONTAINER = 'local-mail-server';

function listExistingMailboxes(): Set<string> {
  const output = execSync(`docker exec ${MAIL_CONTAINER} setup email list`, { encoding: 'utf-8' });
  // Each line looks like "* somebody@test.local ( 12K / ~ ) [0%]" — pull out the address.
  const emails = [...output.matchAll(/\*\s+(\S+@\S+)\s+\(/g)].map(m => m[1]);
  return new Set(emails);
}

function addMailbox(email: string, password: string) {
  execSync(`docker exec ${MAIL_CONTAINER} setup email add ${email} '${password}'`, { encoding: 'utf-8' });
}

setup('provision fixture mailboxes on the local mail server', async () => {
  const requiredEmails = [
    ...Object.values(AGENTS).map(a => a.email),
    ...Object.values(CUSTOMERS).map(c => c.email),
    ...Object.values(MANAGERS).map(m => m.email),
    ...Object.values(PROJECTS).map(p => p.supportEmail),
  ];

  let existing: Set<string>;
  try {
    existing = listExistingMailboxes();
  } catch (err) {
    // The local mail stack is a shared, fixed resource on this machine (not
    // something spun up per Redmine instance) — if it's not running at all,
    // don't fail the whole setup chain over it; just warn loudly so
    // email-flow tests fail with an obvious reason instead of a silent hang.
    console.warn(
      `[mailboxes.setup] Could not reach the "${MAIL_CONTAINER}" mail container (${(err as Error).message}). ` +
      `Skipping mailbox provisioning — any email-flow test will fail until this container is running.`
    );
    return;
  }

  const missing = requiredEmails.filter(email => !existing.has(email));
  for (const email of missing) {
    addMailbox(email, MAIL_PASSWORD);
    console.log(`[mailboxes.setup] Created mailbox: ${email}`);
  }
  if (missing.length === 0) {
    console.log('[mailboxes.setup] All fixture mailboxes already exist — nothing to create.');
  }
});
