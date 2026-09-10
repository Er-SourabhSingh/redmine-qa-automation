# Test Scope — Redmineflux Agile Board

## In Scope

- [x] Functional testing
- [ ] Permission testing (partial — role gating not yet confirmed live)
- [x] Workflow testing
- [x] Negative testing
- [x] UI validation (German language compatibility, per current test cycle)
- [x] Multi-language testing (German — Stage 1), resolution testing (Stage 2), Lotus theme retest (Stages 3/6)

## Out of Scope

- Full permutation of every card-field option × every grouping option — spot-check representative combinations instead.
- Full Story Points value-configuration testing beyond confirming the toggle and basic display.

## Redmine Version

7.0.1.stable

## Environment

Forge — see `QA_CREDENTIALS_FORGE.md` for current Base URL.

## Test Cycle

German-language compatibility cycle (same multi-stage plan as Tags/Checklist/Lotus/Gantt/Dashboards): Stage 1 (German + Default theme), Stage 2 (resolutions 1280×720/1920×1080), Stages 3–6 (Lotus theme retest, including combined with resolutions).
