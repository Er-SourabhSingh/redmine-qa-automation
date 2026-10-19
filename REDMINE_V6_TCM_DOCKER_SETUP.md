# Redmine 6 + Testcase Management Docker Stack — Full Setup (for a new machine)

> This documents the `C:\redmine v6\` Docker stack used for all `rftc-*` external-spec QA testing
> (RFTC-016/017/020/021/038/011/044 etc.) in this repo's testcases. **`C:\redmine v6\` itself is NOT a git
> repo** — only the two plugin folders inside `plugins\` are (separate GitHub repos). So on a new machine,
> the top-level compose/Dockerfile/`.env`/config files have to be recreated from this doc; cloning the
> plugin repos is a separate step (see §2 — the user handles that part themselves, not documented here).

## 1. Prerequisites

- Docker Desktop (with WSL2 backend on Windows), running.
- Git with SSH access configured for `git@github.com:zehntech/...` (needed to clone the two plugin repos,
  not covered here — see §2).

## 2. Folder layout

```
C:\redmine v6\
  .env
  .dockerignore
  Dockerfile
  docker-compose.yml
  README.md
  docker\
    configuration.yml
  plugins\
    redmineflux_testcase_management\   <- git clone git@github.com:zehntech/redmineflux-testcase-management.git
    redmineflux-tcm-ci\                <- git clone git@github.com:zehntech/redmineflux-tcm-ci.git
```

Create `C:\redmine v6\`, `C:\redmine v6\docker\`, and `C:\redmine v6\plugins\`, then clone the two repos into
`plugins\` with their exact folder names above (Redmine requires the plugin folder name to match the id in its
`Redmine::Plugin.register :<id>` line — the `redmineflux_testcase_management` name already matches; it was
originally cloned/named with a typo (`redmineflux_testcase_managemnet`) on the old machine and renamed once,
noted here so the same mistake isn't repeated).

## 3. File contents to recreate

### `C:\redmine v6\.env`

```env
COMPOSE_PROJECT_NAME=redmine6

# Base image tag (official redmine image, Debian bookworm variant)
REDMINE_TAG=6.0-bookworm

# Host ports (bound to 127.0.0.1 only)
REDMINE_PORT=3000
MAILPIT_PORT=8025
POSTGRES_HOST_PORT=5433

DB_NAME=redmine
DB_USER=redmine
DB_PASSWORD=redmine

# Shared by the web and sidekiq containers — keep it stable or every login session is invalidated.
SECRET_KEY_BASE=76b396551c613c34e4dcdd9ba873efa2090068216b419dc7961d441e3afb557b3b1ccbd3990681f53c4b4dce2b5c05be7c667feb78ec978cd2c6b8444c9a40f9

SIDEKIQ_CONCURRENCY=5
```

> Keep `SECRET_KEY_BASE` exactly as above if you want existing session cookies/exported data from the old
> machine to still work; otherwise any stable 128-hex-char value is fine for a fresh instance.

### `C:\redmine v6\.dockerignore`

```
.env
**/.git
**/node_modules
**/log/*.log
**/tmp
```

### `C:\redmine v6\docker\configuration.yml`

```yaml
# Outgoing mail goes to Mailpit (http://localhost:8025) so reminder / report emails sent by
# Sidekiq can be checked without a real mail server. Point SMTP_* at a real server to send for real.
production:
  email_delivery:
    delivery_method: :smtp
    smtp_settings:
      address: <%= ENV.fetch('SMTP_HOST', 'mailpit') %>
      port: <%= ENV.fetch('SMTP_PORT', '1025') %>
      domain: <%= ENV.fetch('SMTP_DOMAIN', 'localhost') %>
      enable_starttls_auto: false
```

### `C:\redmine v6\Dockerfile`

```dockerfile
# Generic Redmine 6 image: base image + the OS packages plugins need (a headless Chrome for
# Grover PDF rendering, wkhtmltopdf for PDFKit). No plugin code is copied in here —
# plugins/ is bind-mounted at runtime (see docker-compose.yml), so adding, updating or
# removing a plugin never requires touching this file or rebuilding for that reason.
ARG REDMINE_TAG=6.0-bookworm
FROM redmine:${REDMINE_TAG}

# Measured from this network: deb.debian.org (Debian's own CDN) ran at ~50-60 KB/s — a
# routing/peering issue to that one host, not a general internet or Docker/WSL2 problem
# (Cloudflare and kernel.org's mirror both measured 2+ MB/s on the same connection). Point
# the 'main'/'updates' suite at kernel.org's mirror instead. debian-security stays on
# deb.debian.org (most third-party mirrors, kernel.org included, don't carry it at all) —
# but nothing installed below needs a package from it, since Chromium itself now comes
# from Google's own fast storage below rather than the slow 'chromium' apt package.
RUN sed -i 's#^URIs: http://deb.debian.org/debian$#URIs: http://mirrors.edge.kernel.org/debian#' \
      /etc/apt/sources.list.d/debian.sources \
 && echo 'Acquire::Retries "5";' > /etc/apt/apt.conf.d/80-retries \
 && echo 'Acquire::http::Timeout "180";' >> /etc/apt/apt.conf.d/80-retries

# wkhtmltopdf (PDFKit) + the runtime shared libraries a standalone Chrome build needs
# (Grover/Puppeteer) — ordinary 'main' packages, from the fast mirror above.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ca-certificates fonts-liberation fonts-noto-color-emoji wget unzip \
      wkhtmltopdf xfonts-base xfonts-75dpi \
      libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libcups2 libdbus-1-3 \
      libgdk-pixbuf-2.0-0 libnspr4 libnss3 libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 \
      libgbm1 libgtk-3-0 libxshmfence1 libxss1 libxext6 libxfixes3 \
 && rm -rf /var/lib/apt/lists/*

# Chrome binary itself: Google's own Chrome for Testing storage (measured ~1.2 MB/s on this
# network) instead of the apt 'chromium' package, which pulls from the slow debian-security
# suite above and is what kept timing out. Pinned version, bump when needed:
# https://googlechromelabs.github.io/chrome-for-testing/known-good-versions-with-downloads.json
ARG CHROME_VERSION=155.0.8059.39
RUN wget -q -O /tmp/chrome.zip \
      "https://storage.googleapis.com/chrome-for-testing-public/${CHROME_VERSION}/linux64/chrome-linux64.zip" \
 && unzip -q /tmp/chrome.zip -d /opt \
 && rm /tmp/chrome.zip \
 && chmod +x /opt/chrome-linux64/chrome
```

### `C:\redmine v6\docker-compose.yml`

```yaml
# Redmine 6 + plugins (mounted live from ./plugins) + Sidekiq.
#
#   docker compose up -d --build         start everything
#   Redmine   http://localhost:3000      admin / admin on first boot
#   Sidekiq   http://localhost:3000/sidekiq   (Redmine admins only)
#   Mailpit   http://localhost:8025      every email Redmine / Sidekiq sends
#
# Adding a new plugin: drop its folder into ./plugins, then
#   docker compose restart redmine sidekiq
# The official entrypoint checks the bundle on every start and, since a mounted
# plugin brings gems the image doesn't have yet, runs `bundle install` and then
# (because REDMINE_PLUGINS_MIGRATE=true below) `rails redmine:plugins:migrate`
# automatically. No image rebuild, no copying, no renaming — just restart.

x-redmine-app: &redmine-app
  build:
    context: .
    args:
      REDMINE_TAG: ${REDMINE_TAG:-6.0-bookworm}
  image: redmine6-plugins:latest
  environment: &redmine-env
    REDMINE_DB_POSTGRES: db
    REDMINE_DB_DATABASE: ${DB_NAME:-redmine}
    REDMINE_DB_USERNAME: ${DB_USER:-redmine}
    REDMINE_DB_PASSWORD: ${DB_PASSWORD:-redmine}
    REDMINE_SECRET_KEY_BASE: ${SECRET_KEY_BASE:?set SECRET_KEY_BASE in .env}
    REDMINE_PLUGINS_MIGRATE: "true"
    REDIS_URL: redis://redis:6379/0
    # Grover (PDF export) — plugins/redmineflux_testcase_management/config/initializers/grover.rb
    # reads PUPPETEER_EXECUTABLE_PATH first, so it uses the standalone Chrome build below
    # directly (Dockerfile), no Puppeteer/npm download needed.
    PUPPETEER_EXECUTABLE_PATH: /opt/chrome-linux64/chrome
    GROVER_NO_SANDBOX: "true"
    WKHTMLTOPDF_PATH: /usr/bin/wkhtmltopdf
  volumes:
    - ./plugins:/usr/src/redmine/plugins          # live plugin source, unchanged on disk
    # Not :ro — the official entrypoint chowns everything under config/ on startup
    # (to the redmine user) and that chown fails/crash-loops on a read-only mount.
    - ./docker/configuration.yml:/usr/src/redmine/config/configuration.yml
    - redmine_files:/usr/src/redmine/files
    - bundle_cache:/usr/local/bundle              # gems installed for plugins persist across restarts
  shm_size: 1gb            # Chromium (Grover PDF rendering) needs more than the 64 MB default
  restart: unless-stopped

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${DB_NAME:-redmine}
      POSTGRES_USER: ${DB_USER:-redmine}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-redmine}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:${POSTGRES_HOST_PORT:-5433}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-redmine} -d ${DB_NAME:-redmine}"]
      interval: 5s
      timeout: 3s
      retries: 20
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: ["redis-server", "--appendonly", "yes"]
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10
    restart: unless-stopped

  mailpit:
    image: axllent/mailpit:latest
    ports:
      - "127.0.0.1:${MAILPIT_PORT:-8025}:8025"
    restart: unless-stopped

  redmine:
    <<: *redmine-app
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "127.0.0.1:${REDMINE_PORT:-3000}:3000"
    command: ["rails", "server", "-b", "0.0.0.0"]
    healthcheck:
      test: ["CMD-SHELL", "curl -fsS http://localhost:3000/login >/dev/null || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 40
      start_period: 180s     # first boot runs bundle install for plugin gems, can take a while

  sidekiq:
    <<: *redmine-app
    user: redmine
    depends_on:
      redmine:
        condition: service_healthy   # wait for web to finish bundle install + migrate first
      redis:
        condition: service_healthy
    command: ["bundle", "exec", "sidekiq", "-e", "production", "-c", "${SIDEKIQ_CONCURRENCY:-5}", "-q", "default"]

volumes:
  pgdata:
  redisdata:
  redmine_files:
  bundle_cache:
```

## 4. Start it

```powershell
cd "C:\redmine v6"
docker compose up -d --build
docker compose ps                 # wait until "redmine" shows "healthy" (first start ~3-5 min — bundle install for plugin gems)
```

Then open **http://localhost:3000** — login `admin` / `admin` on first boot (Redmine will force a password
change). Other services:

| Service | URL | Notes |
|---|---|---|
| Redmine web | http://localhost:3000 | `admin`/`admin` first boot |
| Sidekiq dashboard | http://localhost:3000/sidekiq | Redmine admins only |
| Mailpit (catches all outgoing mail) | http://localhost:8025 | nothing sends real email |
| Postgres | `localhost:5433` | `redmine`/`redmine`/`redmine` (db/user/password) |

## 5. Everyday commands

```powershell
docker compose logs -f redmine sidekiq            # logs
docker compose restart redmine sidekiq            # restart app + workers (after a plugin change / git pull)
docker compose exec redmine bash                  # shell inside Redmine
docker compose down                               # stop (data kept)
docker compose down -v                             # stop AND delete DB, Redis, files, gem cache — destructive
```

Optional demo/seed data for Testcase Management:

```powershell
docker compose exec redmine bundle exec rake testcase_plugin:setup RAILS_ENV=production
```

**After `git pull`-ing either plugin repo**, always restart so the new code takes effect (Rails production
mode does not hot-reload views/helpers/JS):

```powershell
docker compose restart redmine sidekiq
```

## 6. Notes / gotchas carried over from the old machine

- **Two real bugs were fixed directly in `redmineflux_testcase_management`'s own source** (already committed
  in that plugin's git history, so cloning the repo brings them — nothing to redo here, just documented for
  context):
  - `config/initializers/sidekiq.rb` had Redis hardcoded to `localhost` and called `Sidekiq::Logging` (doesn't
    exist in Sidekiq 7, which the plugin pins to `~> 7.3`) — crashed the Sidekiq worker on boot. Now reads
    `REDIS_URL` and uses the Sidekiq 7 logger API.
  - `config/initializers/pdfkit.rb` hardcoded a Windows wkhtmltopdf path — now reads `WKHTMLTOPDF_PATH`.
- **This stack's `db`/`redis`/`sidekiq` are proper dedicated Docker services** (unlike some other ad-hoc
  Redmine instances referenced elsewhere in this QA repo's memory files, where Redis/Sidekiq had to be
  manually `docker exec`'d in after the fact — see `REDMINE_OPS_COMMANDS.md` §1 for that *different* pattern,
  which does **not** apply to this stack).
  do NOT run `docker compose exec` to manually install Redis/Sidekiq here — they're already dedicated services.
- PDF rendering (Grover) uses the image's own standalone Chrome (`/opt/chrome-linux64/chrome`), not
  Puppeteer/npm download — no extra setup needed.
- Database config comes entirely from `REDMINE_DB_*` env vars (official image feature) — there's no
  checked-in `database.yml` to restore separately.
- `redmineflux-tcm-ci` (the CI/testing-harness sibling repo, used for `rftc-016/017/038` CLI/CI testing) lives
  alongside `redmineflux_testcase_management` inside `plugins\` purely for convenience/co-location — it is
  **not** itself a loaded Redmine plugin (no `init.rb`), so it has no effect on the Rails boot; it's just a
  second git checkout sitting in the same parent folder. It has its own separate Jenkins-based Docker setup
  (`jenkins/docker-compose.jenkins.yml` inside that repo) for the Jenkins CI-pipeline tests in `RFTC-038_...md`
  — not covered by this doc, read that repo's own `jenkins/README.md` if that harness needs standing up again.

## 7. One-prompt recreation

On the new machine, after cloning the two plugin repos into `C:\redmine v6\plugins\` (user's own step), a
single prompt like **"read `REDMINE_V6_TCM_DOCKER_SETUP.md` in `redmine-qa-automation` and recreate the
`C:\redmine v6\` Docker stack, then start it"** is enough — every file this doc's §3 lists just needs to be
written to disk at the paths given, then §4's commands run.
