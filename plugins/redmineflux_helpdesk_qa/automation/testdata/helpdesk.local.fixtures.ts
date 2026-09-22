/**
 * Real, currently-existing test data on the LOCAL environment (redmine-docker-6
 * container, http://localhost:3012), mirroring `HELPDESK_TESTDATA_LOCAL.xlsx`.
 *
 * Separate from `helpdesk.fixtures.ts`, which is Forge-only — data here has no
 * relationship to Forge fixtures beyond borrowing the same persona names for
 * realism (see comments below). Keep this file and the xlsx in sync manually.
 *
 * Backing mail server: local Docker Postfix/Dovecot + Roundcube stack, domain
 * `test.local`, every mailbox below shares one password (`MAIL_PASSWORD`).
 * Webmail: http://127.0.0.1:8081/. SMTP: mail:587 (STARTTLS). IMAP: mail:993 (SSL).
 *
 * Specs import from here instead of hardcoding magic strings:
 *   import { PROJECTS, AGENTS, CUSTOMERS, MANAGERS, MAIL_SERVER } from '../testdata/helpdesk.local.fixtures';
 */

export const MAIL_SERVER = {
  smtpHost: 'mail',
  smtpPort: 587,
  imapHost: 'mail',
  imapPort: 993,
  domain: 'test.local',
  webmailUrl: 'http://127.0.0.1:8081/',
} as const;

/**
 * Shared password for every fixture account (Redmine login AND mailbox) —
 * a throwaway fixture value, not a real secret. Standardized to match the
 * repo-wide common password in QA_CREDENTIALS.md (2026-09-14, user request:
 * one password everywhere, so an already-seeded environment never needs its
 * password force-updated to match a plugin-specific value). Confirmed live
 * this Redmine instance's password policy (Administration > Settings >
 * Authentication) requires only a minimum length of 8, no character-class
 * complexity — plain 8 digits satisfies it.
 */
export const MAIL_PASSWORD = '12345678';

export interface ProjectFixture {
  id: number;
  name: string;
  identifier: string;
  /** The project's dedicated Helpdesk support inbox (SMTP + IMAP, set in Email Configuration). */
  supportEmail: string;
}

export const PROJECTS = {
  alpha: {
    id: 3,
    name: 'Helpdesk QA Alpha',
    identifier: 'helpdesk-qa-alpha',
    supportEmail: 'alpha.support@test.local',
  },
  beta: {
    id: 4,
    name: 'Helpdesk QA Beta',
    identifier: 'helpdesk-qa-beta',
    supportEmail: 'beta.support@test.local',
  },
} as const satisfies Record<string, ProjectFixture>;

export type ProjectKey = keyof typeof PROJECTS;

export interface AgentFixture {
  /** Persona name borrowed from the Forge fixtures' Support Level assignees (see helpdesk.fixtures.ts SUPPORT_LEVELS), for realism only — no other link to Forge. */
  name: string;
  login: string;
  email: string;
  project: ProjectKey;
}

/**
 * 10 dedicated agents per project (20 total), created as real Redmine Users,
 * role **Agent** (id 6), project members per `project` below. Login and
 * mailbox password both `MAIL_PASSWORD` (see above).
 *
 * The first 3 per project (lunaBlossom/autumnGrace/willowBelle on Alpha,
 * auroraWren/briarSunset/celesteDawn on Beta) were created 2026-08-26 and are
 * the ones referenced elsewhere in this session's docs/bugs (e.g. the L1→L2→L3
 * SLA escalation chain in HELPDESK_MEMORY.md). The other 14 (2026-09-14,
 * user request: "more agents per project") reuse every remaining unused
 * persona name from the repo root's `QA_CREDENTIALS.md` Seed Users list (a
 * pool shared across Local and Forge testing, not Forge-only) — same
 * "borrow the name for realism, no other link beyond the name itself"
 * convention as the original 6 (see this file's header comment) — for
 * scenarios needing more than 3 agents per project (multi-agent assignment,
 * additional escalation levels, load-style ticket distribution).
 */
export const AGENTS = {
  lunaBlossom: { name: 'Luna Blossom', login: 'luna.blossom', email: 'luna.blossom@test.local', project: 'alpha' },
  autumnGrace: { name: 'Autumn Grace', login: 'autumn.grace', email: 'autumn.grace@test.local', project: 'alpha' },
  willowBelle: { name: 'Willow Belle', login: 'willow.belle', email: 'willow.belle@test.local', project: 'alpha' },
  daisySkye: { name: 'Daisy Skye', login: 'daisy.skye', email: 'daisy.skye@test.local', project: 'alpha' },
  harmonyRose: { name: 'Harmony Rose', login: 'harmony.rose', email: 'harmony.rose@test.local', project: 'alpha' },
  summerRain: { name: 'Summer Rain', login: 'summer.rain', email: 'summer.rain@test.local', project: 'alpha' },
  violetEmber: { name: 'Violet Ember', login: 'violet.ember', email: 'violet.ember@test.local', project: 'alpha' },
  serenityBloom: { name: 'Serenity Bloom', login: 'serenity.bloom', email: 'serenity.bloom@test.local', project: 'alpha' },
  novaStarling: { name: 'Nova Starling', login: 'nova.starling', email: 'nova.starling@test.local', project: 'alpha' },
  ivySkylark: { name: 'Ivy Skylark', login: 'ivy.skylark', email: 'ivy.skylark@test.local', project: 'alpha' },

  auroraWren: { name: 'Aurora Wren', login: 'aurora.wren', email: 'aurora.wren@test.local', project: 'beta' },
  briarSunset: { name: 'Briar Sunset', login: 'briar.sunset', email: 'briar.sunset@test.local', project: 'beta' },
  celesteDawn: { name: 'Celeste Dawn', login: 'celeste.dawn', email: 'celeste.dawn@test.local', project: 'beta' },
  lunaMeadow: { name: 'Luna Meadow', login: 'luna.meadow', email: 'luna.meadow@test.local', project: 'beta' },
  sageWillow: { name: 'Sage Willow', login: 'sage.willow', email: 'sage.willow@test.local', project: 'beta' },
  marigoldRayne: { name: 'Marigold Rayne', login: 'marigold.rayne', email: 'marigold.rayne@test.local', project: 'beta' },
  emberLilac: { name: 'Ember Lilac', login: 'ember.lilac', email: 'ember.lilac@test.local', project: 'beta' },
  opalSparrow: { name: 'Opal Sparrow', login: 'opal.sparrow', email: 'opal.sparrow@test.local', project: 'beta' },
  seleneFrost: { name: 'Selene Frost', login: 'selene.frost', email: 'selene.frost@test.local', project: 'beta' },
  islaMoon: { name: 'Isla Moon', login: 'isla.moon', email: 'isla.moon@test.local', project: 'beta' },
} as const satisfies Record<string, AgentFixture>;

export type AgentKey = keyof typeof AGENTS;

export interface CustomerFixture {
  login: string;
  email: string;
  project: ProjectKey;
}

/**
 * 1 dedicated Customer record per project, created via the real UI on 2026-08-26
 * (`rf_customers/new`) — login and mailbox password both `MAIL_PASSWORD` (see above).
 */
export const CUSTOMERS = {
  alphaCustomer: { login: 'alpha.customer', email: 'alpha.customer@test.local', project: 'alpha' },
  betaCustomer: { login: 'beta.customer', email: 'beta.customer@test.local', project: 'beta' },
} as const satisfies Record<string, CustomerFixture>;

export type CustomerKey = keyof typeof CUSTOMERS;

export interface ManagerFixture {
  name: string;
  login: string;
  email: string;
  /** The single project this user is a Member of — deliberately not a member of any other project. */
  project: ProjectKey;
}

/**
 * Project-scoped Manager fixture, created 2026-08-27 to unblock TC-HLP-062
 * (manager scoped to one project cannot disturb another project's customer
 * access). Real Redmine User, role **Manager** (id 3, given manage_helpdesk +
 * export_helpdesk_reports + manage_prepaid_support_hours + view_helpdesk +
 * view_email_history permissions this session), Member of Helpdesk QA Alpha
 * ONLY — verified not a Member of Beta.
 */
export const MANAGERS = {
  ivySterling: { name: 'Ivy Sterling', login: 'ivy.sterling', email: 'ivy.sterling@test.local', project: 'alpha' },
} as const satisfies Record<string, ManagerFixture>;

export type ManagerKey = keyof typeof MANAGERS;
