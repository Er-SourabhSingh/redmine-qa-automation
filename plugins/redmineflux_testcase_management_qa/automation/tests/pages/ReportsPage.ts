import { Download, Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export type ReportType =
  | 'Testcase Summary'
  | 'Defect Summary'
  | 'Activity Summary'
  | 'Tester Scorecard'
  | 'Requirement Coverage'
  | 'Overdue Run Summary';

export interface CreateReportOptions {
  name: string;
  type: ReportType;
  description?: string;
  /** Only for Activity Summary. */
  startDate?: string;
  endDate?: string;
  /** Only for Requirement Coverage. */
  requirementName?: string;
  /** Defaults to "Include all test run". */
  onlyTheseRuns?: string[];
  notifyEmails?: string[];
  emailFormat?: 'pdf' | 'html';
  schedule?: {
    interval: 'Every day' | 'Every week' | 'Every month';
    weekday?: string;
    day?: string;
    hour: string;
    minute: string;
  };
}

/**
 * `/projects/<id>/testcase_reports` (list + Scheduled Reports) and
 * `/projects/<id>/testcase_reports/new` (the New report form). Field
 * ids/names confirmed live 2026-10-05 via a direct-script DOM dump (not
 * guessed from the TC prose) — see TESTCASE_MANAGEMENT_MEMORY.md.
 *
 * Several fields are present in the DOM from first load but only become
 * *visible* after a triggering event fires (report-type change reveals
 * start/end date or the Requirement select; the notify_me checkbox reveals
 * the email fields; schedule_later reveals the interval/weekday/day/time
 * selects) — matches TC-TCM-081's own "Note for automation" that date fields
 * only render after the report-type change event fires. force:true is used
 * only on the few toggle controls that must be checked before their own
 * target becomes visible; everything after that uses plain visibility-gated
 * actions so a genuine reveal-logic regression would still fail loudly.
 */
export class ReportsPage extends BasePage {
  private readonly newReportLink: Locator;
  private readonly reportTypeSelect: Locator;
  private readonly nameInput: Locator;
  private readonly startDateInput: Locator;
  private readonly endDateInput: Locator;
  private readonly requirementSelect: Locator;
  private readonly includeAllRadio: Locator;
  private readonly includeFollowingRadio: Locator;
  private readonly notifyMeCheckbox: Locator;
  private readonly emailAddressesTextarea: Locator;
  private readonly emailAsPdfRadio: Locator;
  private readonly emailAsHtmlRadio: Locator;
  private readonly scheduleNowRadio: Locator;
  private readonly scheduleLaterRadio: Locator;
  private readonly scheduleIntervalSelect: Locator;
  private readonly scheduleWeekdaySelect: Locator;
  private readonly scheduleDaySelect: Locator;
  private readonly scheduleHourSelect: Locator;
  private readonly scheduleMinuteSelect: Locator;
  private readonly createButton: Locator;
  private readonly cancelButton: Locator;

  constructor(page: Page, private readonly projectId: string) {
    super(page);
    this.newReportLink = page.getByRole('link', { name: 'New report' });
    this.reportTypeSelect = page.locator('#testcase_report_report_type');
    this.nameInput = page.locator('#testcase_report_name');
    this.startDateInput = page.locator('#start_date');
    this.endDateInput = page.locator('#end_date');
    this.requirementSelect = page.locator('#testcase_report_requirement_id');
    this.includeAllRadio = page.locator('#custom_field_user_role_all');
    this.includeFollowingRadio = page.locator('#custom_field_user_role_following');
    this.notifyMeCheckbox = page.locator('#notify_me');
    // NAMING QUIRK (confirmed live): this field's real underlying name is
    // `testcase_report[email_message]`, but it is the EMAIL ADDRESSES box
    // ("Please enter one email address per line."), not a message body.
    this.emailAddressesTextarea = page.locator('#testcase_report_email_message');
    this.emailAsPdfRadio = page.locator('#email_as_pdf');
    this.emailAsHtmlRadio = page.locator('#email_as_html');
    this.scheduleNowRadio = page.locator('#schedule_now');
    this.scheduleLaterRadio = page.locator('#schedule_later');
    this.scheduleIntervalSelect = page.locator('#testcase_report_schedule_interval');
    this.scheduleWeekdaySelect = page.locator('#testcase_report_schedule_weekday');
    this.scheduleDaySelect = page.locator('#testcase_report_schedule_day');
    this.scheduleHourSelect = page.locator('#testcase_report_time_4i');
    this.scheduleMinuteSelect = page.locator('#testcase_report_time_5i');
    this.createButton = page.locator('input[name="commit"]');
    this.cancelButton = page.getByRole('link', { name: 'Cancel' });
  }

  async openList() {
    await this.goto(`/projects/${this.projectId}/testcase_reports`);
  }

  async openNew() {
    await this.openList();
    await this.newReportLink.click();
  }

  /** Fills the New report form without submitting — lets a TC inspect/assert mid-form state (e.g. TC-081's validation, TC-084's). */
  async fillForm(options: CreateReportOptions) {
    await this.reportTypeSelect.selectOption(options.type);
    if (options.name) await this.nameInput.fill(options.name);

    if (options.type === 'Activity Summary' && (options.startDate || options.endDate)) {
      await expect(this.startDateInput).toBeVisible();
      if (options.startDate) await this.startDateInput.fill(options.startDate);
      if (options.endDate) await this.endDateInput.fill(options.endDate);
    }

    if (options.type === 'Requirement Coverage' && options.requirementName) {
      await expect(this.requirementSelect).toBeVisible();
      await this.requirementSelect.selectOption({ label: options.requirementName });
    }

    if (options.onlyTheseRuns && options.onlyTheseRuns.length > 0) {
      await this.includeFollowingRadio.check({ force: true });
      for (const runName of options.onlyTheseRuns) {
        await this.page.getByRole('checkbox').locator('xpath=following-sibling::text()').first(); // no-op guard
        await this.page
          .locator('label', { hasText: runName })
          .locator('input[type="checkbox"]')
          .check({ force: true });
      }
    }

    if (options.notifyEmails && options.notifyEmails.length > 0) {
      await this.notifyMeCheckbox.check({ force: true });
      await expect(this.emailAddressesTextarea).toBeVisible();
      await this.emailAddressesTextarea.fill(options.notifyEmails.join('\n'));
      if (options.emailFormat === 'html') {
        await this.emailAsHtmlRadio.check({ force: true });
      } else {
        await this.emailAsPdfRadio.check({ force: true });
      }
    }

    if (options.schedule) {
      await this.scheduleLaterRadio.check({ force: true });
      await expect(this.scheduleIntervalSelect).toBeVisible();
      await this.scheduleIntervalSelect.selectOption(options.schedule.interval);
      if (options.schedule.interval === 'Every week' && options.schedule.weekday) {
        await this.scheduleWeekdaySelect.selectOption(options.schedule.weekday);
      }
      if (options.schedule.interval === 'Every month' && options.schedule.day) {
        await this.scheduleDaySelect.selectOption(options.schedule.day);
      }
      await this.scheduleHourSelect.selectOption(options.schedule.hour);
      await this.scheduleMinuteSelect.selectOption(options.schedule.minute);
    }
  }

  async submit() {
    await this.createButton.click();
  }

  /** Convenience: fill + submit in one call for the common case. */
  async createReport(options: CreateReportOptions) {
    await this.openNew();
    await this.fillForm(options);
    await this.submit();
  }

  async cancel() {
    await this.cancelButton.click();
  }

  async openReportByName(name: string) {
    await this.openList();
    await this.page.getByRole('link', { name, exact: true }).click();
  }

  async editReportByName(name: string) {
    await this.openList();
    await this.row(name).locator('a.icon-edit').click();
  }

  /**
   * "Delete" on a report row opens a custom in-page modal (`#delete_report`,
   * class `rf_testcase_management_modal`) — NOT a native browser confirm()
   * dialog, confirmed live via DOM dump (same custom-modal pattern this
   * plugin uses elsewhere, e.g. Test Suite's own delete confirmation). A
   * near-identical modal (`#schedule_delete_report`) exists for Scheduled
   * Reports and shares the same button value="Delete", so the confirm click
   * must be scoped to `#delete_report` specifically or Playwright throws a
   * strict-mode ambiguity error.
   */
  async deleteReportByName(name: string) {
    await this.openList();
    await this.row(name).locator('a.icon-del').click();
    await expect(this.page.locator('#delete_report')).toBeVisible();
    await this.page.locator('#delete_report input[name="commit"]').click();
    await this.page.waitForLoadState('networkidle');
  }

  async cancelDeleteReportByName(name: string) {
    await this.openList();
    await this.row(name).locator('a.icon-del').click();
    await expect(this.page.locator('#delete_report')).toBeVisible();
    // Two controls in this modal share onclick="closeDeleteReportModal()" — the
    // × close button and the actual "Cancel" button — scope to the Cancel
    // button's own class so the TC exercises the control a real user would.
    await this.page.locator('#delete_report .rf_testcase_management_modal_btn_cancel').click();
  }

  async assertReportListedInList(name: string) {
    await this.openList();
    await expect(this.page.getByRole('link', { name, exact: true })).toBeVisible();
  }

  async assertReportNotListed(name: string) {
    await this.openList();
    await expect(this.page.getByRole('link', { name, exact: true })).toHaveCount(0);
  }

  async assertValidationError(message: string) {
    await expect(this.page.getByText(message, { exact: false })).toBeVisible();
  }

  /** Must already be on an open report's detail page. */
  async downloadHtml(): Promise<Download> {
    await this.page.locator('#download-dropdown').click();
    await expect(this.page.locator('#download-menu')).toBeVisible();
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.locator('#download-html').click(),
    ]);
    return download;
  }

  async downloadPdf(): Promise<Download> {
    await this.page.locator('#download-dropdown').click();
    await expect(this.page.locator('#download-menu')).toBeVisible();
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.locator('#download-pdf').click(),
    ]);
    return download;
  }

  async downloadExcel(): Promise<Download> {
    await this.page.locator('#download-dropdown').click();
    await expect(this.page.locator('#download-menu')).toBeVisible();
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.locator('#download-excel').click(),
    ]);
    return download;
  }

  /**
   * The reports list page renders TWO separate tables: the main "Reports"
   * table (#, Name, Created/Updated By, Created At, Actions — Edit+Delete)
   * and, below it, a "Scheduled Reports" table (Name, Scheduled Time,
   * Frequency, Actions — Delete ONLY, no Edit) for any report that was
   * scheduled. A scheduled report's name therefore matches `tr` in BOTH
   * tables, so a bare `page.locator('tr', { hasText: name })` is a latent
   * strict-mode violation (confirmed live via TC-TCM-107's failure 2026-10-05
   * when pagination put both rows on the same page). Scope to the table
   * whose header row contains "FREQUENCY" — the resizer plugin's own
   * #JColResizer0/#JColResizer1 ids are assignment-order-based, not semantic.
   */
  scheduledReportsTable(): Locator {
    return this.page.locator('table').filter({ has: this.page.locator('th', { hasText: 'FREQUENCY' }) });
  }

  getScheduledRow(name: string): Locator {
    return this.scheduledReportsTable().locator('tr', { hasText: name });
  }

  /**
   * The ONLY exposed way to cancel a schedule is the Scheduled Reports row's
   * own Delete icon (`confirmDeleteScheduleReport`, posts to
   * `/cancel_scheduling/:id`) — confirmed live there is no Edit icon on a
   * Scheduled Reports row at all, so an edit-and-switch-to-"Right now"
   * approach cannot work. This removes the row from Scheduled Reports; the
   * underlying report itself is untouched and stays in the main Reports list.
   */
  async cancelScheduleByName(name: string) {
    await this.openList();
    await this.getScheduledRow(name).locator('a.icon-del').click();
    await expect(this.page.locator('#schedule_delete_report')).toBeVisible();
    await this.page.locator('#schedule_delete_report input[name="commit"]').click();
    await this.page.waitForLoadState('networkidle');
  }
}
