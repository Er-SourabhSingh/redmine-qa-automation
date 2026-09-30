# Bug Report Template

- Bug ID: BUG-PLT-021
- Production Redmine Issue ID: #121711
- Title: A deleted record's "created"/"updated" audit rows permanently lose their human-readable name and regress to "ClassName #ID" — only the destroy hook snapshots a name, create/update never do
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_platform
- Plugin version: `redmineflux_platform` branch, current tip
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, post-upgrade)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-30

## Steps to reproduce

1. Log in as Admin, create a Team (e.g. "PLT-AUDIT-TC130-Team").
2. Rename it (e.g. to "PLT-AUDIT-TC130-Team-RENAMED").
3. Delete it.
4. Open Redmineflux Platform → Audit events (`/redmineflux_platform/list/audit_events`) and look at all 3 rows for this team (created, updated, deleted).

## Expected result

- Per `PLATFORM_PLUGIN_TESTER_GUIDE.md` §9's own stated fix ("A deleted record still shows its name, not a class name and a number") and this cycle's TC-PLT-131, **every** audit row for a record — not just the delete row — should remain readable by name once the record it describes is gone, since that is the entire point of an audit trail: a durable record of history that survives the thing it describes.

## Actual result

Only the **deleted** row shows the actual name. The **created** and **updated** rows for the exact same, now-deleted record permanently regress to a bare "ClassName #ID":

```
created   Team #16      (should read "PLT-AUDIT-TC130-Team")
updated   Team #16      (should read "PLT-AUDIT-TC130-Team-RENAMED", or at least the pre-rename name)
deleted   PLT-AUDIT-TC130-Team-RENAMED    (correct — this one works)
```

Confirmed this is not a one-off: 3 more teams from an earlier bulk-delete fixture (`PLT-BULK-Team-01/02/03`, deleted via TC-PLT-126) show the identical pattern — their `created` rows read "Team #15", "Team #14", "Team #13" respectively, bare class+ID, while their own `deleted` rows (elsewhere in the same list) correctly show the real names.

By contrast, a Leave record that has **not** been deleted still shows a proper descriptive label on its `created`/`updated` rows ("Aurora Wren 2027-08-02 - 2027-08-02") — confirming the label mechanism itself works fine while the live record still exists; the regression only manifests after the record is deleted.

### Root cause (confirmed from source)

`lib/redmineflux_platform/concerns/auditable.rb` has 3 lifecycle hooks:

```ruby
after_commit :rf_audit_creation,  on: :create
after_commit :rf_audit_changes,   on: :update
after_commit :rf_audit_destruction, on: :destroy
```

Only `rf_audit_destruction` calls `rf_audit_identity` — a small helper that reads `name`/`title`/`code`/`email`/`login`/`subject` off the record **while it still exists in memory** and stores it into the audit row's `metadata`, specifically so the row remains readable after the row is gone:

```ruby
def rf_audit_destruction
  rf_audit_safely do
    AuditService.log(auditable: self, action: 'deleted', ...,
                     metadata: rf_audit_identity.merge(rf_audit_context || {}))
  end
end
```

`rf_audit_creation` and `rf_audit_changes` never call `rf_audit_identity` — their `metadata` is only ever `rf_audit_context.presence` (a separate, opt-in mechanism for something like "cloned from," almost always `nil`). Both hooks were written on the (reasonable at the time, but incomplete) assumption that a `created`/`updated` row can always resolve the live record later via `AuditEvent#auditable_label`:

```ruby
def auditable_label
  resolved = auditable&.to_s          # tries a live DB lookup first
  return resolved if resolved.present?
  stored = metadata.is_a?(Hash) ? metadata['name'].presence : nil   # falls back to a stored snapshot
  return stored if stored.present?
  short = auditable_type.to_s.split('::').last.to_s                # last resort: bare class + id
  auditable_id.blank? ? short : "#{short} ##{auditable_id}"
end
```

`resolve_auditable` does `klass.find_by(id: auditable_id)` — once the record is deleted, this always returns `nil`, so `auditable&.to_s` is blank on every subsequent view. The label then falls through to `metadata['name']` — which is present for the `deleted` row (`rf_audit_identity` populated it) but **blank for `created`/`updated`** (neither hook ever populated it) — so those two fall all the way through to the bare "ClassName #ID" the destroy hook's own comment specifically calls out as the exact problem it was written to solve: *"an entry saying only 'Organization #57 deleted' is close to useless."* That reasoning applies identically to `created`/`updated` once the record is gone; it just was never extended to those two hooks.

## Evidence

### Screenshot

(No new screenshot — see the Audit events list directly, `/redmineflux_platform/list/audit_events`, rows for `Team #16`/`Team #15`/`Team #14`/`Team #13` vs. their own `deleted` rows in the same table.)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-021/retest-yyyy-mm-dd-pass.png)

### Console / log

- No error — a silent metadata omission, not a crash.

## Duplicate check

- Duplicate found: No — related to the historical fix this same file's own comments describe (the destroy-hook fix that inspired TC-PLT-131), but this is the same defect class recurring in the 2 hooks that fix was never extended to, not a duplicate of the already-fixed delete case.

## Production report

Reported to production 2026-09-30 as **#121711** (project `ztflux`, tracker Bug, Priority Medium, Defect Type Functional, Defect Severity Medium-severity, Defect priority Medium, assigned Prashant Chaurasia). Linked via `report_defect` to testcase #121706 (`Entity CRUD and Field Validation`, Feature #120043) / Run #586 / environment `Win + Chrome + Ver6`; testcase result marked Failed with defect #121711 attached.
