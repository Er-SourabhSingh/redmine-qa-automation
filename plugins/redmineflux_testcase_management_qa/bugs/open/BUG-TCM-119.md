# BUG-TCM-119

- Bug ID: BUG-TCM-119
- Production Redmine Issue ID: 125097
- Title: `redmineflux-tcm submit` crashes with a raw unhandled `TypeError` traceback on a malformed mapping file (a `cases` entry that's a string instead of `{testcase_id, testsuite_id}`), instead of the clean "Input error" message every other mapping-file problem produces
- Severity: Low
- Redmine version: N/A (CLI tool, rftc-017 — `redmineflux-tcm-ci` repo, package `redmineflux_tcm`)
- Plugin name: redmineflux-tcm-ci (the CI client CLI, not the Redmine plugin itself)
- Plugin version: 0.1.0
- Environment: Docker `redmine6-redmine-1` (Python 3.11.2), talking to `localhost:3000`
- Browser: N/A (CLI)
- User role: N/A — reproducible by any CLI user regardless of Redmine role
- Date: 2026-10-24

## Steps to reproduce

1. Create a mapping file whose `cases` object has a correctly-shaped key but a **malformed value** — a bare
   string instead of the documented `{testcase_id, testsuite_id}` object:
   ```json
   {"cases": {"test_login_valid": "23"}}
   ```
   (a plausible real mistake — e.g. a user copies a key→id lookup table from elsewhere without reading the exact
   schema, or a hand-written generator script emits the id as a bare value instead of nesting it)
2. `redmineflux-tcm submit --junit <any real JUnit file> --mapping <the file above> --run <id> --env <env>
   --project <id>`.

## Expected result

Per the exact design principle `RFTC-017_EXTERNAL_SPEC_CI_RESULTS_CLI.md`'s own RFTC017-21 already established for
this file ("never a raw traceback" — missing `cases` key and malformed JSON both already produce a clean
`"Input error: ..."` message, exit 2), a malformed `cases` **value** shape should fail the same clean way, not
crash.

## Actual result

A raw, unhandled Python traceback reaches the CLI's own stdout/stderr (exactly where a CI log would show it,
polluting the build output with an internal stack trace instead of an actionable message):

```
Traceback (most recent call last):
  File "/usr/local/bin/redmineflux-tcm", line 8, in <module>
    sys.exit(main())
  File "redmineflux_tcm/__main__.py", line 352, in main
    return args.func(args, s, rep)
  File "redmineflux_tcm/__main__.py", line 84, in cmd_submit
    rows, unmatched = resolve_rows(normalized, mapping)
  File "redmineflux_tcm/junit_to_tcm.py", line 165, in resolve_rows
    "issue_id": case["testcase_id"],
TypeError: string indices must be integers, not 'str'
```
Exit code is `1` (an unhandled Python exception's default), not the documented `2` (USAGE) every other
mapping-file problem in this file correctly returns.

## Root cause (confirmed via code read)

`redmineflux_tcm/junit_to_tcm.py`'s `resolve_rows()`:
```python
cases = mapping["cases"]
...
case = cases.get(key)
if case is None:
    unmatched.append(entry)
    continue
...
rows.append({
    "issue_id": case["testcase_id"],      # <-- crashes here if `case` isn't a dict
    "testsuite_id": case["testsuite_id"],
    ...
})
```
The function validates that `mapping["cases"]` exists and that each requested `key` resolves to *something*
(`case is None` check), but never validates that the resolved `case` value is itself a dict shaped like
`{testcase_id, testsuite_id}` before indexing into it. `tests/test_mapping_contract.py` (the suite that
specifically covers this contract) validates a missing `cases` key, a malformed-JSON file, and `cases` itself
being the wrong type (`{"cases": [1,2,3]}`, i.e. a list) — but never a per-entry **value** shape mismatch, which
is exactly the gap this reproduces.

## Duplicate check

- Duplicate found: No. Checked `bugs/_duplicates.md`/`bugs/_index.md` for "mapping", "traceback", "junit_to_tcm" —
  no existing entry. Distinct from `BUG-TCM-065` (the `python -m client` packaging gap) and `BUG-TCM-118` (the
  TCM plugin's own `bootstrap_run` race condition) — this is a different repo (`redmineflux-tcm-ci`) and a
  different code path entirely.
