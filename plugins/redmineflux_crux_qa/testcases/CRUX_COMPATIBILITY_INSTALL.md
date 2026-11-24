# Test Suite — Crux Compatibility: Redmine Version / Database Adapter

> Source: user request (2026-11-24) — "crux ko version 5 and 7 bhi install kr ke check kr lo, database
> sqlite or mysql rakhna, dono me alag alag, check kr lena koi migration fat to nhi rahi he aur sab sahi se
> check ho raha he na koi issue to nahi he." Plugin: redmineflux_crux only (no sibling plugins mounted — a
> focused install/migrate + basic-functionality check on version/DB combinations the main stack doesn't cover).
> Main stack for comparison: Redmine 6.0-bookworm + Postgres, `localhost:3015`.
> TC range: TC-CRX-1091 to TC-CRX-1094.

## Fixtures needed

- Two new, isolated Docker stacks (built fresh for this suite, not reused from any other plugin's QA folder):
  - `C:\crux-redmine-r5-sqlite` — Redmine 5.1-bookworm, no `REDMINE_DB_*` env vars set (official image falls
    back to SQLite3 automatically), Redmine `localhost:3021`, crux-core `localhost:8789`, mcp `localhost:8087`.
  - `C:\crux-redmine-r7-mysql` — Redmine 7.0-bookworm, real `mysql:8.0` (not MariaDB) via `REDMINE_DB_MYSQL`,
    `utf8mb4`, Redmine `localhost:3022`, crux-core `localhost:8790`, mcp `localhost:8088`.
  - Both stacks mount only `plugins/redmineflux_crux` (copied from `C:\crux-redmine\plugins\redmineflux_crux`)
    — confirmed via `init.rb` that the plugin declares `requires_redmine version_or_higher: '5.0'` and no
    `requires_redmine_plugin` dependency, so it is expected to stand alone.
- Default `admin`/`admin` credentials (forced password change handled before each UI check).
- `docker compose logs redmine` full migration output, captured and grepped for the plugin's own migration
  names (`CreateCruxCapabilityField`, `RemoveUnusedCruxCapabilityField`) and for any `error`/`fail`/`exception`.

## Positive Cases — Install / Migrate

- **TC-CRX-1091** — Plugin installs and migrates cleanly on Redmine 5.1 + SQLite3.
- **TC-CRX-1092** — Plugin installs and migrates cleanly on Redmine 7.0 + MySQL 8.0.

## Positive Cases — Basic Functional Sanity (post-install)

- **TC-CRX-1093** — Core UI (admin login, top menu, dashboard, plugin listing) renders without error on
  Redmine 5.1 + SQLite3.
- **TC-CRX-1094** — Core UI (admin login, top menu, dashboard, plugin listing) renders without error on
  Redmine 7.0 + MySQL 8.0, and the newer Rails/Ruby runtime doesn't surface any plugin-level incompatibility.

---

### TC-CRX-1091: Plugin installs and migrates cleanly on Redmine 5.1 + SQLite3

**User Role:** N/A (container-level install, no Redmine session needed for this TC).

**Steps:** Build `C:\crux-redmine-r5-sqlite` (official `redmine:5.1-bookworm` image + build-essential, only
`redmineflux_crux` mounted, `REDMINE_PLUGINS_MIGRATE: "true"`, no `REDMINE_DB_*` vars set) via
`docker compose up -d --build`. Inspect the full `docker compose logs redmine` output for the plugin's two
migrations and for any error/exception/fail line anywhere in the boot sequence.

**Expected Result:** Both `CreateCruxCapabilityField` and `RemoveUnusedCruxCapabilityField` migrate with a
normal `migrated (N.NNNNs)` line and no SQL/Ruby exception; the container reaches a healthy state; no stray
`error`/`fail`/`exception` text anywhere in the redmine service's boot log apart from expected, unrelated
startup noise (e.g. a generic "Gemfile lists puma more than once" warning from the base image, nothing
plugin-specific).

**Result: PASS.** Official entrypoint correctly fell back to SQLite3 (log line: *"warning: missing
REDMINE_DB_MYSQL, REDMINE_DB_POSTGRES, or REDMINE_DB_SQLSERVER environment variables" → "*** Using sqlite3 as
fallback. ***"*), confirmed DB file created at `/usr/src/redmine/sqlite/redmine.db` under the `sqlite_data`
volume. Full migration log shows:
```
I, [...] INFO -- : Migrating to CreateCruxCapabilityField (20260722000001)
== 20260722000001 CreateCruxCapabilityField: migrating ========================
== 20260722000001 CreateCruxCapabilityField: migrated (0.0925s) ===============

I, [...] INFO -- : Migrating to RemoveUnusedCruxCapabilityField (20261111000001)
== 20261111000001 RemoveUnusedCruxCapabilityField: migrating ==================
== 20261111000001 RemoveUnusedCruxCapabilityField: migrated (0.0235s) =========
```
Both migrations completed cleanly, zero SQL errors. Puma booted ("Rails 6.1.7.10 application starting in
production", "Listening on http://0.0.0.0:3000"), `GET /login` returned `200 OK`. Container reached `healthy`.
No plugin-related error/exception lines anywhere in the log. Only benign, pre-existing non-plugin warnings
("Gemfile lists the gem puma... more than once") were present — not a Crux defect.

---

### TC-CRX-1092: Plugin installs and migrates cleanly on Redmine 7.0 + MySQL 8.0

**User Role:** N/A (container-level install).

**Steps:** Build `C:\crux-redmine-r7-mysql` (official `redmine:7.0-bookworm` image + build-essential, only
`redmineflux_crux` mounted, `REDMINE_DB_MYSQL: db` against a real `mysql:8.0` service, `utf8mb4` encoding,
`REDMINE_PLUGINS_MIGRATE: "true"`) via `docker compose up -d --build`. Same log inspection as TC-CRX-1091.

**Expected Result:** Same bar as TC-CRX-1091 — both plugin migrations succeed cleanly against the MySQL
adapter specifically (not just SQLite/Postgres, which the plugin is already known to support), and Redmine 7's
newer Rails/Ruby stack doesn't trip any plugin-side incompatibility during boot or migrate.

**Result: PASS.** `db` (mysql:8.0) container reached `healthy` first, Redmine then migrated the full core
schema followed by the plugin:
```
I, [...] INFO -- : Migrating to CreateCruxCapabilityField (20260722000001)
== 20260722000001 CreateCruxCapabilityField: migrating ========================
== 20260722000001 CreateCruxCapabilityField: migrated (0.1640s) ===============

I, [...] INFO -- : Migrating to RemoveUnusedCruxCapabilityField (20261111000001)
== 20261111000001 RemoveUnusedCruxCapabilityField: migrating ==================
== 20261111000001 RemoveUnusedCruxCapabilityField: migrated (0.0734s) =========
```
Zero SQL errors against the real MySQL adapter. Confirmed the runtime jump is real and meaningful (Redmine 7
boot log: `Rails 8.1.4 application starting in production`, `Ruby version: ruby 4.0.9 ... +PRISM`, `Puma
version: 8.0.2`, vs. Redmine 5/6's Rails 6.1/Ruby 3.2) — no incompatibility surfaced from the plugin at either
boot or migrate time. `GET /login` returned `200 OK`, container reached `healthy`. The only non-plugin,
pre-existing log noise seen: a generic Gemfile-duplicate-puma warning and a `[DEPRECATED] Platform :mingw...`
notice from the base Gemfile.lock — both unrelated to Crux. One side note, NOT a defect: a set of
`ActionController::RoutingError ("No route matches...")` lines appeared for sibling-plugin API probes
(`/devops/builds.json`, `/api/crm.json`, `/helpdesk/api/v1/tickets.json`, etc.) — expected and correct, since
this stack deliberately has only `redmineflux_crux` installed and the plugin's own `PluginAgents` startup sync
is probing for sibling plugins that genuinely aren't present here.

---

### TC-CRX-1093: Core UI renders without error on Redmine 5.1 + SQLite3

**User Role:** `admin`.

**Steps:** Log in as `admin`/`admin` (complete the forced first-login password change), then visit, in order:
`/login`, `/crux` (dashboard), `/admin/plugins`.

**Expected Result:** Login succeeds; the "Crux" top-menu entry and the floating "Ask Crux" bubble are present;
`/crux` renders fully (HTTP 200, not a 500) even without `REDMINEFLUX_API_KEY`/REST API configured for this
pass — a graceful, correctly-worded "can't confirm identity" state is acceptable and expected, a hard crash is
not; `/admin/plugins` lists "Redmineflux Crux" with a version string and no error row.

**Result: PASS.** Logged in cleanly, completed the forced password reset. `/crux` dashboard rendered fully
(HTTP 200) with the "Crux" top-menu link and "Ask Crux" floating bubble both present. Page correctly showed
the graceful degraded state — *"⚠ Crux couldn't confirm who you are with Redmineflux. Check that the REST API
is turned on (Administration → Settings → API) and that the Crux service can reach Redmineflux."* — with each
dashboard card showing "Couldn't load this right now." + a "Try again" button, not a crash. The one browser
console entry was a plain `401 Unauthorized` on `/crux/dashboard.json`, consistent with the same
not-yet-configured state (REST API/API key deliberately left unset for this compatibility pass, per explicit
user instruction that this round didn't need live chat/full fixture setup). `/admin/plugins` listed
"Redmineflux Crux", author "Redmineflux - Powered by Zehntech Technologies Inc", version `0.0.0-dev`, no error
row.

---

### TC-CRX-1094: Core UI renders without error on Redmine 7.0 + MySQL 8.0

**User Role:** `admin`.

**Steps:** Same as TC-CRX-1093, against `localhost:3022`.

**Expected Result:** Same bar as TC-CRX-1093, and additionally: no behavioral or rendering difference
attributable to Redmine 7's newer admin layout/Rails version (Redmine 7 ships a revised collapsible admin
sidebar, not present on 5.x/6.x).

**Result: PASS.** Identical outcome to TC-CRX-1093: login + forced password reset succeeded, `/crux` dashboard
rendered fully (HTTP 200) with the same correct graceful-degradation cards and the same top-menu/bubble
presence, `/admin/plugins` listed "Redmineflux Crux" / version `0.0.0-dev` cleanly. Redmine 7's revised admin
sidebar (now collapsible, with a new native "Webhooks" entry Redmine 7 adds) rendered the plugin's three
"Crux — ..." admin-menu entries (providers & keys / logs / frozen rules) correctly alongside it — no layout
breakage or missing menu items caused by the newer admin UI.

---

## Environment note (setup-only, not a defect)

Both fresh stacks initially logged a harmless `crux-core link failed: Errno::ECONNREFUSED` on first boot and
showed the Settings page's Core service URL defaulting to `http://localhost:8787`
(`Setting.plugin_redmineflux_crux['core_url']`'s own fallback, per `lib/redmineflux_crux/core_client.rb:114`)
— this is the same already-documented gotcha found earlier on the Nuitka-binary stack (`TC-MCP-042`): the
Settings page's "Test connection" and the background startup-link are both tested **server-side**, so they
need the Docker-internal address (`http://crux-core:8787`), not the host-mapped port. Set on both stacks before
TC-CRX-1093/1094 were executed; not filed as a defect since it is expected first-boot behavior on any brand-new
instance, documented in both stacks' own `docker-compose.yml` header comment.

## Suite summary

4/4 TCs executed, 4/4 PASS. No defects found. `redmineflux_crux` installs and migrates cleanly on Redmine
5.1 + SQLite3 and Redmine 7.0 + MySQL 8.0, in addition to the main stack's already-covered Redmine 6.0 +
Postgres — confirmed via full migration-log inspection (not just exit code) and native Playwright verification
of the core UI surface on both.
