# Test Cases — Redmineflux Knowledge Base — Public URL Sharing, Token Security & Rate Limiting

> Source: vendor KB — "How to Use Public URL Sharing", "Security" (Rate Limiting via Rack::Attack, Token Security),
> "Public Access Settings", Troubleshooting, FAQ Q6.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Knowledge Base Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_knowledge_base_qa

## Environment preconditions — read before running anything here

The KB states three conditions that silently invalidate results:

1. **Rate limiting runs in production and test environments only.** It is disabled in development.
2. **`Rails.cache` must be a shared store**, not `MemoryStore`, or throttle counters are not shared and limits
   never trigger.
3. **`rack-attack ~> 6.7` must be installed.**

If any condition fails, mark TC-RKB-119 onward **Not Executed — environment unsuitable** rather than passing them.
A "pass" recorded with the limiter switched off documents protection that is not actually running, which is worse
than no result. Record the environment, cache store and gem version at the top of every run.

Also note: **public pages are browser-cached for 10 minutes** via Cache-Control. When testing revocation, always use
a fresh session or a cache-bypassing request, or a revoked link will appear to still work.

Testing must be done from a genuinely unauthenticated client — a private window, or a separate browser with no
Redmine session. Testing while logged in is the easiest way to get a false pass across this entire suite.

---

## Functional Cases — Enabling and using a public URL

---

### TC-RKB-109: Enable public access on a published page

**User Role:** Member with `manage_knowledgebase_pages`
**Priority:** High
**Steps:**
1. Open a published page → **Public URL** → **Enable Public Access**.

**Expected Result:**
- A URL is generated containing a token, and can be copied from the modal.

---

### TC-RKB-110: Token matches the documented format

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Inspect the generated token.

**Expected Result:**
- **64 hexadecimal characters**, consistent with `SecureRandom.hex(32)` as documented.
- A shorter or non-random-looking token would make shared pages enumerable and is a Critical finding in itself.

---

### TC-RKB-111: The public URL works unauthenticated

**User Role:** Unauthenticated visitor
**Priority:** High
**Steps:**
1. Open the URL in a private window with no Redmine session.

**Expected Result:**
- The published page renders read-only, with no login prompt.

---

### TC-RKB-112: The public view is read-only

**User Role:** Unauthenticated visitor
**Priority:** High
**Steps:**
1. Inspect the public page for Edit, Publish, Delete, Versions, commenting, and any sidebar action menus.

**Expected Result:**
- None are present. The KB specifies read-only, no editing and no commenting.
- Absence in the UI is necessary but not sufficient — TC-RKB-130 tests the endpoints.

---

### TC-RKB-113: Only the published version is served

**User Role:** Member then unauthenticated visitor
**Priority:** High
**Steps:**
1. Publish version 1 and share it publicly.
2. Edit the page so an unpublished draft exists, and let auto-save run.
3. Reload the public URL (bypassing cache).

**Expected Result:**
- The public view shows **version 1**, not the in-progress draft.
- **Leaking an unpublished draft to unauthenticated visitors would be the worst possible failure of this feature**
  and is exactly the case a naive "render current content" implementation would fail.

---

### TC-RKB-114: Public access cannot be enabled on a page with no published version

**User Role:** Member
**Priority:** High
**Steps:**
1. On a never-published draft, look for the Public URL action.
2. Send the enable-public-access request **directly** for that page.

**Expected Result:**
- Not offered **and** refused at the endpoint. The KB states public access can only be enabled on pages with at
  least one published version.

---

### TC-RKB-115: Public access cannot be enabled on an explicitly unpublished page

**User Role:** Member
**Priority:** High
**Steps:**
1. Unpublish a page, then attempt to enable public access through the UI and directly.

**Expected Result:**
- Refused at both, per the KB's explicit statement.

---

### TC-RKB-116: View count is tracked

**User Role:** Member + unauthenticated visitor
**Priority:** Low
**Steps:**
1. Note the page's view count, load the public URL several times from a fresh session, re-check.

**Expected Result:**
- The count increases as documented. It must not count authenticated internal views if it is presented as a public
  view count — record what it actually measures.

---

### TC-RKB-117: Browser caching behaves as documented

**User Role:** Unauthenticated visitor
**Priority:** Medium
**Steps:**
1. Inspect the public response's `Cache-Control` headers.

**Expected Result:**
- A 10-minute cache window, per the KB.
- **The response must not be cacheable by shared/intermediary caches in a way that would serve it after
  revocation** — record the exact directives, since this interacts directly with TC-RKB-118.

---

### TC-RKB-118: Disabling public access revokes the URL immediately

**User Role:** Member, then unauthenticated visitor
**Priority:** High
**Steps:**
1. Confirm the public URL works.
2. **Public URL** → **Disable Public Access**.
3. Retry the same URL from a **fresh** session that cannot be serving the 10-minute browser cache.

**Expected Result:**
- The URL stops working at once and the token is cleared from the database, exactly as the KB states.
- Revocation is the only control a sharer has after distributing a link; any delay or continued service is a
  High-severity defect. Be rigorous about the cache, or this case will report a false failure.

---

## Functional Cases — Rate limiting

> Only meaningful under the environment preconditions above.

---

### TC-RKB-119: Per-minute throttle triggers

**User Role:** Unauthenticated client
**Priority:** High
**Steps:**
1. With the limit at its default 30/minute, issue 35 GET requests to a public URL from one IP within a minute.

**Expected Result:**
- Requests beyond the limit receive **429 Too Many Requests** with a **Retry-After** header, per the KB.

---

### TC-RKB-120: Hourly aggressive throttle triggers

**User Role:** Unauthenticated client
**Priority:** Medium
**Steps:**
1. Stay under the per-minute limit but exceed 100 requests in an hour from one IP.

**Expected Result:**
- 429 with Retry-After once the hourly limit is passed.

---

### TC-RKB-121: Throttling is per IP

**User Role:** Two unauthenticated clients on different IPs
**Priority:** Medium
**Steps:**
1. Exhaust the limit from IP A, then request from IP B.

**Expected Result:**
- B is unaffected. Throttling is per IP address, not global — a global counter would let one scraper deny the
  feature to every legitimate reader.

---

### TC-RKB-122: Non-GET requests to public URLs are blocked

**User Role:** Unauthenticated client
**Priority:** High
**Steps:**
1. Send POST, PATCH, PUT and DELETE requests to a `/kb/public/*` URL.

**Expected Result:**
- All blocked automatically, per the KB. Combined with TC-RKB-130, this is the guarantee that a public token is
  read-only at the transport level.

---

### TC-RKB-123: Known bot user agents are blocked

**User Role:** Unauthenticated client
**Priority:** Medium
**Steps:**
1. With **Block bots** enabled, request the public URL with user agents `curl`, `wget`, `python-requests` and
   `scrapy`.
2. Repeat with an ordinary browser user agent.

**Expected Result:**
- The four named agents are blocked; the browser agent is served.
- Note honestly in the results that this is trivially bypassed by changing the user agent string — it is a
  scraping speed bump, not an access control, and should not be relied on as one.

---

### TC-RKB-124: Disabling bot blocking

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Disable **Block bots** and repeat TC-RKB-123.

**Expected Result:**
- Those agents are now served, subject to the normal throttles.

---

### TC-RKB-125: Throttle limits are configurable and take effect within 60 seconds

**User Role:** Admin + unauthenticated client
**Priority:** Medium
**Steps:**
1. Lower the per-minute limit, save, wait 60 seconds, and re-test.

**Expected Result:**
- The new limit applies without a server restart, per the KB.

---

### TC-RKB-126: IP allowlist bypasses throttling

**User Role:** Admin + client on the allowlisted IP
**Priority:** Medium
**Steps:**
1. Add the test client's IP to the allowlist; exceed the per-minute limit.

**Expected Result:**
- No 429. The allowlist bypasses rate limiting, as documented.

---

### TC-RKB-127: IP blocklist always rejects

**User Role:** Admin + client on the blocklisted IP
**Priority:** High
**Steps:**
1. Add the client's IP to the blocklist and make a single request.

**Expected Result:**
- Rejected immediately, regardless of how few requests were made.
- Then add the same IP to **both** lists and retry: the precedence must be deterministic, and **blocklist should
  win** (paired with TC-RKB-092). An allowlist entry silently overriding a block would defeat the blocklist.

---

## Negative Cases — token security

---

### TC-RKB-128: Invalid token format is rejected before any database lookup

**User Role:** Unauthenticated client
**Priority:** High
**Steps:**
1. Request public URLs with: a too-short token, a token containing non-hex characters, an empty token, and a
   64-character token that is valid in form but does not exist.

**Expected Result:**
- All refused with a not-found style response.
- **The response and its timing must not distinguish "malformed" from "well-formed but non-existent"** in a way
  that enables enumeration — the KB states format is validated before the lookup precisely to prevent this.
- The error must not disclose the page title, project name or whether the page exists.

---

### TC-RKB-129: A token for one page does not reach another

**User Role:** Unauthenticated client
**Priority:** High
**Steps:**
1. With a valid token for page X, attempt to request page Y by substituting identifiers while keeping the token.

**Expected Result:**
- Refused. A token authorises exactly one page, not unauthenticated access generally.
- A token that becomes a general read key for the knowledge base would be Critical.

---

### TC-RKB-130: The public token confers no write access

**User Role:** Unauthenticated client
**Priority:** High
**Steps:**
1. Using the public token and no session, send requests directly for: edit page, publish, unpublish, delete,
   restore version, create node, and regenerate the public token.

**Expected Result:**
- Every one refused.
- A public token that can unpublish or delete the page — or mint its own replacement — would be Critical.

---

### TC-RKB-131: The public view exposes no internal data

**User Role:** Unauthenticated visitor
**Priority:** High
**Steps:**
1. Inspect the public page's full HTML source and network responses for: the sidebar tree, other page titles,
   space names, version history, author email addresses, internal user names, issue subjects from `#` mentions,
   and any API payloads.

**Expected Result:**
- Only the shared page's published content is present.
- **Other page titles or the space tree leaking into the public view would disclose the shape of the project's
  internal documentation** to anyone holding a single link — a real leak that is invisible from the rendered page
  and only found by reading the source.

---

### TC-RKB-132: Public access when the master toggle is off

**User Role:** Admin, then unauthenticated visitor
**Priority:** High
**Steps:**
1. Disable **Enable public access** in plugin settings.
2. Retry an existing, previously working public URL from a fresh session.

**Expected Result:**
- Refused. The master toggle overrides any per-page token — it is the administrator's kill switch for the entire
  unauthenticated surface (paired with TC-RKB-085).

---

### TC-RKB-133: Enabling public access without permission

**User Role:** Member with `view_knowledgebase` only
**Priority:** High
**Steps:**
1. Confirm the Public URL action is not offered.
2. Send the enable-public-access request **directly**.

**Expected Result:**
- Refused with 403. The KB restricts this to `manage_knowledgebase_pages` holders.
- **Anyone who can mint a token can publish internal documentation to the open internet**, so an unenforced
  endpoint here is High severity even if every other case passes.

---

### TC-RKB-134: Public URL after the page moves or the project changes state

**User Role:** Member + Admin, then unauthenticated visitor
**Priority:** Medium
**Steps:**
1. With a public URL active, in turn: move the page to another folder; close the project; archive the project;
   make a public project private. Retry the link after each.

**Expected Result:**
- Moving the page should not break the link — the token addresses the page, not its path.
- **An archived project's page still being served publicly is a defect**: archiving is expected to remove access
  entirely.
- For the others, record the behaviour; an administrator locking down a project would reasonably expect public
  links to die with it, and if they do not, that belongs in the plugin memory file.

---

### TC-RKB-135: Indexing exposure

**User Role:** Unauthenticated visitor
**Priority:** Low
**Steps:**
1. Inspect the public page's response headers and markup for indexing directives.

**Expected Result:**
- Record whether a `noindex` directive is present. Without one, a shared documentation page can be crawled and
  indexed, turning "anyone with the link" into "anyone searching" — worth recording even though it is a
  configuration finding rather than a code defect.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
