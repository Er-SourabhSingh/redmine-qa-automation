import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Helpdesk Settings › Canned Responses (/rf_canned_responses). Locators
 * verified against the live Forge instance on 2026-08-21 and re-confirmed
 * (full CRUD + macros + validation) on 2026-08-24. No project selector on
 * this form — confirms the guide's claim that canned responses are shared
 * across every project, not per-project like Products/SLAs.
 *
 * Confirmed live 2026-08-24:
 * - Name/Content are both real HTML5 `required` inputs (client-side
 *   "Please fill out this field." blocks submission before any request).
 * - Name has a real server-side max length of exactly 255 characters —
 *   256 is refused with "Name is too long (maximum is 255 characters)",
 *   255 succeeds. Confirmed by direct boundary probe, not guessed.
 * - Duplicate Name is refused server-side with "Name has already been
 *   taken" (TC-HLP-026).
 * - Author is NOT an input — it's static text showing the current user,
 *   confirmed un-editable.
 * - The submit button here genuinely IS `input[type="submit"][name="commit"]`
 *   (unlike Customer's form, which uses a `<button>` — don't assume the two
 *   patterns are interchangeable across this plugin's forms).
 * - Full CRUD+search+delete cycle executed end-to-end on a throwaway
 *   "CRUD Test Canned Response" (created, found via search matching
 *   Name AND Content text, deleted via the shared JS confirmation modal
 *   a.rf-delete-btn[data-item-type="canned response"]).
 * - All 9 macro links insert their token at the current cursor position in
 *   Content on click (confirmed: clicking {{customer_name}} after typing
 *   "Hi " produced "Hi {{customer_name}}").
 * - Macro substitution on a real ticket reply confirmed correct for all 9
 *   macros simultaneously (TC-HLP-002): {{customer_name}}→ticket author,
 *   {{ticket_id}}→"#236", {{ticket_subject}}, {{project_name}},
 *   {{assignee_name}}, {{current_user}}→replying user, {{current_date}},
 *   {{current_time}} all substituted correctly. Selecting a template in the
 *   reply box's Canned Response dropdown APPENDS after already-typed text
 *   rather than replacing it (TC-HLP-003, confirmed).
 *
 * BUG-HLP-003 (filed 2026-08-24, High): the Active checkbox on this Edit
 * form has no Rails hidden fallback input, so unchecking it and saving
 * sends no `active` param at all — the update silently leaves the record
 * Active. Deactivating a canned response via the UI currently DOES NOT
 * WORK once it has been created Active. TC-HLP-033 cannot pass as written
 * until this is fixed. `setActive(false)` below is implemented to match
 * the documented UI flow, but calling it against an already-Active record
 * will NOT actually deactivate it — this is the bug, not a locator issue.
 */
export class HelpdeskCannedResponsePage extends BasePage {
  private readonly nameInput = this.page.locator('#rf_canned_response_name');
  private readonly contentInput = this.page.locator('#canned_content');
  private readonly activeCheckbox = this.page.locator('#rf_canned_response_active');
  private readonly submitButton = this.page.locator('input[type="submit"][name="commit"]');

  // Macro shortcut links in the Content field's "Available Macros:" row —
  // confirmed real attributes: class="mail-macro insert-macro", data-macro="{{...}}".
  private readonly macroLink = (macro: MacroName) => this.page.locator(`a.insert-macro[data-macro="{{${macro}}}"]`);

  // Navigating to /rf_canned_responses redirects to the Helpdesk Settings tab
  // (/rf_helpdesk/setting?tab=canned_responses) — verified 2026-08-21. That
  // Settings page renders Holidays/Products/Email Config/Canned Responses
  // tabs together in the DOM, and their search boxes all share id="search"
  // (an accessibility bug in the plugin) — use the placeholder text to
  // disambiguate, never `#search` directly on this page. Search confirmed
  // to match against BOTH Name and Content text (2026-08-24).
  private readonly searchInput = this.page.getByPlaceholder('Search canned responses...');
  private readonly applyFiltersButton = this.page.getByRole('button', { name: 'Apply Filters' });
  private readonly clearFiltersLink = this.page.getByRole('link', { name: 'Clear' });

  /** Real nav path (added 2026-08-25): Helpdesk Command Center rail → "Helpdesk Settings" → "Canned Responses" tab. */
  async openList() {
    await this.clickTopNav('Helpdesk Command Center');
    await this.clickHelpdeskSubNav('Helpdesk Settings');
    await this.clickSettingsTab('Canned Responses');
  }

  /** Navigates to the list, then clicks "New Canned Response". */
  async openNew() {
    await this.openList();
    await this.page.getByRole('link', { name: 'New Canned Response' }).click();
  }

  /** Navigates to the list, then clicks the named row's "Edit" link — pre-fills Name/Content/Active. */
  async openEdit(canned_response_name: string) {
    await this.openList();
    await this.row(canned_response_name).getByRole('link', { name: 'Edit' }).click();
  }

  /** Reads the "Author" column for the named row without opening it — call after openList(). */
  async getAuthor(canned_response_name: string): Promise<string | null> {
    return this.getRowCellText(canned_response_name, 'Author');
  }

  /**
   * Confirmed live 2026-08-24: same JS confirmation-modal pattern as every
   * other Helpdesk Settings entity — a.rf-delete-btn[data-item-name],
   * data-item-type="canned response". Actually exercised end-to-end
   * (not just markup-inspected) against a throwaway entity.
   */
  async delete(canned_response_name: string) {
    await this.page.locator(`a.rf-delete-btn[data-item-name="${canned_response_name}"]`).click();
    await this.page.getByRole('button', { name: 'Delete' }).click();
  }

  async search(term: string) {
    await this.searchInput.fill(term);
    await this.applyFiltersButton.click();
  }

  async clearFilters() {
    await this.clearFiltersLink.click();
  }

  async create(options: { name: string; content: string; active?: boolean }) {
    await this.openNew();
    await this.nameInput.fill(options.name);
    await this.contentInput.fill(options.content);
    if (options.active === false) await this.activeCheckbox.uncheck();
    await this.submitButton.click();
  }

  /** Call after openEdit(). Only fills what's provided. See BUG-HLP-003 re: setting active=false. */
  async edit(options: { name?: string; content?: string; active?: boolean }) {
    if (options.name) await this.nameInput.fill(options.name);
    if (options.content) await this.contentInput.fill(options.content);
    if (options.active === true) await this.activeCheckbox.check();
    if (options.active === false) await this.activeCheckbox.uncheck(); // BUG-HLP-003: will not actually persist
    await this.submitButton.click();
  }

  /** Clicks a macro shortcut link, inserting it at the current cursor position in Content. Call after focusing/typing in Content. */
  async insertMacro(macro: MacroName) {
    await this.macroLink(macro).click();
  }

  async assertRowVisible(name: string) {
    await expect(this.page.getByRole('link', { name })).toBeVisible();
  }

  /** Distinct from an empty-list state — the filtered/searched-with-no-results state, confirmed live 2026-08-24. */
  async assertNoSearchResults() {
    await expect(this.page.getByText('Nothing matched')).toBeVisible();
  }

  /**
   * NOT YET VERIFIED — the exact duplicate-name error wording IS confirmed
   * ("Name has already been taken", TC-HLP-026 executed 2026-08-24), but this
   * assertion helper's regex was written broad to also match other entities'
   * wording; narrow it if a stricter match is needed.
   */
  async assertDuplicateNameRefused() {
    await expect(this.page.getByText(/already been taken|has already been taken|must be unique/i)).toBeVisible();
  }
}

export type MacroName =
  | 'customer_name'
  | 'customer_email'
  | 'ticket_id'
  | 'ticket_subject'
  | 'project_name'
  | 'assignee_name'
  | 'current_user'
  | 'current_date'
  | 'current_time';
