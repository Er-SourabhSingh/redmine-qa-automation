# Bug Report

- Bug ID: BUG-RDV-081
- Title: Operational status badge values not localised — pending/running/success/failed/investigating/resolved display as English in all non-English locales
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Plugin version: current (local Docker 2026-05-29)
- Environment: Local Docker (http://localhost:3008)
- Browser: Chromium (Playwright)
- User role: Admin
- Severity: Medium
- Date: 2026-05-29

## Steps to reproduce

1. Change language to German (de).
2. Navigate to `/projects/phoenix-platform/devops_builds`.
3. Observe the Build Status badge column — values show "pending", "running", "success", "failed" in English.
4. Navigate to `/projects/phoenix-platform/devops_incidents`.
5. Observe the Status badge column — values show "investigating", "resolved" in English.
6. Repeat for French, Spanish, Japanese, Russian, Dutch, Polish, Portuguese, pt-BR, Chinese.

## Expected result

Build status badges display in the active locale:
- "pending" → German: "Ausstehend", French: "En attente", Japanese: "保留中"
- "running" → German: "Läuft", French: "En cours", Japanese: "実行中"
- "success" → German: "Erfolgreich", French: "Succès", Japanese: "成功"
- "failed" → German: "Fehlgeschlagen", French: "Échoué", Japanese: "失敗"
- "investigating" → German: "Untersuchung", Japanese: "調査中"
- "resolved" → German: "Gelöst", Japanese: "解決済み"

Color-coding (blue/green/red/gray) remains unchanged regardless of language.

## Actual result

All status badge values render as lowercase English strings in every non-English locale. Confirmed in: de, fr, es, ja, ru, nl, pl, pt, pt-BR, zh.

## Evidence

![BUG-RDV-081 — Builds page (German): status badges "pending", "success", "failed", "running" all in English](../../screenshots/BUG-RDV-081/bug-rdv-081-de-builds-status-badges.png)

![BUG-RDV-081 — Incidents page (Japanese): status badges "investigating", "resolved" in English; column headers correctly in Japanese](../../screenshots/BUG-RDV-081/bug-rdv-081-ja-incidents-status-badges.png)

## Affected test cases

- TC-RDV-565 (PARTIAL)
- TC-RDV-566 (PARTIAL)

## Duplicate check

- Duplicate found: No
- Existing bug reference: None
