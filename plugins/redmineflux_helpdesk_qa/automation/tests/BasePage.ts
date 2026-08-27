import { Page } from '@playwright/test';

/**
 * Shared behavior for every page object in this plugin's suite.
 * Plugin-specific page objects (e.g. HelpdeskTicketPage) should extend this.
 *
 * NAVIGATION POLICY (added 2026-08-25): an audit found every page object's
 * open*() method navigated via goto(deepUrl) exclusively — zero clicks
 * through real nav links/tabs/menus anywhere in this suite. That means the
 * automation could never catch a broken or missing nav link (e.g.
 * BUG-HLP-005: `/rf_slas` and `/rf_support_levels` are reachable by URL but
 * have NO link to them anywhere in the UI), and doesn't exercise the app the
 * way a real user/agent/customer does.
 *
 * From now on, page objects should reach a screen by clicking through
 * clickTopNav()/clickProjectTab()/clickHelpdeskSubNav()/clickSettingsTab()
 * below, chained from a plain entry-point goto() (logging in, or landing on
 * a project's Overview) — NOT by goto()-ing straight to the target URL.
 * The one deliberate exception: a method whose entire point is to prove a
 * screen is reachable ONLY by direct URL with no nav path to it (see
 * HelpdeskSlaPage.openGlobalListViaDirectUrl() /
 * HelpdeskSupportLevelPage.openGlobalListViaDirectUrl(), both tied to
 * BUG-HLP-005) — those keep goto() on purpose and are named ...ViaDirectUrl
 * so the distinction is never ambiguous at the call site.
 */
export class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path: string) {
    await this.page.goto(path);
  }

  async isVisible(selector: string): Promise<boolean> {
    return this.page.locator(selector).isVisible().catch(() => false);
  }

  /** Shared click-by-accessible-name helper backing all four nav methods below. */
  protected async clickNavLink(label: string) {
    await this.page.getByRole('link', { name: label, exact: true }).click();
  }

  /**
   * Redmine's persistent top application menu — Home / My page / Projects /
   * "Helpdesk Command Center" / Administration / Help. Present on every page
   * for Admin/Agent roles; NOT present for the Customer role, whose top nav
   * collapses to just My account/Sign out/"My Helpdesk" (confirmed live
   * 2026-08-24 testing the Customer login flow — see BUG-HLP-006).
   */
  async clickTopNav(label: string) {
    await this.clickNavLink(label);
  }

  /**
   * A project's own standard menu tabs — Overview/Activity/Issues/.../
   * Helpdesk/Settings/etc. Call after landing on any page within that
   * project (e.g. after goto(`/projects/${identifier}`) as the one
   * acceptable entry-point goto, or after clickTopNav('Projects') and
   * picking the project from the list).
   */
  async clickProjectTab(label: string) {
    await this.clickNavLink(label);
  }

  /**
   * An item in the Helpdesk sub-nav. Shared markup between two different
   * contexts with DIFFERENT label sets — pick the right one per page object:
   *  - Command Center rail (7 items): Helpdesk Dashboard, Helpdesk Tickets,
   *    Reports, Organization, Customers, Products, Helpdesk Settings.
   *  - A project's own Helpdesk tab (6 items): Helpdesk Dashboard, Helpdesk
   *    Tickets, Knowledgebase, Helpdesk SLA, Organization, Settings.
   *
   * DELIBERATELY scoped to the `<ul>` containing "Helpdesk Dashboard"
   * (added 2026-08-25), NOT a bare page-wide link lookup: a project's own
   * Helpdesk tab renders the standard Redmine project menu (which has its
   * OWN "Settings" tab, e.g. `/projects/:id/settings`) at the same time as
   * this sub-nav (whose "Settings" is a DIFFERENT link, e.g.
   * `/projects/:id/helpdesk/settings`) — an unscoped
   * getByRole('link', {name:'Settings'}) would match both and throw a
   * strict-mode ambiguity error. Scoping to the list containing "Helpdesk
   * Dashboard" (unique to this sub-nav in both its contexts) resolves it.
   */
  async clickHelpdeskSubNav(label: string) {
    const subNav = this.page
      .getByRole('list')
      .filter({ has: this.page.getByRole('link', { name: 'Helpdesk Dashboard', exact: true }) });
    await subNav.getByRole('link', { name: label, exact: true }).click();
  }

  /**
   * A tab within whichever Helpdesk Settings screen is currently loaded.
   * Two different Settings screens exist with DIFFERENT tab sets:
   *  - Global (Command Center → "Helpdesk Settings"): Holiday, Products,
   *    Email Configuration, Canned Responses.
   *  - Project-level (project's Helpdesk tab → "Settings"): Holiday,
   *    Products, Support Level (no Email Configuration/Canned Responses here).
   *
   * CAUTION: "Products" is ambiguous specifically on the GLOBAL Settings
   * screen — the Command Center rail's own "Products" link is rendered on
   * that same page alongside the Settings tab of the same name (confirmed
   * live). No current page object calls `clickSettingsTab('Products')` (use
   * HelpdeskProductPage, which goes via the rail directly instead), but if
   * one ever needs to, scope it the same way clickHelpdeskSubNav() does
   * before relying on a bare name match here.
   */
  async clickSettingsTab(label: string) {
    await this.clickNavLink(label);
  }

  /**
   * A table row identified by matching text anywhere in it — the shared
   * pattern every Settings-entity list table uses (Organization/SLA/Support
   * Level/Product/Customer/Canned Response/Holiday) to find "the row for
   * this named record" before clicking its Edit link or reading another
   * column. Added 2026-08-25 to replace the same `this.page.locator('tr', {
   * hasText: ... })` expression that was previously duplicated inline in
   * every page object's openEdit()-style method.
   */
  protected row(rowIdentifier: string) {
    return this.page.locator('tr', { hasText: rowIdentifier });
  }

  /**
   * Reads one column's text from the row identified by `rowIdentifier`, by
   * column header label rather than a hardcoded index — works for any of
   * the Settings-entity list tables since they're all standard
   * `<table>/<th>/<td>` markup with cells in the same order as their
   * headers (confirmed live 2026-08-24/25 across Organization, SLA, Support
   * Level, Product, Customer). Added 2026-08-25: previously these page
   * objects could click a named row's Edit/Delete link but had no way to
   * read any OTHER column's value (e.g. Support Level's "Escalation To",
   * Organization's "User Count") without opening Edit first.
   *
   * Scopes to the specific `<table>` containing that row so a page with
   * multiple tables (none currently, but Ticket List's filter/column UI is
   * a good example of a page with more than one collection) can't match the
   * wrong one's header row.
   */
  protected async getRowCellText(rowIdentifier: string, columnHeader: string): Promise<string | null> {
    const table = this.page.locator('table').filter({ has: this.page.locator('tr', { hasText: rowIdentifier }) });
    const headers = await table.locator('th').allTextContents();
    const columnIndex = headers.findIndex(h => h.trim() === columnHeader);
    if (columnIndex === -1) {
      throw new Error(`Column header "${columnHeader}" not found in this table. Available headers: ${headers.map(h => h.trim()).join(', ')}`);
    }
    return table.locator('tr', { hasText: rowIdentifier }).locator('td').nth(columnIndex).textContent();
  }
}
