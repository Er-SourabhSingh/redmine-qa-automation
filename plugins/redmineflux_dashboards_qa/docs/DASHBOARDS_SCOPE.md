# Test Scope — Redmineflux Dashboards

## In Scope

- [x] Functional testing
- [ ] Permission testing (partial — role gating not yet confirmed live)
- [x] Workflow testing
- [x] Negative testing
- [x] UI validation (German language compatibility, per current test cycle)
- [x] Multi-language testing (German — Stage 1), resolution testing (Stage 2), Lotus theme retest (Stages 3/6)

## Out of Scope

- Full permutation of every chart type × every data-filter combination — spot-check representative chart types instead.
- Public share-link testing across multiple browsers/devices (functional smoke test only).

## Redmine Version

7.0.1.stable

## Environment

Forge — see `QA_CREDENTIALS_FORGE.md` for current Base URL.

## Test Cycle

German-language compatibility cycle (same multi-stage plan as Tags/Checklist/Lotus/Gantt): Stage 1 (German + Default theme), Stage 2 (resolutions 1280×720/1920×1080), Stages 3–6 (Lotus theme retest, including combined with resolutions).
