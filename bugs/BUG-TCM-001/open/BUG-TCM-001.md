# BUG-TCM-001: "Confirm Removal" popup — button shows `Translation missing: en.button_remove`

**Plugin:** Redmineflux Testcase Management v6.2.0
**Severity:** Medium
**Status:** Open
**Affects:** All languages (root cause is missing translation key in en.yml)
**Discovered:** 2026-05-20 — EN language baseline testing

---

## Description

The "Confirm Removal" popup (`#custom-confirmation-popup`) used when removing a test case from a test suite shows a raw Rails translation-missing string as the confirm button label:

```
Translation missing: en.button_remove
```

The Cancel button shows correctly as "Cancel".

---

## Steps to Reproduce

1. Navigate to Test Cases section of a project with the plugin enabled
2. Select a test case checkbox in a test suite
3. Right-click → select "Remove Testcase" from the context menu
   (or trigger the confirmation popup via any "Remove" action on a test case)
4. Observe the confirm button label

---

## Expected

Confirm button should display a valid English label such as "Remove" or "Confirm".

---

## Actual

```
Button text: "Translation missing: en.button_remove"
```

Popup HTML:
```html
<button id="cancel-remove">Cancel</button>
<button id="confirm-remove">Translation missing: en.button_remove</button>
```

---

## Root Cause

The translation key `button_remove` does not exist in the plugin's `en.yml` locale file.
The `window.I18n_TC` object (834 keys loaded) contains `button_remove_testcase` and `button_remove_all_testcase` but **no** `button_remove` key.

---

## Impact

- Affects all languages — since English (en) is the fallback, all locales fall back to this missing key
- The popup is unusable/unprofessional for all users regardless of language
