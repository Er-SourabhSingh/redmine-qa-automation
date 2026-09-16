import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Helpdesk Dashboard — Command Center (global, `/helpdesk`) and Project-level
 * (`/projects/:id/helpdesk`) versions share the same KPI-card/Prepaid-table
 * markup, just scoped differently. Locators verified live 2026-08-25 on
 * `flux-fwdq7ydhw49` as admin. Closes a gap flagged in `HELPDESK_MEMORY.md`'s
 * outstanding list ("Still no page object for: ... Dashboard (either global
 * or project)"), and backs TC-HLP-066/067 (basic rendering) and TC-HLP-274/
 * 275 (KPI "View all" links) in `HELPDESK_NAVIGATION_WORKSPACES.md`.
 *
 * Confirmed differences between the two:
 *  - Global: 5 KPI cards + a "Prepaid Support Hours" table that spans every
 *    project (has its own "Project" column, since it aggregates every
 *    org/project pair) + "Recent Tickets" (search box + table, spans all
 *    projects) + a "Ticket Statistics" heading (the chart itself is not
 *    accessible-tree-readable — not covered here). "New issue" goes to
 *    `/issue_helpdesks/new` (no project pre-selected).
 *  - Project-level: same 5 KPI cards, scoped to just this project — but
 *    Recent Tickets / Ticket Statistics are confirmed ABSENT entirely (not
 *    just empty). Its "Prepaid Support Hours" table only lists this
 *    project's own organizations (no separate "Project" column, since it's
 *    implied). "New issue" goes to `/projects/:id/helpdesk/new`.
 *
 * TC-HLP-274 re-verified live this pass: clicking the global dashboard's
 * "Unassigned" KPI card landed on `/rf_helpdesk/issues?assigned_to_id[]=none
 * &status_id[]=open&...`, with the filter panel correctly pre-filled
 * (Status = Any open status, Assignee = Nobody (unassigned)) and the
 * resulting "1 tickets" count matching the KPI's own count exactly.
 *
 * NOT yet covered: the Date Range picker's own popup UI (only the trigger
 * button is here — its calendar/preset options were never opened), and the
 * Ticket Statistics chart (would need canvas pixel inspection or an
 * underlying data API — neither attempted).
 */
export class HelpdeskDashboardPage extends BasePage {
  private readonly dateRangeButton = this.page.getByRole('button', { name: 'Date Range' });
  private readonly newIssueLink = this.page.getByRole('link', { name: 'New issue' });
  private readonly recentTicketsSearchInput = this.page.getByPlaceholder('Search tickets by subject…');

  /** The 5 KPI cards' visible labels — identical wording on both the global and project-level dashboard. */
  static readonly KPI_LABELS = {
    unassigned: 'Unassigned',
    open: 'Open',
    onHold: 'On Hold',
    slaBreached: 'SLA Breached',
    resolved: 'Resolved',
  } as const;

  /** Real nav path: Helpdesk Command Center rail entry point — the global, all-projects dashboard. */
  async openGlobalDashboard() {
    await this.clickTopNav('Helpdesk Command Center');
  }

  /** Real nav path: land on the project, click its "Helpdesk" tab — the project-scoped dashboard. */
  async openProjectDashboard(projectIdentifier: string) {
    await this.goto(`/projects/${projectIdentifier}`);
    await this.clickProjectTab('Helpdesk');
  }

  /**
   * The whole KPI card IS the link (confirmed live — clicking anywhere on it,
   * including its "View all" text, navigates via the same href), matched by
   * its label with word-boundaries so "Open" doesn't accidentally match
   * inside a longer label.
   */
  private kpiLink(key: keyof typeof HelpdeskDashboardPage.KPI_LABELS) {
    const label = HelpdeskDashboardPage.KPI_LABELS[key];
    return this.page.getByRole('link', { name: new RegExp(`\\b${label}\\b`) });
  }

  /** Reads the KPI card's count — its first child element's text, confirmed live to always be just the number. */
  async getKpiCount(key: keyof typeof HelpdeskDashboardPage.KPI_LABELS): Promise<string | null> {
    return this.kpiLink(key).locator(':scope > *').first().textContent();
  }

  /** Navigates via a KPI card's own link — the pre-applied-filter ticket list for that KPI. */
  async clickKpiViewAll(key: keyof typeof HelpdeskDashboardPage.KPI_LABELS) {
    await this.kpiLink(key).click();
  }

  async openDateRangePicker() {
    await this.dateRangeButton.click();
  }

  async openNewIssue() {
    await this.newIssueLink.click();
  }

  /**
   * Reads a column from the "Prepaid Support Hours" table via the shared
   * `BasePage.getRowCellText()` — `rowIdentifier` can be an Organization name
   * (works on both dashboards) or a Project name (global dashboard only,
   * since only it has that column).
   */
  async getPrepaidCellText(rowIdentifier: string, columnHeader: 'Project' | 'Organization' | 'Approved' | 'Used' | 'Remaining' | 'Usage'): Promise<string | null> {
    return this.getRowCellText(rowIdentifier, columnHeader);
  }

  /** Global dashboard only — filters the "Recent Tickets" table by subject. */
  async searchRecentTickets(term: string) {
    await this.recentTicketsSearchInput.fill(term);
  }

  /** Global dashboard only — clicks a ticket's link from the "Recent Tickets" table. */
  async openRecentTicket(ticketId: number) {
    await this.page.locator(`a[href="/issues/${ticketId}"]`).first().click();
  }

  async assertRecentTicketVisible(ticketId: number, subject: string) {
    await expect(this.page.locator(`a[href="/issues/${ticketId}"]`, { hasText: subject }).first()).toBeVisible();
  }
}
