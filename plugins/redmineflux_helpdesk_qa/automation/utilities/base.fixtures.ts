import { test as base, expect } from '@playwright/test';
import { HelpdeskOrganizationPage } from '../tests/pages/HelpdeskOrganizationPage';
import { HelpdeskSlaPage } from '../tests/pages/HelpdeskSlaPage';
import { HelpdeskSupportLevelPage } from '../tests/pages/HelpdeskSupportLevelPage';
import { HelpdeskCustomerPage } from '../tests/pages/HelpdeskCustomerPage';
import { HelpdeskProductPage } from '../tests/pages/HelpdeskProductPage';
import { HelpdeskCannedResponsePage } from '../tests/pages/HelpdeskCannedResponsePage';
import { HelpdeskHolidayPage } from '../tests/pages/HelpdeskHolidayPage';
import { HelpdeskTicketListPage } from '../tests/pages/HelpdeskTicketListPage';
import { HelpdeskKnowledgebasePage } from '../tests/pages/HelpdeskKnowledgebasePage';
import { RolesPermissionsPage } from '../tests/pages/RolesPermissionsPage';
import { ProjectSettingsPage } from '../tests/pages/ProjectSettingsPage';
import { ProjectMembersPage } from '../tests/pages/ProjectMembersPage';
import { AdminUsersPage } from '../tests/pages/AdminUsersPage';
import { CustomerPortalPage } from '../tests/pages/CustomerPortalPage';
import { HelpdeskDashboardPage } from '../tests/pages/HelpdeskDashboardPage';

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
