import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * A project's Knowledgebase tab (/projects/:id/helpdesk/knowledgebase).
 * Locators verified against the live Forge instance on 2026-08-21 for the
 * empty-state chrome, and CONFIRMED LIVE on Local (redmine-docker-6) on
 * 2026-08-26 by actually creating and publishing a real article (TC-HLP-018)
 * — the article editor's title/body/action-button locators below are no
 * longer guesses.
 *
 * CORRECTION 2026-08-26: clicking the top-level "+" next to the "Knowledgebase"
 * heading does NOT open a distinct "New Space" modal as previously assumed —
 * it opens a simple "New Article" inline panel (just a Title field + Cancel/
 * Save), and saving it immediately creates and opens a real article
 * (`?page_id=N`). Oddly, the underlying DOM still reuses `#child-space-name`
 * as this panel's title input id — the plugin's "Space" and "Article"
 * concepts appear to share the same underlying create-child-node flow, not
 * two separate entities as the old comment below assumed. The `#space-name`/
 * `#create-space` modal fields still exist in the DOM (for a real top-level
 * "Space" distinct from an "Article" — not yet triggered/confirmed live) —
 * kept below, but unverified which real UI action opens that modal.
 *
 * Article body is a real Editor.js instance (`#contentEditor`), not a plain
 * textarea — type into its first block (`.ce-paragraph.cdx-block[contenteditable]`).
 * Confirmed toolbar block types: Text, Heading, List, Code, Quote, Delimiter,
 * Table, Image, Attachment, Raw HTML, Warning, Checklist — richer than the
 * ticket-reply Markdown toolbar (Strong/Italic/etc.), a different editor entirely.
 */
export class HelpdeskKnowledgebasePage extends BasePage {
  private readonly searchSpacesInput = this.page.locator('#search-spaces');
  private readonly searchContentInput = this.page.locator('#search-content');
  private readonly newArticleButton = this.page.locator('h5:has-text("Knowledgebase") img'); // the "+" icon next to the "Knowledgebase" heading — opens the New Article panel directly
  private readonly newArticleTitleInput = this.page.locator('#child-space-name'); // confirmed live 2026-08-26 despite the id name — this is the New Article panel's Title field
  private readonly newArticleSaveButton = this.page.getByRole('button', { name: 'Save', exact: true });
  /** @deprecated unverified live — kept in case a genuine top-level "Space" modal exists separately from New Article */
  private readonly newSpaceButton = this.page.locator('#new-object');
  private readonly spaceNameInput = this.page.locator('#space-name');
  private readonly createSpaceButton = this.page.locator('#create-space');
  private readonly cancelSpaceModalButton = this.page.locator('#close-add-modal');
  private readonly childSpaceNameInput = this.page.locator('#child-space-name');
  private readonly createChildSpaceButton = this.page.locator('#create-child');
  private readonly cancelChildModalButton = this.page.locator('#close-chid-modal');
  /** Confirmed live 2026-08-26 — Editor.js body editor container and its first editable block. */
  private readonly contentEditor = this.page.locator('#contentEditor');
  private readonly contentEditorFirstBlock = this.page.locator('#contentEditor .ce-paragraph.cdx-block');
  private readonly menuButton = this.page.locator('#menu-btn'); // confirmed live — an options/menu button on the article toolbar, not previously documented
  private readonly shareButton = this.page.locator('#share-btn');
  private readonly exportButton = this.page.locator('#export-btn');
  private readonly saveDraftButton = this.page.locator('#save-draft');
  private readonly publishButton = this.page.locator('#publish'); // same button relabels to "Republish" once already published — match by id, not text
  private readonly deleteButton = this.page.locator('#delete-button');
  private readonly deleteConfirmButton = this.page.locator('#delete-item');
  private readonly deleteCancelButton = this.page.locator('#cancel-delete-btn');

  /** Real nav path (added 2026-08-25): land on the project, click its "Helpdesk" tab, then "Knowledgebase" in the sub-nav. */
  async open(projectIdentifier: string) {
    await this.goto(`/projects/${projectIdentifier}`);
    await this.clickProjectTab('Helpdesk');
    await this.clickHelpdeskSubNav('Knowledgebase');
  }

  async searchSpaces(term: string) {
    await this.searchSpacesInput.fill(term);
  }

  async searchContent(term: string) {
    await this.searchContentInput.fill(term);
  }

  async createSpace(name: string) {
    await this.spaceNameInput.fill(name);
    await this.createSpaceButton.click();
  }

  async createChildSpace(name: string) {
    await this.childSpaceNameInput.fill(name);
    await this.createChildSpaceButton.click();
  }

  /** Confirmed live 2026-08-26 (TC-HLP-018) — the top-level "+" opens this panel directly, no separate Space step. */
  async createArticle(title: string) {
    await this.newArticleButton.click();
    await this.newArticleTitleInput.fill(title);
    await this.newArticleSaveButton.click();
  }

  /** Confirmed live 2026-08-26 — types into the Editor.js body's first block. */
  async fillBody(text: string) {
    await this.contentEditorFirstBlock.click();
    await this.contentEditorFirstBlock.fill(text);
  }

  async publish() {
    await this.publishButton.click();
  }

  async saveDraft() {
    await this.saveDraftButton.click();
  }

  async deleteCurrentItem() {
    await this.deleteButton.click();
    await this.deleteConfirmButton.click();
  }

  async share() {
    await this.shareButton.click();
  }

  async exportPdf() {
    await this.exportButton.click();
  }
}
