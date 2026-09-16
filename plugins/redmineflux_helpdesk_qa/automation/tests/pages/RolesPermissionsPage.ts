import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Administration › Roles and permissions (/roles, /roles/:id/edit,
 * /roles/permissions). Standard Redmine core screens, not Helpdesk-specific
 * UI — but needed by HELPDESK_PERMISSIONS.md to grant/revoke the 8 helpdesk
 * permissions per role. Locators verified against the live Forge instance
 * on 2026-08-21.
 *
 * The 8 helpdesk permission keys (role_permissions_<key> checkbox ids):
 *   view_helpdesk, manage_helpdesk, export_helpdesk_reports,
 *   manage_prepaid_support_hours, view_email_history, add_kb_page,
 *   edit_kb_page, delete_kb_page
 * NOTE: view_email_history (8th) is NOT documented in HELPDESK_USER_GUIDE.md
 * §20's permission table (only 7 are listed there) — confirmed live.
 */
export class HelpdeskPermissionKey {
  static readonly VIEW_HELPDESK = 'view_helpdesk';
  static readonly MANAGE_HELPDESK = 'manage_helpdesk';
  static readonly EXPORT_HELPDESK_REPORTS = 'export_helpdesk_reports';
  static readonly MANAGE_PREPAID_SUPPORT_HOURS = 'manage_prepaid_support_hours';
  static readonly VIEW_EMAIL_HISTORY = 'view_email_history';
  static readonly ADD_KB_PAGE = 'add_kb_page';
  static readonly EDIT_KB_PAGE = 'edit_kb_page';
  static readonly DELETE_KB_PAGE = 'delete_kb_page';
}

export class RolesPermissionsPage extends BasePage {
  private readonly saveButton = this.page.getByRole('button', { name: 'Save' });
  private readonly newRoleLink = this.page.getByRole('link', { name: 'New role' });
  private readonly nameInput = this.page.locator('#role_name');
  private readonly createButton = this.page.getByRole('button', { name: 'Create' });

  /** Real nav path (added 2026-08-25): top nav "Administration" → "Roles and permissions" in the admin sidebar. */
  async openRolesList() {
    await this.clickTopNav('Administration');
    await this.clickNavLink('Roles and permissions');
  }

  /** Navigates to the roles list, then clicks the named role's link. */
  async openRoleEdit(roleName: string) {
    await this.openRolesList();
    await this.page.getByRole('link', { name: roleName, exact: true }).click();
  }

  /** Navigates to the roles list, then clicks "Permissions report". */
  async openPermissionsReport() {
    await this.openRolesList();
    await this.page.getByRole('link', { name: 'Permissions report' }).click();
  }

  /** Call after openRoleEdit(). Permission key is one of HelpdeskPermissionKey's values. */
  async setPermission(permissionKey: string, granted: boolean) {
    const checkbox = this.page.locator(`#role_permissions_${permissionKey}`);
    if (granted) await checkbox.check();
    else await checkbox.uncheck();
  }

  async isPermissionGranted(permissionKey: string): Promise<boolean> {
    return this.page.locator(`#role_permissions_${permissionKey}`).isChecked();
  }

  async save() {
    await this.saveButton.click();
  }

  /**
   * Reads the permissions report matrix (/roles/permissions) for one
   * permission row, returning granted-state per role column in the order
   * the columns appear (this instance's order: Manager, Employee, Client,
   * Project Lead, QA, Team Lead, Developer, Non member, Anonymous — verify
   * order on each run since roles can be reordered).
   */
  async getPermissionRow(permissionLabel: string): Promise<boolean[]> {
    return this.row(permissionLabel).first().locator('input[type="checkbox"]')
      .evaluateAll(els => els.map(el => (el as HTMLInputElement).checked));
  }

  /** True if a role with this exact name already exists — provisioning's check-before-create. */
  async exists(roleName: string): Promise<boolean> {
    await this.openRolesList();
    return this.page.getByRole('link', { name: roleName, exact: true }).isVisible().catch(() => false);
  }

  /**
   * Creates a new role via /roles/new (confirmed live 2026-09-14: Name field
   * `#role_name`, an optional "Copy workflow from" select, then the same
   * per-module permission checkboxes as the edit form — including a
   * "Redmineflux Helpdesk" group with View/Manage helpdesk, Export helpdesk
   * reports, Manage prepaid support hours, View email history, and the 3 KB
   * article permissions). Does not set permissions itself — call
   * setPermission() + save() afterward, same as editing an existing role.
   */
  async createRole(options: { name: string; copyWorkflowFrom?: string }) {
    await this.openRolesList();
    await this.newRoleLink.click();
    await this.nameInput.fill(options.name);
    if (options.copyWorkflowFrom) {
      await this.page.getByLabel('Copy workflow from').selectOption({ label: options.copyWorkflowFrom });
    }
  }

  /** Call after createRole() and any setPermission() calls — submits the New role form. */
  async create() {
    await this.createButton.click();
  }
}
