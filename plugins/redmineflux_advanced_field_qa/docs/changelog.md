# Test Run Changelog — Redmineflux Advanced Field

| Date | Redmine Version | Environment | Tested By | Summary |
|------|-----------------|-------------|-----------|---------|
| 2026-05-21 | 6.0.9.stable | Forge | Admin (Playwright/Claude) | Executed all positive test cases TC-RAF-001 through TC-RAF-044. 47 PASS, 0 FAIL, 4 BLOCKED (BUG-RAF-001). 2 bugs found: BUG-RAF-001 (dependency rule limit) High, BUG-RAF-002 (integer formula float validation) High. All formula types, sequence, dependency, and visibility rules verified. |
| 2026-05-21 | 6.0.9.stable | Forge (flux-f3txguimh49) | Admin (Playwright/Claude) | Bug fix retest session. Both bugs fixed and confirmed PASS. TC-RAF-022/023/024/036 retested — all PASS. BUG-RAF-002 repro issue #274 retested — edit + submit successful, no validation error. Final result: 51 PASS, 0 FAIL, 0 BLOCKED. All bugs closed. |
