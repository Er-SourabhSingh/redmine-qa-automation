# Bug Report Template

- Bug ID: BUG-PLT-022
- Production Redmine Issue ID: #121712
- Title: Tags field: clicking a different chip's × while text is still uncommitted in the entry box silently fails to remove that chip and instead commits the leftover text as an unwanted new tag
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_platform
- Plugin version: `redmineflux_platform` branch, current tip
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, post-upgrade)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-30

## Steps to reproduce

1. Open any Organization or Contact edit form (e.g. `/redmineflux_platform/list/organizations/1/edit`), which already has at least 2 existing tags as chips (e.g. "plt-qa-tag-enter", "plt-qa-tag-comma").
2. Click into the "Add a tag" entry box and type some text, but do **not** press Enter or comma, and do not click a suggestion — leave it as uncommitted typed text (e.g. type "test-repro").
3. Without clearing the entry box, click the × ("Remove ...") button on a *different*, already-existing chip (e.g. "Remove plt-qa-tag-comma").

## Expected result

- The clicked chip ("plt-qa-tag-comma") is removed, exactly as it is when the entry box is empty. The uncommitted text in the entry box is the tester's business, not something the removal action should silently act on.

## Actual result

- The clicked chip is **not removed** — it is still present after the click.
- Instead, the uncommitted text from the entry box is silently added as a **new, unintended tag chip**.

Reproduced cleanly twice in a row with different target chips, confirming it is not a one-off automation timing artifact:

| Trial | Entry box text | Target × clicked | Result |
|---|---|---|---|
| 1 | `P` | Remove plt-qa-tag-enter | `plt-qa-tag-enter` still present; new chip `P` added |
| 2 | `test-repro` | Remove plt-qa-tag-comma | `plt-qa-tag-comma` still present; new chip `test-repro` added |

### Root cause (confirmed from source)

`assets/javascripts/platform.js`, inside `buildTagField(input)`:

```js
entry.addEventListener('blur', function () {
  // What was typed and not committed is still what the reader meant.
  if (entry.value.trim()) { add(entry.value); }
  closeMenu();
});
```

and:

```js
function render() {
  chips.innerHTML = '';
  chosen.forEach(function (tag) {
    var chip = document.createElement('span');
    ...
    var remove = document.createElement('button');
    ...
    remove.addEventListener('click', function (event) {
      event.stopPropagation();
      drop(tag);
    });
    chip.appendChild(remove);
    chips.appendChild(chip);
  });
  sync();
}
```

Clicking a chip's × button moves focus away from `entry` first. The browser fires `blur` on `entry` *before* the button's own `click` event completes. The `blur` handler calls `add(entry.value)`, which pushes the leftover text onto `chosen` and calls `render()` — and `render()` does `chips.innerHTML = ''` and rebuilds **every** chip, including the very `<button>` the user is in the middle of clicking. That button node is now detached from the DOM before its own `click` event fires, so the pending `click` never reaches a live `drop(tag)` call — the removal is silently swallowed, while the blur-triggered `add()` still goes through.

The `blur`-commits-typed-text behavior (comment: *"What was typed and not committed is still what the reader meant"*) is a deliberate design choice on its own, and is not being disputed here — the bug is that this same blur handler re-renders (and thereby detaches) the exact control the user's click was already in flight toward, so one user action produces two wrong outcomes at once: the intended removal is dropped, and an unintended tag is added instead.

Confirmed the underlying record was never affected — the form was cancelled (not saved), and the database still shows only the original `PLT-BASELINE` tag on this Organization afterward.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-PLT-022/tag-remove-swallowed-phantom-tag-added.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-022/retest-yyyy-mm-dd-pass.png)

### Console / log

- No JS error thrown — a silent race between `blur` and `click`, not a crash.

## Duplicate check

- Duplicate found: No — distinct from BUG-PLT-019/020/021 (sorting, member-picker filter, audit labels); this is specific to the Tags chip control's blur/click race.

## Production report

Reported to production 2026-09-30 as **#121712** (project `ztflux`, tracker Bug, Priority Low, Defect Type Functional, Defect Severity Low-severity, Defect priority Low, assigned Prashant Chaurasia). Linked via `report_defect` to testcase #121706 (`Entity CRUD and Field Validation`, Feature #120043) / Run #586 / environment `Win + Chrome + Ver6`; testcase result marked Failed with defect #121712 attached.
