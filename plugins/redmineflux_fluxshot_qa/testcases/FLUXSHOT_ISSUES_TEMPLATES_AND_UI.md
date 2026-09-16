# Test Cases — Fluxshot — Add/Update Issue, Templates, Appearance & Permissions

> Source: vendor KB — "Capture a Screenshot and Add a New Issue", "Update an Existing Issue", "Use Templates",
> "Use the Rich Description Editor", "Switch Dark Mode", "Change Color Theme", "Resize the Sidebar",
> Troubleshooting ("Issues not loading in Update Issue tab"), FAQ on templates and personalisation.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Fluxshot Chrome Extension + `redmineflux_fluxshot`
- Version: (record both at execution time)
- Path: plugins/redmineflux_fluxshot_qa

## Methodology

Issue and template behaviour is **server-side** — verify every created or updated issue on its Redmine page, not
only by the extension's success toast. Appearance behaviour is **browser-side** and verified by persistence across
sessions.

---

## Functional Cases — Add Issue

---

### TC-FSX-401: Create an issue with all fields

**User Role:** Logged-in member with issue-create rights
**Steps:**
1. On the **Add Issue** tab set Project, Tracker, Subject, Description, Assignee and a parent Issue; click
   **Save**.
2. Open the created issue in Redmine.

**Expected Result:**
- The issue exists with exactly those values, the screenshot is attached, and a toast showed the issue number.
- The editor tab closes, per the KB.

---

### TC-FSX-402: Subject is required

**User Role:** Logged-in member
**Steps:**
1. Attempt to save with the Subject blank.

**Expected Result:**
- Refused with a clear message; nothing is created.

---

### TC-FSX-403: Project dropdown lists accessible projects

**User Role:** Member of two projects out of several
**Steps:**
1. Open the Project dropdown and compare it against the projects the user can see in Redmine.

**Expected Result:**
- Exactly the user's accessible projects — no more (see TC-FSX-903 for the endpoint check).

---

### TC-FSX-404: Tracker list matches the project

**User Role:** Logged-in member
**Steps:**
1. Select a project and check the trackers offered; switch project and re-check.

**Expected Result:**
- Only trackers enabled for that project. Switching the project refreshes the list.

---

### TC-FSX-405: Assignee list matches the project

**User Role:** Logged-in member
**Steps:**
1. Open the Assignee dropdown for a project.

**Expected Result:**
- Only users assignable in that project — not every account on the instance.

---

### TC-FSX-406: Parent issue creates a sub-issue

**User Role:** Logged-in member
**Steps:**
1. Choose a parent issue and save; open the result in Redmine.

**Expected Result:**
- The new issue is a child of the chosen parent.

---

### TC-FSX-407: Required custom fields

**User Role:** Logged-in member
**Preconditions:** The tracker has required custom fields the extension form does not collect.
**Steps:**
1. Attempt to create an issue on that tracker.

**Expected Result:**
- Either the fields are collected, or creation is refused with a message naming them.
- **The extension must not create issues that Redmine's own form would reject.** Such records surface later as
  unsaveable issues and are a High-severity data-integrity defect — and the extension is an easy path to them,
  since it submits through the API with a reduced field set.

---

### TC-FSX-408: Save & Open navigates to the issue

**User Role:** Logged-in member
**Steps:**
1. Use **Save & Open**.

**Expected Result:**
- The issue is created and the browser navigates to its Redmine page.

---

### TC-FSX-409: Creation failure is reported

**User Role:** Logged-in member
**Steps:**
1. Take the network offline, or revoke the user's create permission, then attempt to save.

**Expected Result:**
- A visible error and **the editor stays open with the annotated screenshot intact**, so the work is not lost.
- Silently closing the tab on failure would discard the user's annotation effort along with the issue.

---

## Functional Cases — Update Issue

---

### TC-FSX-410: Update an existing issue

**User Role:** Logged-in member with edit rights
**Steps:**
1. On the **Update Issue** tab select Project, Tracker and an Issue; adjust the pre-filled Subject/Description;
   click **Update**.
2. Open the issue in Redmine.

**Expected Result:**
- The screenshot is attached, the changes are saved, and the change is journaled like any normal edit.

---

### TC-FSX-411: Fields pre-fill from the selected issue

**User Role:** Logged-in member
**Steps:**
1. Select an issue and inspect Subject and Description.

**Expected Result:**
- Both pre-fill with the issue's current values and remain editable.
- **Confirm the existing description is preserved rather than replaced by an empty field** — submitting a blank
  description over a populated one would silently destroy the issue's content.

---

### TC-FSX-412: The issue dropdown is searchable and shows ID and subject

**User Role:** Logged-in member
**Steps:**
1. Type into the Issues dropdown.

**Expected Result:**
- It filters as you type and each entry shows the issue ID and subject, per the KB.

---

### TC-FSX-413: Tracker filters the issue list

**User Role:** Logged-in member
**Steps:**
1. Change the Tracker and observe the Issues dropdown.

**Expected Result:**
- Only issues of that tracker are offered.

---

### TC-FSX-414: Non-admins see only issues assigned to them

**User Role:** A non-admin member
**Steps:**
1. Compare the Issues dropdown against the project's full issue list.

**Expected Result:**
- Only issues **assigned to this user** appear, exactly as the KB states.
- Record this as intended behaviour — it is also the KB's documented explanation for "issues not loading", so
  an empty dropdown may be correct rather than broken.

---

### TC-FSX-415: Update & Open navigates to the issue

**User Role:** Logged-in member
**Steps:**
1. Use **Update & Open**.

**Expected Result:**
- The issue updates and the browser navigates to it.

---

### TC-FSX-416: Update failure is reported

**User Role:** Logged-in member
**Steps:**
1. Attempt to update an issue the user cannot edit, or with the network offline.

**Expected Result:**
- A clear error, the editor stays open, and **no partial update** — the attachment must not land on an issue whose
  field changes were rejected.

---

## Functional Cases — Rich description editor

---

### TC-FSX-417: All formatting controls work

**User Role:** Logged-in member
**Steps:**
1. In the Description field apply H1, H2, bold, italic, underline, a bullet list, a numbered list and a link.

**Expected Result:**
- All eight documented controls work in the editor.

---

### TC-FSX-418: Formatting renders correctly in Redmine

**User Role:** Logged-in member
**Steps:**
1. Create an issue with all of that formatting and open it in Redmine.

**Expected Result:**
- Headings, emphasis, lists and the link render as formatted content, **not as visible raw markup**.
- The KB states descriptions are saved as Redmine-compatible Markdown; this case verifies the conversion actually
  survives the round trip, which is where cross-system formatting usually breaks.

---

### TC-FSX-419: Underline in Markdown

**User Role:** Logged-in member
**Steps:**
1. Apply underline and inspect the rendered issue.

**Expected Result:**
- Record the result. Markdown has no native underline, so this control is the most likely of the eight to produce
  raw markup or be silently dropped — worth checking specifically rather than as part of a general formatting pass.

---

### TC-FSX-420: Special characters and injection

**User Role:** Logged-in member
**Steps:**
1. Enter a script tag, HTML markup and Markdown metacharacters in the Subject and Description; create the issue
   and view it in Redmine as another user.

**Expected Result:**
- Rendered as literal text by Redmine's own sanitiser. **No script executes.**
- Confirm the extension does not bypass Redmine's normal content handling by submitting pre-rendered HTML.

---

## Functional Cases — Templates

---

### TC-FSX-501: Create a template

**User Role:** Logged-in member
**Steps:**
1. Templates tab → name, subject, description → **Create**.

**Expected Result:**
- The template card appears below the form and persists across sessions.

---

### TC-FSX-502: Use a template to pre-fill

**User Role:** Logged-in member
**Steps:**
1. On Add Issue, select the template from the dropdown.

**Expected Result:**
- Subject and Description pre-fill with its values, including formatting, and remain editable.

---

### TC-FSX-503: Edit a template

**User Role:** Logged-in member
**Steps:**
1. Click the pencil (✏) icon, change the values, click **Update**.

**Expected Result:**
- The form pre-fills with existing values and the changes persist.
- **Issues previously created from it are unaffected** — a template is a starting point, not a live link.

---

### TC-FSX-504: Delete a template with confirmation

**User Role:** Logged-in member
**Steps:**
1. Click the trash (🗑) icon.

**Expected Result:**
- A confirmation modal appears **naming the template**, per the KB. Confirming removes it; cancelling keeps it.

---

### TC-FSX-505: Template validation

**User Role:** Logged-in member
**Steps:**
1. Create templates with a blank name, a blank subject, a duplicate name and a 500-character name.

**Expected Result:**
- Blank name is rejected — an unnamed card cannot be chosen from the dropdown.
- Long values do not break the card layout.

---

### TC-FSX-506: Several templates coexist

**User Role:** Logged-in member
**Steps:**
1. Create three templates and switch between them on the Add Issue tab.

**Expected Result:**
- Each pre-fills its own values, with no bleed between them.

---

### TC-FSX-507: Templates persist across devices

**User Role:** Logged-in member
**Steps:**
1. Log in on a second browser or machine and open the Templates tab.

**Expected Result:**
- The same templates appear — they are stored server-side in `fluxshot_templates`, not locally.

---

### TC-FSX-508: Templates are private to their owner

**User Role:** Two members
**Steps:**
1. User A creates a template; user B opens the Templates tab.

**Expected Result:**
- B sees only their own templates, per the KB's explicit privacy claim. The endpoint check is TC-FSX-902.

---

## Functional Cases — Appearance

---

### TC-FSX-601: Dark mode applies throughout

**User Role:** Logged-in member
**Steps:**
1. ⚙ → toggle **Dark Mode** on, and inspect forms, dropdowns, buttons, modals and toast notifications.

**Expected Result:**
- All of them switch to the dark theme, per the KB's list.
- **Text stays legible everywhere** — a modal or toast left in light styling on a dark background is the typical
  gap, and it is worth checking each of the five element types named rather than glancing at the sidebar.

---

### TC-FSX-602: Dark mode persists

**User Role:** Logged-in member
**Steps:**
1. Close and reopen the editor, and restart Chrome.

**Expected Result:**
- The preference is restored.

---

### TC-FSX-603: Dark mode does not affect the screenshot

**User Role:** Logged-in member
**Steps:**
1. Capture and submit with dark mode on.

**Expected Result:**
- The screenshot and its annotations are unchanged — the theme is UI chrome only.

---

### TC-FSX-604: All five accent colours apply

**User Role:** Logged-in member
**Steps:**
1. Apply Blue, Purple, Green, Orange and Rose in turn.

**Expected Result:**
- Each applies instantly to buttons, active tab indicators, focus rings, links and form borders, per the KB.
- **Focus rings stay visible** in every theme — losing the focus indicator makes the sidebar unusable by keyboard.

---

### TC-FSX-605: Accent colour persists

**User Role:** Logged-in member
**Steps:**
1. Reopen the editor after restarting Chrome.

**Expected Result:**
- The chosen colour is restored.

---

### TC-FSX-606: Accent colour works with dark mode

**User Role:** Logged-in member
**Steps:**
1. Combine each accent colour with dark mode.

**Expected Result:**
- All five combinations remain legible, with adequate contrast between accent elements and the dark background.

---

### TC-FSX-607: Resize the sidebar

**User Role:** Logged-in member
**Steps:**
1. Drag the sidebar's left edge wider and narrower.

**Expected Result:**
- The cursor changes to a resize cursor, the sidebar resizes, and **Painterro reflows to fill the remaining
  space** rather than being clipped or overlapped.

---

### TC-FSX-608: Width limits are enforced

**User Role:** Logged-in member
**Steps:**
1. Drag beyond both extremes.

**Expected Result:**
- The width is clamped to **260 px minimum and 520 px maximum**, per the KB. The sidebar never becomes unusable
  and never swallows the annotation area.

---

### TC-FSX-609: Width persists

**User Role:** Logged-in member
**Steps:**
1. Resize, close the editor, and reopen.

**Expected Result:**
- The chosen width is restored.

---

### TC-FSX-610: Form usability at the minimum width

**User Role:** Logged-in member
**Steps:**
1. At 260 px, complete a full Add Issue flow including the rich text toolbar and the dropdowns.

**Expected Result:**
- Every control remains reachable and usable. A toolbar that wraps into unusability at the documented minimum is
  a real defect, since the plugin itself allows that width.

---

## Negative Cases — permissions and visibility

---

### TC-FSX-901: Issue creation follows the user's own Redmine permissions

**User Role:** A member without issue-create rights on a project
**Steps:**
1. Check whether the project appears in the dropdown.
2. Send the create request **directly** to the plugin's API naming that project.

**Expected Result:**
- Refused at the endpoint with 403 — the extension must grant nothing beyond the user's own permissions.

---

### TC-FSX-902: Templates cannot be read or changed by another user

**User Role:** Two members
**Steps:**
1. User A creates a template and notes its ID.
2. As user B, request that template directly, then attempt to edit and delete it.

**Expected Result:**
- All three refused.
- **Privacy is a stated guarantee and template IDs are trivially guessable.** A list filtered only in the UI while
  the endpoint serves any ID would expose every user's templates — which may contain internal process detail,
  customer names or draft wording. This is the suite's most important permission case.

---

### TC-FSX-903: The project list does not leak inaccessible projects

**User Role:** Member of two projects
**Steps:**
1. Inspect the **response payload** behind the Project dropdown, not just the rendered list.

**Expected Result:**
- Only accessible projects are present in the payload.
- Client-side filtering would disclose the names of every project on the instance — a real, invisible leak.

---

### TC-FSX-904: The issue list does not leak inaccessible issues

**User Role:** Non-admin member
**Steps:**
1. Inspect the payload behind the Issues dropdown.
2. Send an update request directly naming an issue the user cannot see.

**Expected Result:**
- The payload contains only issues the user may see, and the direct update is refused.
- **Issue subjects are the leak here** — the dropdown shows ID and subject, so an unfiltered payload discloses the
  subject of every issue in the project.

---

### TC-FSX-905: Non-member cannot reach a private project

**User Role:** Authenticated non-member
**Preconditions:** **Confirm the project is genuinely private** — a newly created Redmine project has "Public"
checked by default; uncheck it explicitly or this case falsely passes.
**Steps:**
1. Send create and update requests directly for that project's issues.

**Expected Result:**
- Refused, with no project or issue metadata in the response.

---

### TC-FSX-906: Unauthenticated API access

**User Role:** No credentials
**Steps:**
1. Call the plugin's issue-create, issue-list and template endpoints with no API key.

**Expected Result:**
- 401 for all.
- Only `plugin_info.json` is expected to be unauthenticated, and it must disclose nothing beyond the installed
  flag and version (TC-FSX-107).

---

### TC-FSX-907: A revoked API key stops working

**User Role:** Member + Admin
**Steps:**
1. Reset the user's Redmine API key while the extension is logged in, then attempt to create an issue.

**Expected Result:**
- Refused, and the extension reports it clearly rather than failing silently — ideally returning the user to the
  login screen so they can recover.

---

### TC-FSX-908: Permission revocation takes effect immediately

**User Role:** Admin + member
**Steps:**
1. Remove the member's create rights while the editor is open, then attempt to save.

**Expected Result:**
- Refused. Permissions are evaluated per request, not cached from login.

---

### TC-FSX-909: Closed and archived projects

**User Role:** Logged-in member
**Steps:**
1. Check whether closed and archived projects appear in the dropdowns, and send create requests for each directly.

**Expected Result:**
- Archived projects are absent and refused; closed projects are read-only, matching Redmine's own semantics.

---

### TC-FSX-910: Attachments respect issue visibility

**User Role:** Member
**Steps:**
1. Attach a screenshot to an issue, then view that issue as a user who cannot see it.

**Expected Result:**
- The attachment is protected exactly as the issue is — screenshots frequently contain more sensitive material
  than the issue text itself, so an attachment reachable by URL outside the issue's own permissions would be a
  High-severity leak.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
