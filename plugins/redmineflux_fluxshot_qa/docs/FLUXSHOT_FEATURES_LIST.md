# Features List — Fluxshot Chrome Extension

> This file must be read before writing any test case. It defines the full feature scope for test coverage.
> Source: https://www.redmineflux.com/knowledge-base/plugins/fluxshot-chrome-extension/ (ingested 2026-09-15).

## Feature List

| # | Feature | Description | Covered by TC |
|---|---------|-------------|---------------|
| 1 | Chrome extension install | Chrome Web Store; pin via the puzzle icon | TC-FSX-024, 102 |
| 2 | Redmine plugin install | `redmineflux_fluxshot`, folder name unchanged, migrate, restart | TC-FSX-026, 104 |
| 3 | REST API prerequisite | Administration → Settings → API | TC-FSX-028 |
| 4 | `plugin_info.json` verification | Returns `{"installed": true, "version": …}` | TC-FSX-029, 107 |
| 5 | Browser compatibility | Chrome 88+ (MV3); Edge and Brave | TC-FSX-031 |
| 6 | Redmine version range | 4.0.x–4.2.x, 5.0.x, 5.1.x, 6.0.x, 6.1.x | TC-FSX-032 |
| 7 | Login modal | Base URL, username, password | TC-FSX-033 – 205 |
| 8 | API key storage | `chrome.storage.local`, never sent to third parties | TC-FSX-038 – 208 |
| 9 | Session persistence | No re-login until explicit logout | TC-FSX-041 |
| 10 | Logout | Clears stored credentials | TC-FSX-042, 211 |
| 11 | One-click capture | Captures the active tab, opens the editor | TC-FSX-001 – 304 |
| 12 | Painterro tools | Text, rectangle, ellipse, arrow, pencil, highlighter, crop, blur, colour, eraser | TC-FSX-005 – 308 |
| 13 | Annotated image is the attachment | The marked-up version is uploaded | TC-FSX-009 |
| 14 | Timer capture | 3 / 5 / 10 s, countdown overlay, Cancel | TC-FSX-010 – 314 |
| 15 | Copy to clipboard | Copies the annotated image, editor stays open | TC-FSX-015 – 317 |
| 16 | Add Issue | Project, tracker, subject, description, assignee, parent, template | TC-FSX-050 – 407 |
| 17 | Save / Save & Open | Create, toast with issue number, close or navigate | TC-FSX-057, 409 |
| 18 | Update Issue | Project, tracker, searchable issue dropdown, pre-filled fields | TC-FSX-059 – 414 |
| 19 | Update / Update & Open | Attach, save, toast, close or navigate | TC-FSX-064, 416 |
| 20 | Rich description editor | H1, H2, B, I, U, bullet, numbered, link → Markdown | TC-FSX-066 – 420 |
| 21 | Templates CRUD | Name, subject, description; create, edit, delete with confirmation | TC-FSX-070 – 507 |
| 22 | Template privacy | Each user sees only their own | TC-FSX-077, 902 |
| 23 | Template pre-fill | Selecting one fills Subject and Description | TC-FSX-509 |
| 24 | Dark mode | Persisted across sessions | TC-FSX-078 – 603 |
| 25 | Accent colour themes | Blue, Purple, Green, Orange, Rose; persisted | TC-FSX-081 – 606 |
| 26 | Resizable sidebar | 260–520 px, persisted, Painterro reflows | TC-FSX-084 – 610 |
| 27 | Permissions and visibility | Project, issue and template scoping | TC-FSX-088 – 910 |
| 28 | Uninstallation | Remove the extension; migrate `VERSION=0` drops `fluxshot_templates` | TC-FSX-048, 111 |

## Notes

- **Not yet executed.** Every TC was authored 2026-09-15 from the vendor KB; none has been run.
- **This product has three independent surfaces** — the Chrome extension, the browser's local storage, and the
  Redmine plugin's API. A defect can live in any of them, so a failing result should name which surface it was
  observed on. Capture and annotation problems are extension-side; permission and visibility problems are almost
  always server-side.
- **The highest-value security cases are the two dropdowns.** The Add Issue **Project** dropdown and the Update
  Issue **Issues** dropdown are populated by API calls. If either is filtered client-side rather than
  server-side, the response body carries names of projects and subjects of issues the user is not entitled to see
  — invisible in the UI and only detectable by reading the payload. TC-FSX-090 and TC-FSX-091 exist for exactly
  that, and the KB's own note that "non-admin users see only issues assigned to them" is the claim being tested.
- **Template privacy is a stated guarantee** ("each Redmine user sees and manages only their own"). TC-FSX-089
  tests it at the endpoint, not just in the list — a template ID is trivially guessable, and templates may contain
  internal process detail.
- **The API key stored in `chrome.storage.local` is a full Redmine credential.** TC-FSX-039 and TC-FSX-043 check
  that it is not exposed to page scripts and that logout genuinely clears it — a key left behind after logout on a
  shared machine gives the next user full API access as the previous one.
- **The blur tool has a specific failure mode worth testing** (TC-FSX-008): blurring is used to hide sensitive
  information before a screenshot is attached to a ticket. If the blur is applied as a reversible overlay rather
  than being burnt into the image, the original pixels travel with the attachment and the redaction is cosmetic.
  That would be a genuine data-exposure defect in a feature people rely on precisely to prevent one.
- **Descriptions are converted to Markdown.** TC-FSX-068 checks the round trip actually renders in Redmine rather
  than arriving as visible markup — the two systems' formatting are not the same, and the conversion is where that
  breaks.
