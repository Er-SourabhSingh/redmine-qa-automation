# BUG-TCM-065

- Bug ID: BUG-TCM-065
- Production Redmine Issue ID: #123559 (https://flux.zehntech.com/issues/123559) — assigned to Vaishnavi Bhawsar, target version Testcase Management plugin Release 7.2.0
- Title: `redmineflux-tcm-ci` 0.1.0 — the documented `python -m client` backward-compat shim is completely unusable on a real `pip install`; it cannot even be imported
- Redmine version: N/A (standalone CI tool, not a Redmine plugin)
- Plugin name: `redmineflux-tcm-ci` / `redmineflux_tcm` package (rftc-017 — "Ship the CI results CLI")
- Plugin version: 0.1.0
- Environment: Docker `redmine6-redmine-1` (Python 3.11.2), fresh `pip install -e .` from a clean checkout
- Browser: N/A (CLI tool)
- User role: N/A
- Date: 2026-10-15

## Steps to reproduce

1. Fresh checkout of `redmineflux-tcm-ci`. Run `pip install -e .` (or `pip install .`) exactly as the README
   instructs.
2. Run `python -m client --version`.
3. Run `python -c "from client.tcm_client import TcmClient"`.

## Expected result

Per `README.md`: *"The old `python -m client …` still works for one minor version but prints a
`DeprecationWarning` (removed in 0.2.0)."* Per `CHANGELOG.md`: *"Backward-compat shim `client/`: `python -m
client` and `from client.tcm_client import …` keep working for one minor version (removed in 0.2.0), each
emitting a `DeprecationWarning` to stderr."* So both commands should run (with a deprecation warning on stderr),
not fail.

## Actual result

Both fail outright — the `client` package cannot be imported at all after a real install:

```
$ python -m client --version
/usr/bin/python3: No module named client

$ python -c "from client.tcm_client import TcmClient"
Traceback (most recent call last):
  File "<string>", line 1, in <module>
ModuleNotFoundError: No module named 'client'
```

This is not an environment fluke — the project's **own shipped test suite** (`tests/test_cli_smoke.py`) already
has two tests that assert exactly this behavior, and both fail the same way when actually run against a real
install:

```
tests/test_cli_smoke.py::test_deprecated_client_shim_still_runs FAILED
tests/test_cli_smoke.py::test_deprecated_client_submodule_import FAILED
========================= 2 failed, 40 passed in 0.33s =========================
```

(Full run: 40/42 tests pass — every other exit-code, config-precedence, mapping-contract, JSON-output,
security-holdout, and Phase-2-degradation test passes cleanly. This is an isolated packaging defect, not a wider
quality problem with the client.)

## Root cause

`pyproject.toml`:

```toml
[tool.setuptools]
packages = ["redmineflux_tcm"]
```

This is an **explicit** package list — not auto-discovery — so `pip install` only ever installs the
`redmineflux_tcm` directory. The `client/` directory (the documented backward-compat shim) sits right next to it
in the repo but is **never named in `packages`**, so no real `pip install` — editable or not — ever makes it
importable. Confirmed directly: even after physically copying the `client/` directory into the exact same source
tree being installed and re-running `pip install -e .`, `import client` still raises `ModuleNotFoundError` —
proving the gap is in the packaging declaration itself, not a missing file.

The shipped tests likely only ever "passed" for the developer when run via `pytest` invoked from the repo root
with no real install on `PYTHONPATH` (where `client/` resolves as a plain top-level directory import, independent
of packaging) — masking the defect in the dev's own environment while a real `pip install .` (exactly what the
README instructs every consumer to run) never exposes it.

## Suggested fix

Either:
- **(a)** Add `"client"` to `packages = ["redmineflux_tcm", "client"]` in `pyproject.toml` so the shim actually
  ships, or
- **(b)** If the shim is meant to be dropped already, update the README/CHANGELOG to stop promising it works and
  remove the two now-permanently-failing tests, or
- **(c)** If the intent is a thin stderr-deprecation-warning wrapper rather than the whole duplicated package,
  make `client/__init__.py` simply re-export from `redmineflux_tcm` with the warning — but that package still
  needs to be listed in `packages` (or use `find_packages()`/`find:` so sibling top-level packages are picked up
  automatically) for it to be importable at all.

(a) is the minimal fix matching current intent; (b) is the honest fallback if 0.2.0 is close enough that shipping
the shim isn't worth it.

## Evidence

### Console / log

```
$ python3 -m pytest tests/ -v
...
tests/test_cli_smoke.py::test_deprecated_client_shim_still_runs FAILED   [ 19%]
tests/test_cli_smoke.py::test_deprecated_client_submodule_import FAILED  [ 21%]
...
=================================== FAILURES ===================================
____________________ test_deprecated_client_shim_still_runs ____________________
    r = subprocess.run([sys.executable, "-m", "client", "--version"], ...)
>   assert r.returncode == 0
E   AssertionError: assert 1 == 0
E   ... stderr='/usr/bin/python3: No module named client\n' ...
___________________ test_deprecated_client_submodule_import ____________________
>   assert r.returncode == 0, r.stderr
E   ModuleNotFoundError: No module named 'client'
========================= 2 failed, 40 passed in 0.33s =========================
```

## Duplicate check

- Duplicate found: No
- Checked `bugs/_index.md` and `bugs/_duplicates.md` — no existing bug covers `redmineflux-tcm-ci`/rftc-017 at
  all; this is the first bug filed against this companion tool (as opposed to the `redmineflux_testcase_management`
  plugin itself).

---

## Retest — 2026-10-19

**CONFIRMED FIXED.** `pyproject.toml` now lists `packages = ["redmineflux_tcm", "client"]`. Fresh `pip install -e
.` (forced reinstall) then `python -m client --version` → prints `DeprecationWarning: \`client\` is deprecated;
use \`redmineflux-tcm\` / \`python -m redmineflux_tcm\` (removed in 0.2.0).` followed by `redmineflux-tcm 0.1.0`.
Exactly the documented behavior. Closing.
