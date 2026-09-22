import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Helpdesk Tickets list (/rf_helpdesk/issues globally, or
 * /projects/:id/helpdesk/tickets for a project). Locators verified against
 * the live Forge instance on 2026-08-21 — filters/columns use a fully custom
 * UI (confirmed: no native Redmine query form), driven by `data-add-filter`
 * buttons and a `c[]` checkbox column picker, not <select> elements.
 *
 * CORRECTION (2026-08-21): an earlier pass at this file claimed "custom grid,
 * no <table>" based only on the empty state ("No tickets yet"). That was
 * wrong — once real tickets exist, the list renders a genuine `<table>` with
 * real `<th>`/`<td>` markup. Row locators below are now verified against 10
 * real Support-tracker tickets found pre-existing on the Helpdesk Service
 * Desk project. Lesson: never trust "no data → no markup" as proof a screen
 * uses no standard table.
 *
 * DISCREPANCY vs HELPDESK_USER_GUIDE.md §6: the real filter set has 17
 * fields, not 16 — "Created" (data-add-filter="created") exists and is not
 * mentioned anywhere in the guide. The column picker (20 columns, 9 default)
 * matches the guide exactly, no discrepancy there.
 */
export class HelpdeskTicketListPage extends BasePage {
  private readonly filtersToggleButton = this.page.getByRole('button', { name: 'Filters', exact: true });
  private readonly addFilterButton = this.page.getByRole('button', { name: 'Add filter' });
  private readonly applyButton = this.page.getByRole('button', { name: 'Apply' });
  private readonly clearLink = this.page.getByRole('link', { name: 'Clear' });
  private readonly columnsButton = this.page.getByRole('button', { name: 'Columns' });
  private readonly newIssueLink = this.page.getByRole('link', { name: 'New issue' });

  /** Maps to each filter's `data-add-filter` attribute — the reliable key, not the visible label. */
  static readonly FILTER_KEYS = {
    status: 'status_id',
    customer: 'customer_id',
    project: 'project_id',
    organization: 'organization_id',
    assignee: 'assigned_to_id',
    priority: 'priority_id',
    author: 'author_id',
    updatedBy: 'updated_by_id',
    slaStatus: 'sla',
    ticketNumber: 'issue_id',
    subject: 'subject',
    description: 'description',
    created: 'created', // NOT documented in HELPDESK_USER_GUIDE.md §6 — found live 2026-08-21
    doneRatio: 'done_ratio',
    startDate: 'start_date',
    dueDate: 'due_date',
    closed: 'closed',
  } as const;

  /** Maps to each column's checkbox `value` attribute in the `c[]` picker. */
  static readonly COLUMN_KEYS = {
    ticketNumber: 'id',
    subject: 'subject',
    customer: 'customer',
    organization: 'organization',
    status: 'status',
    priority: 'priority',
    assignee: 'assigned_to',
    slaStatus: 'sla_remaining',
    updated: 'updated_on',
    project: 'project',
    tracker: 'tracker',
    author: 'author',
    supportLevel: 'support_level',
    product: 'product',
    doneRatio: 'done_ratio',
    startDate: 'start_date',
    dueDate: 'due_date',
    closed: 'closed_on',
    created: 'created_on',
    updatedBy: 'updated_by',
  } as const;

  /** Default 9 columns ticked out of the box — verified live, matches the guide exactly. */
  static readonly DEFAULT_COLUMN_KEYS = [
    'id', 'subject', 'customer', 'organization', 'status',
    'priority', 'assigned_to', 'sla_remaining', 'updated_on',
  ];

  /** Real nav path (added 2026-08-25): Helpdesk Command Center rail → "Helpdesk Tickets". */
  async openGlobalList() {
    await this.clickTopNav('Helpdesk Command Center');
    await this.clickHelpdeskSubNav('Helpdesk Tickets');
  }

  /** Real nav path (added 2026-08-25): land on the project, click its "Helpdesk" tab, then "Helpdesk Tickets" in the sub-nav. */
  async openProjectList(projectIdentifier: string) {
    await this.goto(`/projects/${projectIdentifier}`);
    await this.clickProjectTab('Helpdesk');
    await this.clickHelpdeskSubNav('Helpdesk Tickets');
  }

  async openFilterPanel() {
    // Guards against double-toggling closed if a previous step already opened it.
    const expanded = await this.filtersToggleButton.getAttribute('aria-expanded');
    if (expanded !== 'true') await this.filtersToggleButton.click();
  }

  async addFilter(key: keyof typeof HelpdeskTicketListPage.FILTER_KEYS) {
    await this.openFilterPanel();
    await this.addFilterButton.click();
    await this.page.locator(`[data-add-filter="${HelpdeskTicketListPage.FILTER_KEYS[key]}"]`).click();
  }

  async removeFilter(label: string) {
    await this.page.getByRole('button', { name: `Delete: ${label}` }).click();
  }

  async apply() {
    await this.applyButton.click();
  }

  async clear() {
    await this.clearLink.click();
  }

  async openColumnPicker() {
    await this.columnsButton.click();
  }

  async setColumn(key: keyof typeof HelpdeskTicketListPage.COLUMN_KEYS, checked: boolean) {
    await this.openColumnPicker();
    const checkbox = this.page.locator(`input[name="c[]"][value="${HelpdeskTicketListPage.COLUMN_KEYS[key]}"]`);
    if (checked) await checkbox.check();
    else await checkbox.uncheck();
  }

  async getCheckedColumns(): Promise<string[]> {
    await this.openColumnPicker();
    return this.page.locator('input[name="c[]"]:checked').evaluateAll(els => els.map(el => (el as HTMLInputElement).value));
  }

  async assertEmptyState() {
    await expect(this.page.getByText('No tickets yet')).toBeVisible();
  }

  async assertTicketCount(count: number) {
    await expect(this.page.getByText(`${count} ticket${count === 1 ? '' : 's'}`)).toBeVisible();
  }

  async openNewIssue() {
    await this.newIssueLink.click();
  }

  // --- Table rows (verified against real ticket data 2026-08-21) ---
  //
  // Row structure per <tr>: <td><a class="rf_helpdesk_table_link" href="/issues/:id">#id</a></td>
  // (ticket # and subject are separate <td>s, each with their own such link to the SAME issue)
  // <td> empty values render as <span class="rf_helpdesk_table_empty_value">—</span>
  // Status/Priority render as <span class="rf_helpdesk_badge rf_helpdesk_badge_info"><span>Label</span></span>
  // (only the "info"/grey badge variant has been observed — New status, Normal priority;
  // other badge color classes for e.g. High priority or Resolved status are not yet confirmed)
  // SLA Status renders as <span class="sla-timer sla-<state>"><span class="sla-sym sla-sym-<color>">symbol</span> Label</span>
  // — only "sla-no-sla" / "sla-sym-grey" / "No SLA" observed so far (no SLA exists yet in this
  // environment); the other 6 badge states from HELPDESK_TICKET_LIST_FILTERS_COLUMNS.md TC-HLP-406
  // (On Track/At Risk/Critical/Breached/Paused/Resolved) are NOT yet confirmed — update this
  // comment and the locators below the first time a real SLA is attached to a ticket.
  // Updated date renders as plain text in <td class="rf_helpdesk_table_date">, format "MM/DD/YYYY h:mm AM/PM".

  /**
   * A ticket row matched by its issue-detail href, NOT by text (unlike
   * BasePage.row(), which matches Settings-entity rows by visible name text
   * — a ticket # alone would ambiguously match other numeric cells in this
   * table, e.g. S.No). Named distinctly so it doesn't collide with (or get
   * confused for) the shared, text-based helper.
   */
  private ticketRow(ticketId: number) {
    return this.page.locator('tr', { has: this.page.locator(`a[href="/issues/${ticketId}"]`) });
  }

  async openTicket(ticketId: number) {
    await this.page.locator(`a.rf_helpdesk_table_link[href="/issues/${ticketId}"]`).first().click();
  }

  async getRowStatus(ticketId: number): Promise<string | null> {
    return this.ticketRow(ticketId).locator('.rf_helpdesk_badge').first().locator('span').textContent();
  }

  async getRowSlaStatus(ticketId: number): Promise<string | null> {
    return this.ticketRow(ticketId).locator('.sla-timer').textContent();
  }

  async assertRowVisible(ticketId: number, subject: string) {
    await expect(this.page.locator(`a.rf_helpdesk_table_link[href="/issues/${ticketId}"]`, { hasText: subject })).toBeVisible();
  }
}
