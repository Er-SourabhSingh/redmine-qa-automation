import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Helpdesk › Support Levels (/rf_support_levels). Locators verified against
 * the live Forge instance on 2026-08-21 via real `name` attributes (Rails
 * form field naming). Full CRUD+search cycle re-confirmed 2026-08-24 on a
 * fresh Forge instance (real L1→L2→L3 escalation chain kept as seed data,
 * throwaway "CRUD Test Level" used for the duplicate-name/duplicate-order/
 * delete cycle).
 *
 * BUG FIX 2026-08-24: `assigneeMultiSelect` used to be modeled as a native
 * `select[multiple]` with a `.selectOption()` call — that never matched the
 * real UI. Support Assignees is a **custom "Select items" checkbox-dropdown
 * widget** (click the textbox to open it, then click individual user
 * checkboxes by name) — the same widget pattern used for SLA↔Holiday and
 * this level's own Escalation-adjacent assignee picker. This page object's
 * `create()`/`edit()` never actually exercised the old (wrong) locator via
 * the page object itself — manual testing always drove it directly via
 * click(). `selectAssignees()` below is the corrected version.
 *
 * BUG-HLP-002 (filed 2026-08-24): the Escalation To dropdown is NOT scoped to
 * the selected Project — it lists every support level across every project
 * regardless of selection. Confirmed by selecting "Education and training3"
 * (unrelated to Helpdesk at all) and seeing AB-L1/L1/L2/L3 from two other
 * projects still offered. The Support Assignees widget IS correctly scoped
 * to project members — this is specifically an Escalation To bug.
 *
 * BUG-HLP-003: same Active-checkbox-can't-be-unchecked-via-Edit defect as
 * Canned Response/Organization/SLA — BUT the list view at /rf_support_levels
 * has its own working AJAX toggle checkbox
 * (`input.support-level-active-toggle`, confirmed to persist across
 * reloads), same pattern as Organization/SLA. Use `setActiveViaListToggle()`
 * to actually change Active.
 *
 * Confirmed live 2026-08-24 (exact validation wording):
 * - Duplicate Level Order within the same project: "Level order has already
 *   been taken" (TC-HLP-XXX regression — level_order uniqueness is
 *   per-project, confirmed by successfully using the same order on this
 *   support level after changing it to an unused number).
 * - Duplicate Name (install-wide, not per-project): "Support Level Name has
 *   already been taken".
 * - A user already assigned to one level in a project is excluded from the
 *   assignee picker for another level in the SAME project (confirmed live:
 *   after assigning Daisy Skye to L1, she no longer appeared in L2's
 *   Support Assignees dropdown on the same project) — matches TC-HLP-102.
 */
export class HelpdeskSupportLevelPage extends BasePage {
  private readonly projectSelect = this.page.locator('select[name="support_level[project_id]"]');
  private readonly nameInput = this.page.locator('input[name="support_level[name]"]');
  private readonly levelOrderInput = this.page.locator('input[name="support_level[level_order]"]');
  private readonly descriptionInput = this.page.locator('textarea[name="support_level[description]"]');
  private readonly assigneesField = this.page.getByRole('textbox', { name: 'Select items' });
  private readonly escalationToSelect = this.page.locator('select[name="support_level[escalation_to_id]"]');
  private readonly activeCheckbox = this.page.locator('input[type="checkbox"][name="support_level[active]"]');
  private readonly submitButton = this.page.getByRole('button', { name: /^(Create|Save)$/ });

  // List view (/rf_support_levels) — real <table>, confirmed live 2026-08-24.
  private readonly searchInput = this.page.getByPlaceholder('Search support levels...');
  private readonly listProjectFilterSelect = this.page.locator('select#project_id');
  private readonly listStatusFilterSelect = this.page.locator('select#active');
  private readonly applyFiltersButton = this.page.getByRole('button', { name: 'Apply Filters' });
  private readonly clearFiltersLink = this.page.getByRole('link', { name: 'Clear' });

  /**
   * REAL nav path (added 2026-08-25): land on the project, click its
   * "Helpdesk" tab, then "Settings", then the "Support Level" tab. This is
   * the ONLY UI path that produces a correctly project-scoped support
   * level — the "New Support Level" button on this list already carries
   * `?project_id=X`.
   */
  async openProjectList(projectIdentifier: string) {
    await this.goto(`/projects/${projectIdentifier}`);
    await this.clickProjectTab('Helpdesk');
    await this.clickHelpdeskSubNav('Settings');
    await this.clickSettingsTab('Support Level');
  }

  /** Call after openProjectList() — clicks "New Support Level", which is correctly project-scoped by construction. */
  async openNew() {
    await this.page.getByRole('link', { name: 'New Support Level' }).click();
  }

  /**
   * BUG-HLP-005 bypass route, kept deliberately as goto() — `/rf_support_levels`
   * (the global admin-level list) is reachable directly by URL but has NO
   * link to it anywhere in the UI (confirmed live 2026-08-24). Exists ONLY
   * to reproduce/verify that bug — use openProjectList() for anything else.
   */
  async openGlobalListViaDirectUrl() {
    await this.goto('/rf_support_levels');
  }

  /**
   * BUG-HLP-005 bypass route, kept deliberately as goto() — reachable only
   * via openGlobalListViaDirectUrl's own "New Support Level" button, which
   * points at bare `/rf_support_levels/new`. Unlike SLA's equivalent, this
   * form still renders a required, visible Project dropdown (so it does NOT
   * orphan the record) — but that dropdown lists every project on the
   * instance, including ones without Helpdesk enabled (part of BUG-HLP-005).
   */
  async openNewViaDirectUrl() {
    await this.goto('/rf_support_levels/new');
  }

  /** Real nav path (added 2026-08-25): openProjectList(projectIdentifier) first, then this clicks the named row's "Edit" link. */
  async openEdit(projectIdentifier: string, supportLevelName: string) {
    await this.openProjectList(projectIdentifier);
    await this.row(supportLevelName).getByRole('link', { name: 'Edit' }).click();
  }

  /** Reads the "Escalation To" column (e.g. "L2", "None (Last Level)") without opening Edit — call after openProjectList(). */
  async getEscalationTarget(supportLevelName: string): Promise<string | null> {
    return this.getRowCellText(supportLevelName, 'Escalation To');
  }

  /** Reads the "Support Assignees" column (comma-separated names) — call after openProjectList(). */
  async getAssigneesCellText(supportLevelName: string): Promise<string | null> {
    return this.getRowCellText(supportLevelName, 'Support Assignees');
  }

  /**
   * Confirmed live 2026-08-24 — full delete flow actually exercised (not just
   * markup-inspected) against a throwaway "CRUD Test Level": click opens the
   * "Delete Support level? ... This action cannot be undone." modal,
   * clicking its Delete button removes the row and it's gone from the list
   * afterward. Same a.rf-delete-btn[data-item-name] pattern as every other
   * Helpdesk Settings entity. L1/L2/L3 kept as real escalation-chain test
   * data, not deleted.
   */
  async delete(supportLevelName: string) {
    await this.page.locator(`a.rf-delete-btn[data-item-name="${supportLevelName}"]`).click();
    await this.page.getByRole('button', { name: 'Delete' }).click();
  }

  /**
   * The list row's live AJAX Active toggle — confirmed live 2026-08-24 as
   * the reliable way to (de)activate a support level (see BUG-HLP-003; the
   * Edit form's checkbox does not persist). Call from the list page
   * (openProjectList() first). Confirmed to persist across reloads.
   */
  async setActiveViaListToggle(supportLevelId: number, active: boolean) {
    const toggle = this.page.locator(`#support_level_active_${supportLevelId}`);
    if (active) await toggle.check();
    else await toggle.uncheck();
  }

  async search(term: string) {
    await this.searchInput.fill(term);
    await this.applyFiltersButton.click();
  }

  async filterByProject(project: string) {
    await this.listProjectFilterSelect.selectOption({ label: project });
    await this.applyFiltersButton.click();
  }

  async filterByStatus(status: 'All Statuses' | 'Active only' | 'Inactive only') {
    await this.listStatusFilterSelect.selectOption({ label: status });
    await this.applyFiltersButton.click();
  }

  async clearFilters() {
    await this.clearFiltersLink.click();
  }

  /**
   * Opens the custom "Select items" assignee widget and clicks each named
   * user's checkbox. Corrected 2026-08-24 — this is NOT a native
   * select[multiple]; call this instead of any selectOption()-based approach.
   */
  async selectAssignees(names: string[]) {
    await this.assigneesField.click();
    for (const name of names) {
      await this.page.getByText(name, { exact: true }).click();
    }
  }

  /**
   * Requires `projectIdentifier` (added 2026-08-25) — navigates via the real
   * project-scoped flow (openProjectList → New Support Level). NOTE: reached
   * this way, `support_level[project_id]` renders as a LOCKED HIDDEN input,
   * not a visible `<select>` (confirmed live 2026-08-24) — so there is
   * nothing to select here; the project is already correctly set by the nav
   * path itself. (Only the bypass route's bare form renders a live,
   * selectable Project dropdown — see openNewViaDirectUrl.)
   */
  async create(options: {
    projectIdentifier: string;
    name: string;
    levelOrder: number;
    description?: string;
    assignees: string[];
    escalatesTo?: string;
    active?: boolean;
  }) {
    await this.openProjectList(options.projectIdentifier);
    await this.openNew();
    await this.nameInput.fill(options.name);
    await this.levelOrderInput.fill(String(options.levelOrder));
    if (options.description) await this.descriptionInput.fill(options.description);
    await this.selectAssignees(options.assignees);
    if (options.escalatesTo) await this.escalationToSelect.selectOption({ label: options.escalatesTo });
    if (options.active === false) await this.activeCheckbox.uncheck();
    await this.submitButton.click();
  }

  /**
   * Call after openEdit(). Only fills what's provided. Confirmed live:
   * escalationTo was set successfully this way for the full L1→L2→L3 chain.
   * Do NOT use `active` here — see BUG-HLP-003, use setActiveViaListToggle() instead.
   */
  async edit(options: {
    name?: string;
    description?: string;
    escalatesTo?: string;
  }) {
    if (options.name) await this.nameInput.fill(options.name);
    if (options.description) await this.descriptionInput.fill(options.description);
    if (options.escalatesTo) await this.escalationToSelect.selectOption({ label: options.escalatesTo });
    await this.submitButton.click();
  }

  /** Confirmed live 2026-08-24 — exact message: "Level order has already been taken" (uniqueness is per-project). */
  async assertDuplicateLevelOrderRefused() {
    await expect(this.page.getByText(/Level order has already been taken/i)).toBeVisible();
  }

  /** Confirmed live 2026-08-24 — exact message: "Support Level Name has already been taken" (uniqueness is install-wide). */
  async assertDuplicateNameRefused() {
    await expect(this.page.getByText(/Support Level Name has already been taken/i)).toBeVisible();
  }

  async assertRowVisible(name: string) {
    await expect(this.page.getByRole('link', { name })).toBeVisible();
  }

  /** Distinct from an empty-list state — the filtered/searched-with-no-results state, confirmed live 2026-08-24. */
  async assertNoSearchResults() {
    await expect(this.page.getByText('Nothing matched')).toBeVisible();
  }
}
