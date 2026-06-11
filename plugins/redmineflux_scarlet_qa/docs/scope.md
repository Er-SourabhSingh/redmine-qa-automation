# Test Scope — Redmineflux Scarlet Theme

## In Scope

- [x] Functional testing — all CRUD operations on all core modules
- [x] Permission testing — admin vs. non-admin views
- [x] Workflow testing — issue lifecycle, project lifecycle
- [x] Negative testing — validation errors, empty fields, invalid data
- [x] UI validation — theme consistency, layout, alignment, colors
- [x] Multi-language testing — where applicable

## Out of Scope

- Plugin-specific functionality (DevOps, Advanced Fields, etc.) — covered by their own QA folders
- Performance / load testing
- PDF/export visual fidelity beyond basic rendering
- Repository integration (unless enabled and accessible)
- Mobile/touch-specific testing

## Redmine Version

To be confirmed from Administration → About page during test run.

## Environment

- URL: https://dev-flux.zehntech.com/
- Type: Forge (hosted)
- Browser: Chrome (primary), Firefox, Edge

## Test Cycle

- Cycle 1: Scarlet theme — full Redmine core coverage
- Start date: 2026-06-04
