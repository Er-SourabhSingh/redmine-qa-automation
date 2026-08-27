import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * The Customer role's restricted portal — a completely different nav/page
 * set from Admin/Agent, not just a permission-filtered view of the same
 * pages. Locators verified live 2026-08-25 on `flux-fwdq7ydhw49`, logged in
 * as the real `acme.hd.contact` fixture (see `testdata/helpdesk.fixtures.ts`).
 *
 * Confirmed nav collapse: a Customer's top nav is just "My account"/"Sign
 * out" plus a single "My Helpdesk" link (`/helpdesk`) — no Projects/Helpdesk
 * Command Center/Administration, matching `BasePage.clickTopNav()`'s doc
 * comment. Use `login()` via `LoginPage` first, then this page object.
 *
 * Confirmed page flow: "My Helpdesk" (`/helpdesk`) lists one card per
 * assigned project (heading + "N open" + "View" link) → clicking "View"
 * lands on that project's OWN restricted Helpdesk dashboard
 * (`/projects/:id/helpdesk`), whose nav is only 3 items — Helpdesk
 * Dashboard/Helpdesk Tickets/Knowledgebase, correctly missing Helpdesk
 * SLA/Organization/Settings (those stay Admin/Agent-only). That dashboard
 * also renders a real "Prepaid Support Hours" table for the customer's
 * linked organization (Organization/Approved/Used/Remaining/Usage/Action —
 * Action being a "Ledger" link) — confirmed live showing Acme Corp's real
 * 40.00h budget correctly on the customer side, matching what was set up
 * from the admin side.
 *
 * Confirmed simplified "New issue" form
 * (`/projects/:id/helpdesk/new`): only 4 fields — Subject*, Description,
 * Priority* (defaults to Normal), Product (project-scoped — confirmed only
 * that project's own products are offered, e.g. Helpdesk Portal/Ticketing
 * API for Helpdesk Service Desk, not Agile Board's products). No
 * Organization/SLA/Support Level/Assignee fields — those are set
 * automatically from the customer's own Project Access record, not chosen
 * per-ticket.
 *
 * KNOWN BUG — BUG-HLP-006 (Critical, open): clicking a ticket's own Ticket #
 * or Subject link in this restricted list redirects to Home with "You are
 * not authorized to access this page," because both links point at
 * Redmine's standard `/issues/:id` route, which the Customer role can't
 * access. Re-confirmed live 2026-08-25 on this instance (a fresh ticket,
 * #271, reproduced identically). `assertTicketOpenBlockedByKnownBug()`
 * below asserts the CURRENT (broken) behavior — update it, not just delete
 * it, the day this bug is actually fixed, so the fix gets caught by a
 * regression run rather than silently passing either way.
 */
export class CustomerPortalPage extends BasePage {
  private readonly newIssueLink = this.page.getByRole('link', { name: 'New issue' });
  private readonly subjectInput = this.page.getByLabel('Subject *');
  private readonly descriptionInput = this.page.getByLabel('Description');
  private readonly priorityCombobox = this.page.getByLabel('Priority *');
  private readonly productCombobox = this.page.getByLabel('Product');
  private readonly createButton = this.page.getByRole('button', { name: 'Create' });

  /** Real nav path: click "My Helpdesk" from wherever the customer currently is. */
  async openMyHelpdesk() {
    await this.clickTopNav('My Helpdesk');
  }

  /**
   * The card for one assigned project on the "My Helpdesk" landing page —
   * scoped via the nearest ancestor `<div>` of that project's own heading,
   * so multiple project cards (a multi-project customer, e.g.
   * `multiproject.contact`) don't collide when locating "View".
   */
  private projectCard(projectName: string) {
    return this.page.getByRole('heading', { name: projectName, exact: true }).locator('xpath=./ancestor::div[1]');
  }

  /** Call after openMyHelpdesk() — clicks the named project's "View" link into its restricted dashboard. */
  async openProjectDashboard(projectName: string) {
    await this.projectCard(projectName).getByRole('link', { name: 'View' }).click();
  }

  /** Reads the "N open" text shown on a project's card — call after openMyHelpdesk(). */
  async getOpenCountText(projectName: string): Promise<string | null> {
    return this.projectCard(projectName).getByText(/open$/).textContent();
  }

  /** Call after openProjectDashboard() — clicks "Helpdesk Tickets" in the restricted 3-item project nav. */
  async openTicketList() {
    await this.clickProjectTab('Helpdesk Tickets');
  }

  /** Call after openProjectDashboard() or openTicketList() — both render a "New issue" link. */
  async openNewIssue() {
    await this.newIssueLink.first().click();
  }

  /**
   * Fills and submits the simplified customer "New issue" form. Call
   * openNewIssue() first. Priority defaults to "Normal" if not specified;
   * Product defaults to "none" (the dropdown's own default option).
   */
  async createTicket(options: {
    subject: string;
    description?: string;
    priority?: 'Low' | 'Normal' | 'High' | 'Urgent' | 'Immediate';
    product?: string;
  }) {
    await this.subjectInput.fill(options.subject);
    if (options.description) await this.descriptionInput.fill(options.description);
    if (options.priority) await this.priorityCombobox.selectOption({ label: options.priority });
    if (options.product) await this.productCombobox.selectOption({ label: options.product });
    await this.createButton.click();
  }

  /**
   * A ticket row matched by its issue-detail href, not by subject text (a
   * subject isn't guaranteed unique) — same reasoning and pattern as
   * `HelpdeskTicketListPage.ticketRow()`, named distinctly here for the same
   * reason (avoids colliding with `BasePage.row()`'s text-based signature).
   */
  private ticketRow(ticketId: number) {
    return this.page.locator('tr', { has: this.page.locator(`a[href="/issues/${ticketId}"]`) });
  }

  async assertTicketRowVisible(ticketId: number, subject: string) {
    await expect(this.ticketRow(ticketId)).toContainText(subject);
  }

  async assertEmptyState() {
    await expect(this.page.getByText('No tickets yet')).toBeVisible();
  }

  /** Clicks a ticket's own Ticket # link in the restricted list — see BUG-HLP-006 in the class doc comment. */
  async openTicket(ticketId: number) {
    await this.page.getByRole('link', { name: `#${ticketId}` }).click();
  }

  /**
   * Asserts BUG-HLP-006's CURRENT (broken) behavior: following openTicket(),
   * the customer lands on Home with this exact flash message, instead of the
   * ticket detail they should see. Re-confirmed live 2026-08-25. Update this
   * assertion (not just delete it) once the bug is actually fixed, so a
   * regression run catches the fix rather than this silently passing either way.
   */
  async assertTicketOpenBlockedByKnownBug() {
    await expect(this.page.getByText('You are not authorized to access this page.')).toBeVisible();
  }
}
