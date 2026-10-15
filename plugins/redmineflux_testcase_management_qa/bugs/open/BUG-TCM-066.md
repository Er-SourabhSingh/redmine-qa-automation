# BUG-TCM-066

- Bug ID: BUG-TCM-066
- Production Redmine Issue ID: #123563 (https://flux.zehntech.com/issues/123563) — assigned to Vaishnavi Bhawsar, target version Testcase Management plugin Release 7.2.0
- Title: GitHub Actions recipes (rftc-038) install the CLI via `pip install .` instead of the pinned `git+https` URL every other platform uses — broken if a consumer actually copies the file as instructed
- Redmine version: N/A (standalone CI recipe, not a Redmine plugin)
- Plugin name: `redmineflux-tcm-ci` recipes (rftc-038 — "CI platform recipes")
- Plugin version: 0.1.0
- Environment: static analysis of `.github/workflows/tcm.yml` / `tcm-full.yml`, cross-checked against the repo's own `scripts/lint_recipes.sh`
- Browser: N/A
- User role: N/A
- Date: 2026-10-15

## Steps to reproduce

1. Run the repo's own lint script: `bash scripts/lint_recipes.sh`.
2. Follow `.github/workflows/tcm.yml`'s own top-of-file instructions literally: *"Copy this file into your
   repo at `.github/workflows/tcm.yml` and adjust the four `TCM_*` values + your test command."*
3. Push to the copied-into repo and let the "Install the TCM CLI (pinned) + test deps" step run.

## Expected result

Per `CI-RECIPES.md`'s own documented contract (point 1, "what every recipe does"): *"Install the pinned CLI
(`pip install "redmineflux-tcm @ git+…@v0.1.0"`)... The install is pinned to an immutable tag because the job
later receives the secret — never run unpinned third-party code in a secret-bearing job."* Every platform's
recipe should install the `redmineflux-tcm` CLI this same pinned way, matching GitLab/CircleCI/Bitbucket/Jenkins.

## Actual result

The repo's own lint script fails on exactly this:

```
== 3. Contract checks ==
FAIL: .github/workflows/tcm.yml installs the CLI from an UNPINNED git URL (pin @<tag>/<sha>)
FAIL: .github/workflows/tcm-full.yml installs the CLI from an UNPINNED git URL (pin @<tag>/<sha>)
```

Both GitHub Actions recipes do `pip install .` (a **local, relative** install) instead of the pinned URL every
other platform uses:

```yaml
# .github/workflows/tcm.yml, "Install the TCM CLI (pinned) + test deps" step
python -m pip install --upgrade pip
# Install from the commit actions/checkout already brought into the
# workspace — a fresh `pip install git+https://...` against this
# private repo fails on hosted runners (no credentials beyond the
# one-off token actions/checkout itself used).
pip install .
pip install -r sample-project/requirements.txt   # <- your test deps
```

Confirmed **every other platform correctly pins the CLI** (2 occurrences each, matching their Phase-1 + Phase-2
jobs):

```
.gitlab-ci.yml / .gitlab-ci.full.yml:        pip install "redmineflux-tcm @ git+https://github.com/zehntech/redmineflux-tcm-ci@v0.1.0"
.circleci/config.yml / config.full.yml:      pip install "redmineflux-tcm @ git+https://github.com/zehntech/redmineflux-tcm-ci@v0.1.0"
bitbucket-pipelines.yml / .full.yml:         pip install "redmineflux-tcm @ git+https://github.com/zehntech/redmineflux-tcm-ci@v0.1.0"
```

(Jenkins's `pip install -q .` is a different, non-bug situation — see Root cause below.)

## Root cause

The GitHub Actions recipe's own comment explains the `pip install .` choice: a fresh `pip install
git+https://...` against **this private repo** fails on a **hosted GitHub Actions runner** (no credentials beyond
the one-off `actions/checkout` token). That reasoning is valid **only when this repo's own CI is testing
itself** (dogfooding) — `actions/checkout@v4` has already cloned this exact repo into the workspace, so `pip
install .` installs the CLI from the checkout that's already there.

But the file's own top-of-file instructions explicitly tell a **consumer** to copy this file into **their own,
unrelated repo**. Once copied there, `actions/checkout@v4` checks out the **consumer's** repo, not
`redmineflux-tcm-ci` — so `pip install .` tries to install *the consumer's own project* as a Python package, not
this CLI at all. The `redmineflux-tcm` console command is never installed, and the very next step ("Submit
results to TCM") fails outright with "command not found" (or, if the consumer's repo happens to have its own
unrelated `pyproject.toml`, installs something else entirely).

**Jenkins is not the same bug**, despite also using `pip install -q .`: `jenkins/README.md` describes it as a
**self-contained local lab tied to this repo's own demo** ("Everything is reproducible from this folder"), not a
"copy this file into any repo" recipe like the other four — so running `pip install .` against its own checkout
is the intended design there, not a packaging mistake.

**Scope**: confirmed narrowly isolated to the two GitHub Actions files. GitLab, CircleCI, and Bitbucket — the
other three "copy into your own repo" platforms — all correctly pin the CLI already.

## Suggested fix

Replace `pip install .` in both `.github/workflows/tcm.yml` and `.github/workflows/tcm-full.yml` with the same
pinned pattern the other three platforms use:

```yaml
pip install "redmineflux-tcm @ git+https://github.com/zehntech/redmineflux-tcm-ci@v0.1.0"
```

If the private-repo-auth problem described in the current comment is real for *this repo's own* self-test
workflow, solve that differently — e.g. keep a **separate, repo-internal** self-test workflow (not shipped as
the public "copy this" recipe) that uses `pip install .`, and make the actual shipped `.github/workflows/tcm.yml`
match the other platforms' pinned-URL pattern, since `redmineflux-tcm-ci` is confirmed to already have a public
remote (`zehntech/redmineflux-tcm-ci`, created per rftc-017's own journal) that a real consumer's hosted runner
can reach without special credentials.

## Evidence

### Console / log

```
$ bash scripts/lint_recipes.sh
== 1. Secret-leak holdout (sacred) ==
OK:   no literal key / --api-key / key= in any recipe
== 2. Negative rules (no leak-enabling debug) ==
OK:   no set -x / printenv / pip -v / verbose HTTP
== 3. Contract checks ==
FAIL: .github/workflows/tcm.yml installs the CLI from an UNPINNED git URL (pin @<tag>/<sha>)
FAIL: .github/workflows/tcm-full.yml installs the CLI from an UNPINNED git URL (pin @<tag>/<sha>)
...
RECIPE LINT FAILED
```

All 8 recipe YAML files (GitHub/GitLab/CircleCI/Bitbucket, Phase 1 + 2 each) were also confirmed syntactically
valid YAML via `yaml.safe_load` — the defect is semantic (wrong install source), not a parse error.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_index.md` and `bugs/_duplicates.md` — no existing bug covers the CI platform recipes
  (`redmineflux-tcm-ci`'s `rftc-038`) at all; `BUG-TCM-065` is the only other bug filed against this companion
  repo, and is unrelated (a different packaging gap, in the Python package itself, not the CI recipes).
