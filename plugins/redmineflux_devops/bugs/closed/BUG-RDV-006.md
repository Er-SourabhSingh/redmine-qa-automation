# BUG-RDV-006

- Bug ID: BUG-RDV-006
- Title: Three undocumented DevOps permissions present in Roles administration panel
- Redmine version: 6.0.9 (Forge)
- Plugin name: redmineflux_devops
- Plugin version: 0.1.0
- Environment: Forge + Local Docker (http://localhost:3008)
- Browser: Chromium (Playwright)
- User role: Administrator
- Date: 2026-05-22

## Steps to reproduce

1. Log in as admin.
2. Navigate to **Administration → Roles and permissions**.
3. Click any role (e.g., Developer).
4. Scroll to the **DevOps** permissions section.
5. Count and note all listed DevOps permission checkboxes.

## Expected result

- 7 DevOps permissions listed, matching requirements.md:
  `view_devops`, `manage_devops_settings`, `trigger_builds`, `approve_deployments`,
  `manage_releases`, `manage_incidents`, `view_security_scans`

## Actual result

- 10 DevOps permissions listed. The 3 additional permissions not in requirements.md are:
  - **Trigger deployments** (distinct from `trigger_builds`)
  - **Approve releases** (distinct from `approve_deployments`)
  - **Override security gate** (no equivalent in requirements.md)
- These 3 permissions are unspecified in requirements.md and the user-guide only partially
  acknowledges them ("some are sub-permissions or aliases") without formal definition.
- There is no documented description, permission guard, or test coverage for these 3 extras.

## Evidence

- Screenshot path: screenshots/TC-RDV-015/tc-rdv-015-devops-permissions.png

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A

## Retest

- Date: 2026-05-23
- Environment: Local Docker (http://localhost:3008)
- Result: **CONFIRMED**
- Navigated to `/roles/3/edit` as admin. Redmineflux DevOps section lists 10 permissions: View DevOps data, Manage DevOps settings, Trigger builds, Trigger deployments, Approve deployments, Approve releases, Manage releases, Manage incidents, View security scans, Override security gate. Three undocumented extras (Manage incidents, View security scans, Override security gate) confirmed present. Screenshot: screenshots/BUG-RDV-006/retest-2026-05-23-confirmed.png

## Retest

- Date: 2026-05-26
- Environment: Local Docker (http://localhost:3008) — fresh instance
- Result: **CONFIRMED**
- Navigated to `/roles/3/edit` as admin. "Redmineflux DevOps" fieldset still lists 10 permissions: View DevOps data, Manage DevOps settings, Trigger builds, Trigger deployments, Approve deployments, Approve releases, Manage releases, Manage incidents, View security scans, Override security gate. 3 undocumented extras (Trigger deployments, Approve releases, Override security gate) remain present with no spec definition.

## Retest

- Date: 2026-05-26
- Environment: Forge (https://flux-foq1fnz3j49.forge.zehntech.com) — new instance
- Result: **CONFIRMED**
- Navigated to `/roles/7/edit` (Developer role) as admin. "Redmineflux DevOps" fieldset lists 10 permissions with values: `view_devops`, `manage_devops_settings`, `trigger_builds`, `trigger_devops_deployment`, `approve_deployments`, `approve_releases`, `manage_releases`, `manage_incidents`, `view_security_scans`, `override_security_gate`. The 3 undocumented extras (`trigger_devops_deployment`, `approve_releases`, `override_security_gate`) are still present on new Forge. Bug persists.

## Closure — NOT A BUG

- Date: 2026-05-26
- Closed by: QA review
- Resolution: **Invalid — all 10 permissions are intentional and documented in the plugin's own API.md and init.rb**

The original bug was filed because `requirements.md`'s permissions matrix (lines 167–173) listed only 7 named permissions. However, all 3 "extra" permissions correspond to real implemented features:

| Permission | Controller action | Feature |
|---|---|---|
| `trigger_devops_deployment` | `devops_environments#deploy` | Trigger Deploy from Redmine (DEP-009), listed in requirements.md line 183 |
| `approve_releases` | `devops_release_approvals#approve, :reject` | Release approval workflow (REL-003), listed in requirements.md line 187 |
| `override_security_gate` | `devops_security_gate_overrides#security_override` | Security gate override for deployments (SEC-003 / rfd-090) |

The `requirements.md` permissions matrix was incomplete — it named 7 top-level permissions but the action table below already implied all 10. The plugin's `init.rb` (lines 189–224) and `API.md` document all 10 permissions correctly. The UI rendering 10 checkboxes is correct behaviour.
