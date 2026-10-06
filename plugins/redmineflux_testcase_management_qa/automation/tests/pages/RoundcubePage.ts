import { Page, expect } from '@playwright/test';

/**
 * Local Docker mail stack's Roundcube webmail (see root MEMORY.md
 * `reference_docker_mail_server.md`) — `http://127.0.0.1:8081/`, domain
 * `test.local`, shared password `Test@12345` for every `*@test.local`
 * account. Only reachable for a Redmine instance on this same machine
 * (localhost:3010 qualifies — confirmed reachable from this host).
 *
 * Opened in its OWN browser context/page (never the same page as the
 * Redmine session under test), since it's a separate origin entirely.
 */
export class RoundcubePage {
  constructor(private readonly page: Page) {}

  async login(email: string, password = 'Test@12345') {
    await this.page.goto('http://127.0.0.1:8081/');
    await this.page.getByLabel('Username').fill(email);
    await this.page.getByLabel('Password', { exact: true }).fill(password);
    await this.page.getByRole('button', { name: 'Login' }).click();
    // #layout-sidebar and #mailboxlist both genuinely exist on a real login
    // (confirmed live) — a combined OR selector resolves to 2 elements and
    // throws a strict-mode error. #mailboxlist alone is unique.
    await expect(this.page.locator('#mailboxlist')).toBeVisible({ timeout: 15000 });
  }

  /** Opens the Inbox and refreshes it (Roundcube doesn't always auto-poll fast enough for a just-sent mail). */
  async refreshInbox() {
    const refreshBtn = this.page.getByRole('button', { name: /refresh|check for new messages/i });
    if (await refreshBtn.isVisible().catch(() => false)) {
      await refreshBtn.click();
    } else {
      await this.page.reload();
    }
    await this.page.waitForLoadState('networkidle');
  }

  /** Polls the inbox for a message with this exact subject, up to timeoutMs. */
  async waitForMessageWithSubject(subject: string, timeoutMs = 30_000): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      await this.refreshInbox();
      const found = await this.page.getByText(subject, { exact: false }).first().isVisible().catch(() => false);
      if (found) return true;
      await this.page.waitForTimeout(3000);
    }
    return false;
  }

  async openMessageWithSubject(subject: string) {
    await this.page.getByText(subject, { exact: false }).first().click();
    // The click only selects the row — the preview pane's iframe then loads
    // the message asynchronously (confirmed live: a screenshot taken right
    // after the click still showed the pane's "Loading..." spinner, so an
    // immediate getAttachmentNames() read an empty, not-yet-rendered frame).
    // Wait for real message content (the subject, rendered inside the frame)
    // before returning control to the caller.
    await expect(this.messageFrame().getByText(subject, { exact: false }).first()).toBeVisible({ timeout: 15_000 });
  }

  async countMessagesWithSubject(subject: string): Promise<number> {
    await this.refreshInbox();
    return this.page.getByText(subject, { exact: false }).count();
  }

  /**
   * The opened message (preview pane) renders inside `iframe[name=
   * "messagecontframe"]`, not the main page — confirmed live the attachment
   * link (`a.filename`, e.g. "report-name.html(~656 KB)") only exists inside
   * that frame. A bare `this.page.locator(...)` for it always returns empty.
   */
  private messageFrame() {
    return this.page.frameLocator('iframe[name="messagecontframe"]');
  }

  /** Reads the names of all attachments on the currently-open message. */
  async getAttachmentNames(): Promise<string[]> {
    const names = await this.messageFrame().locator('a.filename').allTextContents();
    return names.map(n => n.trim()).filter(Boolean);
  }

  async getMessageBodyText(): Promise<string> {
    return this.messageFrame().locator('body').innerText();
  }
}
