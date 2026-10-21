# BUG-TCM-073

- Bug ID: BUG-TCM-073
- Production Redmine Issue ID: #124009 (https://flux.zehntech.com/issues/124009) — assigned to Vaishnavi Bhawsar, priority Low, Defect Type Usability / Defect Severity Low-severity / Defect priority Low. Linked to production Testcase #124007 ("Converted search buttons (Todos/Milestones/Test Plans/Test-Suite tree) must be keyboard-reachable native buttons") in Run #612, environment Win + Chrome + Ver6, suite #443 (RFTC-011 — UI Modernization Wave 0).
- Title: Test-Suite tree's search button is a `<span role="button" tabindex="-1">`, not keyboard-reachable — the last of 7 original fake-submit instances across the plugin, every other one already fixed this release
- Redmine version: 6.x (Docker `localhost:3000`, Postgres)
- Plugin name: redmineflux_testcase_management
- Plugin version: master (post-7.1.0, pre-7.2.0 — rftc-011 Waves 0/2/4/5/6/7/8 merged)
- Environment: Docker `redmine6-redmine-1`, project `RFTC-016 CI Ingest QA` (id=2)
- Browser: Chrome (via Playwright)
- User role: Admin
- Date: 2026-10-19
- Severity: Low (accessibility/keyboard-navigation, not security — but a confirmed, reproducible, currently-live defect, not a theoretical gap)

## Steps to reproduce

1. Open the Test-Suite tree (`/test_suites?project_id=<id>`).
2. Try to reach the "Search" control using only the Tab key (no mouse).
3. Inspect the element: `document.querySelectorAll('[role=button]')` shows a `<span role="button">Search</span>` with `tabindex="-1"`.

## Expected result

Per the plugin's own rftc-011 "UI modernization" effort (§26, "native controls over custom JS"), every one of the originally-7 `<span role="button">` fake-submit search controls across the plugin should be a native `<button type="submit">`, keyboard-reachable by default. This release (Waves 2, 5, 6) has already converted 6 of the 7: Runs & Results list, Milestones (×2), Test Plans (×2), Todos.

## Actual result

**FAIL — the 7th and last instance.** The Test-Suite tree's own search button (`test_suites/index.html.erb`) is still `<span role="button" tabindex="-1">Search</span>` — not a native button, and `tabindex="-1"` explicitly removes it from the keyboard tab order, so a keyboard-only user cannot reach it at all (worse than merely "not semantically a button" — it is structurally unreachable). Confirmed live: every other converted screen's search button is a genuine `<button type="submit">` with no `tabindex` override (keyboard-reachable by default); this is the one screen left on the old pattern.

Every rftc-011 wave from Wave 2 onward explicitly tracks this exact remaining count ("plugin-wide fake-submit count = 1, `test_suites/index.html.erb`, untouched — Wave 3's screen, not this wave's") but none of Waves 2/4/5/6/7/8 actually fixes it, and no Wave-1/Wave-3-specific spec document exists in this QA cycle's reading set to confirm whether fixing it was ever scheduled or deliberately deferred.

## Suggested fix

Convert `test_suites/index.html.erb`'s search `<span role="button" tabindex="-1">` to a native `<button type="submit">`, matching the exact pattern already applied to the other 6 converted views this release (Runs & Results, Milestones, Test Plans, Todos) — same visual result, same submit behavior, but keyboard/focus/screen-reader accessible by default with no hand-written `onclick`/`onkeydown` re-implementation needed.

## Evidence

```js
// document.querySelectorAll('[role=button]') on /test_suites?project_id=rftc-016-ci-qa
[
  { tag: "SPAN", text: "", tabindex: "0" },
  { tag: "SPAN", text: "", tabindex: "0" },
  { tag: "SPAN", text: "Search", tabindex: "-1" }   // <- the search button; -1 = removed from tab order entirely
]
```

## Duplicate check

- Duplicate found: No
- Checked `bugs/_index.md` and `bugs/_duplicates.md` — no existing bug covers this specific remaining instance. This is the same underlying anti-pattern class the rftc-011 waves already fixed 6 other instances of this release, just never reached on this one screen.

## Retest — 2026-10-21 (FIXED)

Retested against `localhost:3000` after the user pulled updated plugin code into `C:\redmine v6\plugins` and the
stack was restarted. Opened `/test_suites?project_id=rftc-016-ci-qa` and inspected the search control directly:

```js
document.querySelectorAll('button')  // filtered to "Search" text
→ [{ tag: "BUTTON", type: "submit", text: "Search" }]
```

The Search control is now a genuine `<button type="submit">`, not a `<span role="button" tabindex="-1">` — no
`tabindex` override, keyboard-reachable by default like the other 6 already-converted screens. **Verdict:
FIXED.** Moving this bug to `bugs/closed/`.
