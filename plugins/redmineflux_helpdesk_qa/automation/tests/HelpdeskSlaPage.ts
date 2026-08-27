import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Helpdesk › SLA (/rf_slas). Locators verified against the live Forge
 * instance on 2026-08-21.
 *
 * DISCREPANCY vs HELPDESK_USER_GUIDE.md §3.2: the real "New SLA" form has NO
 * visible Project field (the guide describes one, "leave blank for global").
 * Also, the real form has fields the guide never mentions: Working Days
 * (Mon–Sun checkboxes) and an "SLA Agreement" file upload.
 *
 * RESOLVED 2026-08-24 (was previously an open question, then briefly
 * mis-stated as "SLA is a global, install-wide entity" — that was WRONG,
 * corrected here after live verification): SLA project-scoping is real, but
 * it is driven by a **hidden `project_id` field populated from a URL query
 * param**, not by any visible dropdown. `/rf_slas/new` alone creates an
 * unscoped SLA (no project_id at all — it won't appear under ANY project's
 * own Helpdesk SLA tab, only in the global admin list at `/rf_slas`).
 * `/rf_slas/new?project_id=9` (which is exactly what the "New SLA" button
 * inside a project's own Helpdesk SLA tab links to) renders a
 * `<input type="hidden" name="project_id" value="9">` that silently
 * associates the new SLA with that project. Confirmed by: creating one SLA
 * via the bare URL (didn't appear under Helpdesk Service Desk's own SLA
 * tab) vs. one created via the project-scoped URL (did appear there, and
 * ONLY there — correctly absent from a different project's tab). Always
 * use `openProjectList()` + `openNew()` below (added 2026-08-25) — the real
 * click-through nav path, which reaches the form with the hidden project_id
 * field already correctly set. The bare/unscoped form is still reachable,
 * but only via the deliberate `openNewViaDirectUrl()` bypass method tied to
 * BUG-HLP-005 — never as the "normal" way to create an SLA.
 *
 * Confirmed live 2026-08-24 (full CRUD+search cycle re-run on a fresh Forge
 * instance, real "Standard" kept as seed data):
 * - Duplicate Name refused with exact message "SLA Name has already been
 *   taken" (TC-HLP-099).
 * - REAL cross-field validation confirmed: "Resolution Time must be greater
 *   than or equal to the Response Time" — submitting Resolution < First
 *   Response (e.g. 2 min resolution vs 30 min response) is refused. This
 *   answers TC-HLP-253 in HELPDESK_FIELD_VALIDATIONS.md definitively: the
 *   plugin DOES cross-validate these two fields, it is not silently accepted.
 * - Same BUG-HLP-003 Active-checkbox-can't-be-unchecked-via-Edit defect as
 *   Canned Response — BUT the list view at /rf_slas has its own working
 *   AJAX toggle checkbox (`input.sla-active-toggle`, confirmed to persist
 *   across reloads), same pattern as Organization. Use
 *   `setActiveViaListToggle()` to actually change Active; do not rely on
 *   `edit()`'s active handling (not exposed here for that reason).
 * - A pre-existing SLA named "test" was discovered on this fresh instance,
 *   not created this session — same "don't trust an empty-looking list"
 *   lesson as before; always re-check what's actually on a given server.
 *
 * RESOLVED 2026-08-25 (was "undocumented file-upload field" above): "SLA
 * Agreement" is Redmine's standard AJAX multi-attachment widget, not a
 * plain single-file input — confirmed live by inspecting the real DOM
 * (`input[type="file"][name="attachments[dummy][file]"]`, class
 * `file_selector filedrop`, `data-upload-path="/uploads.js"`). Setting a
 * file on it triggers an async upload; on success the widget swaps in a
 * filename textbox + an "Optional description" textbox + a delete link, all
 * before the SLA form itself is ever submitted. Use `uploadAgreement()`
 * below, which waits for that swap to complete before returning.
 */
type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export class HelpdeskSlaPage extends BasePage {
  private readonly nameInput = this.page.getByLabel('SLA Name *');
  private readonly descriptionInput = this.page.getByLabel('Description');
  private readonly firstResponseTimeInput = this.page.getByLabel('First Response Time *');
  private readonly resolutionTimeInput = this.page.getByLabel('Resolution Time *');
  private readonly activeCheckbox = this.page.getByLabel('Active');
  private readonly saveButton = this.page.getByRole('button', { name: 'Save' });

  // "SLA Agreement" — Redmine's standard AJAX attachment widget, not a plain
  // file input. The visible "Choose File" button triggers this hidden
  // native input; do not target the button itself with setInputFiles().
  private readonly agreementFileInput = this.page.locator('input[name="attachments[dummy][file]"]');

  // List view (/rf_slas) — custom grid, no <table>; row markup not yet
  // verified since no SLA exists yet (empty state only).
  private readonly searchInput = this.page.getByPlaceholder('Search SLAs...');
  private readonly statusFilterSelect = this.page.locator('select#active');
  private readonly applyFiltersButton = this.page.getByRole('button', { name: 'Apply Filters' });
  private readonly clearFiltersLink = this.page.getByRole('link', { name: 'Clear' });

  private readonly workingDayCheckboxes = {
    monday: this.page.getByLabel('Monday'),
    tuesday: this.page.getByLabel('Tuesday'),
    wednesday: this.page.getByLabel('Wednesday'),
    thursday: this.page.getByLabel('Thursday'),
    friday: this.page.getByLabel('Friday'),
    saturday: this.page.getByLabel('Saturday'),
    sunday: this.page.getByLabel('Sunday'),
  };

  /**
   * REAL nav path (added 2026-08-25): land on the project, click its
   * "Helpdesk" tab, then "Helpdesk SLA" in the Helpdesk sub-nav. This is the
   * ONLY UI path that produces a correctly project-scoped SLA — the "New
   * SLA" button on this list already carries `?project_id=X`, so
   * openNew() below (called after this) reaches the form with the hidden
   * project_id field already correctly rendered, with no need to guess/pass
   * a project ID manually.
   */
  async openProjectList(projectIdentifier: string) {
    await this.goto(`/projects/${projectIdentifier}`);
    await this.clickProjectTab('Helpdesk');
    await this.clickHelpdeskSubNav('Helpdesk SLA');
  }

  /** Call after openProjectList() — clicks "New SLA", which is correctly project-scoped by construction. */
  async openNew() {
    await this.page.getByRole('link', { name: 'New SLA' }).click();
  }

  /**
   * BUG-HLP-005 bypass route, kept deliberately as goto() — `/rf_slas` (the
   * global admin-level list) is reachable directly by URL but has NO link to
   * it anywhere in the UI (confirmed live 2026-08-24). This method exists
   * ONLY to reproduce/verify that bug, never as a "normal" way to reach the
   * SLA list — use openProjectList() for anything else.
   */
  async openGlobalListViaDirectUrl() {
    await this.goto('/rf_slas');
  }

  /**
   * BUG-HLP-005 bypass route, kept deliberately as goto() — the global
   * list's own "New SLA" button (reachable only via openGlobalListViaDirectUrl)
   * points at bare `/rf_slas/new` with NO project_id, producing a
   * permanently orphaned SLA. Pass projectId only to reproduce the (now
   * fixed-in-nav, still-URL-reachable) `?project_id=X` shortcut; omit it to
   * reproduce the fully orphaned case.
   */
  async openNewViaDirectUrl(projectId?: number) {
    await this.goto(projectId ? `/rf_slas/new?project_id=${projectId}` : '/rf_slas/new');
  }

  /** Real nav path (added 2026-08-25): openProjectList(projectIdentifier) first, then this clicks the named row's "Edit" link. */
  async openEdit(projectIdentifier: string, slaName: string) {
    await this.openProjectList(projectIdentifier);
    await this.row(slaName).getByRole('link', { name: 'Edit' }).click();
  }

  /** Reads the "User Count" column (customers assigned this SLA) — call after openProjectList(). */
  async getUserCount(slaName: string): Promise<string | null> {
    return this.getRowCellText(slaName, 'User Count');
  }

  /** Reads the "SLA Agreement" column — "—" if no file was uploaded. Call after openProjectList(). */
  async getAgreementCellText(slaName: string): Promise<string | null> {
    return this.getRowCellText(slaName, 'SLA Agreement');
  }

  /** Real nav path (added 2026-08-25): openProjectList(projectIdentifier) first, then this clicks the SLA's own name link — read-only detail view. */
  async openDetail(projectIdentifier: string, slaName: string) {
    await this.openProjectList(projectIdentifier);
    await this.page.getByRole('link', { name: slaName }).click();
  }

  /**
   * Confirmed live 2026-08-21 — kept as a direct-URL goto() on purpose: this
   * screen has genuinely NO link to it anywhere in the UI (worth a UI-polish
   * note, not a bug — unlike BUG-HLP-005's SLA/Support-Level list routes,
   * there's no "New History" action a bypass could even apply to). Shows
   * CREATE/UPDATE actions with user, timestamp, and a field-level diff.
   */
  async openHistory(slaId: number) {
    await this.goto(`/rf_slas/${slaId}/history`);
  }

  /**
   * Confirmed live 2026-08-24 — full delete flow actually exercised (not just
   * markup-inspected) against a throwaway "CRUD Test SLA": click opens the
   * "Delete SLA? Are you sure you want to delete "X"? This action cannot be
   * undone." modal, clicking its Delete button removes the row and it's
   * gone from the list afterward. Same a.rf-delete-btn[data-item-name]
   * pattern as every other Helpdesk Settings entity.
   */
  async delete(slaName: string) {
    await this.page.locator(`a.rf-delete-btn[data-item-name="${slaName}"]`).click();
    await this.page.getByRole('button', { name: 'Delete' }).click();
  }

  /**
   * The list row's live AJAX Active toggle — confirmed live 2026-08-24 as
   * the reliable way to (de)activate an SLA (see BUG-HLP-003; the Edit
   * form's checkbox does not persist). Call from the list page
   * (openProjectList() first). Confirmed to persist across reloads.
   */
  async setActiveViaListToggle(slaId: number, active: boolean) {
    const toggle = this.page.locator(`#sla_active_${slaId}`);
    if (active) await toggle.check();
    else await toggle.uncheck();
  }

  /** Confirmed live 2026-08-24 — exact message: "SLA Name has already been taken". */
  async assertDuplicateNameRefused() {
    await expect(this.page.getByText(/already been taken/i)).toBeVisible();
  }

  /** Confirmed live 2026-08-24 — exact message when Resolution < First Response Time. */
  async assertResolutionMustBeGreaterThanResponse() {
    await expect(this.page.getByText(/Resolution Time must be greater than or equal to the Response Time/i)).toBeVisible();
  }

  /**
   * Response/resolution unit dropdowns are plain <select> siblings of their
   * spinbutton, not independently labeled — select by visible option text.
   */
  async setFirstResponseTime(value: number, unit: 'Minutes' | 'Hours') {
    await this.firstResponseTimeInput.fill(String(value));
    await this.firstResponseTimeInput.locator('xpath=following-sibling::select[1]').selectOption({ label: unit });
  }

  async setResolutionTime(value: number, unit: 'Minutes' | 'Hours' | 'Days') {
    await this.resolutionTimeInput.fill(String(value));
    await this.resolutionTimeInput.locator('xpath=following-sibling::select[1]').selectOption({ label: unit });
  }

  async setWorkingDays(days: WeekDay[]) {
    for (const day of days) {
      await this.workingDayCheckboxes[day].check();
    }
  }

  /**
   * Uploads a file to "SLA Agreement" (confirmed live 2026-08-25 — see the
   * class doc comment). Waits for the widget's post-upload state (filename +
   * "Optional description" textboxes) before returning, so a caller can
   * immediately click Save without racing the async /uploads.js request.
   */
  async uploadAgreement(filePath: string) {
    await this.agreementFileInput.setInputFiles(filePath);
    await this.page.getByPlaceholder('Optional description').waitFor({ state: 'visible' });
  }

  /** Requires `projectIdentifier` (added 2026-08-25) — navigates via the real project-scoped flow (openProjectList → New SLA), never the bypass route. */
  async create(options: {
    projectIdentifier: string;
    name: string;
    description?: string;
    firstResponse: { value: number; unit: 'Minutes' | 'Hours' };
    resolution: { value: number; unit: 'Minutes' | 'Hours' | 'Days' };
    workingDays?: WeekDay[];
    active?: boolean;
    agreementFilePath?: string;
  }) {
    await this.openProjectList(options.projectIdentifier);
    await this.openNew();
    await this.nameInput.fill(options.name);
    if (options.description) await this.descriptionInput.fill(options.description);
    await this.setFirstResponseTime(options.firstResponse.value, options.firstResponse.unit);
    await this.setResolutionTime(options.resolution.value, options.resolution.unit);
    if (options.workingDays) await this.setWorkingDays(options.workingDays);
    if (options.active === false) await this.activeCheckbox.uncheck();
    if (options.agreementFilePath) await this.uploadAgreement(options.agreementFilePath);
    await this.saveButton.click();
  }

  /** Call after openEdit(). Only fills what's provided — leaves other fields untouched. */
  async edit(options: {
    name?: string;
    description?: string;
    firstResponse?: { value: number; unit: 'Minutes' | 'Hours' };
    resolution?: { value: number; unit: 'Minutes' | 'Hours' | 'Days' };
    agreementFilePath?: string;
  }) {
    if (options.name) await this.nameInput.fill(options.name);
    if (options.description) await this.descriptionInput.fill(options.description);
    if (options.firstResponse) await this.setFirstResponseTime(options.firstResponse.value, options.firstResponse.unit);
    if (options.resolution) await this.setResolutionTime(options.resolution.value, options.resolution.unit);
    if (options.agreementFilePath) await this.uploadAgreement(options.agreementFilePath);
    await this.saveButton.click();
  }

  /** Parses openHistory()'s entries — confirmed live format: "ACTION Name MM/DD/YYYY hh:mm AM/PM" then detail line(s). */
  async getHistoryEntries(): Promise<string> {
    return this.page.locator('body').innerText();
  }

  async assertRowVisible(name: string) {
    await expect(this.page.getByRole('link', { name })).toBeVisible();
  }

  async assertEmptyState() {
    await expect(this.page.getByText('No SLA policies yet')).toBeVisible();
  }

  async search(term: string) {
    await this.searchInput.fill(term);
    await this.applyFiltersButton.click();
  }

  async filterByStatus(status: 'All Statuses' | 'Active only' | 'Inactive only') {
    await this.statusFilterSelect.selectOption({ label: status });
    await this.applyFiltersButton.click();
  }

  async clearFilters() {
    await this.clearFiltersLink.click();
  }
}
