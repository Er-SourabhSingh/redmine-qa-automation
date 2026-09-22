import { test, expect } from '@playwright/test';
import { HelpdeskOrganizationPage } from './pages/HelpdeskOrganizationPage';
import { HelpdeskCustomerPage } from './pages/HelpdeskCustomerPage';
import { LoginPage } from './pages/LoginPage';
import { PROJECTS } from '../testdata/helpdesk.local.fixtures';

/**
 * Mirrors testcases/HELPDESK_CUSTOMERS_ORGANIZATIONS.md — automates the
 * subset of its 30 TCs with a confirmed manual PASS that this first pass
 * covers (per CLAUDE.md §13, only a confirmed-PASS TC gets automated).
 *
 * Deliberately NOT automated in this pass (left for a follow-up):
 *  - TC-HLP-042/294 (Edit-customer "Send account information" email) — needs
 *    the local mail server (Roundcube) wired into automation, not yet done.
 *  - TC-HLP-062 — needs a 4th auth role (a project-scoped Manager); this
 *    suite's auth.setup.ts currently only covers Admin/Agent/Customer.
 *  - TC-HLP-065 — needs project-scoped Organization-tab page-object methods
 *    that don't exist yet.
 *  - TC-HLP-056/120/124 — these TCs' own confirmed result is FAIL/mixed
 *    (BUG-HLP-013 Portal Preview reachable, BUG-HLP-011 org delete has no
 *    linkage warning) — automating a known-broken behavior as "expected"
 *    isn't appropriate; revisit once those bugs are fixed.
 *  - TC-HLP-045/113/280/334 — straightforward follow-up additions using the
 *    same page-object methods already built here, deferred only for time.
 *
 * Runs under the `admin` project (see playwright.config.ts) — every TC this
 * file covers is scoped to "Admin or Agent with manage_helpdesk" or plain
 * "Agent", and Admin satisfies both.
 *
 * Organization/Customer CRUD tests create their own uniquely-named fixtures
 * and delete them afterward, so the suite is safe to re-run without
 * accumulating clutter. The dropdown-scoping tests and the Customer 360
 * KPI-consistency test are read-only against this environment's long-lived,
 * stable fixtures (Helpdesk QA Alpha/Beta and `alpha.customer`) — they
 * create nothing.
 */

test.describe('Organizations', () => {
  let org: HelpdeskOrganizationPage;

  test.beforeEach(({ page }) => {
    org = new HelpdeskOrganizationPage(page);
  });

  test('TC-HLP-037 - creating an organization saves name and all optional fields', async () => {
    const name = 'Automation Org TC108';
    await org.create({
      name,
      website: 'https://tc108.example.com',
      phone: '+1 (555) 010-0108',
      address: '108 Automation Street, Testville',
      employeeCount: 108,
      notes: 'TC-HLP-037 automated fixture.',
      billingInfo: 'TC-HLP-037 billing info fixture.',
    });

    expect(await org.getName()).toBe(name);
    expect(await org.getWebsite()).toContain('tc108.example.com');
    expect(await org.getPhone()).toContain('+1 (555) 010-0108');
    expect(await org.getEmployeeCount()).toContain('108');
    expect(await org.getAddress()).toContain('108 Automation Street');
    expect(await org.getNotes()).toContain('TC-HLP-037 automated fixture');
    expect(await org.getBillingInfo()).toContain('TC-HLP-037 billing info fixture');

    await org.openList();
    await org.delete(name);
  });

  test('TC-HLP-038 - creating an organization with only the required Name field succeeds', async () => {
    const name = 'Automation Org TC324';
    await org.create({ name });

    expect(await org.getName()).toBe(name);
    expect(await org.getWebsite()).toBe('—');
    expect(await org.getPhone()).toBe('—');
    expect(await org.getEmployeeCount()).toBe('—');
    expect(await org.getAddress()).toBe('—');
    expect(await org.getNotes()).toContain('No notes available');
    expect(await org.getBillingInfo()).toContain('No billing information available');

    await org.openList();
    await org.delete(name);
  });

  test('TC-HLP-039 - editing only Name leaves already-set optional fields untouched', async () => {
    const originalName = 'Automation Org TC336';
    const renamedName = 'Automation Org TC336 (Renamed)';
    await org.create({
      name: originalName,
      website: 'https://tc336.example.com',
      phone: '+1 (555) 033-0336',
      address: '336 Untouched Avenue',
      employeeCount: 336,
      notes: 'TC-HLP-039 notes must survive a Name-only edit.',
      billingInfo: 'TC-HLP-039 billing info must survive a Name-only edit.',
    });

    await org.openEdit(originalName);
    await org.edit({ name: renamedName }); // deliberately no other field passed

    expect(await org.getName()).toBe(renamedName);
    expect(await org.getWebsite()).toContain('tc336.example.com');
    expect(await org.getPhone()).toContain('+1 (555) 033-0336');
    expect(await org.getEmployeeCount()).toContain('336');
    expect(await org.getAddress()).toContain('336 Untouched Avenue');
    expect(await org.getNotes()).toContain('TC-HLP-039 notes must survive');
    expect(await org.getBillingInfo()).toContain('TC-HLP-039 billing info must survive');

    await org.openList();
    await org.delete(renamedName);
  });

  test('TC-HLP-040 - editing every field in one Save persists all new values', async () => {
    const originalName = 'Automation Org TC337';
    const newName = 'Automation Org TC337 (Changed)';
    await org.create({ name: originalName, website: 'https://old.example.com', phone: '+1 000', employeeCount: 1 });

    await org.openEdit(originalName);
    await org.edit({
      name: newName,
      website: 'https://tc337-new.example.com',
      phone: '+44 20 7946 0999',
      address: '337 New Avenue, New Testburg',
      employeeCount: 999,
      notes: 'TC-HLP-040 all-fields-changed notes.',
      billingInfo: 'TC-HLP-040 all-fields-changed billing info.',
    });

    expect(await org.getName()).toBe(newName);
    expect(await org.getWebsite()).toContain('tc337-new.example.com');
    expect(await org.getPhone()).toContain('+44 20 7946 0999');
    expect(await org.getEmployeeCount()).toContain('999');
    expect(await org.getAddress()).toContain('337 New Avenue');
    expect(await org.getNotes()).toContain('all-fields-changed notes');
    expect(await org.getBillingInfo()).toContain('all-fields-changed billing info');

    await org.openList();
    await org.delete(newName);
  });

  test('TC-HLP-060 - creating an organization with a duplicate name is refused', async () => {
    const name = 'Automation Org TC119';
    await org.create({ name });
    await org.openList();

    await org.create({ name }); // second attempt, same name
    await org.assertDuplicateNameRefused();

    await org.openList();
    await org.delete(name);
  });

  test('TC-HLP-058 - list search, Status filter, Apply/Clear all work correctly', async () => {
    const activeName = 'Automation Org TC279 Active';
    const inactiveName = 'Automation Org TC279 Inactive';
    await org.create({ name: activeName });
    await org.openList();
    await org.create({ name: inactiveName });

    // Deactivate the second fixture via the list toggle (BUG-HLP-003 workaround — the Edit form's checkbox doesn't persist).
    await org.openList();
    const orgId = await org.getOrganizationId(inactiveName);
    await org.setActiveViaListToggle(orgId, false);

    await org.search('TC279 Active');
    await org.assertRowVisible(activeName);
    await org.assertRowNotVisible(inactiveName);

    await org.openList();
    await org.filterByStatus('Inactive only');
    await org.assertRowVisible(inactiveName);
    await org.assertRowNotVisible(activeName);

    await org.openList();
    await org.filterByStatus('Active only');
    await org.assertRowVisible(activeName);
    await org.assertRowNotVisible(inactiveName);

    await org.clearFilters();
    await org.assertRowVisible(activeName);
    await org.assertRowVisible(inactiveName);

    await org.openList();
    await org.delete(activeName);
    await org.openList();
    await org.delete(inactiveName);
  });
});

test.describe('Customers', () => {
  let customer: HelpdeskCustomerPage;

  test.beforeEach(({ page }) => {
    customer = new HelpdeskCustomerPage(page);
  });

  test('TC-HLP-041 - creating a customer creates the account and flags it as a helpdesk customer', async () => {
    const login = 'automation.tc109';
    await customer.createAccount({
      login,
      firstName: 'Automation',
      lastName: 'TC109',
      email: 'automation.tc109@test.local',
      password: 'Test@12345',
    });

    await customer.openList();
    await customer.assertRowVisible('Automation TC109');
    expect(await customer.getProjectCount('Automation TC109')).toBe('0');

    await customer.delete('Automation TC109');
  });

  test('TC-HLP-047 - creating a customer with identity, an explicit password, and Project Access all in one Save', async () => {
    const login = 'automation.tc323';
    await customer.openNew();
    // Fill identity first so the Project Access section (which needs at least
    // one eligible project) has something to scope its dropdowns against.
    await customer.createAccount({
      login,
      firstName: 'Automation',
      lastName: 'TC323',
      email: 'automation.tc323@test.local',
      password: 'Test@12345',
      projectAccess: [{ project: PROJECTS.alpha.name }],
    });

    await customer.openList();
    await customer.assertRowVisible('Automation TC323');
    expect(await customer.getProjectCount('Automation TC323')).toBe('1');

    await customer.delete('Automation TC323');
  });

  test('TC-HLP-044 - editing only a customer\'s required Last name leaves Project Access and password untouched', async ({ page }) => {
    const login = 'automation.tc333';
    await customer.createAccount({
      login,
      firstName: 'Automation',
      lastName: 'TC333',
      email: 'automation.tc333@test.local',
      password: 'Test@12345',
      projectAccess: [{ project: PROJECTS.alpha.name }],
    });
    await customer.openList();
    const orgBefore = await customer.getOrganizationName('Automation TC333');
    const projectsBefore = await customer.getProjectCount('Automation TC333');

    await customer.openEdit('Automation TC333');
    await customer.edit({ lastName: 'TC333-ReqOnly' }); // deliberately no other field passed

    await customer.openList();
    await customer.assertRowVisible('Automation TC333-ReqOnly');
    expect(await customer.getOrganizationName('Automation TC333-ReqOnly')).toBe(orgBefore);
    expect(await customer.getProjectCount('Automation TC333-ReqOnly')).toBe(projectsBefore);

    // The existing password must still work — a required-field-only save
    // must not silently force a reset or invalidate the credential. Uses a
    // fresh, unauthenticated context (not this admin session) so the login
    // attempt is genuine, not just an already-logged-in admin session.
    const customerContext = await page.context().browser()!.newContext();
    const customerPage = await customerContext.newPage();
    const loginPage = new LoginPage(customerPage);
    await loginPage.login(login, 'Test@12345');
    await loginPage.assertLoggedIn();
    await customerContext.close();

    await customer.delete('Automation TC333-ReqOnly');
  });

  test('TC-HLP-051 - removing a project-access row removes only that project\'s access', async () => {
    const login = 'automation.tc112';
    await customer.createAccount({
      login,
      firstName: 'Automation',
      lastName: 'TC112',
      email: 'automation.tc112@test.local',
      password: 'Test@12345',
      projectAccess: [{ project: PROJECTS.alpha.name }, { project: PROJECTS.beta.name }],
    });
    await customer.openList();
    expect(await customer.getProjectCount('Automation TC112')).toBe('2');

    await customer.openEdit('Automation TC112');
    await customer.removeProjectAccessRow(0); // removes the Alpha row (index 0)
    await customer.submit();

    await customer.openList();
    expect(await customer.getProjectCount('Automation TC112')).toBe('1');

    await customer.delete('Automation TC112');
  });

  test('TC-HLP-063 - a customer can hold more than one project-access row at once (added across two separate Saves)', async () => {
    const login = 'automation.tc122';
    // Step 1: create with only a Project A (Alpha) row, in its own Save.
    await customer.createAccount({
      login,
      firstName: 'Automation',
      lastName: 'TC122',
      email: 'automation.tc122@test.local',
      password: 'Test@12345',
      projectAccess: [{ project: PROJECTS.alpha.name }],
    });
    await customer.openList();
    expect(await customer.getProjectCount('Automation TC122')).toBe('1');

    // Step 2: without removing the Alpha row, add a Beta row in a SEPARATE, later Save.
    await customer.openEdit('Automation TC122');
    await customer.addProjectAccessRow(1, { project: PROJECTS.beta.name });
    await customer.selectProjectAccessFirstAvailable(1, 'sla');
    await customer.selectProjectAccessFirstAvailable(1, 'supportLevel');
    await customer.submit();

    // Step 3: reload and confirm BOTH rows survive — this is the exact
    // contradiction TC-122 exists to resolve (HELPDESK_USER_GUIDE.md's own
    // prose says only one row can exist at a time; its own tester checklist
    // says both survive — already confirmed live in the manual pass that the
    // checklist is correct, not the prose).
    await customer.openList();
    expect(await customer.getProjectCount('Automation TC122')).toBe('2');

    await customer.openList();
    await customer.delete('Automation TC122');
  });

  test('TC-HLP-057 - searching and filtering the customer list works correctly', async () => {
    const login = 'automation.tc118';
    await customer.createAccount({
      login,
      firstName: 'Automation',
      lastName: 'TC118Unique',
      email: 'automation.tc118@test.local',
      password: 'Test@12345',
    });

    await customer.openList();
    await customer.search('TC118Unique');
    await customer.assertRowVisible('Automation TC118Unique');

    await customer.openList();
    await customer.search(login);
    await customer.assertRowVisible('Automation TC118Unique');

    await customer.openList();
    await customer.search('automation.tc118@test.local');
    await customer.assertRowVisible('Automation TC118Unique');

    await customer.openList();
    await customer.clearFilters();
    await customer.delete('Automation TC118Unique');
  });

  test('TC-HLP-053/115/116 - eye icon opens Customer 360, showing identity/KPIs, and its Open count matches the list', async ({ page }) => {
    // Uses the long-lived alpha.customer fixture (real ticket history) rather
    // than a freshly-created customer with zero tickets, since TC-115/116
    // specifically care about real KPI/entitlement data being displayed
    // consistently, not about creating that history.
    await customer.openList();
    const listOpenCount = await customer.getOpenCount('Alpha Customer');

    await customer.openDetail('Alpha Customer');
    await expect(page).toHaveURL(/\/rf_customers\/\d+$/); // Customer 360, not /portal

    expect(await customer.getLogin()).toBe('alpha.customer');
    expect(await customer.getEmail()).toContain('alpha.customer@test.local');
    const totalTickets = await customer.getStat('Total Tickets');
    const open360 = await customer.getStat('Open');
    expect(Number(totalTickets)).toBeGreaterThanOrEqual(0);
    expect(listOpenCount).not.toBeNull();
    expect(open360?.trim()).toBe(listOpenCount!.trim());
  });
});

test.describe('Project Access dropdown scoping', () => {
  let customer: HelpdeskCustomerPage;

  test.beforeEach(({ page }) => {
    customer = new HelpdeskCustomerPage(page);
  });

  // NOTE: per BUG-HLP-004, switching a row's Project does NOT remove the
  // other project's SLA/Support Level options from the DOM — it marks them
  // `disabled` (confirmed live 2026-09-14: `allTextContents()` returns the
  // exact same full superset of labels regardless of which project is
  // selected). So the correct assertion for TC-111/283 is each option's
  // disabled state flipping, not the raw label list changing.

  test('TC-HLP-048 - Support Level dropdown only offers the selected project\'s support levels', async () => {
    await customer.openNew();

    await customer.selectProjectAccessProject(0, PROJECTS.alpha.name);
    expect(await customer.isProjectAccessOptionDisabled(0, 'supportLevel', 'L1')).toBe(false);
    expect(await customer.isProjectAccessOptionDisabled(0, 'supportLevel', 'AB-L1')).toBe(true);

    await customer.selectProjectAccessProject(0, PROJECTS.beta.name);
    expect(await customer.isProjectAccessOptionDisabled(0, 'supportLevel', 'AB-L1')).toBe(false);
    expect(await customer.isProjectAccessOptionDisabled(0, 'supportLevel', 'L1')).toBe(true);
  });

  test('TC-HLP-049 - SLA dropdown only offers the selected project\'s SLAs', async () => {
    await customer.openNew();

    await customer.selectProjectAccessProject(0, PROJECTS.alpha.name);
    expect(await customer.isProjectAccessOptionDisabled(0, 'sla', 'Alpha Standard SLA')).toBe(false);
    expect(await customer.isProjectAccessOptionDisabled(0, 'sla', 'Beta Standard SLA')).toBe(true);

    await customer.selectProjectAccessProject(0, PROJECTS.beta.name);
    expect(await customer.isProjectAccessOptionDisabled(0, 'sla', 'Beta Standard SLA')).toBe(false);
    expect(await customer.isProjectAccessOptionDisabled(0, 'sla', 'Alpha Standard SLA')).toBe(true);
  });

  test('TC-HLP-050 - Organization dropdown is NOT filtered by the selected project (by design)', async () => {
    await customer.openNew();
    await customer.selectProjectAccessProject(0, PROJECTS.alpha.name);
    const alphaOptions = await customer.getProjectAccessOptionLabels(0, 'organization');

    await customer.selectProjectAccessProject(0, PROJECTS.beta.name);
    const betaOptions = await customer.getProjectAccessOptionLabels(0, 'organization');

    // Unlike SLA/Support Level, Organization's full option list must stay
    // IDENTICAL across a Project change — this is documented, confirmed
    // expected behavior (Organization has no project-scoping mechanism),
    // not a bug to guard against.
    expect(alphaOptions).toEqual(betaOptions);
  });
});
