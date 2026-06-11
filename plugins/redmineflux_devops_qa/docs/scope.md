# Test Scope — Redmineflux DevOps

## In Scope

- [x] Functional testing — all 81 features across 14 categories
- [x] Permission testing — all 7 plugin permissions × 6 roles (tc-13)
- [x] Workflow testing — 6 core DevOps business workflows (tc-14 E2E)
- [x] Negative testing — invalid inputs, unauthorized access, boundary conditions
- [x] UI validation — labels, error messages, empty states, UI element presence
- [x] Multi-language testing — 11 languages: en, de, fr, es, nl, pt, pt-BR, pl, ja, ru, zh-CN (tc-15)

## Out of Scope

- Performance/load testing (e.g., high-volume webhook ingestion stress tests)
- Infrastructure provisioning of actual CI/CD pipelines (only the plugin integration is tested)
- Third-party tool internal behavior (GitHub Actions, GitLab CI, Jenkins — only the plugin's display and interaction are tested)
- API contract testing beyond what the plugin exposes in Redmine
- Mobile/responsive UI testing
- PDF export of bug reports (generated only on explicit user request)

## Redmine Version

- Target: 6.0.9.stable (Forge environment) / local dev as fallback
- Credentials: load from QA_CREDENTIALS_FORGE.md (Forge) or QA_CREDENTIALS_LOCAL.md (local)

## Environment

- Forge (primary): credentials in QA_CREDENTIALS_FORGE.md
- Local (secondary): credentials in QA_CREDENTIALS_LOCAL.md
- Never hardcode base URLs or credentials in test files

## Test Cycle

- Cycle 1 (current): Test case authoring — COMPLETE (TC-RDV-001 to TC-RDV-575, 15 suites)
- Cycle 2 (next): Test execution against Forge environment using MCP + Playwright Agent
- Cycle 3: Regression after bug fixes
