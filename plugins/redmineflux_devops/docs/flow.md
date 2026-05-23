# Plugin Flow — Redmineflux DevOps

## Flow 1: Code-to-Production Deployment

1. Developer pushes commit to feature branch → webhook received by plugin
2. CI pipeline triggers → build status badge updates on linked Redmine issue
3. Build passes → deployment pipeline runs → deployment record created in Redmine
4. Deployment approval gate requires Manager approval → Manager approves via plugin UI
5. Deployment completes → environment health check runs → uptime dashboard updates
6. DORA metrics (deployment frequency, lead time) recalculate automatically

## Flow 2: Failed Build → Bug Creation

1. CI pipeline fails → plugin receives webhook with failure status
2. Plugin auto-posts comment on linked Redmine issue with build log URL and failure summary
3. QA or Developer opens issue → sees build failure comment → creates Redmine issue from failed test
4. Failed test issue linked back to build record

## Flow 3: Release Management

1. Manager creates release version in plugin → selects linked issues
2. Plugin checks release blockers (open critical issues) → blocks release if any exist
3. Plugin suggests semantic version (e.g., 2.1.0) based on included changes
4. Changelog auto-generated from linked issue titles and types
5. Multi-role approval workflow: QA approves → Manager approves → release published
6. Git tag created via plugin → release notes editor opened for final editing

## Flow 4: Security Gate Enforcement

1. Security scan completes in CI → results posted to plugin via webhook
2. Plugin displays vulnerability summary on project DevOps tab
3. Security gate policy evaluated → if critical vulnerability found, deployment blocked
4. Compliance checklist status updated → audit trail entry written
5. Team notified via plugin notification system

## Flow 5: Production Incident Lifecycle

1. Alert received from monitoring tool → plugin creates alert feed entry
2. Alert severity threshold met → plugin auto-creates Incident record
3. On-call engineer assigned → incident timeline begins
4. Deployment correlation checked → deployment linked to incident if timing matches
5. Incident resolved → MTTR recorded → post-mortem document generated
6. Post-mortem reviewed and published → incident closed

## Flow 6: Environment Management

1. DevOps engineer registers new environment (staging) in plugin environment registry
2. Environment health status monitored → uptime displayed on environment dashboard
3. Deployment freeze window configured for production (e.g., holiday period)
4. During freeze, deployment approval gate rejects all requests with freeze message
5. Freeze lifted → deployments resume normally
6. Environment comparison run between staging and production → diff displayed

## Flow 7: Webhook Security Validation

1. External CI tool sends webhook to Redmine plugin endpoint
2. Plugin validates HMAC-SHA256 signature in X-Hub-Signature-256 header
3. Signature valid → payload processed; invalid → 401 returned, no processing
4. SSRF guard checked for outbound callback URLs in payload
5. Token stored encrypted (AES-256-GCM) in plugin credential store

## Flow 8: Permission Enforcement

1. User with only `view_devops` permission navigates to DevOps tab → read-only view
2. User attempts to trigger build → blocked by permission check → error message shown
3. User with `trigger_builds` permission triggers build → succeeds
4. User with `approve_deployments` approves deployment → succeeds
5. Non-member attempts to access project DevOps tab → redirected / 403 shown
