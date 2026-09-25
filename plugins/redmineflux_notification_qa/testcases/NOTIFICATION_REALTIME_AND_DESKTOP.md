# Test Cases — Redmineflux Notification — Real-Time (Faye) & Desktop Notifications

> Source: vendor KB — "Faye Server Address", "How to Enable Real-Time Notifications",
> "How to Enable Browser Desktop Notifications", Troubleshooting ("Real-Time Notifications Are Not Working",
> "Browser Desktop Notifications Are Not Working"), FAQ Q7.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Notification Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_notification_qa

## Environment preconditions — record these with every result

Real-time delivery depends on a **separate process** and on network reachability in two directions. A negative
result is meaningless without knowing which of these was true:

1. Is the Faye server running? (`rackup plugins/redmineflux_notification/faye.ru -E production`)
2. Is the configured Faye address correct and reachable **from the Redmine server**?
3. Is it reachable **from the browser**? These are different network paths and both must work.
4. Is the browser blocking the Faye request (mixed content, CORS, an extension)?

Desktop notifications add three more gates: the Redmine preference, the browser's site permission, and the
operating system's notification setting. All three are documented, and any one silently blocks delivery.

---

## Functional Cases — Faye configuration

---

### TC-NTF-062: Faye server starts

**User Role:** Admin (shell)
**Priority:** Medium
**Steps:**
1. Run `rackup plugins/redmineflux_notification/faye.ru -E production`.

**Expected Result:**
- The process starts and listens on the expected port without error.
- **Record the process state alongside every later case in this suite** — a "real-time is broken" result while
  Faye is not running is not a defect, it is a missing prerequisite.

---

### TC-NTF-063: Configure the Faye address

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Configure → Redmine Notifications → enter the address, e.g. `http://your_server:9292/faye` → **Apply**.
2. Reload the page.

**Expected Result:**
- The address persists.

---

### TC-NTF-064: Notifications arrive in real time

**User Role:** Actor and Watcher, in separate browsers
**Priority:** High
**Steps:**
1. Watcher sits on any Redmine page without reloading.
2. Actor creates or updates a watched issue.

**Expected Result:**
- The Watcher's notification count and red dot update **automatically, without a reload**, per the KB.
- Confirm by leaving the page untouched — a count that only changes on navigation is not real-time, and would
  be easy to mistake for success.

---

### TC-NTF-065: Real-time delivery reaches only the intended recipient

**User Role:** Actor, Watcher, Uninvolved member (three browsers)
**Priority:** High
**Steps:**
1. Actor updates an issue watched only by Watcher.

**Expected Result:**
- Watcher's counter updates; the Uninvolved member's does not.
- **Inspect what actually arrives over the Faye channel**, not just the rendered counter. A push architecture that
  broadcasts every notification to all connected clients and filters in the browser would deliver other users'
  issue subjects to every logged-in session — a real leak, and one that is invisible from the UI. This is the
  single most important case in the suite.

---

### TC-NTF-066: Real-time survives a reconnect

**User Role:** Watcher
**Priority:** Medium
**Steps:**
1. Interrupt the network briefly, restore it, then have the Actor trigger a notification.

**Expected Result:**
- The client reconnects and resumes receiving, or at minimum the notification is still stored and visible after a
  reload. Nothing is lost.

---

### TC-NTF-067: Stored notifications work regardless of Faye

**User Role:** Admin + Watcher
**Priority:** High
**Steps:**
1. Stop the Faye server, leaving the address configured; trigger a notification; reload the Watcher's page.

**Expected Result:**
- The notification is stored and visible on the bell and the history page.
- Real-time is an enhancement, not the delivery mechanism — losing notifications entirely when Faye is down would
  be a High-severity defect.

---

### TC-NTF-068: Empty Faye address turns real-time off cleanly

**User Role:** Admin + Watcher
**Priority:** Medium
**Steps:**
1. Clear the address field and Apply; trigger a notification.

**Expected Result:**
- No real-time update, no console errors, no repeated failing connection attempts in the browser.
- Notifications are still stored and visible, exactly as the KB describes.

---

## Negative Cases — Faye

---

### TC-NTF-069: Wrong or unreachable Faye address

**User Role:** Admin + Watcher
**Priority:** Medium
**Steps:**
1. Configure an address that is syntactically valid but unreachable; trigger a notification.

**Expected Result:**
- Redmine and the page continue to work normally.
- The failure is **diagnosable** — a connection error in the browser console or in the Redmine log, which is what
  the KB's troubleshooting tells the reader to look for.
- The page must not hang, retry in a tight loop, or block rendering waiting for Faye.

---

### TC-NTF-070: Mixed-content blocking

**User Role:** Watcher
**Priority:** Low
**Steps:**
1. Serve Redmine over HTTPS with an `http://` Faye address.

**Expected Result:**
- The browser blocks the insecure request and the failure is recognisable as such.
- This is a very likely real-world configuration mistake — the KB's example address is `http://` — and without a
  clear signal an administrator will spend a long time debugging a working plugin. Record whether anything in the
  UI or log makes the cause apparent.

---

### TC-NTF-071: Faye endpoint does not leak to unauthenticated clients

**User Role:** Anonymous / an unauthenticated client
**Priority:** High
**Steps:**
1. Connect to the Faye endpoint directly with no Redmine session and subscribe to the available channels.

**Expected Result:**
- No notification content is delivered.
- **Faye is a separate process listening on its own port and is not behind Redmine's session handling by default.**
  If issue subjects can be read by anyone who can reach that port, that is a Critical leak — and it is precisely
  the failure mode a bolt-on push server invites. Record the port's network exposure as part of the result.

---

## Functional Cases — Desktop notifications

---

### TC-NTF-072: Enable desktop notifications

**User Role:** Member
**Priority:** Medium
**Steps:**
1. My Account → Preferences → enable **Notifications** and **Use desktop notifications if my browser supports
   it** → Save.
2. Grant the browser's notification permission for the site.

**Expected Result:**
- Both preferences persist and the browser prompts for, and records, permission.

---

### TC-NTF-073: A desktop notification is delivered

**User Role:** Actor and Watcher
**Priority:** Medium
**Steps:**
1. With the Watcher's browser minimised or on another tab, the Actor updates a watched issue.

**Expected Result:**
- A desktop notification appears identifying the issue, and clicking it reaches the issue or the notification.

---

### TC-NTF-074: Desktop notifications respect the preference

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Disable **Use desktop notifications** while leaving **Notifications** enabled; trigger a notification.

**Expected Result:**
- No desktop popup, but the in-app notification still arrives. The two settings are independent.

---

### TC-NTF-075: Browser permission denied

**User Role:** Member
**Priority:** Low
**Steps:**
1. Deny the browser's notification permission for the site while the preference is enabled; trigger a
   notification.

**Expected Result:**
- No desktop popup, and **the in-app notification is unaffected**.
- No repeated permission prompts and no JavaScript error. A denied browser permission must degrade quietly.

---

### TC-NTF-076: Operating-system notifications disabled

**User Role:** Member
**Priority:** Low
**Steps:**
1. Disable notifications for the browser at the OS level (the KB documents both Windows and macOS) and trigger a
   notification.

**Expected Result:**
- No popup; everything else continues to work.
- Record this explicitly: it is the third independent gate, and it is invisible from inside Redmine, so a user
  reporting "desktop notifications don't work" may have a correctly configured Redmine.

---

### TC-NTF-077: Desktop notification content

**User Role:** Watcher
**Priority:** High
**Steps:**
1. Inspect what a desktop notification actually displays.

**Expected Result:**
- Enough to identify the issue, and **nothing the recipient is not entitled to see**.
- Desktop notifications appear on a screen that may be shared, projected or visible to passers-by, and they
  persist in the OS notification centre outside Redmine's control. Content from a private note appearing here
  would be a meaningful disclosure even though the recipient is a legitimate user.

---

### TC-NTF-078: Desktop notifications at volume

**User Role:** Watcher
**Priority:** Low
**Steps:**
1. Trigger 20 notifications in quick succession.

**Expected Result:**
- The browser handles them without freezing, and they are stacked, collapsed or rate-limited rather than firing
  twenty separate popups that bury the user's screen.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
