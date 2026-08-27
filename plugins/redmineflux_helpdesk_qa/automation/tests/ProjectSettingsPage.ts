import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * A project's Settings › Project tab (/projects/:id/settings), specifically
 * the module-enablement checkboxes — this is how the Helpdesk module itself
 * gets switched on (HELPDESK_PLUGIN_INSTALLATION.md feature #2). Standard
 * Redmine core screen. Locators verified against the live Forge instance on
 * 2026-08-21 (used to enable Helpdesk on the "Helpdesk Service Desk" project).
 *
 * NOTE: this page renders every settings tab's form in the DOM at once
 * (Project/Members/Issue tracking/Versions/etc. all present, only one
 * visible at a time) — there are multiple <input type="submit" name="commit">
 * "Save" buttons on the page. Always scope to `.first()` (the Project tab's,
 * which loads by default) unless deliberately on a different tab.
 */
export class ProjectSettingsPage extends BasePage {
  private readonly nameInput = this.page.locator('#project_name');
  private readonly descriptionInput = this.page.locator('#project_description');
  private readonly identifierInput = this.page.locator('#project_identifier'); // disabled after creation
  private readonly homepageInput = this.page.locator('#project_homepage');
  private readonly publicCheckbox = this.page.locator('#project_is_public');
  private readonly inheritMembersCheckbox = this.page.locator('#project_inherit_members');
  private readonly saveButton = this.page.getByRole('button', { name: 'Save' }).first();

  private readonly moduleCheckboxIds: Record<string, string> = {
    issueTracking: 'project_enabled_module_names_issue_tracking',
    timeTracking: 'project_enabled_module_names_time_tracking',
    news: 'project_enabled_module_names_news',
    documents: 'project_enabled_module_names_documents',
    files: 'project_enabled_module_names_files',
    wiki: 'project_enabled_module_names_wiki',
    repository: 'project_enabled_module_names_repository',
    forums: 'project_enabled_module_names_boards',
    calendar: 'project_enabled_module_names_calendar',
    gantt: 'project_enabled_module_names_gantt',
    helpdesk: 'project_enabled_module_names_helpdesk',
  };

  /** Real nav path (added 2026-08-25): land on the project, click its "Settings" tab — lands on the Project sub-tab (module checkboxes) by default. */
  async open(projectIdentifier: string) {
    await this.goto(`/projects/${projectIdentifier}`);
    await this.clickProjectTab('Settings');
  }

  async setModule(module: keyof typeof this.moduleCheckboxIds, enabled: boolean) {
    const checkbox = this.page.locator(`#${this.moduleCheckboxIds[module]}`);
    if (enabled) await checkbox.check();
    else await checkbox.uncheck();
  }

  async isModuleEnabled(module: keyof typeof this.moduleCheckboxIds): Promise<boolean> {
    return this.page.locator(`#${this.moduleCheckboxIds[module]}`).isChecked();
  }

  async save() {
    await this.saveButton.click();
  }

  /** Convenience: open, toggle the Helpdesk module, save — the exact flow used to enable it live. */
  async enableHelpdeskModule(projectIdentifier: string) {
    await this.open(projectIdentifier);
    await this.setModule('helpdesk', true);
    await this.save();
  }
}
