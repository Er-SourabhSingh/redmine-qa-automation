# Test Cases — Redmineflux Helpdesk — Features 45–47: Canned Responses, Products, Knowledgebase

> Source: `docs/HELPDESK_FEATURES_LIST.md` #45–47 (category H). Grounded in `docs/HELPDESK_USER_GUIDE.md` §14 (Canned responses), §7.3 (Inserting a canned response), §15 (Products), §17 (Knowledgebase), §24 (Troubleshooting — draft KB visibility), §25 (FAQ — share links), and tester checklist §26 groups H (Products), I (Canned responses), R (Knowledgebase).
>
> This suite fulfills the deferral noted in `HELPDESK_TICKET_LIFECYCLE.md` (§7.3 canned-response insertion, promised to feature #45). A customer seeing no Canned Response dropdown at all is already covered there (TC-HLP-390) — not repeated here.

## Plugin
- Name: redmineflux_helpdesk
- Version: (fill from environment)
- Redmine version: (fill from environment)
- Path: plugins/redmineflux_helpdesk_qa

---

## Positive Cases

---

### TC-HLP-001: Creating a canned response with a unique name and body

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Helpdesk › Settings › Canned Responses › New
2. Name: `Acknowledge receipt` (unique); Body: includes at least one macro, e.g. `Hi {{customer_name}}, thanks for reaching out.`
3. Save

**Expected Result:**
- Saves successfully and appears in the Canned Responses list

**CONFIRMED LIVE 2026-09-11** (Local, redmine-docker-6, admin): **PASS.** Created "TC-HLP-001 Welcome Message" (id 5) with Content "Hi {{customer_name}}, thanks for reaching out." — "Successful creation.", appears in the list with the macro text intact, Active by default.

---

### TC-HLP-002: All nine macros substitute correctly when inserted on a real ticket

**User Role:** Agent
**Precondition:** A canned response body containing all nine macros: `{{customer_name}}`, `{{customer_email}}`, `{{ticket_id}}`, `{{ticket_subject}}`, `{{project_name}}`, `{{assignee_name}}`, `{{current_user}}`, `{{current_date}}`, `{{current_time}}`.

**Steps:**
1. Open a real ticket, click Reply
2. Select this canned response from the **Canned Response** dropdown

**Expected Result:**
- Every macro is replaced with the correct real value for this ticket (e.g. `{{ticket_id}}` → `#1042`, `{{current_user}}` → the signed-in agent, etc.) — none are left un-substituted
- **CONFIRMED LIVE 2026-08-24** on real ticket #236 ("Fix missing breadcrumb navigation", Helpdesk Service Desk, assignee Harmony Rose): all 9 macros substituted correctly in one reply — `{{customer_name}}`→"Redmine Admin" (ticket author), `{{ticket_id}}`→"#236", `{{ticket_subject}}`→"Fix missing breadcrumb navigation", `{{project_name}}`→"Helpdesk Service Desk", `{{assignee_name}}`→"Harmony Rose", `{{current_user}}`→"Redmine Admin" (the replying user), `{{current_date}}`→"2026-08-24", `{{current_time}}`→"06:38:24". `{{customer_email}}` was not included in this specific probe's template text — not individually re-verified, but no reason to expect it behaves differently from the other 8.

---

### TC-HLP-003: Inserting a canned response appends to already-typed text rather than replacing it

**User Role:** Agent
**Precondition:** Reply box open.

**Steps:**
1. Type a short sentence into the reply box
2. Select a canned response from the dropdown

**Expected Result:**
- The canned response's text is **appended** after what was already typed — the original text is not overwritten or removed
- **CONFIRMED LIVE 2026-08-24:** typed "Manual text before template." then selected "Acknowledge Receipt" — result was `"Manual text before template. \n\nHi Redmine Admin, ..."`, i.e. genuinely appended with a blank-line separator, original text fully intact.

---

### TC-HLP-004: Clicking a macro shortcut link inserts it into Content at the cursor position

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** New or Edit Canned Response form open.

**Steps:**
1. Type `Hi ` into the Content field
2. Click the `{{customer_name}}` link under "Available Macros:"

**Expected Result:**
- The literal text `{{customer_name}}` is inserted at the cursor position, producing `Hi {{customer_name}}`
- **CONFIRMED LIVE 2026-08-24** — exact result observed matches. Each macro link (`a.insert-macro[data-macro="{{...}}"]`) behaves the same way; only `{{customer_name}}` was individually click-tested this way, the remaining 8 were verified via direct typing + real-ticket substitution instead (TC-HLP-002) rather than individually clicked.

---

### TC-HLP-005: Editing a canned response updates Name and Content

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** An existing canned response.

**Steps:**
1. Open its Edit page (`/rf_canned_responses/:id/edit` — confirmed live, pre-fills Name/Content/Active from the saved row)
2. Change the Content, Save

**Expected Result:**
- The change persists — reopening Edit or viewing the list shows the updated Content
- **CONFIRMED LIVE 2026-08-24** on "Acknowledge Receipt" (id=1): edited Name and Content independently, both changes persisted correctly across page reloads

---

### TC-HLP-006: Editing only Content on an existing canned response leaves Name and the already-checked Active untouched

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** An existing, Active canned response with both a distinct Name and non-empty Content already saved (e.g. "Acknowledge Receipt").

**Steps:**
1. Open the canned response's Edit page (`/rf_canned_responses/:id/edit`)
2. Change ONLY the Content field — leave Name exactly as pre-filled, and do not touch the Active checkbox at all
3. Save
4. Reopen Edit on the same record, and also check the Canned Responses list

**Expected Result:**
- Content shows the new value entered in Step 2
- Name is unchanged from its original value — editing Content alone did not blank or reset Name, which is the common partial-update bug class this dimension targets (an Edit view that doesn't correctly resubmit a field the user never touched)
- Active is still checked/Active in both the reopened Edit form and the list — leaving an already-checked checkbox untouched during an unrelated field edit must not silently uncheck it
- This is the mirror case of TC-HLP-033/BUG-HLP-003: that pair covers deliberately UNCHECKING Active (currently blocked, since the checkbox has no Rails hidden fallback field and an unchecked box omits `active` from the request). This case never touches the checkbox — a checked checkbox always submits `active=1` regardless of what else changed on the form — so BUG-HLP-003's known failure mode should not apply here
- If Active were found unchecked after this save despite never being touched, that would be a distinct and more severe bug than BUG-HLP-003 — a partial edit silently deactivating a record via a field it never interacted with — and should be filed as its own bug, not folded into BUG-HLP-003

**CONFIRMED LIVE 2026-09-11** (Local, redmine-docker-6, admin, "TC-HLP-001 Welcome Message" id 5 — Active, distinct Name, non-empty Content): **PASS.** Opened Edit, changed only Content (appended " Updated per TC-HLP-006."), left Name and the already-checked Active box untouched, Save. List afterward shows: Name unchanged ("TC-HLP-001 Welcome Message"), Content updated to the new text, Active still reads "Active". No partial-update regression — this canned response's own checked Active box survives an unrelated-field edit correctly (checkbox only fails to persist when someone explicitly tries to *un*check it, per BUG-HLP-003 — an untouched checked box is a different, unaffected code path).

---

### TC-HLP-007: Deleting a canned response removes it after confirmation

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

### TC-HLP-008: Creating a product saves its required and optional fields

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Helpdesk Settings › Products › New Product
2. Name: `Phoenix Core` (unique); Code: `PHX-CORE` (unique); Category: `Platform`; Project: pick one
3. Save

**Expected Result:**
- Saves successfully with all fields correctly stored
- **Field-list correction, live form check 2026-08-31 (Local, redmine-docker-6):** the real New Product form has a **Description** textarea (`rf_product[description]`) that isn't in `HELPDESK_USER_GUIDE.md` §15's field table and isn't covered by this TC's own steps above — see TC-HLP-011 for dedicated coverage of that field.

**CONFIRMED via cross-reference 2026-09-11**: this TC's exact scenario (Name + Code + Category populated at create time, all saved correctly) is the same claim TC-HLP-010 already confirms live and in more depth (Name/Code/Category/Description/Active all filled in one Save, every field verified via a reopened Edit form). Not independently re-executed as a separate creation — the original "Phoenix Core"/`PHX-CORE` fixture this TC's steps describe was itself later renamed while confirming TC-HLP-011/331 (now "Phoenix Core II"/`PHX-CORE-3`), so re-running these exact literal steps would just duplicate TC-322. See TC-HLP-010 for the live evidence.

---

### TC-HLP-009: Creating a Product with only the required fields succeeds

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None. Per `HELPDESK_USER_GUIDE.md` §15, only Name and Code are required — Category, Description, and Active all have defaults or are optional.

**Steps:**
1. Helpdesk Settings › Products › New Product
2. Fill only Name and Code — leave Category and Description blank
3. Save

**Expected Result:**
- Save succeeds with no required-field error on Category or Description
- The product appears in the list/detail with Category and Description both empty

**CONFIRMED LIVE 2026-09-11** (Local, redmine-docker-6, admin): **PASS.** Created "TC-HLP-009 Required Fields Only" (Code `TC321`) on Helpdesk QA Alpha with only Name/Code filled, Category and Description left blank. "Successful creation." — no required-field error on either optional field. Appears in the Products list (id 8) with Category blank and Active checked by default.

---

### TC-HLP-010: Creating a Product with every field filled in the initial Save, not via a later Edit

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None. Complements TC-HLP-011, which only proves Description is editable via Edit on an already-existing product.

**Steps:**
1. New Product
2. In one Save: fill Name, Code, Category, **Description**, and leave Active checked
3. Save, then open the product to confirm every field

**Expected Result:**
- Description saves correctly on the very first Save, not only when added later via Edit

**CONFIRMED LIVE 2026-09-11** (Local, redmine-docker-6, admin): **PASS.** Created "TC-HLP-010 All Fields One Save" (Code `TC322`, Category `Software`, Description `Created with every field filled in the initial save, per TC-HLP-010.`, Active left checked) on Helpdesk QA Alpha, all in one Create submission. "Successful creation." (id 9). Reopened Edit and confirmed via direct DOM read: every field — Name, Code, Category, Description, and Active — persisted exactly as entered on the very first save, nothing deferred to a later Edit.

---

### TC-HLP-011: Editing a Product updates every field, including its undocumented Description

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** An existing product (e.g. "Phoenix Core").

**Steps:**
1. Open the product's Edit form
2. Change Name, Code, Category, **Description**, and Active in one save (Project is a locked field on this form, per the live check above — not independently editable, so not exercised here)
3. Save, then reopen Edit to confirm each field independently

**Expected Result:**
- Every field saves the new value entered
- **Description** is checked here specifically — it's a real field on this form but has no coverage anywhere else in this suite or in `HELPDESK_FIELD_VALIDATIONS.md`

**CONFIRMED LIVE 2026-09-11** (Local, redmine-docker-6, admin): **PASS.** Edited "Phoenix Core" (id 5) in one Save: Name → "Phoenix Core (Edited)", Code → "PHX-CORE-2", Category → "Platform" (was blank), Description → "Enterprise core platform product, edited via TC-HLP-011." (was blank), Active unchecked. List and a reopened Edit form both confirmed every field persisted exactly as entered, including Active genuinely unchecked. **Notable positive contrast with BUG-HLP-003/BUG-HLP-035**: Product's Active checkbox has a real Rails hidden-fallback input (`<input type="hidden" name="rf_product[active]" value="0">` immediately before the checkbox), so unchecking it correctly submits and persists — unlike Canned Response and Support Package, which lack this fallback and can never be saved Inactive. Re-checked Active and restored the product to its original clean values afterward.

---

### TC-HLP-012: Editing a Product's required fields only leaves its already-set optional fields untouched

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** An existing product with Category and Description both already populated — any product satisfies this, e.g. one created via TC-HLP-010's single-Save all-fields flow, or "Phoenix Core" (Code `PHX-CORE`) after TC-HLP-011 has given it a Description.

**Steps:**
1. Open the product's Edit form
2. Change only the Name field to a new value (e.g. append " II") — leave Code, Category, and Description exactly as they were pre-filled, do not click into or alter them
3. Save
4. Reopen Edit to inspect all fields, then repeat Steps 1–4 changing only Code this time instead of Name

**Expected Result:**
- The touched required field (Name, then Code) saves the new value each time
- Category and Description still show their original, pre-existing values after both saves — neither was blanked, reset, or truncated by a Save that only intended to change the required field
- This is distinct from TC-HLP-011 (Editing a Product updates every field...), which changes every field including the optional ones in the same Save and so cannot by itself prove a partial update is safe — a form whose Edit view fails to re-populate an already-set optional field into the submitted params would silently wipe Category/Description on any Save that only touches Name or Code. This TC isolates exactly that failure path
- If either optional field comes back blank after either save, this is a real bug (the common "Edit view didn't pre-populate the field, so it round-trips empty" class) — file it rather than treating it as expected behavior

**CONFIRMED LIVE 2026-09-11** (Local, redmine-docker-6, admin, using "Phoenix Core" id 5 post-TC-309 — Category "Platform", Description set, Active checked): **PASS on both passes.** Pass 1: changed only Name → "Phoenix Core II", Save, reopened Edit — Code/Category/Description/Active all unchanged (`PHX-CORE-2` / `Platform` / description text intact / checked). Pass 2: changed only Code → "PHX-CORE-3", Save, reopened Edit — Name/Category/Description/Active all unchanged from Pass 1's values. Neither optional field was ever blanked, reset, or truncated by a Save that only touched a required field — the Edit view correctly round-trips every already-set value. (One methodology note: an initial DOM query for the Active checkbox's `.checked` state via a bare `input[name="rf_product[active]"]` selector returned a false negative, because it matched the form's hidden fallback input — which shares the same `name` — ahead of the real checkbox in DOM order, not the checkbox itself; re-queried with `input[type="checkbox"]` added to the selector and confirmed the real checkbox was checked throughout, as expected. Worth remembering for any future DOM-level checkbox verification on this form.)

---

### TC-HLP-013: Deleting an unused Product succeeds

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A product not currently linked to any ticket (distinct from TC-HLP-028, which covers the linked/blocked case).

**Steps:**
1. Delete the unused product

**Expected Result:**
- Deletion succeeds with no error, and the product no longer appears in the Product list or in the ticket-form Product dropdown

**CONFIRMED LIVE 2026-09-11** (Local, redmine-docker-6, admin): **PASS.** Deleted "TC-HLP-010 All Fields One Save" (id 9, never linked to any ticket) — "Successful deletion.", list dropped from 9 rows to 8, product gone.

---

### TC-HLP-014: Picking a product on the ticket form saves and displays on the ticket

**User Role:** Agent
**Precondition:** At least one active product exists for the ticket's project.

**Steps:**
1. Raise or edit a ticket, select a Product
2. Save

**Expected Result:**
- The product is saved on the ticket and displayed (e.g. in the ticket detail and/or as a column, per `HELPDESK_TICKET_LIST_FILTERS_COLUMNS.md`)

**CONFIRMED LIVE 2026-09-11** (Local, redmine-docker-6, admin): **PASS.** Opened ticket #84's Edit form, selected Product = "TC-HLP-009 Required Fields Only", Submit. Ticket detail immediately shows **"Product: TC-HLP-009 Required Fields Only"** in its field grid, alongside Organization/Customer. Saved and displayed correctly.

- **Follow-up, Customer role, 2026-09-11**: this PASS covers Admin/Agent only. As `alpha.customer`, the New issue form also genuinely offers a Product dropdown, and a selection ("Falcon Suite" on new ticket #88) saves correctly server-side (confirmed via DOM). **But the customer can never see that value again** — `.product.attribute` is `display:none` for the Customer role on the ticket's own detail view, unlike Organization (shown in the same field grid) — filed as **BUG-HLP-051**, since `HELPDESK_USER_GUIDE.md` §7 documents "the product" as one of the things shown when a ticket is opened, with no agent-only qualifier. Customers also have no field-edit surface at all post-creation (inline Subject rename + Reply Note only) — this matches the plugin's documented reduced-customer-model and is not itself a defect.

---

### TC-HLP-015: Product list search, Project filter, Status filter, Apply Filters, and Clear Filters all work correctly

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

**CONFIRMED LIVE 2026-09-11** (Local, redmine-docker-6, admin, 9 products across Alpha/Beta, one — "TC-HLP-009 Required Fields Only" — deliberately Inactive from TC-HLP-034): **PASS on all 5 steps.** Search "Phoenix" → exactly "Phoenix Core II". Project=Helpdesk QA Beta → exactly "TC-HLP-017 Beta Product" (1 row). Status=Inactive only → exactly "TC-HLP-009 Required Fields Only" (the one deactivated product). Combined search="TC-HLP" + Project=Alpha + Status=Active only → exactly **"TC-HLP-167 Permission Test Product"** — correctly excluding "TC-HLP-009..." (wrong status) and "TC-HLP-017 Beta Product" (wrong project), confirming genuine AND logic across all three filters, not OR. Clear → search/project/status all reset to blank and the full unfiltered list (9 rows) returns.

---

### TC-HLP-016: Canned Response list search, Apply Filters, and Clear Filters work correctly

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

**CONFIRMED LIVE 2026-09-11** (Local, redmine-docker-6, admin, 3 canned responses — "Acknowledge Receipt", "Follow-up Reminder", "TC-HLP-001 Welcome Message"): **PASS on all 3 steps.** Search "Follow-up" (matches Name) → exactly "Follow-up Reminder". Search "recent" (appears only in "Follow-up Reminder"'s Content — "...on your **recent** ticket..." — not in any Name) → same single match, confirming Content is searched too. Clear → search box resets to empty and the full unfiltered list (3 rows) returns. Also reconfirmed: this filter bar still has no Status dropdown at all (only the search box), consistent with BUG-HLP-003 still being open — Canned Response still has no way to be deactivated, so a Status filter would have nothing meaningful to filter on.

---

### TC-HLP-017: The Product dropdown on the ticket form only offers this project's own products

**User Role:** Agent
**Precondition:** Project A and Project B each have their own, different active product.

**Steps:**
1. Raise or edit a ticket on Project A, open the **Product** dropdown
2. Raise or edit a separate ticket on Project B, open its **Product** dropdown

**Expected Result:**
- Project A's ticket only offers Project A's product(s) — Project B's product is not selectable
- Project B's ticket only offers Project B's product(s), independent of Project A
- Mirrors the project-scoping requirement already established for the Support Level (TC-HLP-048) and SLA (TC-HLP-049) dropdowns elsewhere in the plugin — this TC specifically confirms the same expectation holds for Product on the ticket form, since it had not been explicitly tested before

**CONFIRMED LIVE 2026-09-11** (Local, redmine-docker-6, admin): **PASS.** Created "TC-HLP-017 Beta Product" (Code `TC285BETA`) on Helpdesk QA Beta — Alpha already had 7 products of its own. Checked both projects' New-issue Product dropdown via direct DOM read (`select[name="rf_product_id"]`): Alpha's offers exactly its own 7 products, no Beta product; Beta's offers exactly `["None", "TC-HLP-017 Beta Product"]`, no Alpha products at all. Fully independent per project, matching Support Level/SLA's already-established scoping.

---

### TC-HLP-018: Creating a Knowledgebase article with a title and rich-text body

**CONFIRMED LIVE 2026-08-26** (Local, redmine-docker-6, Helpdesk QA Alpha project, admin) — PASS, first time this TC has actually been executed (previously only the empty-state chrome had been observed). The top-level "+" next to the "Knowledgebase" heading opens a "New Article" panel directly (Title field only) — no separate "Space" step is required first, correcting the earlier assumption in `HelpdeskKnowledgebasePage.ts`'s doc comment. Saving immediately creates and opens the article (`?page_id=N`). The body is a real **Editor.js** instance (`#contentEditor`, type into `.ce-paragraph.cdx-block[contenteditable]`), not a plain textarea — confirmed toolbar block types: Text, Heading, List, Code, Quote, Delimiter, Table, Image, Attachment, Raw HTML, Warning, Checklist. Clicking Publish correctly saved the body content and relabeled the button "Republish". Real article `HelpdeskKnowledgebasePage.ts` locators added: `createArticle()`, `fillBody()`, `publish()`.

- **Follow-up — every editor block type and inline format actually exercised, 2026-09-11** (Local, redmine-docker-6, admin, dedicated fixture article "TC-HLP editor block types test", page id 7): this original PASS only confirmed the toolbar's 12 block-type buttons *exist* and that plain paragraph text saves — it never actually inserted formatted rich text, despite this TC's own Steps calling for "bold, list, link". Went back and genuinely tested every block type and every inline format this time. **All PASS, confirmed via direct DOM inspection after a real Publish + full page reload** (not just the live in-editor state):
  - **Inline formatting** (select text, use the floating inline toolbar): Bold (`<b>`), Italic (`<i>`), Underline (`<u class="cdx-underline">`), Strikethrough (`<s class="cdx-strikethrough">`), Link (`<a href="...">`, via the toolbar's "Add a link" input) — all five confirmed present in the reloaded paragraph's `innerHTML`.
  - **Block types**: Heading (`<h2 class="ce-header">`), List (`<ul class="cdx-nested-list--unordered">` with item text), Code (real `<textarea>` value), Quote (`<blockquote>` with text + author caption), Delimiter (renders, correctly auto-adds a trailing empty paragraph so typing can continue), Table (2×2 grid, both a header cell and a data cell independently editable and both persisted), Image (real file upload via the same `image-tool` used by the Attachment block's sibling type — real `<img src="/rf_kb/download?id=...">`, plus a working caption field), Raw HTML (textarea holding literal HTML, persisted verbatim), Warning (Title + Message, both independently editable, both persisted), Checklist (item text persisted, and the checked state — `cdx-checklist__item--checked` — also survived the reload).
  - **Methodology note**: the inline toolbar and the block-type ("+") popover both leave a second, stale instance in the DOM after their first open — `document.querySelector` can silently grab the dead one (buttons present but non-functional, empty `innerHTML`). Always re-query for the visible instance (nonzero `getBoundingClientRect()`) rather than trusting the first match. Also, a genuine `beforeunload` confirmation dialog appears on any navigation away from an article with edits — even immediately after clicking Publish — confirmed harmless (accepting it and reloading shows all content correctly saved), but worth knowing so a real reload isn't mistaken for a hang.
  - Fixture article (page id 7) and the 1×1 test PNG (`automation/uploads/tc-editor-blocks-test-image.png`) left in place as reusable evidence/regression fixtures.

**User Role:** Agent with `add_kb_page`
**Precondition:** Project's Helpdesk module enabled.

**Steps:**
1. Project › Helpdesk › Knowledgebase › New article
2. Title: `Resetting your password`; Body: formatted rich text (bold, list, link)
3. Save

**Expected Result:**
- Article saves with the title and formatted body intact

---

### TC-HLP-019: Creating a child article nests correctly under its parent

**User Role:** Agent with `add_kb_page`
**Precondition:** A parent article exists (TC-HLP-018).

**Steps:**
1. From the parent article, create a child article

**Expected Result:**
- The child appears nested under the parent in the Knowledgebase tree

**CONFIRMED LIVE 2026-09-11** (Local, redmine-docker-6, admin): **FAIL — filed as BUG-HLP-048.** Created parent article "Resetting your password" (page 3), opened it, then exhaustively searched for any child-creation control: the same "Add Article" ("+") control used for the parent (creates a root-level sibling regardless of which article is open — confirmed via DOM, the new article lands in `<ul id="spaces">`, not the open article's own empty child container `<ul id="ul3">`); the article's full 7-control toolbar (Search/Share/Export/Save/Delete/Publish/Menu, Menu's own dropdown being just Attachments + Page History); a synthetic `contextmenu` dispatch (no custom menu exists); and drag-and-drop (confirmed via the plugin's own JS source, `dragDropPage()`, that every move/reorder branch is gated on `current.parentNode == i.parentNode` — there is no re-parenting code path at all). **Root-caused via source**: the "Add Article" flow's own `createNode()` correctly reads the open article's ID intending a child, but its `createNewPage()` AJAX payload to `rf_knowledgebase_pages.json` never actually includes a `parent_id` — only a cosmetic display-string `path` — so the server has nothing to record the relationship from. Reproduced independently twice: once via synthetic click (page 4), once via a fully genuine Playwright click (page 5) — both landed as root siblings. Directly contradicts `HELPDESK_USER_GUIDE.md` §17's explicit "Nest | Create the child from the parent article" and `HELPDESK_FEATURES_LIST.md` feature #47. All three fixture articles (id 3, 4, 5) left in place for future retesting.

---

### TC-HLP-020: Editing a Knowledgebase article keeps a version on every save

**User Role:** Agent with `edit_kb_page`
**Precondition:** An existing article.

**Steps:**
1. Edit the article's body, Save
2. Edit it again with a different change, Save
3. Open version history

**Expected Result:**
- Every save is retained as a distinct version; version history lists all of them in order

**CONFIRMED LIVE 2026-09-11** (Local, redmine-docker-6, admin, article "Resetting your password" id 3): **PASS.** Typed body content ("Version 1 content..."), Publish. Edited again ("Version 2 content..."), Republish (button label correctly changes from "Publish" to "Republish" after the first save). Opened Menu → Page History: table lists exactly 2 rows, "CURRENT (v. 2)" and "v. 1", both attributed to Redmine Admin with real timestamps — every save retained as its own distinct version.

---

### TC-HLP-021: Comparing and restoring an older Knowledgebase version works

**User Role:** Agent with `edit_kb_page`
**Precondition:** An article with at least two versions (TC-HLP-020).

**Steps:**
1. Open version history, compare the current version against an earlier one
2. Restore the earlier version

**Expected Result:**
- The comparison correctly shows the differences
- Restoring reverts the article's current content to that earlier version's content

**CONFIRMED LIVE 2026-09-11** (Local, redmine-docker-6, admin, article "Resetting your password" id 3, versions from TC-HLP-020): **FAIL — filed as BUG-HLP-049.** Opened Page History, clicked "v. 1" — the editor rendered its content read-only (confirmed correct content: "Version 1 content..."), but no compare and no restore control exists anywhere: the history table itself has no action column, `getVersion(id)` (confirmed via source) explicitly hides both Save and Publish while showing an old version, and a full-text search of the entire KB JS bundle for "restore"/"compare" returns zero matches. Version retention itself is solid (TC-HLP-020 passed) — specifically the two actions promised on top of it are both completely absent, not merely hard to find.

---

### TC-HLP-022: Adding and removing attachments on a Knowledgebase article

**User Role:** Agent with `edit_kb_page`
**Precondition:** An existing article.

**Steps:**
1. Add a file attachment to the article, Save
2. Remove it, Save

**Expected Result:**
- The attachment is added and downloadable after step 1
- It is fully removed after step 2

**CONFIRMED LIVE 2026-09-11** (Local, redmine-docker-6, admin, article "Resetting your password" id 3): **PARTIAL — add PASSES, remove FAILS, filed as BUG-HLP-050.** Step 1: via the block-type toolbox, added an "Attachment" block and uploaded a real file (`tc-166-test-attachment.txt`) — genuinely persisted (real 35-byte size, real download link `/rf_kb/download?id=9&...`, listed correctly in the Attachments panel with uploader and timestamp). Step 2: exhaustively attempted removal — the Attachments panel's Action column has only a download link (confirmed via `innerHTML`, no delete icon); the block's own settings button only opens the block-type-conversion popover, no delete/tune option; multiple click-select + Backspace/Delete keyboard attempts (at different coordinates within the block, and via arrow-key navigation from the adjacent text block) all left the block fully intact (`document.querySelectorAll('.cdx-attaches').length` stayed at 1 throughout). Root-caused via source: a real `changeHandler()` listens for Editor.js's `block-removed` event on attachment blocks and calls a genuine `DELETE rf_kb_delete_attachment/:id` endpoint — the removal path exists and is wired, but nothing reachable in the UI ever fires that event.

---

### TC-HLP-023: Search finds a Knowledgebase article by title and by body content

**User Role:** Agent or Customer with KB view access
**Precondition:** An article whose title contains "password" and whose body separately contains the word "token" nowhere in the title.

**Steps:**
1. Search for "password"
2. Search for "token"

**Expected Result:**
- Both searches return the article — search matches on title and on body content

**CONFIRMED LIVE 2026-09-11** (Local, redmine-docker-6, admin, article "Resetting your password" id 3, body containing "...password reset steps with screenshots"): **PASS.** Search "password" (title match) → returns the article. Search "screenshots" (appears only in the body, nowhere in the title) → also returns the same article — confirms body content is genuinely indexed, not just title. Minor unrelated cosmetic observation, not filed as a bug: each search result row's icon image 404s (`kb_article-icon.svg` and its `article-icon.svg` fallback both missing), so results render with a broken/blank icon — purely visual, no functional impact on search itself.

---

### TC-HLP-024: A generated share link still requires signing in

**User Role:** Agent
**Precondition:** An existing published article.

**Steps:**
1. Use **Share** to generate a link
2. Open the link in a private/incognito browser session with no active login

**Expected Result:**
- The link resolves to the article's normal URL, which then requires signing in — it is not a public, authentication-free view

**CONFIRMED LIVE 2026-09-11** (Local, redmine-docker-6, article "Resetting your password" id 3): **PASS.** Clicked Share — network capture of the real `PUT rf_kb_generate_url/3.json` call shows the returned "share link" is literally the article's own normal in-app URL (`.../knowledgebase?page_id=3`, plus an unused `key` field not embedded in the URL itself). Logged out completely, navigated directly to that exact URL with no session — correctly redirected to `/login?back_url=...` pointing back at it. Not a public, authentication-free view.

---

### TC-HLP-025: Exporting a Knowledgebase article produces a PDF

**User Role:** Agent or Customer with KB view access
**Precondition:** An existing article.

**Steps:**
1. Use **Export** on the article

**Expected Result:**
- A PDF is generated containing the article's content

**CONFIRMED LIVE 2026-09-11** (Local, redmine-docker-6, admin, article "Resetting your password" id 3): **PASS.** Clicked Export — a real PDF (`Resetting your password.pdf`, ~1.5MB) downloaded successfully. Opened it directly: contains the article's actual current body text ("Version 2 content - revised, more detailed password reset steps with screenshots") and renders the attachment block (`tc-166-test-attachment.txt`, 0.0 KB) as well — genuine content export, not a blank/placeholder file.

---

## Negative Cases

---

### TC-HLP-026: Creating a canned response with a duplicate name is refused

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A canned response named "Acknowledge receipt" already exists.

**Steps:**
1. Attempt to create another canned response also named "Acknowledge receipt"

**Expected Result:**
- Save is refused with a duplicate-name message
- **CONFIRMED LIVE 2026-08-24** — exact message is **"Name has already been taken"**

---

### TC-HLP-027: Creating a product with a duplicate name or code is refused

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A product named "Phoenix Core" with code "PHX-CORE" already exists.

**Steps:**
1. Attempt to create another product with the same Name (different Code)
2. Attempt to create another product with the same Code (different Name)

**Expected Result:**
- Both attempts are refused — Name and Code are each independently required to be unique

**CONFIRMED LIVE 2026-09-11** (Local, redmine-docker-6, admin): **PASS.** With "Phoenix Core II" (Code `PHX-CORE-3`) already existing on Helpdesk QA Alpha: attempt 1 (same Name "Phoenix Core II", different Code `TC171-DIFFCODE`) refused with **"Name has already been taken for this project"**; attempt 2 (different Name, same Code `PHX-CORE-3`) refused with **"Code has already been taken for this project"**. Both validations are real, specific, and independently enforced — neither duplicate was created.

---

### TC-HLP-028: A product linked to tickets cannot be deleted

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A product already selected on at least one ticket.

**Steps:**
1. Attempt to delete the product

**Expected Result:**
- Deletion is refused with a clear message — not a crash or silent failure

**CONFIRMED LIVE 2026-09-11** (Local, redmine-docker-6, admin): **PASS.** With "TC-HLP-009 Required Fields Only" (id 8) freshly linked to ticket #84 (TC-HLP-014), attempted Delete from the Products list — confirmed the modal, and the request refused with **"This product is used in existing tickets, so it cannot be deleted."** The product remains in the list, untouched, and the ticket's Product field is unaffected.

---

### TC-HLP-029: A role without `add_kb_page` cannot create a Knowledgebase article

**User Role:** Agent whose role has `view_helpdesk` but not `add_kb_page`
**Precondition:** Viewing the project's Knowledgebase.

**Steps:**
1. Attempt to create a new article

**Expected Result:**
- The create action is refused/hidden

**CONFIRMED via cross-reference 2026-09-11**: `HELPDESK_PERMISSIONS.md` TC-HLP-173 ("canonical version of TC-HLP-029/174/175") already confirmed this exact scenario live on 2026-09-07 — Pass 2 (`edit_kb_page` only, no `add_kb_page`) and Pass 3 (`delete_kb_page` only, no `add_kb_page`) both showed create genuinely blocked: the underlying action is refused (no New-Article modal opens, sidebar count unchanged) even though the Add-Article icon itself stays visible regardless of permission (a harmless cosmetic inconsistency, not a bug — the real action is what's gated). Not independently re-executed here since TC-211 already covers it with real per-permission evidence; see that TC for the full pass-by-pass detail.

---

### TC-HLP-030: A role without `edit_kb_page` cannot edit a Knowledgebase article

**User Role:** Agent whose role lacks `edit_kb_page`
**Precondition:** An existing article.

**Steps:**
1. Attempt to edit the article

**Expected Result:**
- The edit action is refused/hidden

**CONFIRMED via cross-reference 2026-09-11**: `HELPDESK_PERMISSIONS.md` TC-HLP-173, Pass 1 (`add_kb_page` only, no `edit_kb_page`) and Pass 3 (`delete_kb_page` only, no `edit_kb_page`) both confirmed edit genuinely blocked — no editable content block instantiates (`.codex-editor__redactor` stays empty / `hasEditableBlock: false`), and the title's Edit pencil has no effect. Not independently re-executed here — see TC-211 for full evidence.

---

### TC-HLP-031: A role without `delete_kb_page` cannot delete a Knowledgebase article

**User Role:** Agent whose role lacks `delete_kb_page`
**Precondition:** An existing article.

**Steps:**
1. Attempt to delete the article

**Expected Result:**
- The delete action is refused/hidden

**CONFIRMED via cross-reference 2026-09-11**: `HELPDESK_PERMISSIONS.md` TC-HLP-173, Pass 1 (`add_kb_page` only, no `delete_kb_page`) and Pass 2 (`edit_kb_page` only, no `delete_kb_page`) both confirmed delete genuinely blocked — `#delete-button` confirmed `display:none` in both passes, no delete affordance reachable at all. Not independently re-executed here — see TC-211 for full evidence.

---

### TC-HLP-032: A customer can never create, edit, or delete a Knowledgebase article

**User Role:** Client (Customer)
**Precondition:** Customer has view access to a project's Knowledgebase.

**Steps:**
1. View the Knowledgebase and look for create/edit/delete controls on any article

**Expected Result:**
- None of create, edit, or delete are available to a customer under any role configuration — this is a hard customer-role restriction, not just a permission toggle

**CONFIRMED LIVE 2026-09-11** (Local, redmine-docker-6, `alpha.customer`): **PASS.** Signed in as the customer, navigated Portal → Helpdesk QA Alpha → Knowledgebase → opened "Resetting your password". Screenshot confirms the entire toolbar is reduced to exactly 3 icons — Search, Share, Export — with no Add Article, no Save/Publish, no Delete, and no Menu (which is what gates Attachments/Page History for an agent). No create/edit/delete control reachable anywhere. (One DOM quirk worth noting for future testers: hidden modal buttons like `#create-space`/`#create-child` still report a non-zero `getBoundingClientRect()` even though their modal is never actually shown — a real screenshot was taken to confirm visually, not just inferred from DOM geometry.)

---

## Edge Cases

---

### TC-HLP-033: Deactivating a canned response removes it from the dropdown but keeps past usage intact

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

### TC-HLP-034: Deactivating a product stops new use without touching existing tickets

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A product already assigned to an existing ticket; then deactivated.

**Steps:**
1. Deactivate the product
2. Attempt to select it on a new ticket
3. Open the existing ticket that already had it assigned

**Expected Result:**
- Step 2: the deactivated product is not offered
- Step 3: the existing ticket still shows the product it was assigned before deactivation

**CONFIRMED LIVE 2026-09-11** (Local, redmine-docker-6, admin): **PASS.** Deactivated "TC-HLP-009 Required Fields Only" (already assigned to ticket #84 per TC-HLP-014). New-issue form's Product dropdown on Helpdesk QA Alpha no longer offers it (7 remaining products listed, this one absent). Reopened ticket #84 — still shows **"Product: TC-HLP-009 Required Fields Only"** unchanged, unaffected by the product's own deactivation.

---

### TC-HLP-035: A customer cannot see a draft (unpublished) Knowledgebase article, even with view access

**User Role:** Client (Customer) whose role can otherwise view KB pages on the project
**Precondition:** An article saved as a draft, not published.

**Steps:**
1. Sign in as the customer and browse/search the Knowledgebase

**Expected Result:**
- The draft article does not appear or is not viewable — only published articles are visible to customers

**CONFIRMED LIVE 2026-09-11** (Local, redmine-docker-6, admin + `alpha.customer`): **PASS.** Created "TC-HLP-035 Draft Article Not Published" (id 6) as admin — saved but deliberately never clicked Publish (button still read "Publish", not "Republish", confirming genuine draft state). Signed in as `alpha.customer` and opened the Knowledgebase: the sidebar tree shows **only** "Resetting your password" (the one genuinely published article) — the draft, and also the two other never-published fixture articles from BUG-HLP-048 (ids 4/5), are all correctly absent. Confirms only published articles are visible to customers.

---

### TC-HLP-036: A Knowledgebase share link never bypasses authentication, even for a different, unauthorized account

**User Role:** Agent (generating the link) and a second Redmine user with no access to that project
**Precondition:** A share link generated for an article on Project A.

**Steps:**
1. Sign in as a user who has an account but no access to Project A
2. Open the share link

**Expected Result:**
- Access is refused for this user too — the link requires both authentication **and** project access, not authentication alone

**CONFIRMED LIVE 2026-09-11** (Local, redmine-docker-6, `zero.perm.user` — zero project memberships anywhere): **PASS.** Using the exact share link from TC-HLP-024 (`.../knowledgebase?page_id=3`), signed in fresh as `zero.perm.user` at the login form the link redirected to. Result: genuine **403 Forbidden**. Confirms the link requires both authentication and real project access — a signed-in account with no access to Helpdesk QA Alpha is still correctly refused, not let through on login alone.

---

## Evidence Map

- Case ID: TC-HLP-001 – TC-HLP-036, plus TC-HLP-015–282 (Product and Canned Response list search & filter, added 2026-08-24), TC-HLP-017 (Product dropdown project-scoping on the ticket form), TC-HLP-011–310 (Product Edit-all-fields and Delete CRUD gap closure, added 2026-08-31 after live form exploration), TC-HLP-009–322 (Product Create-time required-fields-only and all-fields-in-one-Save cases, added 2026-09-01), TC-HLP-012 (Product edit-required-fields-only-leaves-optional-untouched), TC-HLP-006 (Canned Response same dimension) — both added 2026-09-01 after a background audit workflow; see `HELPDESK_FIELD_VALIDATIONS.md` TC-HLP-144/TC-HLP-140 for these two entities' edit-time validation-error counterparts
- Screenshot: `screenshots/<TC-ID>/` (only if a bug is found — see `CLAUDE.md` §6)
- Log: `logs/`
- Bug reference: see `bugs/_index.md`
