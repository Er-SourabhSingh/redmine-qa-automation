# Redmine Docker Ops Commands — Redis/Sidekiq, Asset Precompile, Theme Install

Reference commands for common maintenance tasks across the Dockerized Redmine
instances. Replace `<container>` with the actual container name, e.g.
`redmine-docker-6-redmine-1`, `redmine-docker-5-redmine-1`,
`redmine-docker-700-redmine-1`.

---

## 1. Redis + Sidekiq (for plugins that need background jobs)

Some plugins (e.g. `redmineflux_helpdesk` — SLA escalation, auto-close,
email checking; `redmineflux_testcase_management` — scheduled
reports/reminders) enqueue jobs via Sidekiq. Without Redis + a running
Sidekiq worker, these specific features fail with
`RedisClient::CannotConnectError` — everything else in Redmine/plugins works
fine regardless.

**Note on scope:** the commands below install Redis and start a worker
*inside the already-running container* via `docker exec` — no restart of the
main Redmine process required. This is **not persistent**: it does not touch
`docker-compose.yml`, so a container restart/recreate wipes both processes
and these steps must be re-run. For a permanent setup, add dedicated `redis`
and `sidekiq` services to the compose file instead (requires one container
recreation to take effect).

```bash
# 1. Install redis-server inside the running container (one-time per container lifetime)
docker exec -u root <container> sh -c "apt-get update -qq && apt-get install -y -qq redis-server"

# 2. Start Redis in the background, bound to localhost only
docker exec -u root -d <container> sh -c "redis-server --daemonize no --bind 127.0.0.1 --port 6379 > /var/log/redis.log 2>&1"

# 3. Verify Redis is up
docker exec <container> sh -c "redis-cli ping"
# expect: PONG

# 4. Start a Sidekiq worker in the background (processes the actual jobs)
docker exec -d <container> sh -c "cd /usr/src/redmine && bundle exec sidekiq -e production > /tmp/sidekiq.log 2>&1"

# 5. Confirm it booted and loaded scheduled jobs
docker exec <container> sh -c "tail -40 /tmp/sidekiq.log"
```

**Why `redis://localhost:6379` and not a separate `redis` container:** some
plugins hardcode `redis://localhost:6379/0` in their Sidekiq initializer
instead of reading `ENV['REDIS_URL']`. Running Redis inside the same
container guarantees `localhost` resolves correctly for every plugin,
regardless of which convention each one follows.

---

## 2. Asset precompile (Propshaft)

Needed whenever a plugin is added, updated, or its assets otherwise change.
Redmine 6.x+ (Rails w/ Propshaft) does **not** auto-recompile on a plain
restart — a stale/missing manifest entry causes 404s on plugin CSS/JS
(assets get requested without their content-digest suffix and fail to
resolve).

```bash
docker exec <container> bundle exec rake assets:precompile RAILS_ENV=production
docker restart <container>
```

If assets are still stale/inconsistent after a precompile, clean the old
compiled output first, then recompile:

```bash
docker exec <container> bundle exec rake assets:clobber RAILS_ENV=production
docker exec <container> bundle exec rake assets:precompile RAILS_ENV=production
docker restart <container>
```

---

## 3. Theme installation (theme-providing plugins)

A plugin that provides a Redmine **theme** (e.g. `redmineflux_scarlet`) is
not enough on its own — installing the plugin does not make the theme show
up in **Administration → Settings → Display → Theme**. These plugins ship
their own dedicated rake task that physically copies the theme's files into
Redmine's theme directory; that step is separate from the normal
install/migrate routine and is easy to miss.

```bash
# Task name follows the pattern <plugin_name>:install_theme — check the
# plugin's own docs/init.rb for the exact namespace if it differs.
docker exec <container> bundle exec rake redmineflux_scarlet:install_theme RAILS_ENV=production

# Compile the theme's CSS/favicon through Propshaft so they don't 404
docker exec <container> bundle exec rake assets:precompile RAILS_ENV=production

# Restart so Redmine's theme scan picks up the new directory
docker restart <container>
```

**Verify the theme was detected:**

```bash
docker exec <container> bundle exec rails runner "puts Redmine::Themes.themes.map(&:name)" RAILS_ENV=production
```

Expected output includes the new theme alongside the built-in ones, e.g.:

```
Alternate
Classic
Redmineflux scarlet
```

**Note:** on Redmine 6.x, the theme directory is `/usr/src/redmine/themes/`
(top-level, *not* `/usr/src/redmine/public/themes/` — that path is legacy/
empty on this version, unlike Redmine 5 where themes do live under
`public/themes/`). Don't assume the path without checking which one already
contains the bundled `Classic`/`Alternate` themes for the version in use.
