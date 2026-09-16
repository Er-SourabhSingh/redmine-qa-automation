import { test as setup } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { RolesPermissionsPage, HelpdeskPermissionKey } from './pages/RolesPermissionsPage';
import { ProjectSettingsPage } from './pages/ProjectSettingsPage';
import { ProjectMembersPage } from './pages/ProjectMembersPage';
import { HelpdeskCustomerPage } from './pages/HelpdeskCustomerPage';
import { HelpdeskSlaPage } from './pages/HelpdeskSlaPage';
import { HelpdeskSupportLevelPage } from './pages/HelpdeskSupportLevelPage';
import { getAdminCredentials } from '../utilities/env';
import { PROJECTS, AGENTS, CUSTOMERS, MANAGERS, MAIL_PASSWORD, ProjectFixture, ProjectKey } from '../testdata/helpdesk.local.fixtures';

/** One baseline SLA + Support Level per project — see step 6's comment for why these must exist before Customer creation. */
const BASELINE_SUPPORT_DATA: Record<ProjectKey, { slaName: string; supportLevelName: string }> = {
  alpha: { slaName: 'Alpha Standard SLA', supportLevelName: 'L1' },
  beta: { slaName: 'Beta Standard SLA', supportLevelName: 'AB-L1' },
};

/**
 * Infrastructure, not a plugin test suite — makes the whole automation suite
 * self-bootstrapping. Everything else (auth.setup.ts, every spec) assumes
 * the fixtures in helpdesk.local.fixtures.ts already exist as real Redmine
 * records. Until this file, that assumption only held because this ONE
 * environment (localhost:3012) had been hand-built up over many manual
 * sessions — a fresh container or a different server would fail immediately.
 *
 * Runs before auth.setup.ts (both matched by the `.setup.ts` runner pattern,
 * chained via `dependencies` in playwright.config.ts). Logs in as Admin —
 * the one credential every freshly-seeded instance is guaranteed to have —
 * then checks-before-creating every role/project/agent/customer the
 * fixtures reference, entirely through real UI clicks (no backend/DB
 * access, matching this plugin's whole-session testing discipline).
 *
 * Written as ONE test(), not one per entity: role creation must happen
 * before project-membership assignment, and project creation before module/
 * tracker enablement, so these steps cannot be allowed to run in parallel
 * across workers the way independent tests normally would.
 */
setup('provision fixtures (roles, projects, agents, customers)', async ({ page }) => {
  // Sequentially checking/creating a role, 2 projects (each with a module +
  // tracker check), 20 agents, 1 manager, and 2 customers comfortably exceeds
  // Playwright's default 30s test timeout — confirmed live 2026-09-14 with
  // only 6 agents (the run reached the customer loop right as the timeout
  // tore the browser down mid-click, surfacing as a misleading "Target page
  // ... has been closed" error rather than an explicit timeout message).
  // Bumped again from 180s→300s when AGENTS grew from 6 to 20 (2026-09-14).
  setup.setTimeout(300_000);

  const { username, password } = getAdminCredentials();
  const loginPage = new LoginPage(page);
  await loginPage.login(username, password);
  await loginPage.assertLoggedIn();

  const roles = new RolesPermissionsPage(page);
  const projects = new ProjectSettingsPage(page);
  const members = new ProjectMembersPage(page);
  const users = new AdminUsersPage(page);
  const customers = new HelpdeskCustomerPage(page);
  const slas = new HelpdeskSlaPage(page);
  const supportLevels = new HelpdeskSupportLevelPage(page);

  // --- 1. Agent role — the role every AGENTS fixture is assigned on its project. ---
  if (!(await roles.exists('Agent'))) {
    await roles.createRole({ name: 'Agent' });
    for (const key of [
      HelpdeskPermissionKey.VIEW_HELPDESK,
      HelpdeskPermissionKey.MANAGE_HELPDESK,
      HelpdeskPermissionKey.EXPORT_HELPDESK_REPORTS,
      HelpdeskPermissionKey.MANAGE_PREPAID_SUPPORT_HOURS,
      HelpdeskPermissionKey.VIEW_EMAIL_HISTORY,
      HelpdeskPermissionKey.ADD_KB_PAGE,
      HelpdeskPermissionKey.EDIT_KB_PAGE,
      HelpdeskPermissionKey.DELETE_KB_PAGE,
    ]) {
      await roles.setPermission(key, true);
    }
    await roles.create();
  }

  // --- 2. Manager role gets the same helpdesk permissions (MANAGERS fixture reuses Redmine's built-in "Manager" role rather than a dedicated one — see HELPDESK_USERS_AND_CUSTOMERS.md). ---
  await roles.openRoleEdit('Manager');
  for (const key of [
    HelpdeskPermissionKey.VIEW_HELPDESK,
    HelpdeskPermissionKey.MANAGE_HELPDESK,
    HelpdeskPermissionKey.EXPORT_HELPDESK_REPORTS,
    HelpdeskPermissionKey.MANAGE_PREPAID_SUPPORT_HOURS,
    HelpdeskPermissionKey.VIEW_EMAIL_HISTORY,
  ]) {
    if (!(await roles.isPermissionGranted(key))) await roles.setPermission(key, true);
  }
  await roles.save();

  // --- 3. Projects — Alpha/Beta, Helpdesk module + Support tracker enabled. ---
  for (const project of Object.values(PROJECTS) as ProjectFixture[]) {
    if (!(await projects.exists(project.identifier))) {
      await projects.createProject({ name: project.name, identifier: project.identifier });
    }
    await projects.open(project.identifier);
    if (!(await projects.isModuleEnabled('helpdesk'))) {
      await projects.setModule('helpdesk', true);
      await projects.save();
    }
    await projects.openIssueTrackingSettings(project.identifier);
    if (!(await projects.isTrackerEnabled('Support'))) {
      await projects.enableTracker('Support');
    }
  }

  // --- 4. Agents — one Redmine User per AGENTS entry, Member of its project with role Agent. ---
  for (const agent of Object.values(AGENTS)) {
    const [firstName, ...rest] = agent.name.split(' ');
    const lastName = rest.join(' ') || firstName;
    if (!(await users.exists(agent.login))) {
      await users.createUser({
        login: agent.login,
        firstName,
        lastName,
        email: agent.email,
        password: MAIL_PASSWORD,
        mustChangePassword: false,
      });
    } else {
      // Already exists (e.g. seeded by a server reseed with an unknown password) —
      // force it back to our own known fixture credentials rather than skip it.
      await users.updateCredentials(agent.login, { email: agent.email, password: MAIL_PASSWORD });
    }
    const project = PROJECTS[agent.project];
    if (!(await members.isMemberWithRole(project.identifier, agent.name, 'Agent'))) {
      await members.addMember(project.identifier, agent.name, ['Agent']);
    }
  }

  // --- 5. Project-scoped Manager fixture. ---
  for (const manager of Object.values(MANAGERS)) {
    if (!(await users.exists(manager.login))) {
      await users.createUser({
        login: manager.login,
        firstName: manager.name.split(' ')[0],
        lastName: manager.name.split(' ').slice(1).join(' ') || manager.name,
        email: manager.email,
        password: MAIL_PASSWORD,
        mustChangePassword: false,
      });
    } else {
      await users.updateCredentials(manager.login, { email: manager.email, password: MAIL_PASSWORD });
    }
    const project = PROJECTS[manager.project];
    if (!(await members.isMemberWithRole(project.identifier, manager.name, 'Manager'))) {
      await members.addMember(project.identifier, manager.name, ['Manager']);
    }
  }

  // --- 6. Baseline SLA + Support Level per project. ---
  // Confirmed live 2026-09-14 (first real fresh-container run): Customer
  // Project Access silently requires a Support Level to exist for the
  // selected project — createAccount() only sets Project (no SLA/Support
  // Level given, since none was a known fixture), and submitting a
  // project-access row with Support Level left at "None" doesn't error, it
  // just drops the whole row and creates a customer with NO project access
  // — no exception thrown, so this went unnoticed until an actual login
  // attempt failed. This never surfaced on localhost:3012 because an SLA +
  // Support Level already existed there from years of prior manual testing.
  // One baseline SLA + Support Level per project (assignee: that project's
  // first fixture agent) is now created here so Customer creation always has
  // something valid to select, on any environment.
  for (const key of Object.keys(PROJECTS) as ProjectKey[]) {
    const project = PROJECTS[key];
    const baseline = BASELINE_SUPPORT_DATA[key];
    if (!(await slas.exists(project.identifier, baseline.slaName))) {
      await slas.create({
        projectIdentifier: project.identifier,
        name: baseline.slaName,
        firstResponse: { value: 60, unit: 'Minutes' },
        resolution: { value: 480, unit: 'Minutes' },
      });
    }
    if (!(await supportLevels.exists(project.identifier, baseline.supportLevelName))) {
      const firstAgentOnProject = Object.values(AGENTS).find(a => a.project === key)!;
      await supportLevels.create({
        projectIdentifier: project.identifier,
        name: baseline.supportLevelName,
        levelOrder: 1,
        assignees: [firstAgentOnProject.name],
      });
    }
  }

  // --- 7. Customers — one Customer record per CUSTOMERS entry. ---
  // NOTE: unlike Users, there is no known page-object flow yet to reset an
  // EXISTING customer's password back to MAIL_PASSWORD (HelpdeskCustomerPage.edit()
  // only touches name/email/project-access) — so an existing customer is left
  // as-is. This is a known gap: if a customer fixture ever ends up with a
  // stale/unknown password, delete it via the UI and let this script recreate
  // it fresh, since createAccount() always sets the known MAIL_PASSWORD.
  //
  // BUG FIX 2026-09-14: a project-access row's SLA/Support Level dropdowns
  // are NOT auto-selected just because a real option now exists — leaving
  // them unset submits the row at its default value ("None"), which the
  // server silently drops the WHOLE row for (no error) rather than saving a
  // customer with no entitlement. Confirmed live: the first fresh-container
  // run reported "success" but created customers with zero project access
  // and a password that then couldn't actually log in. Passing the same
  // baseline SLA/Support Level created in step 6 explicitly avoids this.
  for (const customer of Object.values(CUSTOMERS)) {
    await customers.openList();
    if (!(await customers.exists(customer.login))) {
      const [firstName, ...rest] = customer.login.split('.');
      const lastName = rest.join(' ') || firstName;
      const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
      const project = PROJECTS[customer.project];
      const baseline = BASELINE_SUPPORT_DATA[customer.project];
      await customers.createAccount({
        login: customer.login,
        firstName: capitalize(firstName),
        lastName: capitalize(lastName),
        email: customer.email,
        password: MAIL_PASSWORD,
        projectAccess: [{ project: project.name, sla: baseline.slaName, supportLevel: baseline.supportLevelName }],
      });
    }
  }
});
