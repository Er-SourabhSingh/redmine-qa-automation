import { test as base, expect } from '@playwright/test';
import { HelpdeskOrganizationPage } from '../tests/HelpdeskOrganizationPage';
import { HelpdeskSlaPage } from '../tests/HelpdeskSlaPage';
import { HelpdeskSupportLevelPage } from '../tests/HelpdeskSupportLevelPage';
import { HelpdeskCustomerPage } from '../tests/HelpdeskCustomerPage';
import { HelpdeskProductPage } from '../tests/HelpdeskProductPage';
import { HelpdeskCannedResponsePage } from '../tests/HelpdeskCannedResponsePage';
import { HelpdeskHolidayPage } from '../tests/HelpdeskHolidayPage';
import { HelpdeskTicketListPage } from '../tests/HelpdeskTicketListPage';
import { HelpdeskKnowledgebasePage } from '../tests/HelpdeskKnowledgebasePage';
import { RolesPermissionsPage } from '../tests/RolesPermissionsPage';
import { ProjectSettingsPage } from '../tests/ProjectSettingsPage';
import { ProjectMembersPage } from '../tests/ProjectMembersPage';
import { AdminUsersPage } from '../tests/AdminUsersPage';
import { CustomerPortalPage } from '../tests/CustomerPortalPage';
import { HelpdeskDashboardPage } from '../tests/HelpdeskDashboardPage';

// Add more page objects here as they're written (ticket detail/reply, reports, etc.).
type Fixtures = {
  organizationPage: HelpdeskOrganizationPage;
  slaPage: HelpdeskSlaPage;
  supportLevelPage: HelpdeskSupportLevelPage;
  customerPage: HelpdeskCustomerPage;
  productPage: HelpdeskProductPage;
  cannedResponsePage: HelpdeskCannedResponsePage;
  holidayPage: HelpdeskHolidayPage;
  ticketListPage: HelpdeskTicketListPage;
  knowledgebasePage: HelpdeskKnowledgebasePage;
  rolesPermissionsPage: RolesPermissionsPage;
  projectSettingsPage: ProjectSettingsPage;
  projectMembersPage: ProjectMembersPage;
  adminUsersPage: AdminUsersPage;
  customerPortalPage: CustomerPortalPage;
  dashboardPage: HelpdeskDashboardPage;
};

export const test = base.extend<Fixtures>({
  organizationPage: async ({ page }, use) => { await use(new HelpdeskOrganizationPage(page)); },
  slaPage: async ({ page }, use) => { await use(new HelpdeskSlaPage(page)); },
  supportLevelPage: async ({ page }, use) => { await use(new HelpdeskSupportLevelPage(page)); },
  customerPage: async ({ page }, use) => { await use(new HelpdeskCustomerPage(page)); },
  productPage: async ({ page }, use) => { await use(new HelpdeskProductPage(page)); },
  cannedResponsePage: async ({ page }, use) => { await use(new HelpdeskCannedResponsePage(page)); },
  holidayPage: async ({ page }, use) => { await use(new HelpdeskHolidayPage(page)); },
  ticketListPage: async ({ page }, use) => { await use(new HelpdeskTicketListPage(page)); },
  knowledgebasePage: async ({ page }, use) => { await use(new HelpdeskKnowledgebasePage(page)); },
  rolesPermissionsPage: async ({ page }, use) => { await use(new RolesPermissionsPage(page)); },
  projectSettingsPage: async ({ page }, use) => { await use(new ProjectSettingsPage(page)); },
  projectMembersPage: async ({ page }, use) => { await use(new ProjectMembersPage(page)); },
  adminUsersPage: async ({ page }, use) => { await use(new AdminUsersPage(page)); },
  customerPortalPage: async ({ page }, use) => { await use(new CustomerPortalPage(page)); },
  dashboardPage: async ({ page }, use) => { await use(new HelpdeskDashboardPage(page)); },
});

export { expect };
