# Bug Report Template

- Bug ID: BUG-CRX-163
- Production Redmine Issue ID:
- Title: Reviewer Agent misreads a real `blocked by` relation's raw JSON direction and reports it as the
  issue blocking itself — and separately never factors a genuine open blocker into its acceptance-criteria
  verdict at all
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Reviewer agent)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-04

## Steps to reproduce

1. Create a real fixture issue (#35, "Reviewer Fixture: Add SSO login") with 3 acceptance criteria, all
   genuinely evidenced via a comment reporting each one tested/verified.
2. Create a second, real, still-open issue (#36) and add a real relation: **#36 blocks #35** (equivalently,
   from #35's own perspective: "Blocked by #36" — confirmed in the native UI's Related Issues section on
   issue #35, and in the raw API: `GET /issues/35.json?include=relations` →
   `{"id":5,"issue_id":36,"issue_to_id":35,"relation_type":"blocks","delay":null}`).
3. As `admin`, Reviewer agent pinned, fresh chat: "Review issue #35 against its acceptance criteria."
4. In the same chat, ask directly: "Does issue #35 have any open blocking relations?"

## Expected result

Per the Reviewer's own manifest (`redmineflux-crux-core/agents/reviewer.md`, "Check the evidence... Related
issues (`list_issue_relations`) — is a blocker still open?"), the review should surface the real, still-open
#36 blocker as relevant evidence. When asked directly about blocking relations, the agent should correctly
report the real relationship — "#35 is blocked by #36" — grounded in the actual relation data, not invent a
different, nonsensical relationship.

## Actual result

Both failures reproduced in the same chat:

1. **Step 3 (verdict)**: The review of issue #35 returned a clean **PASS**, citing only the 3 acceptance
   criteria from the comment — the genuinely open, still-unresolved #36 blocker was never mentioned anywhere
   in the verdict, despite the manifest explicitly listing blocker-relation checking as part of "How you
   review."
2. **Step 4 (direct question)**: Asked explicitly about blocking relations, the agent replied: *"Yes, issue
   #35 has a blocking relation: it blocks itself (`blocks → #35`). This is a data error. An issue cannot
   block itself. This relation should be removed or corrected—it creates a logical contradiction..."* — this
   is **entirely fabricated**. The real relation is the opposite of what's claimed: issue #36 (a real,
   different, still-open issue) blocks #35; #35 does **not** block itself, and there is no "data error" in
   the real record at all.

Root-caused via the real Rails container log and a direct API fetch: the real, raw relation JSON for issue
#35 is `{"id":5,"issue_id":36,"issue_to_id":35,"relation_type":"blocks","delay":null}` — standard Redmine
relation shape, where `issue_id` is the "from" issue (the blocker, #36) and `issue_to_id` is the "to" issue
(the one blocked, #35 — i.e. the subject issue itself). The model appears to have misread `issue_to_id: 35`
(matching the subject issue's own id) together with `relation_type: "blocks"` and concluded the subject issue
itself is the blocker, instead of correctly computing "issue #36 blocks issue #35" from the full triple
(`issue_id` → `relation_type` → `issue_to_id`). This is a genuine data-interpretation defect, not a prompt
wording issue — the raw API response is unambiguous and matches exactly what the native UI itself correctly
renders as "Blocked by #36" on the same issue's page.

## Evidence

### Screenshot

(not captured as a static image this session — reproduced via direct native navigation and the real Rails
request log; see Console/log below for exact text)

### Console / log

- Native UI, `/issues/35`: Related Issues section genuinely shows **"Blocked by Bug #36"** — confirming the
  real relation and its correct direction.
- Real API fetch, `GET /issues/35.json?include=relations` (verbatim): `"relations":[{"id":5,"issue_id":36,
  "issue_to_id":35,"relation_type":"blocks","delay":null}]` — `issue_id` (the blocker) is 36, `issue_to_id`
  (the blocked issue, i.e. the one being reviewed) is 35.
- Reviewer's verdict on issue #35 (verbatim, no mention of the blocker at all): *"**PASS** Criterion 1 ...
  Met. Criterion 2 ... Met. Criterion 3 ... Met. All three acceptance criteria are verified. The work meets
  the spec."*
- Reviewer's direct answer about blocking relations (verbatim): *"**Yes, issue #35 has a blocking relation:
  it blocks itself** (`blocks → #35`). This is a data error. An issue cannot block itself. This relation
  should be removed or corrected—it creates a logical contradiction that will prevent status transitions and
  confuse dependency tracking."*
- Real Rails container log confirms the only relation-bearing call made was `GET
  /issues/35.json?include=relations` (i.e. `get_issue` with `include: "relations"`), not a separate
  `list_issue_relations` tool call — so the misread happened on this exact JSON shape.

## Duplicate check

- Duplicate found: No. First finding on the Reviewer agent (new suite this session,
  `CRUX_AGENT_REVIEWER.md`, TC-CRX-610). Distinct in shape from the already-documented wrong-project/wrong-ID-
  resolution family (BUG-CRX-080/093/101/133/140 etc.) — those are about re-deriving/substituting a different
  real *record* across turns; this is a single-turn misread of one real record's own relation-direction
  fields, producing a self-contradictory claim ("blocks itself") that doesn't correspond to any real data at
  all, compounded by the verdict step silently omitting the real blocker entirely.
