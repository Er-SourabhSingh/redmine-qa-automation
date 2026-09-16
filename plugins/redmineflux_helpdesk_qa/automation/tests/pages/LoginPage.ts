import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Redmineflux's custom-skinned login screen (NOT the standard Redmine core
 * login form). Used by tests/auth.setup.ts to establish the per-role
 * sessions every other page object relies on.
 *
 * BUG FIX 2026-08-25: this page object previously targeted `#username` /
 * `#password` / `input[type="submit"][name="login"]` / `#loggedas` — the
 * standard Redmine core login form's markup. The real, live form (confirmed
 * repeatedly across multiple Forge instances this engagement, most recently
 * `flux-fwdq7ydhw49`) is a completely different custom form: heading
 * "Welcome to Redmineflux" / "Welcome Back", a Login textbox (placeholder
 * "Enter your email or username", accepts either username or email), a
 * Password textbox (placeholder "Enter your password", with a visible
 * show/hide toggle), a "Forgot password?" link, and a `<button>` labeled
 * "Login" (not an `<input type="submit">`). The old locators would have
 * matched nothing and thrown on first use — this was never actually
 * exercised via auth.setup.ts before now (every login this engagement was
 * driven by direct Playwright MCP interaction, not this page object).
 *
 * NOTE: a fresh admin/admin login on a brand-new Forge instance is always
 * followed by a forced "Change password" interstitial (confirmed every
 * rotation this engagement) — that is a one-time bootstrap step handled
 * manually per new instance (see QA_CREDENTIALS.md), not something
 * login() below accounts for. login() assumes the account's real, current
 * password is already known and passed in.
 *
 * BUG FIX 2026-09-14: the themed form above is provided by a DIFFERENT
 * plugin in the Redmineflux ecosystem (confirmed live: a single-plugin
 * fresh container with ONLY redmineflux_helpdesk installed — no
 * redmineflux_scarlet/gantt/checklist/etc. — falls back to Redmine's own
 * stock login form, plain "Login"/"Password" labels, no custom
 * placeholders). Every real target environment (Local redmine-docker-6,
 * Forge) runs the full ~11-plugin Redmineflux suite together and so always
 * has the themed form — but a genuinely fresh/minimal install might not,
 * so login() now detects whichever form is actually present rather than
 * assuming the themed one.
 */
export class LoginPage extends BasePage {
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly submitButton: Locator;
  private readonly loginErrorMessage: Locator;
  private readonly loggedAsIndicator: Locator;
  // Stock Redmine core login form fallback (real field ids, not accessible-name
  // based — the accessible name for the password field there is the awkward
  // "Password Lost password" since a "Lost password" link sits right next to it).
  private readonly stockUsernameInput: Locator;
  private readonly stockPasswordInput: Locator;
  private readonly stockSubmitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.getByPlaceholder('Enter your email or username');
    this.passwordInput = page.getByPlaceholder('Enter your password');
    this.submitButton = page.getByRole('button', { name: 'Login', exact: true });
    this.stockUsernameInput = page.locator('#username');
    this.stockPasswordInput = page.locator('#password');
    this.stockSubmitButton = page.locator('input[type="submit"][name="login"]');
    // NOT YET VERIFIED — no failed-login attempt has been driven through this
    // custom form yet this engagement (only successful logins observed).
    // Confirm/replace this locator the first time a real negative-login TC runs.
    this.loginErrorMessage = page.locator('#flash_error, .flash.error');
    // NOTE 2026-09-14: originally targeted the "Sign out" link (`a.logout`),
    // confirmed present in every successful login's own accessibility
    // snapshot — but the raw DOM query for it is flaky (resolved anywhere
    // from 0 to 8 matches across otherwise-identical successful logins,
    // presumably a responsive-header re-render/hydration transient this
    // theme goes through right after login). The one thing that's reliably
    // present exactly once in every case observed (Admin/Agent/Customer, all
    // 2026-09-14 automation runs) is the plain "Logged in as" text next to
    // the username — use that instead of chasing the header's own DOM churn.
    this.loggedAsIndicator = page.getByText('Logged in as');
  }

  /**
   * Reaches the login form. Prefers clicking "Sign in" from the home page
   * (matches what TC-HLP-060-style navigation tests actually exercise), but
   * this environment's current config (confirmed live 2026-09-14 on
   * localhost:3012, redmine-docker-6) redirects an anonymous goto('/')
   * straight to /login with no home page to click through at all — so fall
   * back to treating an already-on-/login landing as success rather than
   * failing waiting for a "Sign in" link that will never appear.
   */
  async open() {
    await this.goto('/');
    if (this.page.url().includes('/login')) return;
    await this.clickTopNav('Sign in');
  }

  async login(username: string, password: string) {
    await this.open();
    const themed = await this.usernameInput.isVisible().catch(() => false);
    if (themed) {
      await this.usernameInput.fill(username);
      await this.passwordInput.fill(password);
      await this.submitButton.click();
    } else {
      await this.stockUsernameInput.fill(username);
      await this.stockPasswordInput.fill(password);
      await this.stockSubmitButton.click();
    }
  }

  async assertLoggedIn() {
    await expect(this.loggedAsIndicator).toBeVisible();
  }

  async assertLoginFailed() {
    await expect(this.loginErrorMessage).toBeVisible();
  }
}
