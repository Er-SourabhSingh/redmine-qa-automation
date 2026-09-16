import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * A project's Settings › Members tab (/projects/:id/settings/members) and
 * the "New member" form (/projects/:id/memberships/new). Standard Redmine
 * core screens — used to reassign a seed user's role on the Helpdesk
 * project (e.g. Developer → QA, to grant an Agent persona a helpdesk
 * permission without touching the Developer role globally). Locators
 * verified against the live Forge instance on 2026-08-21.
 */
export class ProjectMembersPage extends BasePage {
  private readonly newMemberLink = this.page.getByRole('link', { name: 'New member' });
  private readonly principalSearchInput = this.page.locator('#principal_search');
  private readonly addButton = this.page.getByRole('button', { name: 'Add' });

  /** Real nav path (added 2026-08-25): land on the project, click its "Settings" tab, then the "Members" sub-tab (standard Redmine core project-settings tabs, not Helpdesk-specific — clickSettingsTab() is the same generic click-by-name helper either way). */
  async openList(projectIdentifier: string) {
    await this.goto(`/projects/${projectIdentifier}`);
    await this.clickProjectTab('Settings');
    await this.clickSettingsTab('Members');
  }

  /** Navigates to the Members list, then clicks "New member". */
  async openNewMemberForm(projectIdentifier: string) {
    await this.openList(projectIdentifier);
    await this.newMemberLink.click();
  }

  /**
   * Adds a user with one or more roles (checkbox labels, e.g. 'QA', 'Developer').
   *
   * BUG FIX 2026-09-14: the New member form renders EVERY eligible non-member
   * principal as a checkbox immediately on page load — confirmed live, all 25
   * (our fixture set fits on one unpaginated page) show up with no typing
   * required. The original code still filled `principalSearchInput` first,
   * which triggers Redmine's real (debounced) autocomplete AJAX call; that
   * call's response re-renders the checklist and REPLACES the checkbox DOM
   * node — sometimes arriving just after our own `.check()`, silently
   * discarding the selection before "Add" was ever clicked (no error, no
   * validation message — Redmine just adds nothing). Confirmed live: only 1
   * of 14 new agents added this way actually got a membership row. Since the
   * target user is already present in the default unfiltered list, checking
   * it directly (no search) avoids the race entirely. This assumes the
   * project's non-member list fits on one page — if it ever grows past that,
   * this will need real search-then-wait-for-settle logic instead.
   */
  async addMember(projectIdentifier: string, userDisplayName: string, roles: string[]) {
    await this.openNewMemberForm(projectIdentifier);
    await this.page.getByLabel(userDisplayName, { exact: false }).check();
    for (const role of roles) {
      await this.page.getByLabel(role, { exact: true }).check();
    }
    await this.addButton.click();
  }

  /**
   * Changes an existing member's role via the Members list row's "Edit"
   * link. Requires openList(projectIdentifier) to have been called first
   * (or call it via editMemberRoles's own navigation below) — real nav path
   * added 2026-08-25, replacing a direct goto(`/memberships/:id/edit`) that
   * required knowing an opaque, non-guessable membership ID up front.
   */
  async editMemberRoles(projectIdentifier: string, userDisplayName: string, roles: string[]) {
    await this.openList(projectIdentifier);
    await this.row(userDisplayName).getByRole('link', { name: 'Edit' }).click();
    // Uncheck all role checkboxes first, then check only the desired ones —
    // not yet verified whether the edit form pre-checks the current role(s);
    // confirm this the first time a real reassignment runs.
    for (const role of roles) {
      await this.page.getByLabel(role, { exact: true }).check();
    }
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  async assertMemberRow(userName: string, role: string) {
    await expect(this.row(userName)).toContainText(role);
  }

  /**
   * True if `userDisplayName` is already a project Member holding `role` —
   * provisioning's check-before-add (adding the same user+role combo twice
   * would either error or create a duplicate row depending on the plugin's
   * validation, so this must be checked first rather than assumed). Call
   * with a project identifier; navigates to the Members list itself.
   */
  async isMemberWithRole(projectIdentifier: string, userDisplayName: string, role: string): Promise<boolean> {
    await this.openList(projectIdentifier);
    const row = this.row(userDisplayName);
    if (!(await row.isVisible().catch(() => false))) return false;
    return row.locator(`text=${role}`).isVisible().catch(() => false);
  }
}
