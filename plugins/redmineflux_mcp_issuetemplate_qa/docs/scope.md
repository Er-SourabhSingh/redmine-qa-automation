# Test Scope — Redmineflux MCP Issue Template

## In Scope

- [x] Functional testing — CRUD operations on issue templates via MCP
- [x] Permission testing — Admin, user with permission, user without permission
- [x] Workflow testing — Create → Apply → Create Issue end-to-end
- [x] Negative testing — Invalid params, missing required fields, unauthorized access
- [ ] UI validation — OUT OF SCOPE (MCP-only cycle)
- [ ] Multi-language testing — OUT OF SCOPE this cycle
- [x] Filter/search testing — List templates by project

## Out of Scope

- UI interactions (Clear Form, Cancel button, CKEditor visual rendering)
- Multi-language validation
- Browser console / network log capture (MCP responses are inspected directly)
- Upgrade compatibility testing

## Redmine Version

Flux (dev-flux.zehntech.com) — version resolved at test start

## Environment

- Forge: `https://dev-flux.zehntech.com`
- MCP servers: `redmineflux` (admin), `redmineflux_user_perm` (with perm), `redmineflux_user_noperm` (no perm)

## Test Cycle

- Cycle: 1 (Initial MCP functional coverage)
- Total planned TCs: 18 (16 executable + 2 N/A)
- Bug prefix: RIT
