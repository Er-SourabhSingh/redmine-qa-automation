/**
 * Real, currently-existing test data on the active Forge rotation, mirroring
 * `automation/testdata/HELPDESK_TESTDATA_FORGE.xlsx` (the human-readable registry).
 *
 * These two files must be kept in sync manually — this one is not generated from
 * the xlsx. Whenever the xlsx registry is updated (new fixture created, renamed,
 * deactivated), update the matching constant here too, and vice versa.
 *
 * Specs import from here instead of hardcoding magic strings:
 *   import { CUSTOMERS, SLAS } from '../testdata/helpdesk.fixtures';
 */

export interface OrganizationFixture {
  name: string;
}

export const ORGANIZATIONS = {
  acme: { name: 'Acme Corp' },
  globex: { name: 'Globex Industries' },
} as const satisfies Record<string, OrganizationFixture>;

export type OrganizationKey = keyof typeof ORGANIZATIONS;

export interface SlaFixture {
  name: string;
  project: string;
  firstResponseHours: number;
  resolutionHours: number;
}

export const SLAS = {
  standard: {
    name: 'Standard SLA',
    project: 'Helpdesk Service Desk',
    firstResponseHours: 4,
    resolutionHours: 24,
  },
  priority: {
    name: 'Priority SLA',
    project: 'Helpdesk Service Desk',
    firstResponseHours: 1,
    resolutionHours: 8,
  },
  agileStandard: {
    name: 'Agile Standard SLA',
    project: 'Agile Board Project',
    firstResponseHours: 4,
    resolutionHours: 24,
  },
  agilePriority: {
    name: 'Agile Priority SLA',
    project: 'Agile Board Project',
    firstResponseHours: 1,
    resolutionHours: 8,
  },
} as const satisfies Record<string, SlaFixture>;

export type SlaKey = keyof typeof SLAS;

export interface SupportLevelFixture {
  name: string;
  project: string;
  levelOrder: number;
  assignees: readonly string[];
  escalatesTo: string | null;
}

export const SUPPORT_LEVELS = {
  l1: {
    name: 'L1',
    project: 'Helpdesk Service Desk',
    levelOrder: 1,
    assignees: ['Daisy Skye', 'Luna Blossom'],
    escalatesTo: 'L2',
  },
  l2: {
    name: 'L2',
    project: 'Helpdesk Service Desk',
    levelOrder: 2,
    assignees: ['Autumn Grace', 'Harmony Rose'],
    escalatesTo: 'L3',
  },
  l3: {
    name: 'L3',
    project: 'Helpdesk Service Desk',
    levelOrder: 3,
    assignees: ['Willow Belle'],
    escalatesTo: null,
  },
  abL1: {
    name: 'AB-L1',
    project: 'Agile Board Project',
    levelOrder: 1,
    assignees: ['Aurora Wren', 'Briar Sunset'],
    escalatesTo: 'AB-L2',
  },
  abL2: {
    name: 'AB-L2',
    project: 'Agile Board Project',
    levelOrder: 2,
    assignees: ['Celeste Dawn'],
    escalatesTo: null,
  },
} as const satisfies Record<string, SupportLevelFixture>;

export type SupportLevelKey = keyof typeof SUPPORT_LEVELS;

export interface ProductFixture {
  name: string;
  code: string;
  project: string;
  category: string;
}

export const PRODUCTS = {
  helpdeskPortal: {
    name: 'Helpdesk Portal',
    code: 'HDP',
    project: 'Helpdesk Service Desk',
    category: 'Web Application',
  },
  ticketingApi: {
    name: 'Ticketing API',
    code: 'TAPI',
    project: 'Helpdesk Service Desk',
    category: 'Software',
  },
  agileBoardWeb: {
    name: 'Agile Board Web',
    code: 'ABW',
    project: 'Agile Board Project',
    category: 'Web Application',
  },
  agileBoardMobile: {
    name: 'Agile Board Mobile',
    code: 'ABM',
    project: 'Agile Board Project',
    category: 'Mobile Application',
  },
} as const satisfies Record<string, ProductFixture>;

export type ProductKey = keyof typeof PRODUCTS;

export interface CannedResponseFixture {
  name: string;
  macros: readonly string[];
}

export const CANNED_RESPONSES = {
  greeting: {
    name: 'Greeting - Ticket Received',
    macros: ['{{customer_name}}', '{{ticket_id}}'],
  },
  escalationNotice: {
    name: 'Escalation Notice',
    macros: ['{{customer_name}}', '{{ticket_id}}', '{{assignee_name}}'],
  },
  requestMoreInfo: {
    name: 'Request for More Information',
    macros: ['{{customer_name}}', '{{ticket_id}}'],
  },
  closing: {
    name: 'Closing - Ticket Resolved',
    macros: ['{{customer_name}}', '{{ticket_id}}'],
  },
} as const satisfies Record<string, CannedResponseFixture>;

export type CannedResponseKey = keyof typeof CANNED_RESPONSES;

export interface SupportPackageFixture {
  name: string;
}

export const SUPPORT_PACKAGES = {
  premium: { name: 'Premium Support' },
  standard: { name: 'Standard Support' },
} as const satisfies Record<string, SupportPackageFixture>;

export type SupportPackageKey = keyof typeof SUPPORT_PACKAGES;

/** Shared password for every seeded test customer — a throwaway fixture value, not a real secret. */
export const TEST_CUSTOMER_PASSWORD = 'Test@12345';

export interface CustomerProjectAccess {
  project: string;
  sla: string;
  supportLevel: string;
  organization: string;
}

export interface CustomerFixture {
  login: string;
  email: string;
  password: string;
  projectAccess: readonly CustomerProjectAccess[];
}

export const CUSTOMERS = {
  /** Single-project customer: Acme Corp on Helpdesk Service Desk. */
  acmeHdContact: {
    login: 'acme.hd.contact',
    email: 'acme.hd.contact@example.com',
    password: TEST_CUSTOMER_PASSWORD,
    projectAccess: [
      {
        project: 'Helpdesk Service Desk',
        sla: 'Standard SLA',
        supportLevel: 'L1',
        organization: 'Acme Corp',
      },
    ],
  },
  /** Single-project customer: Globex Industries on Agile Board Project. */
  globexAgileContact: {
    login: 'globex.agile.contact',
    email: 'globex.agile.contact@example.com',
    password: TEST_CUSTOMER_PASSWORD,
    projectAccess: [
      {
        project: 'Agile Board Project',
        sla: 'Agile Priority SLA',
        supportLevel: 'AB-L1',
        organization: 'Globex Industries',
      },
    ],
  },
  /** Single-project customer: Globex Industries on Helpdesk Service Desk. */
  globexHdContact: {
    login: 'globex.hd.contact',
    email: 'globex.hd.contact@example.com',
    password: TEST_CUSTOMER_PASSWORD,
    projectAccess: [
      {
        project: 'Helpdesk Service Desk',
        sla: 'Priority SLA',
        supportLevel: 'L2',
        organization: 'Globex Industries',
      },
    ],
  },
  /**
   * Multi-project customer — two project-access rows, different org/SLA/support-level
   * per row. Exercises the TC-HLP-045/122 multi-project-access pattern.
   */
  multiProjectContact: {
    login: 'multiproject.contact',
    email: 'multiproject.contact@example.com',
    password: TEST_CUSTOMER_PASSWORD,
    projectAccess: [
      {
        project: 'Helpdesk Service Desk',
        sla: 'Standard SLA',
        supportLevel: 'L1',
        organization: 'Acme Corp',
      },
      {
        project: 'Agile Board Project',
        sla: 'Agile Standard SLA',
        supportLevel: 'AB-L2',
        organization: 'Globex Industries',
      },
    ],
  },
} as const satisfies Record<string, CustomerFixture>;

export type CustomerKey = keyof typeof CUSTOMERS;

export interface PrepaidBudgetFixture {
  organization: string;
  project: string;
  approvedHours: number;
  supportPackage: string;
  runOutMode: 'No limit' | 'Hard — stop work' | 'Soft — allow overage';
}

export const PREPAID_BUDGETS = {
  acmeOnHelpdeskServiceDesk: {
    organization: 'Acme Corp',
    project: 'Helpdesk Service Desk',
    approvedHours: 40,
    supportPackage: 'Premium Support',
    runOutMode: 'Hard — stop work',
  },
  globexOnAgileBoardProject: {
    organization: 'Globex Industries',
    project: 'Agile Board Project',
    approvedHours: 20,
    supportPackage: 'Standard Support',
    runOutMode: 'Soft — allow overage',
  },
} as const satisfies Record<string, PrepaidBudgetFixture>;

export type PrepaidBudgetKey = keyof typeof PREPAID_BUDGETS;
