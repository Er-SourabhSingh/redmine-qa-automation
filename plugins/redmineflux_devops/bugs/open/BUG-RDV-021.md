# BUG-RDV-021 — Auto-transition rules UI missing per-rule configuration (Add Rule, Source Status, Trigger type)

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-RDV-021 |
| **Severity** | Medium |
| **Status** | Open |
| **Discovered in TC** | TC-RDV-088 |
| **Redmine Version** | 6.0.9 |
| **Plugin Version** | 0.1.0 |
| **Environment** | Local Docker (http://localhost:3008) |
| **Date Found** | 2026-05-25 |
| **Found By** | QA Automation |

## Summary
The Auto-Transition Rules section in DevOps settings only provides a single global enable/disable toggle and a single "On PR Merge, Move Issue To" target status selector. The spec requires a configurable multi-rule system with "Add Rule", Source Status, Target Status, and Trigger type fields per rule.

## Steps to Reproduce
1. Navigate to `http://localhost:3008/projects/phoenix-platform/devops_settings`.
2. Locate the "Auto-Transition Rules" section.
3. Observe the available controls.

## Expected Result
- An "Add Rule" button to create multiple rules.
- Per rule: Source Status (e.g. "In Review"), Target Status (e.g. "Ready for QA"), Trigger (e.g. "PR Merged").
- Saved rules listed: `On PR Merge: In Review → Ready for QA`.
- Only Admin and DevOps Engineer roles can access/modify rules.

## Actual Result
- Only two controls in the Auto-Transition section:
  1. `auto_transition_enabled` checkbox: "Enable auto-transition on PR merge"
  2. `pr_merged_status_id` select: "On PR Merge, Move Issue To" (single global target)
- No "Add Rule" button, no source status per rule, no trigger type selection.
- Only one rule possible (global: any PR merge → single target status).

## Screenshot
`screenshots/TC-RDV-088/tc-rdv-088-fail.png`

## Notes
- The basic auto-transition feature functions (single-rule, confirmed in TC-RDV-054–058).
- The missing per-rule UI is a feature gap vs the spec requirement (SCM-004 / rfd-009).
