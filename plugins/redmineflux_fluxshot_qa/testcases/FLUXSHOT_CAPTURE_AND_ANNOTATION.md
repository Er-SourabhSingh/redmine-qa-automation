# Test Cases — Fluxshot — Capture, Annotation, Timer & Clipboard

> Source: vendor KB — "Configuration & First Login" (capture on click), "Annotate and Edit Screenshots",
> "Capture with a Timer Delay", "Copy Screenshot to Clipboard", Troubleshooting (blank screenshots, clipboard
> errors), FAQ on annotation, clipboard and timer.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Fluxshot Chrome Extension
- Version: (record at execution time)
- Browser: (record at execution time)
- Path: plugins/redmineflux_fluxshot_qa

## Navigation methodology

All of this is browser-side: click the Fluxshot toolbar icon and work in the editor tab that opens.

---

## Functional Cases — Capture

---

### TC-FSX-001: One-click capture

**User Role:** Logged-in user
**Steps:**
1. Open a content-rich page and click the Fluxshot icon.

**Expected Result:**
- The current tab is captured **immediately** and the editor opens in a new tab with the screenshot loaded.

---

### TC-FSX-002: The capture matches what was on screen

**User Role:** Logged-in user
**Steps:**
1. Capture a page and compare the image against the visible page.

**Expected Result:**
- The visible viewport is captured accurately, with correct colours and no truncation or scaling artefacts.
- Record whether it captures the **viewport only** or the full page — the KB says "a screenshot of the current
  tab", which is ambiguous, and users will assume one or the other.

---

### TC-FSX-003: Capture on different page types

**User Role:** Logged-in user
**Steps:**
1. Capture: a long scrolling page, a page with an open modal, a page with video, a PDF rendered in the browser,
   and a page at a high zoom level.

**Expected Result:**
- Each produces a usable image rather than a blank or partially rendered one.
- Record any page type that fails — a blank capture is the KB's own documented symptom, so knowing which content
  triggers it is useful diagnostic information.

---

### TC-FSX-004: Capture on a restricted page

**User Role:** Logged-in user
**Steps:**
1. Attempt to capture a `chrome://` page and the Chrome Web Store.

**Expected Result:**
- A clear message rather than a blank screenshot silently attached to an issue.
- Chrome blocks extensions from capturing these pages; the failure is expected, but it must be visible, or a user
  will file a blank screenshot on a real ticket.

---

## Functional Cases — Annotation

---

### TC-FSX-005: All ten Painterro tools work

**User Role:** Logged-in user
**Steps:**
1. Apply in turn: text (with font, size, colour), rectangle, ellipse, arrow, pencil/brush, highlighter, crop,
   blur, colour picker, eraser.

**Expected Result:**
- Each tool works as described and the result is visible on the image.
- Record a result per tool — the KB enumerates all ten, so a blanket "annotation works" would hide one broken
  tool.

---

### TC-FSX-006: Crop changes the image that is submitted

**User Role:** Logged-in user
**Steps:**
1. Crop the screenshot to a region, then create an issue and open the attachment in Redmine.

**Expected Result:**
- The attachment is the cropped image, not the original.
- **A crop that is only a view transformation would attach the full uncropped screenshot** — meaning content the
  user deliberately cut out still reaches the ticket. Verify by opening the attached file, not the editor preview.

---

### TC-FSX-007: The eraser removes annotations, not image content

**User Role:** Logged-in user
**Steps:**
1. Draw several annotations, erase some, and submit.

**Expected Result:**
- Erased annotations are gone; the underlying screenshot is intact.

---

### TC-FSX-008: Blur is burnt into the image, not an overlay

**User Role:** Logged-in user
**Steps:**
1. Capture a page containing clearly readable text that stands in for sensitive data.
2. Blur that region.
3. Create an issue, then **download the attachment from Redmine and open it** in an image editor.
4. Inspect the blurred region's actual pixels.

**Expected Result:**
- The blurred area is **irrecoverably blurred in the stored file** — the original pixels are gone.
- **This is the most important case in the suite.** Blur exists so people can hide passwords, customer data and
  personal information before attaching a screenshot to a ticket that many colleagues can read. If the blur is
  stored as a reversible layer, or if the unblurred original is what gets uploaded, then a feature people trust to
  redact is doing nothing — and they will have used it precisely on the data that matters most. Treat any failure
  here as High severity or above.

---

### TC-FSX-009: The annotated version is what gets attached

**User Role:** Logged-in user
**Steps:**
1. Annotate heavily, create an issue, and open the attachment in Redmine.

**Expected Result:**
- The attachment carries every annotation, per the KB's statement that "the annotated version of the screenshot is
  automatically used as the attachment".

---

## Functional Cases — Timer capture

---

### TC-FSX-010: All three delays are offered and work

**User Role:** Logged-in user
**Steps:**
1. Click the timer icon (⏱) and use **3**, then **5**, then **10** seconds in turn.

**Expected Result:**
- All three documented delays are offered, and each captures after roughly the stated interval.

---

### TC-FSX-011: The countdown overlay appears on the source tab

**User Role:** Logged-in user
**Steps:**
1. Start a timer capture and watch the original tab.

**Expected Result:**
- The extension switches back to the source tab and shows a full-screen countdown overlay, per the KB.

---

### TC-FSX-012: The overlay does not appear in the screenshot

**User Role:** Logged-in user
**Steps:**
1. Complete a timer capture and inspect the resulting image.

**Expected Result:**
- The countdown overlay is **absent** from the captured image.
- An overlay that captures itself would defeat the feature entirely — and it is the obvious implementation
  mistake, since the overlay is drawn on the very tab being captured.

---

### TC-FSX-013: Timer captures a transient UI state

**User Role:** Logged-in user
**Steps:**
1. Start a 5-second timer, then open a dropdown or hover a tooltip and hold it until the capture fires.

**Expected Result:**
- The transient state appears in the screenshot — this is the feature's stated purpose.

---

### TC-FSX-014: Cancel aborts the countdown

**User Role:** Logged-in user
**Steps:**
1. Start a timer and click **Cancel** in the overlay.

**Expected Result:**
- The countdown stops, the overlay disappears, and **no screenshot is taken**. The editor keeps its previous image.

---

### TC-FSX-015: Timer with the source tab closed or navigating

**User Role:** Logged-in user
**Steps:**
1. Start a timer, then close the source tab; repeat but navigate it to another page before the countdown ends.

**Expected Result:**
- A clear failure message rather than a silently blank screenshot.
- The KB documents the blank-screenshot symptom for exactly this situation, so the interesting question is whether
  the user is told — an unexplained white image attached to a ticket is worse than an error.

---

## Functional Cases — Copy to clipboard

---

### TC-FSX-016: Copy the annotated screenshot

**User Role:** Logged-in user
**Steps:**
1. Annotate, click the copy icon (⎘), then paste into another application.

**Expected Result:**
- The pasted image includes the annotations.
- A toast confirms *"Screenshot copied to clipboard"*.

---

### TC-FSX-017: The editor stays open after copying

**User Role:** Logged-in user
**Steps:**
1. Copy, then continue annotating and create an issue.

**Expected Result:**
- The editor remains open and usable, per the KB — copying is not a terminal action.

---

### TC-FSX-018: Copying creates nothing in Redmine

**User Role:** Logged-in user
**Steps:**
1. Copy to clipboard, then check the project's issues.

**Expected Result:**
- No issue, no attachment, no API call that writes anything. Copying is purely local, as FAQ states.

---

### TC-FSX-019: Clipboard permission denied

**User Role:** Logged-in user
**Steps:**
1. Block clipboard access for extension pages and click copy.

**Expected Result:**
- An error toast rather than a silent failure — the KB documents this exact symptom and its remedy.
- Nothing else in the editor breaks.

---

## Negative Cases

---

### TC-FSX-020: Blank or white screenshot recovery

**User Role:** Logged-in user
**Steps:**
1. If a capture comes out blank, reload the extension at `chrome://extensions` with the ↺ button and retry.

**Expected Result:**
- The documented remedy resolves it. Record the conditions that produced the blank capture — reproducibility is
  what makes this filable.

---

### TC-FSX-021: Very large captures

**User Role:** Logged-in user
**Steps:**
1. Capture a very large, high-resolution page, annotate heavily, and create an issue.

**Expected Result:**
- The image is produced and uploaded without failing, and the attachment is within Redmine's own attachment size
  limit.
- **If it exceeds the limit, the failure must be explicit.** A silent failure here loses both the screenshot and,
  potentially, the issue the user was creating — record whether the issue is still created without its attachment.

---

### TC-FSX-022: Rapid successive captures

**User Role:** Logged-in user
**Steps:**
1. Click the Fluxshot icon several times in quick succession.

**Expected Result:**
- Editor tabs are handled predictably — either reused or opened cleanly — with no orphaned tabs and no confusion
  about which screenshot belongs to which editor.

---

### TC-FSX-023: Annotation performance

**User Role:** Logged-in user
**Steps:**
1. Apply 50 annotations to one screenshot.

**Expected Result:**
- The editor stays responsive and all annotations are preserved in the submitted image.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
