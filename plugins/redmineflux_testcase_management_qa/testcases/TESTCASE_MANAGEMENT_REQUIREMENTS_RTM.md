# Test Cases — Redmineflux Testcase Management — Requirements & Traceability Matrix

> Source: vendor KB "Requirements & Configuration" and "Access traceability matrix".
> **Status: executed 2026-10-01; re-regressed and extended 2026-10-23** with full editor block-type coverage
> (all 12 EditorJS tools via the real block-menu, not just the subset exercised by the original BUG-TCM-074
> retest), attachment/image upload-download round-trip, Share/Export/Save toolbar buttons, and the Requirements
> page's own content search — per explicit user request to check every editor feature, attachment, search,
> download and share functionality thoroughly. Found 2 new bugs (BUG-TCM-099, BUG-TCM-100); also caught and
> discarded 3 false-alarm findings during testing after verifying against the real cause (see TC-TCM-303/307).
> **Further extended 2026-10-23 (same day)** per direct user follow-up on requirement↔testcase linking/unlinking
> specifically: tested all 3 real linking surfaces (Edit form, Testcase-grid right-click context menu,
> requirement-page `#`-mention) for both link and unlink, confirmed the right-click menu is assign-only (no
> unlink option exists there at all), reconfirmed BUG-TCM-027 (Edit-form unlink) with cleaner evidence, and
> verified the RTM's own counts (Total Defects Found, Total Linked Testcases) against the real underlying data —
> both accurate, including correctly excluding 2 dangling `RequirementIssue` rows pointing to already-deleted
> test cases (a minor data-hygiene observation, not a bug). Re-confirmed explicitly, per direct user question,
> that the RTM itself never shows Run membership for a linked test case (only the separate Requirement Coverage
> report does).
> **Extended 2026-10-27** with the new Requirement Templates feature (standalone create/edit, delete, and template
> selection at Requirement-creation time) — added per direct user request, following live retest of BUG-TCM-120
> and BUG-TCM-122 against a freshly-pulled plugin build (7.2.0). All 4 cases executed live against `localhost:3000`,
> project `rftc-016-ci-qa`, as Administrator. **TC-TCM-332 extended same day** per direct user follow-up to cover
> every block type the Content editor's toolbox offers (not just a single bold paragraph) — see its own Status
> note for the full 10-block-type template built and verified.

## Plugin
- Name: Redmineflux Testcase Management
- Version: v7.0.0
- Redmine version: 6.1.3 (`localhost:3012`) / 7.0.0 (`localhost:3010`)
- Path: plugins/redmineflux_testcase_management_qa

## Navigation methodology

Project → **TestCases** → **Requirements** sidebar icon, and → **Traceability (RTM)** icon. Coverage figures must
be cross-checked against the underlying run results, not accepted from the matrix alone.

**Precondition:** the **Feature Tracker** is configured; ≥1 run with executed results exists.

---

## Functional Cases — Requirements

---

### TC-TCM-112: Create a requirement document

**User Role:** QA / Manager
**Priority:** High
**Steps:**
1. **Requirements** → add a requirement.
2. Enter a title and body; save; reload the list.

**Expected Result:**
- The requirement is created and listed with the title entered.

**Status:** **EXECUTED 2026-10-01 — PASS.** Created requirement `REQ-TC112 Create Requirement Test` via the "+" add control on the Requirements tree. Saved as `#5`, appears in the left tree alongside the pre-existing `gsdfgdf`, with "Created by : Redmine Admin" / "Updated by : Redmine Admin" timestamps shown. Body left empty (Editor.js block editor, not a plain form field — title alone is sufficient to confirm this TC's assertion).

---

### TC-TCM-113: Requirement title is mandatory

**User Role:** QA
**Priority:** Low
**Steps:**
1. Create a requirement with an empty title; save.

**Expected Result:**
- Refused with a visible validation message; nothing created.

**Status:** **EXECUTED 2026-10-01 — PASS.** Left Title blank, clicked Save. Inline message "Please enter title!" shown directly under the field; the form stayed open and no new entry appeared in the requirements tree (still exactly `gsdfgdf` + `REQ-TC112 Create Requirement Test`).

---

### TC-TCM-114: Link a test case to a requirement at creation

**User Role:** QA
**Priority:** High
**Steps:**
1. Create a test case selecting the requirement from the **Requirement** dropdown; save; open the requirement.

**Expected Result:**
- The requirement shows the linked case; the case shows the requirement.

**CONFIRMED LIVE — 2026-10-01 — FAIL, compounds existing BUG-TCM-021 and BUG-TCM-022, no new bug filed.** Selected
`REQ-TC112 Create Requirement Test` on a fresh New Test Case form, then hit the near-guaranteed first-attempt
validation failure from BUG-TCM-011. Checked the Requirement select's selection **after that re-render, before
resubmitting** — empty, the selection was wiped exactly like BUG-TCM-021 already documents for Steps (its own
title explicitly covers "the Steps/Requirements sections," confirmed here to be accurate for Requirements too,
not just Steps). The resulting issue (#1595) also landed on the **Bug** tracker (BUG-TCM-022), on which the
Requirements field doesn't render at all — so the link is doubly absent. Not a new bug; both root causes already
tracked.

---

### TC-TCM-115: Link an existing test case to a requirement

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Edit an existing case and set its requirement; save; open the requirement.

**Expected Result:**
- The link is reflected on both sides.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Linked existing case #1021 to `REQ-TC112 Create Requirement Test` via the
single-selection context menu's Requirements submenu (same mechanism as TC-149's bulk version, works identically
for one case). Confirmed on both sides: issue #1021 shows "Requirements: REQ-TC112 Create Requirement Test," and
the requirement's own detail page lists #1021 alongside the other cases already linked to it (#458, #459, #1526).

---

### TC-TCM-116: Link multiple test cases to one requirement

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Link three cases to requirement R1 (individually or by bulk assign); open R1.

**Expected Result:**
- All three cases are listed against R1, with no duplicates.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Demonstrated via TC-149 (bulk-linked #458, #459, #1526) plus TC-115
(#1021 linked individually): `REQ-TC112 Create Requirement Test`'s own detail page now lists exactly 4 distinct
cases (#458, #459, #1526, #1021), each appearing exactly once — no duplicates from the two separate linking
actions.

---

### TC-TCM-117: Unlink a test case from a requirement

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Clear a case's requirement; save; open the requirement and the RTM.

**Expected Result:**
- The case no longer appears against the requirement, and the RTM coverage figure decreases accordingly.

**CONFIRMED LIVE — 2026-10-01 — FAIL, filed as BUG-TCM-027 (Medium).** On case #1021's `/edit` form, clicked the
**×** on its `REQ-TC112` select2 chip — confirmed client-side removal (`selectedOptions` empty). Submitted via
`form.requestSubmit()` (confirmed genuine, URL changed from `/edit` to the plain issue URL) — reproduced 3 times.
Every time, reloading the issue still shows **"Requirements: REQ-TC112 Create Requirement Test"**, unchanged.
Filed **BUG-TCM-027**.

---

### TC-TCM-118: Edit a requirement

**User Role:** QA / Manager
**Priority:** Medium
**Steps:**
1. Change a requirement's title and body; save; reload; check linked cases.

**Expected Result:**
- Changes persist; existing case links are unaffected by the edit.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Found the edit control (an `img.pencil-icon` next to the title, not an
inline-click-the-text pattern). Clicking it exposes the title as a `contenteditable` element (Editor.js-based, per
TC-112's own evidence). Appended " EDITED" and clicked away to blur — auto-saves with no explicit Save button.
Confirmed persisted after a fresh reload, and all 4 existing case links (#458, #459, #1526, #1021) remained
intact and unaffected.

---

### TC-TCM-119: Delete an unlinked requirement

**User Role:** Manager / Admin
**Priority:** Medium
**Steps:**
1. Delete a requirement with no linked cases; confirm; reload.

**Expected Result:**
- Removed from the list and no longer offered in the test case Requirement dropdown.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Created a genuinely unlinked requirement (`QA-UNLINKED-REQ-119`, page_id
6 — the pre-existing `gsdfgdf` turned out to actually have 3 real links, #434/#471/#458, so a fresh fixture was
needed). Deleted via the delete-icon → "Are you sure?" confirmation → Delete. Confirmed removed from the
Requirements tree after a fresh reload.

---

### TC-TCM-120: Delete a requirement that has linked test cases

**User Role:** Admin
**Priority:** High
**Steps:**
1. Link two cases to a requirement, then delete it.
2. Open those cases, the RTM, and a Requirement Coverage report.

**Expected Result:**
- Either the delete is blocked with a clear message, or it succeeds and the **test cases survive** with their
  requirement link cleanly cleared.
- The RTM and the coverage report must not error or show a dangling reference. Record the behaviour.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Deleted requirement `gsdfgdf` (3 real links: #434, #471, #458) — **not
blocked**, succeeds silently with the same plain "Are you sure?" confirmation as an unlinked requirement (no
extra warning about the 3 links). All checked afterward:
- **Cases survive**: #434 and #471 both load cleanly, no error, no "Requirements:" line at all (consistent with
  how an issue with zero requirements renders elsewhere this session — link cleanly cleared, not dangling).
- **RTM**: correctly shows "Total Requirement: 1" (only `REQ-TC112`), `gsdfgdf` is entirely absent, no error/NaN/
  undefined.
- **Requirement Coverage report**: its own "Select Requirement" dropdown correctly no longer offers `gsdfgdf` as
  an option (only `REQ-TC112`); generating a report completes with no error.

---

### TC-TCM-121: Requirements are project-scoped

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Create requirement `REQ-A` in Project A; open Project B's requirement list and the test case Requirement dropdown.

**Expected Result:**
- `REQ-A` does not appear in Project B.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Checked `REQ-TC112 Create Requirement Test EDITED` (from `test-project`)
against `tcm-permissions-private-test`: absent from that project's own Requirements list **and** from its New
Test Case form's Requirement dropdown. Correctly project-scoped.

---

## Functional Cases — Traceability Matrix

---

### TC-TCM-122: RTM lists requirements against their test cases

**User Role:** QA
**Priority:** High
**Steps:**
1. With ≥2 requirements each holding ≥2 linked cases, open the **Traceability (RTM)** view.

**Expected Result:**
- Every requirement is shown with exactly its linked cases; no case appears under a requirement it is not linked to.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Created a second requirement (`REQ-TC122-SECOND`, #7) and linked cases
#459/#1526 to it (both were already also linked to `REQ-TC112`, a valid multi-requirement state). RTM correctly
shows "Total Requirement: 2," with `#7 : REQ-TC122-SECOND` listing exactly #459/#1526, and `#5 : REQ-TC112...`
listing exactly its own 4 cases (#458/#459/#1021/#1526) — no case appears under a requirement it isn't linked to.

---

### TC-TCM-123: RTM reflects execution results

**User Role:** QA
**Priority:** High
**Steps:**
1. Note a requirement's coverage in the RTM.
2. Execute one of its linked cases as **Passed** and another as **Failed**.
3. Reload the RTM.

**Expected Result:**
- The matrix reflects the new statuses and any pass/fail counts match the run grid exactly.

**CONFIRMED LIVE — 2026-10-01 — Corrected premise: the RTM view itself has no Status column at all** (its table
is literally just Requirement / Testcases / Defects — confirmed via the raw HTML, zero mention of Status/Run/
Environment anywhere). Execution results are shown on a **separate** screen instead: the **Requirement Coverage
report** (one of the 6 report types), whose own columns are Testcase #, Title, Run, Environment, Status, Coverage
Status. Recorded a fresh **Passed** result on case #458 (linked to `REQ-TC112`) in run #21 — reopening the
already-generated Coverage Report (not regenerated) immediately showed the updated row: `Status: Passed,
Coverage Status: Fully Covered`, confirming it reflects live execution state correctly, just on the Coverage
Report screen rather than the RTM itself. Not filed as a bug — `FEATURES_LIST.md` describes the RTM feature
broadly as "Coverage view... and their results," which the plugin satisfies via these two complementary screens
together, even though the RTM screen alone (as this TC narrowly describes it) doesn't carry status data.

---

### TC-TCM-124: RTM shows uncovered requirements

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Create a requirement with no linked test cases; open the RTM.

**Expected Result:**
- The requirement is listed and visibly identified as having no coverage — it must not be silently omitted, since
  uncovered requirements are the main thing an RTM exists to reveal.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Created `QA-UNCOVERED-REQ-124` with zero linked cases. The RTM correctly
lists it (`#8 : QA-UNCOVERED-REQ-124`) with an empty Testcases cell — not silently omitted — and "Total
Requirement" correctly advanced to 3.

---

### TC-TCM-125: RTM shows unlinked test cases

**User Role:** QA
**Priority:** Low
**Steps:**
1. With ≥1 case linked to no requirement, open the RTM.

**Expected Result:**
- Behaviour is explicit — orphan cases are either shown in an "unlinked" grouping or documented as out of scope.
  Record which.

**CONFIRMED LIVE — 2026-10-01 — PASS (by design, not formally documented).** The RTM page has no "unlinked"
grouping or any mention of orphan/unlinked cases anywhere in its text — the view is purely requirement-driven
(its only columns are Requirement/Testcases/Defects), so a case with no requirement link simply never appears,
with no explicit label either way. Not filed as a bug: the view's own structure makes the requirement-centric
scope reasonably self-evident, even though neither the UI nor `USER_GUIDE.md`/`FEATURES_LIST.md` states it
explicitly in words.

---

### TC-TCM-126: RTM coverage agrees with the Requirement Coverage report

**User Role:** QA
**Priority:** High
**Steps:**
1. For the same requirement, compare the RTM's coverage against a freshly generated Requirement Coverage report.

**Expected Result:**
- Both give the same tested/untested counts. A discrepancy between the two views is a defect.

**CONFIRMED LIVE — 2026-10-01 — Not meaningfully testable, same root fact as TC-123.** The RTM carries no
tested/untested count at all (only aggregate "Total Requirement / Total Linked Testcases / Total Defects Found"
across the whole page, and a plain case list per requirement — no per-requirement pass/fail breakdown). The
Coverage Report, by contrast, reports per-**run-assignment** rows (a case can appear more than once if it belongs
to multiple runs), a different granularity than the RTM's per-case link list. With no comparable "tested/untested
count" surfaced on the RTM side, there is nothing to compare for agreement or discrepancy. Not a bug — a
consequence of the same structural gap already recorded on TC-123.

---

### TC-TCM-127: RTM with no requirements renders cleanly

**User Role:** QA
**Priority:** Low
**Steps:**
1. Open the RTM in a project with the module enabled but no requirements.

**Expected Result:**
- An explicit empty state renders. No blank page, no error, no `NaN`/`undefined`.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Opened the RTM in `tcm-permissions-private-test` (module enabled, zero
requirements). Renders cleanly: "Total Requirement: 0 / Total Linked Testcases: 0 / Total Defects Found: 0" and
an explicit **"No data"** message in place of the table. No blank page, no error, no `NaN`/`undefined`.

---

## Functional Cases — Requirement Content Editor (round-trip persistence)

---

### TC-TCM-269: Requirement content persists across reload for every content-editor block type

**User Role:** Administrator
**Priority:** Critical
**Steps:**
1. Create a fresh requirement.
2. Add one block of each available content-editor tool in turn: paragraph (with Bold/Italic/Underline/
   Strikethrough/Link), Heading, List, Quote, Code, Delimiter, Table, Warning, Checklist, Raw HTML, Image
   (upload), Attachment (upload).
3. Save, reload the page, and check every block is present, with the same content, in the same order.

**Expected Result:**
- Every block added is present, unmodified, and in order after reload. Regression target for BUG-TCM-074 (the
  original view-triggered phantom-save defect).

**Status: EXECUTED 2026-10-20 — PASS** (fix verification pass for BUG-TCM-074, both as a two-separate-burst test
and as one single combined burst covering paragraph/heading/list/delimiter/attachment/mention together). Confirmed
clean across 8+ consecutive reloads on the fixed `C:\crux-redmine` build. See `bugs/closed/BUG-TCM-074.md`
("Retest #2" / "Retest #3") for full evidence.

---

### TC-TCM-270: Rapid, back-to-back multi-block edits do not race/lose content across reloads

**User Role:** Administrator
**Priority:** Critical
**Steps:**
1. Open a requirement.
2. Without pausing between them, add several different blocks in quick succession (e.g. a paragraph, a
   `#`-mention link to an existing test case, an attachment upload, another paragraph immediately after the
   upload starts).
3. Reload the page 3–4 times in a row, checking the full block list each time.

**Expected Result:**
- Nothing is dropped or reordered on any of the reloads, regardless of save timing. Regression target for
  BUG-TCM-074's reopened finding (a save-race that could non-deterministically drop a block added in a rapid
  edit burst).

**Status: EXECUTED 2026-10-20 — PASS.** Reproduced the exact reopening scenario (rapid multi-block bursts,
including a block added immediately after starting an attachment upload, before it finished) across two separate
bursts (8 reloads total) and one single combined burst (4 more reloads) — zero loss, zero reordering every time.
See `bugs/closed/BUG-TCM-074.md`.

---

### TC-TCM-271: Link a test case to a requirement via a `#`-mention in its content

**User Role:** Administrator
**Priority:** High
**Steps:**
1. In a requirement's content, type `#` followed by an existing test case's subject/ID; select it from the
   suggestion list.
2. Save, reload, and check: the content shows a real link to that test case's issue, and the Traceability Matrix
   shows the relation.

**Expected Result:**
- The mention renders as a clickable link to the test case's issue page, and the backing requirement↔testcase
  relation is created and visible on the Traceability Matrix.

**Status: EXECUTED 2026-10-20 — PASS.** Confirmed both the rendered `<a href="/issues/N">` link persisting across
reloads and the Traceability Matrix showing the relation (requirement ↔ test case) immediately after linking.

---

### TC-TCM-272: Unlink a test case from a requirement by deleting its `#`-mention text

**User Role:** Administrator
**Priority:** Medium
**Steps:**
1. On a requirement already linked to a test case via a `#`-mention, delete the mention text from the content
   using real keyboard input (click into the block, place cursor after the mention, Backspace).
2. Save, reload, and check the content and the Traceability Matrix.

**Expected Result:**
- The mention is gone from the content on reload, and the Traceability Matrix no longer shows the relation.

**Status: EXECUTED 2026-10-20 — PASS**, with a caveat recorded for future sessions: a **scripted** deletion (DOM
`execCommand`/`textContent` manipulation instead of real keyboard events) can appear to remove the mention from
the Traceability Matrix immediately, while the content itself silently fails to persist the deletion and the
mention reappears on the next reload — this is a **test-tooling artifact** (the synthetic edit never actually
reached the app's save pipeline), not a product defect. Confirmed clean when redone with real `Backspace`
keypresses: content and Traceability Matrix both correctly reflect the unlink after reload. See
`bugs/closed/BUG-TCM-074.md` ("Retest #3") for the full investigation.

---

### TC-TCM-273: Renaming a requirement's title does not affect its already-saved content

**User Role:** Administrator
**Priority:** Medium
**Steps:**
1. On a requirement with existing content (multiple blocks), use the pencil icon to rename its title.
2. Save, reload, and check both the new title and the content blocks.

**Expected Result:**
- The new title persists, and every content block from before the rename is still present, unchanged.

**Status: EXECUTED 2026-10-20 — PASS.** Renamed twice in the same retest session; content (6 blocks including a
mention and an attachment) was unaffected both times, confirmed on reload after each rename.

---

## Functional Cases — Toolbar (Search, Share, Export, Save) and full block-type coverage

---

### TC-TCM-303: Every content-editor block type inserts correctly via the real "+" block-type menu and persists across reload

**User Role:** Administrator
**Priority:** Critical
**Steps:**
1. Create a fresh requirement.
2. Using the real "+" plus-button → block-type popover (not a scripted/API insertion), add one of each: Text
   (paragraph), Heading, List, Code, Quote, Delimiter, Table, Image (upload), Attachment (upload), Raw HTML,
   Warning, Checklist.
3. Save, reload the page, and verify every block is present with its content intact, in order.

**Expected Result:**
- All 12 block types insert without error and persist unchanged after reload.

**Status: EXECUTED 2026-10-23 — PASS, with an important test-methodology correction recorded.** All 12 block
types (Text, Heading, List, Code, Quote, Delimiter, Table, Image, Attachment, Raw HTML, Warning, Checklist)
inserted and persisted correctly across reload, confirmed via direct DOM inspection of the saved page content
(`document.querySelectorAll('.ce-block')`) both before and after a hard reload.

**Correction during testing**: an initial pass appeared to show Code/Quote/Delimiter/Table/Image block insertion
throwing a JS error (`TypeError: Cannot read properties of undefined (reading 'holder')`) and failing to insert
— investigated before concluding a defect, and found the root cause was in the **test script itself**: the
popover-selection helper used `document.querySelector('.ce-popover, .ce-popover--opened')`, which always returns
the *first* `.ce-popover` element in the DOM (one exists per block, mostly closed/invisible) rather than the one
actually open for the currently-focused block. Clicking an item inside a stale, zero-size, invisible popover
instance produced the error and no real insertion. Corrected by always locating the popover whose
`offsetParent !== null` (genuinely visible) before clicking an item — after that fix, every block type inserted
cleanly with zero console errors. This is recorded here as a methodology lesson (also in
`TESTCASE_MANAGEMENT_MEMORY.md`), not a product defect — nothing was actually broken once tested correctly.

**Also corrected**: the Image block initially appeared to show "Select an Image" (empty) after reload via a
crude `textContent` check — but `<img>` elements have no text content, so that check was meaningless. Direct
inspection of the `<img src>` attribute, plus a byte-for-byte MD5 comparison of the downloaded file against the
original upload, confirmed the image persisted **perfectly**, byte-identical.

**Visual-render gap caught by the user, 2026-10-23 (same day), and corrected**: the MD5/`src` check above proves
the file round-trips correctly, but does not prove the image is actually *visible* on the page. The user
directly spotted, from a full-page screenshot, that no image rendered at all between the Table and Attachment
blocks. Investigated: the original test upload was a 1×1 pixel PNG (70 bytes, built as a minimal valid file for
the upload test) — it loaded correctly (`complete: true`, correct `src`) but rendered at genuinely **1×1 CSS
pixels** (`naturalWidth`/`naturalHeight`/bounding-rect all `1`), invisible to the eye even though nothing was
actually broken. Re-tested with a real, visible 100×100 PNG: it renders correctly and visibly after a fresh
reload (confirmed via a full-page screenshot, not just a DOM query). **Not a product defect** — the original
"byte-identical" PASS was correct but incomplete, since byte/DOM-level checks alone can't catch "is this
file too small to see." Recorded as a testing lesson: when confirming an uploaded image persists, also take a
real screenshot and/or check `naturalWidth`/`naturalHeight` are non-trivial, not just the `src` attribute and a
hash match.

---

### TC-TCM-304: Inline paragraph formatting (Bold, Italic, Highlight, Underline, Strikethrough, Link) applies correctly; Highlight's visual style does not survive reload

**User Role:** Administrator
**Priority:** Medium
**Steps:**
1. In a paragraph block, select text and apply each inline tool from the selection toolbar: Bold, Italic,
   Highlight (background-color marker), Underline, Strikethrough, Link.
2. Save, reload, and inspect the saved HTML.

**Expected Result:**
- All 6 formats apply without error. Ideally all 6 persist identically across reload.

**Status: EXECUTED 2026-10-23 — PASS for 5 of 6, 1 observation recorded (not filed as a clean bug).** All 6
tools applied correctly and nested properly in the live DOM (confirmed
`<s><u><b><i style="background-color:...">...<a href>...</i></b></u></s>`). After reload, Bold/Italic/
Underline/Strikethrough/Link all persisted correctly, but the **Highlight tool's `style="background-color:..."`
attribute was stripped** — the `<i>` tag itself survived (since Italic was also applied), but its highlight
color was gone. This is very likely a deliberate side effect of this plugin's own prior output-safety/XSS
hardening (rftc-013, SEC-002–004 — stripping arbitrary inline `style` attributes is a reasonable anti-XSS
measure), not a new regression — but the practical effect is that the Highlight tool is functionally broken:
it visually applies in the editor but can never actually be saved. Recorded as an observation in
`TESTCASE_MANAGEMENT_MEMORY.md` for a developer to judge whether this tradeoff is intentional.

---

### TC-TCM-305: Attachment upload and download round-trip correctly

**User Role:** Administrator
**Priority:** High
**Steps:**
1. Add an Attachment block, upload a real file.
2. Save, reload, and download the file via its link.

**Expected Result:**
- The attachment persists and downloads as the exact original file, unchanged.

**Status: EXECUTED 2026-10-23 — PASS.** Uploaded `tc176-sample-attachment.txt` via the real file-chooser flow;
persisted correctly across reload with its title/size (`0.1KB`) shown, and its download link
(`/requirement/download?id=4&filename=tc176-sample-attachment.txt`) served a 200 OK response.

---

### TC-TCM-306: Image upload and download round-trip byte-identically

**User Role:** Administrator
**Priority:** High
**Steps:**
1. Add an Image block, upload a real image file.
2. Save, reload, and download the image via its rendered `<img src>` URL.
3. Compare the downloaded bytes against the original upload.

**Expected Result:**
- The image persists and downloads byte-identical to the original upload.

**Status: EXECUTED 2026-10-23 — PASS.** Uploaded a 70-byte PNG; after reload, the `<img>` tag's `src` correctly
pointed to `/requirement/download?id=5&filename=qa-test-image.png`; downloaded file's MD5
(`f829b914fc47cfc9c0747c119c27cf1b`) matched the original upload's MD5 exactly.

---

### TC-TCM-307: Requirements content search matches body content correctly, but does not match on requirement title

**User Role:** Administrator
**Priority:** Medium
**Steps:**
1. Click the Search icon on the Requirements page's toolbar to open the search panel.
2. Search a term known to exist only in a requirement's **body content** (e.g. a distinctive word from a
   paragraph block).
3. Search a term known to exist only in a requirement's **title**, not its body.

**Expected Result:**
- Content-text search returns the correct matching requirement(s). (Title-matching behavior should be
  explicit — record whichever way it actually works.)

**Status: EXECUTED 2026-10-23 — PASS for content search; title search confirmed absent (feature gap, not a
regression, recorded as an observation).** Searching `sadfsdf` (body text of `REQ-RFTC011-4 Multi-defect RTM
check`) correctly returned exactly that requirement, both via the real UI (real keystrokes) and via a direct
`curl` call to the underlying `content_search_knowledgebase_testcase` endpoint. Searching `Multi-defect` (an
exact substring of that same requirement's **title**, not present in its body text) returned **zero** results
both via the UI and via direct `curl` — confirming the search indexes/matches body content only, never the
title. Not filed as a bug (no indication this was ever intended to cover titles), but recorded as a minor,
worth-knowing gap in `TESTCASE_MANAGEMENT_MEMORY.md`.

**Methodology note**: an initial pass showed "0 search results" even for the correct body-content term, which
looked like a broken search — investigated before concluding anything, and found the test script's `.fill()`
call doesn't trigger the live-search component's real keystroke/debounce listener. Retyping with genuine
keyboard events (`pressSequentially`) produced the correct "1 search results" with the right requirement listed
and clickable, navigating correctly to it. The search feature itself was never broken.

---

### TC-TCM-308: Share, Export (PDF), and Save toolbar buttons all work correctly

**User Role:** Administrator
**Priority:** Medium
**Steps:**
1. On a requirement's detail page, click Share, Export, and Save in turn and verify each one's actual effect.

**Expected Result:**
- Share copies a usable link; Export downloads a PDF matching the on-screen content; Save persists the current
  state.

**Status: EXECUTED 2026-10-23 — PASS (functionally), 1 code-quality defect found (BUG-TCM-100).** Share
(`#share-btn`) correctly copies the requirement's direct URL to the clipboard (confirmed via
`navigator.clipboard.readText()`), though it gives no visible on-screen confirmation (no toast) — a minor UX
gap, not filed as a bug. Export (`#export-btn`) downloaded a real PDF
(`REQ-RFTC011-4 Multi-defect RTM check.pdf`) whose content matched the on-screen requirement text exactly
(verified by reading the PDF). Save (`#save-draft`) correctly persists edits (confirmed throughout TC-303/304's
testing — every edit auto-saved and/or explicit-saved correctly). **Found BUG-TCM-100**: the Save button and a
Close button both carry `alt="share-icon"` in their `<img>` tag — identical to the real Share button's
accessible name, confirmed via direct DOM inspection (`save-icon-....svg` and `close_icon-....svg` assets both
mislabeled). Filed as a Low-severity code-quality/accessibility defect, not a functional break.

---

### TC-TCM-309: Pressing Escape throws a console error from the plugin's onboarding-tour script, even when no tour is active

**User Role:** Administrator
**Priority:** Low
**Steps:**
1. On any Testcase Management page, without opening the onboarding tour, press Escape.
2. Check the browser console.

**Expected Result:**
- No JS error, since no tour is active to tear down.

**Status: EXECUTED 2026-10-23 — FAIL, filed as BUG-TCM-099 (Low).** Every Escape press (reproduced 2/2)
throws `TypeError: Cannot read properties of undefined (reading 'wrapper') at ztTour.destroyTour`, called
unconditionally from the tour script's global `onKeyUp` listener with no guard for "is a tour actually open."
No visible functional breakage observed alongside it — purely a console-level defect, but real and consistently
reproducible on an extremely common key.

---

## Functional Cases — Requirement↔Testcase linking from every real entry point, and RTM count accuracy

---

### TC-TCM-310: Link a requirement to a test case via the plain Issue Edit form's own Requirement field (distinct from the context-menu path)

**User Role:** Administrator
**Priority:** High
**Steps:**
1. Open an existing test case with no requirement link via its own Edit form (not the Testcase Summary grid's
   right-click context menu, and not the New Test Case creation form).
2. In the Requirements select2 field, add a requirement and Submit.
3. Reload the issue and confirm the link.

**Expected Result:**
- The requirement link is added and persists.

**Status: EXECUTED 2026-10-23 — PASS, after correcting a false-negative first attempt.** This is a genuinely
distinct linking surface from TC-TCM-115 (whose actual evidence used the right-click context menu, not the Edit
form, despite its written steps saying "Edit an existing case") and from TC-TCM-114 (the New Test Case creation
form). Tested directly on a real, previously-unlinked test case (#2140): selected "requirement 2" in the Edit
form's Requirement select2 field, submitted, and confirmed via direct DB lookup
(`RequirementIssue.where(issue_id: 2140)`) that the link persisted correctly. **First attempt showed zero
effect** (DB unchanged, `updated_on` unchanged, no journal entry at all) — investigated before concluding a
defect, and confirmed the *entire form submission* had silently not gone through that first time (not specific
to the Requirement field), most likely a stale element reference in the test script rather than a real
application issue. Redone cleanly with a visible Subject change alongside it to confirm the submission genuinely
reached the server ("Successful update." flash, subject changed in the DB) — the Requirement link then
persisted correctly every time.

---

### TC-TCM-311: Unlinking a requirement via the plain Issue Edit form's Requirement field does not persist (BUG-TCM-027, reconfirmed on a clean fixture)

**User Role:** Administrator
**Priority:** Medium
**Steps:**
1. On a test case with an existing requirement link (e.g. the one just created in TC-TCM-310), open its Edit
   form, remove the requirement chip via its own "×" button, and Submit.
2. Reload and check whether the link is actually gone.

**Expected Result:**
- The requirement link is removed.

**Status: EXECUTED 2026-10-23 — FAIL, reconfirms the already-open BUG-TCM-027.** Removed the "requirement 2"
chip from issue #2140's Edit form (confirmed client-side empty via `selectedOptions` before submitting), then
Submit. The server responded with **"Successful update."**, yet the database shows **zero change at all** —
`updated_on` timestamp identical to before the submission, and `RequirementIssue.where(issue_id: 2140)` still
returns `[6]` (the link untouched). This is a cleaner, more direct reproduction than BUG-TCM-027's original
evidence (a flash message actively claiming success while nothing was actually persisted, not merely "the old
value is still shown somewhere"). No new bug filed — this is squarely BUG-TCM-027's existing scope.

---

### TC-TCM-312: The Testcase Summary grid's right-click "Requirements" context-menu submenu has no unlink/remove option at all — assign-only by design

**User Role:** Administrator
**Priority:** Medium
**Steps:**
1. On the Testcase Summary grid, select a test case that already has a requirement linked.
2. Right-click to open the context menu and inspect the "Requirements" submenu's full contents.

**Expected Result:**
- Document whether the submenu offers a way to remove/unlink an existing requirement, or only to add one.

**Status: EXECUTED 2026-10-23 — confirmed assign-only, no bug filed (documents an existing gap, consistent with
TC-TCM-149/150's "adds rather than replaces" finding).** Right-clicked issue #2115 (already linked to
`REQ-RFTC011-4 Multi-defect RTM check`). The "Requirements" submenu lists only the 3 existing requirements as
clickable assign targets (`REQ-RFTC011-4 Multi-defect RTM check`, `requirement 2`, `QA-EDITOR-FULLTEST-REQ`) —
there is no "Remove requirement" / "Clear requirement" / unlink entry anywhere in the menu. Combined with
TC-TCM-149/150's finding that this same path only *adds* (never replaces) a requirement, this confirms the
right-click context-menu surface is **add-only** for requirement linking across the board — the only ways to
*remove* a link today are the Edit form (broken, BUG-TCM-027) or deleting a `#`-mention from the requirement's
own content (works, TC-TCM-272).

---

### TC-TCM-313: RTM's "Total Defects Found" count and per-row Defects column are accurate against the real underlying data

**User Role:** Administrator
**Priority:** High
**Steps:**
1. Open the RTM and note "Total Defects Found."
2. Independently compute the real distinct defect count linked to this project's requirement-linked test cases
   (via `ExecutionDefect` → `IssueStatusResult` → issue).
3. Compare.

**Expected Result:**
- The two counts match exactly.

**Status: EXECUTED 2026-10-23 — PASS.** RTM showed **"Total Defects Found: 10."** Independently computed via
`ExecutionDefect.joins(:issue_status_result).where(issue_status_results: {issue_id: <requirement-linked
testcase ids>}).distinct.pluck(:defect_issue_id)` — exactly **10** distinct defect issues
(`[25, 29, 30, 31, 37, 2052, 2056, 2064, 2065, 2066]`), matching exactly. Spot-checked one row directly: requirement
`REQ-RFTC011-4`'s testcase `#24` correctly lists 7 distinct linked defects in its own Defects cell
(`#25, #29, #30, #31, #37, #2064, #2065, #2066` — 8 shown, all real CI-failure defect issues for that test case).

---

### TC-TCM-314: RTM's "Total Linked Testcases" count correctly excludes dangling links to already-deleted test cases — a related data-hygiene observation, not a bug

**User Role:** Administrator
**Priority:** Low
**Steps:**
1. Compare RTM's "Total Linked Testcases" figure against a raw count of all `RequirementIssue` rows for the
   project.

**Expected Result:**
- If a `RequirementIssue` row's target test case has since been deleted, the RTM should not count it (a dangling
  reference should not inflate the displayed total).

**Status: EXECUTED 2026-10-23 — PASS for the RTM's own display; an underlying data-hygiene gap recorded as an
observation, not filed as a bug.** RTM displayed **"Total Linked Testcases: 12."** A raw count of
`RequirementIssue` rows for this project's requirements returned **14** distinct `issue_id` values. Investigated
the 2-row discrepancy: `Issue.find` for 2 of those 14 ids (`#2121`, `#2124`) returns nothing — **both test cases
have been deleted, but their `RequirementIssue` join rows were never cleaned up.** The RTM itself handles this
correctly (its displayed count of 12 already excludes these 2 dangling rows, and they don't appear in the
table), so this is **not a defect in the RTM** — but it confirms `RequirementIssue` rows for a deleted test case
are left behind as orphaned data, the same general pattern already documented for `ExecutionDefect` in
BUG-TCM-061 (orphan rows after a *defect* is deleted). Recorded in `TESTCASE_MANAGEMENT_MEMORY.md` as a
worth-knowing data-hygiene pattern, not filed as a new bug since nothing user-visible is actually broken by it.

---

### TC-TCM-315: RTM itself never shows whether a linked test case belongs to any Run — reiterating TC-TCM-123's finding, explicitly re-checked per direct user question

**User Role:** Administrator
**Priority:** Medium
**Steps:**
1. For a requirement's linked test case that is known to belong to at least one Run, check whether the RTM
   itself displays that fact anywhere (not the separate Requirement Coverage report).

**Expected Result:**
- Document explicitly whether the RTM shows Run membership for its linked test cases.

**Status: RE-CONFIRMED 2026-10-23 — same finding as TC-TCM-123/126, explicitly re-verified because the user
directly asked whether the RTM shows "if that testcase is in any run."** The RTM's table has exactly 3 columns —
Requirement, Testcases, Defects — confirmed again via the current page's live structure. There is no Run column,
no per-testcase run badge, and no aggregate run-coverage figure anywhere on this page. Run/execution-status
information is only available via the separate **Requirement Coverage report** (one of the 6 report types),
exactly as already documented on TC-TCM-123. Not a new gap — reiterated here because the user asked specifically
about it in this session, to make the answer explicit and current rather than relying on a 2026-10-01 finding
alone.

---

## Functional Cases — Requirement Templates

---

### TC-TCM-329: Create a standalone Requirement Template with original rich-text content (not cloned from an existing Requirement)

**User Role:** Administrator
**Priority:** Medium
**Steps:**
1. Administration → Plugins → Redmineflux Testcase Management → Configure → **Requirement Templates** tab.
2. Click **"New Requirement Template"**.
3. Enter a `Name`, then click into the `Content` editor (Editor.js — same editor Requirements themselves use) and
   type original content directly — do not clone from any existing Requirement.
4. Apply inline formatting (e.g. select the text and press Ctrl+B for bold) before saving.
5. Click **Create**.

**Expected Result:**
- The template saves successfully with no Requirement needed as a source; the list shows it with both `Edit` and
  `Delete` actions.
- The formatting applied in the editor (e.g. bold) is preserved in the saved content, not stripped or escaped.

**Status: EXECUTED 2026-10-27 — PASS.** Created template `QA-RTPL-Fidelity-Test` with content
`TEMPLATE-MARKER-rtpl001 bold-me-this`, selected all and applied Ctrl+B before saving — confirmed via DOM
(`.cdx-block` `innerHTML`) the content was wrapped in a real `<b>` tag at the moment of typing. After Create, the
template appeared in the list (id `4`) with both `Edit` and `Delete` links present (previously Delete-only, per
BUG-TCM-122). This directly verifies BUG-TCM-122 Finding 1 (no standalone create) is fixed.

---

### TC-TCM-330: Edit an existing Requirement Template — name and content both persist after Update

**User Role:** Administrator
**Priority:** Medium
**Steps:**
1. From the Requirement Templates list, click **Edit** on an existing template.
2. Confirm the form is pre-populated with the template's current `Name` and `Content` (including any formatting).
3. Change the `Name` and append text to the `Content`.
4. Click **Update**.
5. Re-open the same template's Edit page on a fresh navigation.

**Expected Result:**
- The Edit form loads the existing name/content correctly (not blank).
- After Update, the list reflects the new name immediately.
- Re-opening Edit on a fresh page load shows both the renamed title and the appended content — the change
  genuinely persisted, not just an in-memory/optimistic UI update.

**Status: EXECUTED 2026-10-27 — PASS.** Opened `/requirement_templates/4/edit` — form correctly pre-populated
`Name: QA-RTPL-Fidelity-Test` and `Content: <b>TEMPLATE-MARKER-rtpl001 bold-me-this</b>` (bold preserved from
TC-329). Renamed to `QA-RTPL-Fidelity-Test-EDITED` and appended ` EDITED-APPEND` inside the same bold run, then
clicked Update — list immediately showed the new name. Re-navigated fresh to the same Edit URL: both the new name
and `<b>TEMPLATE-MARKER-rtpl001 bold-me-this EDITED-APPEND</b>` loaded correctly, confirming a genuine server-side
persist. This directly verifies BUG-TCM-122 Finding 2 (no edit capability) is fixed.

---

### TC-TCM-331: Delete a Requirement Template — confirmation modal, removal from list

**User Role:** Administrator
**Priority:** Low
**Steps:**
1. From the Requirement Templates list, click **Delete** on a template.
2. Confirm the modal text names the correct template.
3. Confirm the deletion.
4. Reload the Requirement Templates tab.

**Expected Result:**
- A confirmation modal appears before any deletion happens (no silent/instant delete).
- After confirming, the template is removed from the list; the list correctly returns to "No data to display"
  when it was the only row.

**Status: EXECUTED 2026-10-27 — PASS.** Clicking Delete on `QA-RTPL-Fidelity-Test-EDITED` raised a modal titled
"Delete Requirement Template?" naming the template explicitly, with Delete/Cancel buttons. Confirmed — the row
was removed, and the Requirement Templates tab correctly showed no table/list content afterward (the only
template had just been deleted). Also exercised earlier in this same session on a different throwaway template
(id `3`, from the BUG-TCM-122 retest) with the same result.

---

### TC-TCM-332: Select a Requirement Template while creating a new Requirement — the new Requirement's content exactly matches the template, across every editor block type

**User Role:** Administrator
**Priority:** High
**Steps:**
1. Create a Requirement Template whose content uses every block type the Content editor's own "+"/block-menu
   offers (Text, Heading, List, Quote, Delimiter, Code, Table, Raw HTML, Warning, Checklist), each with a unique
   marker string, per TC-TCM-329/330.
2. On the project's Requirements page, click **+** to open "New Requirement".
3. Enter a Title, then select the template from the **"Select Requirement Template"** dropdown.
4. Click **Save**.
5. Open the newly-created Requirement on a fresh page load (not the same in-memory state as right after Save).

**Expected Result:**
- The dropdown lists the template by name.
- The created Requirement's content editor shows exactly the template's content for **every** block type used —
  same text, same block structure (heading stays a heading, list stays a list with the same item count, table
  keeps every cell, etc.) — not blank, not truncated, not collapsed to plain text, not missing any block.

**Status: EXECUTED 2026-10-27 — PASS (extended same day, full block-type coverage).** Initial pass only exercised
a single bold paragraph; extended per direct user follow-up ("tumne sare editor use kr ke template banaya?",
"table add nhi kiya") to cover every block type the toolbox actually offers. Built template
`QA-RTPL-AllBlocks-Test` (id `5`) with one of each: Paragraph, Heading, List (2 items), Quote, Delimiter, Code,
Table (2×2, all 4 cells), Raw HTML, Warning (title+message), Checklist — each block's text carrying a
`TEMPLATE-MARKER-allblocks` marker. Saved and re-opened the template fresh to confirm all 10 blocks persisted
correctly (two blocks — Code and Raw HTML — initially appeared to lose their typed content when a later block was
inserted via the toolbox, a client-side re-render timing quirk; retyping them immediately before the final Save
fixed it and the saved/reloaded template showed all 10 blocks intact — not filed as a bug, since the final saved
state is correct and this only affects mid-authoring block insertion order, not data integrity once saved).

Created a new Requirement (`REQ-TC-ALLBLOCKS-USE-TEST`, page_id `120`) with this template selected. On a **fresh
page reload** (not the same in-memory state as right after Save), inspected `#contentEditor`'s DOM directly:
all 10 block classes present in the same order (`ce-paragraph`, `ce-header`, `cdx-nested-list`, `cdx-quote`,
`ce-delimiter`, `ce-code`, table `cdx-block`, `ce-rawtool`, `cdx-warning`, `cdx-checklist`); both `<textarea>`
values (Code, Raw HTML) exactly matched the template's; the table's 4 cells, the 2 list items, the Warning's
title+message, and the Checklist item text all matched exactly. No block was dropped, truncated, or flattened to
plain text. Cleanup: deleted the test Requirement and the test template afterward.

---

## Regression — 2026-10-27 (post-bug-fix pass, triggered by BUG-TCM-093/072/121's Critical/High severity per SENIOR_QA_STANDARDS.md §26)

Live-executed against `localhost:3000`, plugin 7.2.0, project `rftc-016-ci-qa`, as Administrator. Scope: the
Requirements content-editor/escaping group, since that's the exact area BUG-TCM-093 (breadcrumb XSS),
BUG-TCM-072 (mention-dropdown XSS) and BUG-TCM-121 (mention-highlight regression) all touched.

- **TC-TCM-112 — PASS.** Created `REG-TC112-Create-20261027` (page_id 122) via the "+" control; appeared in the
  list immediately.
- **TC-TCM-113 — PASS.** Empty-title Save correctly blocked; inline "Please enter title!" message confirmed
  present (initially missed on a first check due to it being transient — re-verified immediately after the Save
  click).
- **TC-TCM-269, TC-303, TC-304, TC-305, TC-306 (partial), TC-307 — PASS**, all verified live on the existing
  `QA-EDITOR-FULLTEST-REQ` fixture (id 112) via a **fresh page load** (not cached state): all 13 original blocks
  (paragraph w/ bold+italic+underline+strikethrough+link, heading, list w/ 2 live `#35` mention links, code,
  quote, delimiter, table, 2×image, raw HTML, checklist, warning) rendered correctly with zero console errors
  (one pre-existing, unrelated cosmetic 404 for `article-icon.svg` noted, not a regression — not filed, purely
  cosmetic icon asset, no functional impact). Attachment (`tc176-sample-attachment.txt`) download link intact.
  Content search for "plain paragraph block" (body text) correctly returned the requirement (1 result); search
  for "FULLTEST" (title-only text) correctly returned 0 results — title-exclusion behavior still correct.
- **TC-TCM-308 (partial) — PASS.** Save toolbar button clicked, re-saved cleanly, no new errors.
- **TC-TCM-309 — PASS.** Pressing Escape on this page produced no new console error (BUG-TCM-099's fix holds) —
  confirmed by comparing the console log before/after the Escape keypress; only the same pre-existing cosmetic
  404 appeared, nothing new.
- **Incident avoided, logged for awareness:** an initial attempt to test TC-TCM-271 via Playwright's `.fill()` on
  the fixture's own first paragraph block **overwrote its content** (fill replaces instead of appending, and
  doesn't trigger Tribute.js the way real keystrokes do — the same lesson already documented earlier this session
  for mention insertion). Caught immediately via DOM check, **not saved** (no Save/Update click made), and
  confirmed fully reverted on a fresh page reload — the fixture's original 13 blocks were intentionally reused
  rather than a disposable one specifically to catch this kind of risk; from now on, any further manual edit
  testing on this fixture will use a disposable requirement instead.

**Not yet executed this pass (deferred, see fork's final report for resume point):** TC-TCM-114–121 (link/unlink/
edit/delete CRUD beyond 112/113), TC-TCM-270 (rapid multi-block race), TC-TCM-271/272 (mention link/unlink, fresh
creation — needs a disposable fixture), TC-TCM-273 (rename doesn't affect content), TC-TCM-310–312 (linking
surfaces), TC-TCM-122–127/313–315 (Traceability Matrix). No regressions found in anything executed.

---

## Evidence Map

| TC range | Area | Bug reference |
|---|---|---|
| TC-TCM-112 – 121 | Requirement CRUD and linking | BUG-TCM-021, BUG-TCM-022, BUG-TCM-027 |
| TC-TCM-122 – 127 | Traceability matrix | — |
| TC-TCM-269 – 273 | Requirement content editor round-trip persistence, link/unlink/rename | BUG-TCM-074 |
| TC-TCM-303 – 309 | Full editor block-type coverage, inline formatting, attachment/image upload-download, search, Share/Export/Save toolbar, tour-script console error | BUG-TCM-099, BUG-TCM-100 |
| TC-TCM-310 – 315 | Requirement↔testcase linking from every real entry point (Edit form, right-click context menu, requirement-page mention), RTM count accuracy (defects, linked-testcase total), RTM's lack of a Run column | BUG-TCM-027 (reconfirmed) |
| TC-TCM-329 – 332 | Requirement Templates: standalone create (with formatting), edit/update persistence, delete, and template-selection content fidelity at Requirement-creation time | BUG-TCM-120, BUG-TCM-122 (both fixed, reverified here) |

- Screenshots only on failure, to `screenshots/<BUG-ID>/` (`CLAUDE.md` §6).
- TC-TCM-120, 269 and 270 are the highest-value cases — data-loss semantics, the content editor's core save
  guarantee, and the save-race regression target respectively. TC-TCM-303 (all 12 block types via the real
  block-menu) is the highest-value case added 2026-10-23 — the broadest single check of the content editor's
  actual feature surface.
