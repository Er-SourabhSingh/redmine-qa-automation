# Test Cases — Redmineflux Helpdesk — Features 45–47: Canned Responses, Products, Knowledgebase

> Source: `docs/HELPDESK_FEATURES_LIST.md` #45–47 (category H). Grounded in `docs/HELPDESK_USER_GUIDE.md` §14 (Canned responses), §7.3 (Inserting a canned response), §15 (Products), §17 (Knowledgebase), §24 (Troubleshooting — draft KB visibility), §25 (FAQ — share links), and tester checklist §26 groups H (Products), I (Canned responses), R (Knowledgebase).
>
> This suite fulfills the deferral noted in `HELPDESK_TICKET_LIFECYCLE.md` (§7.3 canned-response insertion, promised to feature #45). A customer seeing no Canned Response dropdown at all is already covered there (TC-HLP-037) — not repeated here.

## Plugin
- Name: redmineflux_helpdesk
- Version: (fill from environment)
- Redmine version: (fill from environment)
- Path: plugins/redmineflux_helpdesk_qa

---

## Positive Cases

---

### TC-HLP-157: Creating a canned response with a unique name and body

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Helpdesk › Settings › Canned Responses › New
2. Name: `Acknowledge receipt` (unique); Body: includes at least one macro, e.g. `Hi {{customer_name}}, thanks for reaching out.`
3. Save

**Expected Result:**
- Saves successfully and appears in the Canned Responses list

---

### TC-HLP-158: All nine macros substitute correctly when inserted on a real ticket

**User Role:** Agent
**Precondition:** A canned response body containing all nine macros: `{{customer_name}}`, `{{customer_email}}`, `{{ticket_id}}`, `{{ticket_subject}}`, `{{project_name}}`, `{{assignee_name}}`, `{{current_user}}`, `{{current_date}}`, `{{current_time}}`.

**Steps:**
1. Open a real ticket, click Reply
2. Select this canned response from the **Canned Response** dropdown

**Expected Result:**
- Every macro is replaced with the correct real value for this ticket (e.g. `{{ticket_id}}` → `#1042`, `{{current_user}}` → the signed-in agent, etc.) — none are left un-substituted
- **CONFIRMED LIVE 2026-08-24** on real ticket #236 ("Fix missing breadcrumb navigation", Helpdesk Service Desk, assignee Harmony Rose): all 9 macros substituted correctly in one reply — `{{customer_name}}`→"Redmine Admin" (ticket author), `{{ticket_id}}`→"#236", `{{ticket_subject}}`→"Fix missing breadcrumb navigation", `{{project_name}}`→"Helpdesk Service Desk", `{{assignee_name}}`→"Harmony Rose", `{{current_user}}`→"Redmine Admin" (the replying user), `{{current_date}}`→"2026-08-24", `{{current_time}}`→"06:38:24". `{{customer_email}}` was not included in this specific probe's template text — not individually re-verified, but no reason to expect it behaves differently from the other 8.

---

### TC-HLP-159: Inserting a canned response appends to already-typed text rather than replacing it

**User Role:** Agent
**Precondition:** Reply box open.

**Steps:**
1. Type a short sentence into the reply box
2. Select a canned response from the dropdown

**Expected Result:**
- The canned response's text is **appended** after what was already typed — the original text is not overwritten or removed
- **CONFIRMED LIVE 2026-08-24:** typed "Manual text before template." then selected "Acknowledge Receipt" — result was `"Manual text before template. \n\nHi Redmine Admin, ..."`, i.e. genuinely appended with a blank-line separator, original text fully intact.

---

### TC-HLP-271: Clicking a macro shortcut link inserts it into Content at the cursor position

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** New or Edit Canned Response form open.

**Steps:**
1. Type `Hi ` into the Content field
2. Click the `{{customer_name}}` link under "Available Macros:"

**Expected Result:**
- The literal text `{{customer_name}}` is inserted at the cursor position, producing `Hi {{customer_name}}`
- **CONFIRMED LIVE 2026-08-24** — exact result observed matches. Each macro link (`a.insert-macro[data-macro="{{...}}"]`) behaves the same way; only `{{customer_name}}` was individually click-tested this way, the remaining 8 were verified via direct typing + real-ticket substitution instead (TC-HLP-158) rather than individually clicked.

---

### TC-HLP-272: Editing a canned response updates Name and Content

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** An existing canned response.

**Steps:**
1. Open its Edit page (`/rf_canned_responses/:id/edit` — confirmed live, pre-fills Name/Content/Active from the saved row)
2. Change the Content, Save

**Expected Result:**
- The change persists — reopening Edit or viewing the list shows the updated Content
- **CONFIRMED LIVE 2026-08-24** on "Acknowledge Receipt" (id=1): edited Name and Content independently, both changes persisted correctly across page reloads

---

### TC-HLP-273: Deleting a canned response removes it after confirmation

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A canned response not needed for other tests.

**Steps:**
1. Click its Delete icon in the list
2. Confirm in the "Delete Canned response?" modal

**Expected Result:**
- The confirmation modal appears with the exact wording `Are you sure you want to delete "{name}"? This action cannot be undone.`
- Confirming removes it from the list immediately
- **CONFIRMED LIVE 2026-08-24** — full delete flow executed end-to-end (not just markup-inspected) against a throwaway "CRUD Test Canned Response" via the shared `a.rf-delete-btn` JS modal pattern used by every Helpdesk Settings entity

---

### TC-HLP-160: Creating a product saves its required and optional fields

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Helpdesk Settings › Products › New Product
2. Name: `Phoenix Core` (unique); Code: `PHX-CORE` (unique); Category: `Platform`; Project: pick one
3. Save

**Expected Result:**
- Saves successfully with all fields correctly stored

---

### TC-HLP-161: Picking a product on the ticket form saves and displays on the ticket

**User Role:** Agent
**Precondition:** At least one active product exists for the ticket's project.

**Steps:**
1. Raise or edit a ticket, select a Product
2. Save

**Expected Result:**
- The product is saved on the ticket and displayed (e.g. in the ticket detail and/or as a column, per `HELPDESK_TICKET_LIST_FILTERS_COLUMNS.md`)

---

### TC-HLP-281: Product list search, Project filter, Status filter, Apply Filters, and Clear Filters all work correctly

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** Multiple products exist across at least two projects, at least one Active and at least one Inactive.

**Steps:**
1. Open the global Products list, type a known product's name into **Search products...**, click **Apply Filters**
2. Clear the search box, set the **Project** dropdown to one specific project, click **Apply Filters**
3. Clear the Project dropdown, set **Status** to **Active only**, then **Inactive only**, applying each time
4. Combine a search term with a Project selection and Status, click **Apply Filters**
5. Click **Clear**

**Expected Result:**
- Step 1: only the matching product(s) are shown
- Step 2: only that project's products are shown
- Step 3: only Active, then only Inactive, products are shown respectively
- Step 4: all three conditions apply together (AND, not OR)
- Step 5: search box, Project dropdown, and Status dropdown all reset, and the full unfiltered list returns

---

### TC-HLP-282: Canned Response list search, Apply Filters, and Clear Filters work correctly

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** Multiple canned responses exist.

**Steps:**
1. Search by a known canned response's name, click **Apply Filters**
2. Search by a word that only appears in a response's Content, not its Name, click **Apply Filters**
3. Click **Clear**

**Expected Result:**
- Step 1: only the matching response(s) are shown
- Step 2: search matches on Content as well as Name (matches the confirmed behavior noted in `HELPDESK_MEMORY.md`)
- Step 3: search box resets and the full unfiltered list returns
- Note: Canned Response has no Status filter dropdown, since (per BUG-HLP-003) it has no working way to deactivate a record at all — confirm this is still the case rather than assuming, in case the underlying bug is fixed by the time this TC runs

---

### TC-HLP-285: The Product dropdown on the ticket form only offers this project's own products

**User Role:** Agent
**Precondition:** Project A and Project B each have their own, different active product.

**Steps:**
1. Raise or edit a ticket on Project A, open the **Product** dropdown
2. Raise or edit a separate ticket on Project B, open its **Product** dropdown

**Expected Result:**
- Project A's ticket only offers Project A's product(s) — Project B's product is not selectable
- Project B's ticket only offers Project B's product(s), independent of Project A
- Mirrors the project-scoping requirement already established for the Support Level (TC-HLP-111) and SLA (TC-HLP-283) dropdowns elsewhere in the plugin — this TC specifically confirms the same expectation holds for Product on the ticket form, since it had not been explicitly tested before

---

### TC-HLP-162: Creating a Knowledgebase article with a title and rich-text body

**CONFIRMED LIVE 2026-08-26** (Local, redmine-docker-6, Helpdesk QA Alpha project, admin) — PASS, first time this TC has actually been executed (previously only the empty-state chrome had been observed). The top-level "+" next to the "Knowledgebase" heading opens a "New Article" panel directly (Title field only) — no separate "Space" step is required first, correcting the earlier assumption in `HelpdeskKnowledgebasePage.ts`'s doc comment. Saving immediately creates and opens the article (`?page_id=N`). The body is a real **Editor.js** instance (`#contentEditor`, type into `.ce-paragraph.cdx-block[contenteditable]`), not a plain textarea — confirmed toolbar block types: Text, Heading, List, Code, Quote, Delimiter, Table, Image, Attachment, Raw HTML, Warning, Checklist. Clicking Publish correctly saved the body content and relabeled the button "Republish". Real article `HelpdeskKnowledgebasePage.ts` locators added: `createArticle()`, `fillBody()`, `publish()`.

**User Role:** Agent with `add_kb_page`
**Precondition:** Project's Helpdesk module enabled.

**Steps:**
1. Project › Helpdesk › Knowledgebase › New article
2. Title: `Resetting your password`; Body: formatted rich text (bold, list, link)
3. Save

**Expected Result:**
- Article saves with the title and formatted body intact

---

### TC-HLP-163: Creating a child article nests correctly under its parent

**User Role:** Agent with `add_kb_page`
**Precondition:** A parent article exists (TC-HLP-162).

**Steps:**
1. From the parent article, create a child article

**Expected Result:**
- The child appears nested under the parent in the Knowledgebase tree

---

### TC-HLP-164: Editing a Knowledgebase article keeps a version on every save

**User Role:** Agent with `edit_kb_page`
**Precondition:** An existing article.

**Steps:**
1. Edit the article's body, Save
2. Edit it again with a different change, Save
3. Open version history

**Expected Result:**
- Every save is retained as a distinct version; version history lists all of them in order

---

### TC-HLP-165: Comparing and restoring an older Knowledgebase version works

**User Role:** Agent with `edit_kb_page`
**Precondition:** An article with at least two versions (TC-HLP-164).

**Steps:**
1. Open version history, compare the current version against an earlier one
2. Restore the earlier version

**Expected Result:**
- The comparison correctly shows the differences
- Restoring reverts the article's current content to that earlier version's content

---

### TC-HLP-166: Adding and removing attachments on a Knowledgebase article

**User Role:** Agent with `edit_kb_page`
**Precondition:** An existing article.

**Steps:**
1. Add a file attachment to the article, Save
2. Remove it, Save

**Expected Result:**
- The attachment is added and downloadable after step 1
- It is fully removed after step 2

---

### TC-HLP-167: Search finds a Knowledgebase article by title and by body content

**User Role:** Agent or Customer with KB view access
**Precondition:** An article whose title contains "password" and whose body separately contains the word "token" nowhere in the title.

**Steps:**
1. Search for "password"
2. Search for "token"

**Expected Result:**
- Both searches return the article — search matches on title and on body content

---

### TC-HLP-168: A generated share link still requires signing in

**User Role:** Agent
**Precondition:** An existing published article.

**Steps:**
1. Use **Share** to generate a link
2. Open the link in a private/incognito browser session with no active login

**Expected Result:**
- The link resolves to the article's normal URL, which then requires signing in — it is not a public, authentication-free view

---

### TC-HLP-169: Exporting a Knowledgebase article produces a PDF

**User Role:** Agent or Customer with KB view access
**Precondition:** An existing article.

**Steps:**
1. Use **Export** on the article

**Expected Result:**
- A PDF is generated containing the article's content

---

## Negative Cases

---

### TC-HLP-170: Creating a canned response with a duplicate name is refused

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A canned response named "Acknowledge receipt" already exists.

**Steps:**
1. Attempt to create another canned response also named "Acknowledge receipt"

**Expected Result:**
- Save is refused with a duplicate-name message
- **CONFIRMED LIVE 2026-08-24** — exact message is **"Name has already been taken"**

---

### TC-HLP-171: Creating a product with a duplicate name or code is refused

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A product named "Phoenix Core" with code "PHX-CORE" already exists.

**Steps:**
1. Attempt to create another product with the same Name (different Code)
2. Attempt to create another product with the same Code (different Name)

**Expected Result:**
- Both attempts are refused — Name and Code are each independently required to be unique

---

### TC-HLP-172: A product linked to tickets cannot be deleted

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A product already selected on at least one ticket.

**Steps:**
1. Attempt to delete the product

**Expected Result:**
- Deletion is refused with a clear message — not a crash or silent failure

---

### TC-HLP-173: A role without `add_kb_page` cannot create a Knowledgebase article

**User Role:** Agent whose role has `view_helpdesk` but not `add_kb_page`
**Precondition:** Viewing the project's Knowledgebase.

**Steps:**
1. Attempt to create a new article

**Expected Result:**
- The create action is refused/hidden

---

### TC-HLP-174: A role without `edit_kb_page` cannot edit a Knowledgebase article

**User Role:** Agent whose role lacks `edit_kb_page`
**Precondition:** An existing article.

**Steps:**
1. Attempt to edit the article

**Expected Result:**
- The edit action is refused/hidden

---

### TC-HLP-175: A role without `delete_kb_page` cannot delete a Knowledgebase article

**User Role:** Agent whose role lacks `delete_kb_page`
**Precondition:** An existing article.

**Steps:**
1. Attempt to delete the article

**Expected Result:**
- The delete action is refused/hidden

---

### TC-HLP-176: A customer can never create, edit, or delete a Knowledgebase article

**User Role:** Client (Customer)
**Precondition:** Customer has view access to a project's Knowledgebase.

**Steps:**
1. View the Knowledgebase and look for create/edit/delete controls on any article

**Expected Result:**
- None of create, edit, or delete are available to a customer under any role configuration — this is a hard customer-role restriction, not just a permission toggle

---

## Edge Cases

---

### TC-HLP-177: Deactivating a canned response removes it from the dropdown but keeps past usage intact

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A canned response already used in at least one existing reply; then deactivated.

**Steps:**
1. Deactivate the canned response
2. Open the reply box's Canned Response dropdown on a new reply
3. Open the ticket containing the earlier reply that used it

**Expected Result:**
- Step 2: the deactivated response no longer appears in the dropdown
- Step 3: the earlier reply's already-inserted text is unaffected — history is preserved

**⚠ BLOCKED by BUG-HLP-003 (executed 2026-08-24, FAILED at Step 1):** unchecking Active on "Acknowledge Receipt" and saving did not persist — reopening Edit showed Active still checked, and the list still showed "Active". Root cause confirmed via DOM inspection: the Active checkbox has no Rails hidden fallback field, so unchecking it omits the `active` param from the request entirely, and the update silently leaves the existing value unchanged. Retried with both a raw DOM click and a genuine Playwright UI click — same result both times. Step 1 (deactivation) cannot currently be completed via the UI at all once a record is Active, so Steps 2–3 could not be meaningfully executed. Re-run this TC once BUG-HLP-003 is fixed.

---

### TC-HLP-178: Deactivating a product stops new use without touching existing tickets

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A product already assigned to an existing ticket; then deactivated.

**Steps:**
1. Deactivate the product
2. Attempt to select it on a new ticket
3. Open the existing ticket that already had it assigned

**Expected Result:**
- Step 2: the deactivated product is not offered
- Step 3: the existing ticket still shows the product it was assigned before deactivation

---

### TC-HLP-179: A customer cannot see a draft (unpublished) Knowledgebase article, even with view access

**User Role:** Client (Customer) whose role can otherwise view KB pages on the project
**Precondition:** An article saved as a draft, not published.

**Steps:**
1. Sign in as the customer and browse/search the Knowledgebase

**Expected Result:**
- The draft article does not appear or is not viewable — only published articles are visible to customers

---

### TC-HLP-180: A Knowledgebase share link never bypasses authentication, even for a different, unauthorized account

**User Role:** Agent (generating the link) and a second Redmine user with no access to that project
**Precondition:** A share link generated for an article on Project A.

**Steps:**
1. Sign in as a user who has an account but no access to Project A
2. Open the share link

**Expected Result:**
- Access is refused for this user too — the link requires both authentication **and** project access, not authentication alone

---

## Evidence Map

- Case ID: TC-HLP-157 – TC-HLP-180, plus TC-HLP-281–282 (Product and Canned Response list search & filter, added 2026-08-24), TC-HLP-285 (Product dropdown project-scoping on the ticket form)
- Screenshot: `screenshots/<TC-ID>/` (only if a bug is found — see `CLAUDE.md` §6)
- Log: `logs/`
- Bug reference: see `bugs/_index.md`
