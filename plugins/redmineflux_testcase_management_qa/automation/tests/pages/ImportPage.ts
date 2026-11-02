import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { StepPair, squash } from '../../utilities/csv';

export interface PreviewRow {
  n: number;
  subject: string;
  status: 'OK' | 'Warning' | 'Error';
  /** Text of every error + warning line shown in the row's detail panel. */
  details: string[];
}

export interface Preview {
  ok: number;
  warnings: number;
  errors: number;
  rows: PreviewRow[];
}

export interface WizardOptions {
  encoding?: 'UTF-8' | 'ISO-8859-1' | 'Windows-1252';
  separator?: ',' | ';';
}

/**
 * The plugin's 4-step CSV import wizard (Project → TestCases → Import Testcases):
 * 1 upload + settings → 2 column mapping → 3 value mapping → 4 preview/confirm.
 * Selectors confirmed against app/views/testcase_import/step1..4.html.erb and perform_import.html.erb.
 */
export class ImportPage extends BasePage {
  private readonly stepLabel: Locator;
  private readonly flashError: Locator;

  constructor(page: Page, private readonly projectId: string) {
    super(page);
    this.stepLabel = page.locator('.step_text');
    this.flashError = page.locator('#flash_error, .flash.error');
  }

  async openStep1() {
    await this.goto(`/projects/${this.projectId}/testcase_import/step1`);
    await expect(this.stepLabel).toHaveText('Step(1/4)');
  }

  /** Uploads on step 1 and presses Next. Lands on step 2, or back on step 1 with a flash error. */
  async upload(file: string, opts: WizardOptions = {}) {
    await this.openStep1();
    await this.page.locator('input[type=file]').setInputFiles(file);
    if (opts.separator) await this.page.locator('select[name="field_separator"]').selectOption(opts.separator);
    if (opts.encoding) await this.page.locator('select[name="encoding"]').selectOption(opts.encoding);
    await this.next();
  }

  private async next() {
    await this.page.getByRole('button', { name: /^Next/ }).click();
  }

  async stepText(): Promise<string> {
    return (await this.stepLabel.first().textContent())?.trim() ?? '';
  }

  async flashErrorText(): Promise<string> {
    await expect(this.flashError.first()).toBeVisible();
    return squash((await this.flashError.first().textContent()) ?? '');
  }

  /** Step 2 — text of the duplicate-header notice, or '' when there is none. */
  async duplicateHeaderNotice(): Promise<string> {
    const notice = this.page.getByText(/Duplicate column names found/);
    return (await notice.count()) ? squash((await notice.first().textContent()) ?? '') : '';
  }

  /** Accepts the auto-mapped columns (step 2) and the default value mapping (step 3), landing on step 4. */
  async acceptMappingsToPreview() {
    await expect(this.stepLabel).toHaveText('Step(2/4)');
    await this.next();
    await expect(this.stepLabel).toHaveText('Step(3/4)');
    await this.next();
    await expect(this.stepLabel).toHaveText('Step(4/4)');
  }

  async readPreview(): Promise<Preview> {
    const num = async (sel: string) => Number((await this.page.locator(sel).first().textContent())?.trim());
    const ok = await num('.first_p .green_text');
    const warnings = await num('.preview_data .yellow_text');
    const errors = await num('.preview_data .red_text');
    const rows = await this.page.locator('tr.preview-row').evaluateAll((trs) =>
      trs.map((tr) => {
        const detail = tr.nextElementSibling as HTMLElement | null;
        const badge = tr.querySelector('.status-badge')?.textContent?.trim() as 'OK' | 'Warning' | 'Error';
        return {
          n: Number(tr.children[0].textContent?.trim()),
          subject: tr.querySelector('.preview-subject')?.getAttribute('title') ?? '',
          status: badge,
          details: detail ? Array.from(detail.querySelectorAll('li')).map((li) => (li.textContent ?? '').trim()) : [],
        };
      })
    );
    return { ok, warnings, errors, rows };
  }

  /** Upload → mappings → step 4, returning the preview without confirming. */
  async previewOf(file: string, opts: WizardOptions = {}): Promise<Preview> {
    await this.upload(file, opts);
    await this.acceptMappingsToPreview();
    return this.readPreview();
  }

  /** Presses Import on step 4 and waits for the progress page to finish and redirect to the suites list. */
  async confirmImport() {
    await this.page.getByRole('link', { name: 'Import', exact: true }).click();
    await this.page.waitForURL(/\/test_suites/, { timeout: 240_000 });
  }

  /** Issues of the project whose subject contains `tag`, as {id, subject}. */
  async findCreated(tag: string): Promise<{ id: number; subject: string }[]> {
    const out: { id: number; subject: string }[] = [];
    for (let pageNo = 1; ; pageNo++) {
      await this.goto(
        `/projects/${this.projectId}/issues?set_filter=1&status_id=*&f[]=subject&op[subject]=~&v[subject][]=${encodeURIComponent(tag)}&c[]=subject&per_page=100&page=${pageNo}`
      );
      const found = await this.page.locator('table.issues td.subject a').evaluateAll((as) =>
        as.map((a) => ({ id: Number((a.getAttribute('href') ?? '').split('/').pop()), subject: (a.textContent ?? '').trim() }))
      );
      out.push(...found);
      if (found.length < 100) break;
    }
    return out;
  }

  /** Saved Step N / Expected Result pairs shown on the test case's own page, in display order. */
  async readSteps(issueId: number): Promise<StepPair[]> {
    await this.goto(`/issues/${issueId}`);
    return this.page.locator('#content .splitcontent').evaluateAll((blocks) =>
      blocks
        .map((b) => {
          const labels = Array.from(b.querySelectorAll('.label')).map((l) => (l.textContent ?? '').trim());
          const values = Array.from(b.querySelectorAll('.value')).map((v) => ((v as HTMLElement).innerText ?? '').replace(/\s+/g, ' ').trim());
          return { labels, values };
        })
        .filter((b) => /^Step \d+:/.test(b.labels[0] ?? '') && /^Expected Result/.test(b.labels[1] ?? ''))
        .map((b) => ({ step: b.values[0], expected: b.values[1] }))
    );
  }
}
