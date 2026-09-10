# Plugin Memory — Redmineflux Gantt Chart

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- The "Flux Gantt-Diagramm" project module is NOT enabled by default on any fresh Forge server, even on a project seemingly built for it ("Flux Gantt Project") — always check/enable it at Project Settings > Modules before testing.
- Dependency-link connector handles (the hover-revealed "Eingehende/Ausgehende Abhängigkeit erstellen" buttons) look like normal `<button>` elements but clicking one does NOT start linking mode by itself — a real `page.mouse` down/move/up drag sequence from one bar's outgoing handle to another bar's incoming handle is required (same technique as bar-resizing). `dispatchEvent` synthetic events and a plain `.click()` both do nothing.
- The Gantt grid's DOM is virtualized/dynamically reflowed — a `querySelectorAll` text search can return stale/wrong results if the grid just re-rendered; prefer re-querying immediately before acting, and cross-check with a screenshot when a result looks surprising (e.g. a header that "disappears" from one query but is actually just off in a different render pass).

## Confirmed Working

- As of 2026-09-09 (Forge `flux-fdrk6suoj49`), all 5 bugs found during this plugin's German-language cycle are fixed and closed, and a final-cycle regression covering the fixed area plus every adjacent dialog/view passed with zero new failures.
- The fix for `BUG-GNT-002` (header/column overflow) made `overflow:hidden`/`text-overflow:ellipsis` genuinely take effect across all 3 previously-affected surfaces (left-panel "Erledigt %" header, "Gesch. Stunden" overlap, Lotus+1280×720 timeline week-headers) — same root-cause fix, confirmed via bounding-box/computed-style checks, not just visual impression.

## Recurring Issues

## Environment Notes

- This plugin's testing has moved across several Forge servers as they've been provisioned/expired: `flux-fczk00paf49` → `flux-f6nlrqpvk49` → `flux-frtsiofsm49` → `flux-fdrk6suoj49`. Always reconfirm existing (closed) bugs on a new server before assuming they're still fixed there.
