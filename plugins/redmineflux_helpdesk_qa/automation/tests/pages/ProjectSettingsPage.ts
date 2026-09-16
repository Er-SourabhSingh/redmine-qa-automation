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

  // New-project form (/projects/new) — confirmed live 2026-09-14, same field
  // ids as the Settings > Project tab above (nameInput/identifierInput/etc.
  // are shared), plus its own Create button.
  private readonly createButton = this.page.getByRole('button', { name: 'Create', exact: true });

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

  // Settings > Issue tracking tab (/projects/:id/settings/issues) — the
  // per-project Tracker enablement checkboxes (confirmed live 2026-09-14:
  // Bug/Feature/Support, all checked by default on a freshly created
  // project, but explicitly ensured here rather than assumed).
  private trackerCheckbox(trackerName: string) {
    return this.page.getByRole('checkbox', { name: trackerName, exact: true });
  }
  private readonly issueTrackingSaveButton = this.page.getByRole('button', { name: 'Save' });

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

  /**
   * True if a project with this identifier already exists — provisioning's
   * check-before-create. `/projects/:identifier` 404s (confirmed live
   * 2026-09-14) rather than redirecting when the identifier is unused, so the
   * HTTP status is the cleanest signal — no reliance on parsing a 404 page's
   * wording, which can vary by locale/theme. Deliberately calls `page.goto()`
   * directly rather than BasePage.goto() (which discards the Response) —
   * this is a probe, not real user navigation, same class of exception as
   * HelpdeskSlaPage's `...ViaDirectUrl()` methods.
   */
  async exists(projectIdentifier: string): Promise<boolean> {
    const response = await this.page.goto(`/projects/${projectIdentifier}`);
    return response !== null && response.status() !== 404;
  }

  /**
   * Creates a new project via the real /projects/new form (top nav
   * "Projects" → "New project" — confirmed live 2026-09-14). Only Name/
   * Identifier/Is public are set here; modules are left at this instance's
   * defaults. Enable Helpdesk (or any other module) as a separate step via
   * enableHelpdeskModule()/setModule() afterward — that flow is already
   * proven to work, so provisioning reuses it rather than the new-project
   * form's own (unverified) module checkboxes.
   */
  async createProject(options: { name: string; identifier: string; isPublic?: boolean }) {
    await this.clickTopNav('Projects');
    await this.page.getByRole('link', { name: 'New project' }).click();
    await this.nameInput.fill(options.name);
    await this.identifierInput.fill(options.identifier);
    if (options.isPublic === false) await this.publicCheckbox.uncheck();
    await this.createButton.click();
  }

  /** Navigates to the project's Issue tracking settings tab (Trackers/Custom fields/defaults). */
  async openIssueTrackingSettings(projectIdentifier: string) {
    await this.goto(`/projects/${projectIdentifier}/settings/issues`);
  }

  /** Call after openIssueTrackingSettings(). Enables the named tracker (e.g. "Support") for this project. */
  async enableTracker(trackerName: string) {
    await this.trackerCheckbox(trackerName).check();
    await this.issueTrackingSaveButton.click();
  }

  /** Call after openIssueTrackingSettings(). */
  async isTrackerEnabled(trackerName: string): Promise<boolean> {
    return this.trackerCheckbox(trackerName).isChecked();
  }
}
