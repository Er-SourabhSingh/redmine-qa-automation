# Test Cases — Redmineflux Checklist — Block Issue Closing

> Source: vendor KB — "How to Enable Block Issue Closing feature".
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Checklist Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_checklist_qa

## Navigation methodology

Administration → Plugins → Redmineflux Checklist Plugin → Configure → General tab → **Block issue closing**.
Enforcement must be verified on the real issue Edit form, and separately on every other path that can close an
issue on this instance.

> **Warning:** this is an instance-wide setting. Record its original value and restore it when the suite finishes.

---

## Functional Cases

---

### TC-CHK-501: Closing is blocked while checklist items are incomplete

**User Role:** Member
**Preconditions:** Block issue closing **enabled**; issue has a checklist with at least one incomplete item.
**Steps:**
1. Open the issue, set Status to a closed status, and save.

**Expected Result:**
- The save is rejected.
- A clear error names the reason (unfinished checklist items) rather than a generic validation failure.
- The issue status is unchanged after reload — the rejection is real, not cosmetic.

---

### TC-CHK-502: Closing succeeds once every item is complete

**User Role:** Member
**Steps:**
1. Mark all checklist items Done.
2. Set the status to a closed status and save.

**Expected Result:**
- The issue closes normally. No lingering block.

---

### TC-CHK-503: Issues with no checklist at all are unaffected

**User Role:** Member
**Steps:**
1. With the setting enabled, close an issue that has no checklist.

**Expected Result:**
- Closes normally. The rule applies only where a checklist exists — it must not block every issue on the instance.

---

### TC-CHK-504: Disabling the setting removes the block

**User Role:** Admin + Member
**Steps:**
1. Disable **Block issue closing** and save.
2. Retry closing an issue that has incomplete checklist items.

**Expected Result:**
- The issue closes. The setting takes effect immediately, without a server restart.

---

### TC-CHK-505: Block applies across all closed statuses

**User Role:** Admin + Member
**Steps:**
1. Identify every status flagged "issue closed" in Administration → Issue statuses.
2. With incomplete items, attempt each one in turn (e.g. Closed, Rejected).

**Expected Result:**
- Every closed status is blocked. A status that slips through is a real gap in the feature, not an edge case.

---

### TC-CHK-506: Block applies to multiple checklists on one issue

**User Role:** Member
**Steps:**
1. Issue with checklist A fully complete and checklist B incomplete. Attempt to close.

**Expected Result:**
- Blocked — the rule is "all checklists complete", not "any one checklist complete".

---

### TC-CHK-507: Non-closed status transitions are unaffected

**User Role:** Member
**Steps:**
1. With incomplete items, change the status from New to In Progress.

**Expected Result:**
- Succeeds. Only transitions into a closed status are blocked.

---

## Negative and boundary Cases

---

### TC-CHK-508: Bulk edit bypass

**User Role:** Manager
**Steps:**
1. Select several issues with incomplete checklists in the issue list.
2. Use right-click bulk edit to set them all to a closed status.

**Expected Result:**
- The block is enforced here too. Blocked issues are reported clearly and are **not** silently closed.
- A bulk path that bypasses the rule is a High-severity defect — the feature is trivially circumventable.

---

### TC-CHK-509: Inline / quick edit bypass

**User Role:** Member
**Steps:**
1. Close the issue using any inline or quick status editor available on this instance
   (issue list context menu, inline editor plugin, board drag-to-done).

**Expected Result:**
- Block enforced on every path, with an intelligible message.
- Note: if the error surfaces through another plugin's toast wrapper, file the message defect against that plugin,
  not this one, but the *enforcement* must still hold.

---

### TC-CHK-510: REST API bypass

**User Role:** Member with API key
**Steps:**
1. `PUT /issues/<id>.json` setting `status_id` to a closed status while items are incomplete.

**Expected Result:**
- Rejected with a 422 and an error body naming the checklist reason.
- If the API closes the issue while the UI blocks it, the rule is advisory only — a High-severity defect.

---

### TC-CHK-511: Closing a parent issue whose subtask has an incomplete checklist

**User Role:** Member
**Steps:**
1. Parent issue with no checklist; subtask has an incomplete checklist. Close the parent.

**Expected Result:**
- Behaviour is explicit and consistent with Redmine's own parent/subtask closing rules. Record what happens;
  an unhandled exception here is a defect regardless of which way the rule falls.

---

### TC-CHK-512: Issue already closed before the setting was enabled

**User Role:** Admin + Member
**Steps:**
1. Close an issue while the setting is off and its checklist incomplete.
2. Enable the setting.
3. Reopen and re-close the issue.

**Expected Result:**
- The already-closed issue is not retroactively invalidated or auto-reopened.
- The re-close attempt is blocked, as expected for a fresh transition.

---

### TC-CHK-513: Deleting the incomplete item unblocks closing

**User Role:** Member
**Steps:**
1. With one incomplete item blocking the close, delete that item.
2. Retry the close.

**Expected Result:**
- The close now succeeds — the check evaluates current state, not a cached flag.

---

### TC-CHK-514: Error message is specific and localized

**User Role:** Member
**Steps:**
1. Trigger the block and read the message. Repeat with the UI language set to a non-English locale.

**Expected Result:**
- The message identifies the checklist as the cause and is fully translated in the active locale, with no
  untranslated English fragments.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
