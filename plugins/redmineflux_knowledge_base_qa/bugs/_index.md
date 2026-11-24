# Bug Index — Redmineflux Knowledge Base Plugin

| Bug ID | Title | Status | Severity | Redmine Version | Production Redmine Issue ID | File Path |
|--------|-------|--------|----------|-----------------|------------------------------|-----------|
| BUG-RKB-001 | KB Editor toolbar: Heading/Font Family/Font Size dropdowns — 6/7 acceptance criteria now PASS (placeholder removal, numeric point sizes, CSS font-size, legacy-content backward compat, reload persistence); sticky/floating toolbar Font Size sync (AC#6) still FAILS | Open — retested 2026-11-24, partially fixed, not yet reported back to production journal | Medium (visually confusing but not data-corrupting — the applied size itself is correct and persists; only the second toolbar's own displayed value lags until reselect) | 6.0-bookworm (local Docker instance, localhost:3015) | #119878 | bugs/open/BUG-RKB-001.md |

## Notes
- Bug ID format: `BUG-RKB-NNN`
- Open bugs: bugs/open/
- Closed bugs: bugs/closed/
- Screenshots: screenshots/<BUG-ID>/
