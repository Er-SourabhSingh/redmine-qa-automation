# BUG-MCP-003

**Status: CLOSED 2026-11-19 — CONFIRMED FIXED.** Developer fix `RMCP-050` ("DevOps build, commit and pull
request lists show the Redmineflux id", redmineflux-mcp 1.0.13) pulled and rebuilt onto the local `mcp`
Docker service. Retested the exact repro from this file: `list_builds(project_id=20)` now shows `#6 (id 1)`
and `list_commits(project_id=20)` now shows `(id 1)`/`(id 2)` next to each SHA; `get_build(build_id=1)` and
`get_commit(commit_id=2)` both resolved cleanly using the now-visible id, no guessing required.

- Bug ID: BUG-MCP-003
- Production Redmine Issue ID: #129089
- Title: `list_builds`/`issue_builds` (and `list_commits`) never surface the Redmineflux database id that `get_build`/`get_commit` actually require — only the provider's own build number / commit SHA, making the "get" tools practically undiscoverable without guessing
- Redmine version: 6.0-bookworm (local Docker, `C:\crux-redmine`, localhost:3015)
- Plugin name: Redmineflux MCP Server (`redmineflux-mcp`'s `devops.py` tools — found against the DevOps plugin's real data, ticket #128756)
- Plugin version: local checkout as of 2026-11-19 (RMCP-042/043)
- Environment: Local Docker QA stack
- Browser: N/A (direct MCP tool calls)
- User role: admin
- Date: 2026-11-19

## Steps to reproduce

1. With a real build and commit in a project (fixture project #20, build linked to issue #167, a real GitHub
   Actions build whose provider-side number is **#6**; a real commit whose SHA is `5fcd2015...`), call
   `redmineflux_devops_list_builds(project_id=20)`.
2. Observe the only identifying info in the row is the build **number** (`#6`) — no Redmineflux database id
   anywhere in the output.
3. Call `redmineflux_devops_get_build(project_id=20, build_id=6)` (the only id visible from step 1/2) →
   `Error: Build not found`.
4. Call `redmineflux_devops_list_commits(project_id=20)` — same gap: only the commit SHA (`5fcd2015`) is
   shown, no database id.
5. Brute-force small integers to find the real id — `get_build(project_id=20, build_id=1)` succeeds and
   returns **Build #6** — confirming the real database id (1) is completely different from the only
   identifier the list tool ever showed (the provider's build number, 6, which reflects this real GitHub
   repo's actual history of 6 prior Actions runs, 5 of which predate this QA session).
6. `get_commit(project_id=20, commit_id=1)` similarly only works by guessing — the real id (1) is never
   surfaced by `list_commits`' SHA-only output.
7. Contrast with `list_pull_requests`/`get_pull_request`: in this specific fixture their Redmineflux id and
   the provider's PR number happen to coincide (both 1, since this was the repo's and the project's very
   first PR) — this made the same class of bug invisible for PRs in this session, by coincidence rather than
   correct behavior. It is not safe to assume PR ids and numbers always coincide on a repo with real history,
   the same way build numbers did not for this very fixture.

## Expected result

- The DevOps Agent's own manifest (`agents/devops.md`) states explicitly: *"Builds, commits and pull
  requests have a Redmineflux id (from the list tools) that differs from the build number or PR number. Use
  the id from the list when calling a get/action tool."* This is a hard requirement on the **list** tools:
  they must include the id. `list_builds` and `list_commits` should show both the database id and the
  provider's own number/SHA, exactly the way `get_pull_request`'s own output format does (`id: 1`,
  `external id: 1` — see Evidence, it already has both fields, builds/commits don't).

## Actual result

- `list_builds` shows only `#<number>` (e.g. `#6`), never the Redmineflux id.
- `list_commits` shows only the SHA (e.g. `5fcd2015`), never the Redmineflux id.
- The only way to call `get_build`/`get_commit` successfully, per the manifest's own documented workflow, is
  currently to guess small integers until one hits — not a usable documented path. In chat, the DevOps Agent
  itself hit this exact wall and visibly self-corrected mid-turn ("the issue was that the build_id parameter
  requires the Redmineflux database ID, not the build number... Let me get the full details") — meaning even
  the agent's own model-side reasoning had to work around a gap in the data it was given, rather than
  following a clean, discoverable path.

## Evidence

### Screenshot

N/A — direct MCP tool call evidence, not a UI session. Raw responses:

```
list_builds(project_id=20):
  "Builds (1 total):\n\n  ○ #6 [pending] main — 5fcd2015 (2026-11-19)\n    Linked to issue #167"

get_build(project_id=20, build_id=6):
  "Error: Build not found\n(If you expected this build #6 to exist, verify the ID with the corresponding list_* tool.)"

get_build(project_id=20, build_id=1):
  "Build #6 — PENDING\n  Provider:   github_actions\n  Branch:     main\n  Commit:     5fcd2015...\n  ..."

list_commits(project_id=20):
  "Commits (2 total):\n\n  da47412f Update README.md\n  ...\n  5fcd2015 QA webhook verification commit, references #167\n  ..."

get_commit(project_id=20, commit_id=1):
  "Commit 5fcd201 (id 1)\n  id: 1\n  sha: 5fcd2015...\n  ..."

Contrast — get_pull_request DOES show both ids cleanly:
  "PR #1 [open] Update README.md\n  id: 1\n  external id: 1\n  ..."
```

### Console / log

N/A

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —
