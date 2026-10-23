# Restoring `localhost:3000` Redmine on a New Laptop

> Created 2026-10-23. This is the DB dump + attachments for the `redmine6` Docker stack (project `alpha-web`,
> all V1 7.1.0 rerun fixtures, QA data, etc.) that was running at `http://localhost:3000` on this laptop.
> Use this together with the `C:\redmine v6` folder you already zipped and are moving to the new device.

## What's in this folder

| File | What it is |
|---|---|
| `redmine6_localhost3000_2026-10-23_1929.dump` | PostgreSQL custom-format dump of the `redmine` database (pg_dump -F c) — all projects, issues, testcases, runs, users, roles, etc. |
| `redmine6_localhost3000_files.tar.gz` | Archive of Redmine's `files/` directory (issue/testcase attachments) from inside the `redmine6-redmine-1` container |
| `RESTORE_ON_NEW_LAPTOP.md` | This file |

**Copy both files to the new laptop** (e.g. alongside the extracted `C:\redmine v6` folder, or anywhere convenient — just remember the path).

## What the new laptop needs first

1. Docker Desktop installed and running.
2. Extract the zip you sent so `C:\redmine v6` exists on the new laptop, with `docker-compose.yml` and `.env` inside it (confirmed present in the source — `REDMINE_TAG=6.0-bookworm`, `REDMINE_PORT=3000`, `DB_NAME=redmine`/`DB_USER=redmine`/`DB_PASSWORD=redmine`, project name `redmine6`).

## Step 1 — Start the stack fresh (don't let it auto-seed over your dump)

```powershell
cd "C:\redmine v6"
docker compose up -d db
# wait ~10s for postgres to be healthy
docker compose ps
```

Start **only the `db` service** first — do not start `redmine`/`sidekiq` yet, so Redmine's entrypoint doesn't run its own first-boot migration/seed before you restore.

## Step 2 — Copy the dump files into the db container and restore

```powershell
docker cp "<path-to>\redmine6_localhost3000_2026-10-23_1929.dump" redmine6-db-1:/tmp/restore.dump

docker exec redmine6-db-1 sh -c "dropdb -U redmine redmine --if-exists && createdb -U redmine redmine"
docker exec redmine6-db-1 pg_restore -U redmine -d redmine --no-owner --no-privileges /tmp/restore.dump
```

If `pg_restore` reports errors about roles/ownership, they're safe to ignore with `--no-owner --no-privileges` already set — just check the final line count isn't zero.

## Step 3 — Restore the attachments (files/)

```powershell
docker compose up -d redmine
# container needs to exist once to copy into its volume
docker cp "<path-to>\redmine6_localhost3000_files.tar.gz" redmine6-redmine-1:/tmp/files.tar.gz
docker exec redmine6-redmine-1 sh -c "cd /usr/src/redmine && tar -xzf /tmp/files.tar.gz"
```

## Step 4 — Start everything and verify

```powershell
docker compose up -d
docker compose ps
```

Open `http://localhost:3000` — log in with any of the existing accounts (see `QA_CREDENTIALS.md` in the repo,
and the `alpha-web` fixture users: `qa.engineer`/`qa.manager`/`developer`/`reporter`, all password `12345678`).
Confirm project **`alpha-web`** (id=5) and its test suites (`Regression - Checkout Flow`, `Guest Checkout`,
`Throwaway Delete Test`) are present — that confirms the DB restore worked.

## Notes

- `SECRET_KEY_BASE` in `.env` must stay the same value it had on this laptop, or existing sessions/cookies tied
  to it break (it's already baked into the zipped `C:\redmine v6\.env` — don't regenerate it).
- The `redmine6-db-1` Postgres is `postgres:16-alpine`, DB name/user/password are all `redmine`/`redmine`/`redmine`
  (local dev only, not a production credential).
- If you tell Claude on the new laptop "use this DB dump," point it at this exact file and this exact MD —
  it has everything needed to do the restore without re-deriving the commands.
