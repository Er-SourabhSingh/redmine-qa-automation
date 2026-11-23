# BUG-MCP-005

- Bug ID: BUG-MCP-005
- Production Redmine Issue ID: —
- Title: 401 challenge's `WWW-Authenticate` header never includes `scope="..."`, even though RMCP-038's own spec requires it and `REDMINEFLUX_OAUTH_SCOPES` is configured
- Redmine version: 6.0-bookworm (local Docker, `C:\crux-redmine`, localhost:3015)
- Plugin name: Redmineflux MCP Server (`redmineflux-mcp`'s `src/oauth.py`, OAuth sign-in feature, production ticket #128313 / RMCP-038)
- Plugin version: local checkout, `crux_development` branch, commit `ddc72c7` (1.1.12)
- Environment: Local Docker QA stack
- Browser: N/A (direct MCP tool calls / curl)
- User role: N/A (unauthenticated request — this is the 401 challenge itself)
- Date: 2026-11-23

## Steps to reproduce

1. Temporarily enable OAuth on the local `mcp` service (`REDMINEFLUX_OAUTH_ENABLED=true`,
   `REDMINEFLUX_PUBLIC_URL=http://localhost:8082`, `REDMINEFLUX_OAUTH_REDMINE_URL=http://localhost:3015`,
   `REDMINEFLUX_OAUTH_CLIENT_ID`/`_SECRET` set, **`REDMINEFLUX_OAUTH_SCOPES="redmine:api"`**), rebuild.
2. `POST /mcp` with no `Authorization` header and no `X-Redmine-API-Key` header.
3. `POST /mcp` with `Authorization: Bearer <garbage-token>`.

## Expected result

Per RMCP-038's own spec (`backlogs/specification/RMCP-038-spec-oauth-sign-in.md` line 41-42): "a request with
no credentials gets `WWW-Authenticate: Bearer resource_metadata="…", scope="…"`." Both the no-credentials case
and the invalid-token case should carry a `scope="redmine:api"` parameter reflecting the configured
`REDMINEFLUX_OAUTH_SCOPES`.

## Actual result

Neither case includes `scope="..."` at all:

- No credentials: `www-authenticate: Bearer resource_metadata="http://localhost:8082/.well-known/oauth-protected-resource"`
- Invalid token: `www-authenticate: Bearer error="invalid_token", error_description="The sign-in has expired or is not valid", resource_metadata="http://localhost:8082/.well-known/oauth-protected-resource"`

Root-caused to `src/oauth.py`'s `OAuthHandler.challenge()` (lines 397-403): it only ever assembles
`resource_metadata` (plus `error`/`error_description` for the invalid-token case) — it never reads
`self.config.oauth_scopes` or appends a `scope=` part, even though `config.oauth_scopes` is populated and
available on the same object. Confirmed via `grep -n ".challenge("` across `src/*.py` that both call sites
(`server.py:1190`, `server.py:1202`) pass the returned header straight through with nothing appended
afterward — this isn't a caller stripping it, the value is simply never constructed.

```python
def challenge(self, invalid_token: bool) -> bytes:
    parts = [f'resource_metadata="{self.resource_metadata_url}"']
    if invalid_token:
        parts.insert(0, 'error="invalid_token"')
        parts.insert(1, 'error_description="The sign-in has expired or is not valid"')
    return ("Bearer " + ", ".join(parts)).encode()
```

## Severity

Low-Medium — a non-conformance with the MCP OAuth discovery convention (a client that relies on the `scope`
hint from the 401 challenge to know what to request won't get it here; it would need to fall back to the
resource/auth-server metadata documents instead, which do carry scope information per RMCP-038). Does not
block sign-in itself; this specific header field is simply absent.

## Evidence

Raw curl responses (headers only shown, run against the locally patched OAuth-enabled config):

```
# No credentials
www-authenticate: Bearer resource_metadata="http://localhost:8082/.well-known/oauth-protected-resource"

# Invalid bearer token
www-authenticate: Bearer error="invalid_token", error_description="The sign-in has expired or is not valid", resource_metadata="http://localhost:8082/.well-known/oauth-protected-resource"
```

Found via TC-MCP-023 (`testcases/MCP_SDK2_OAUTH_SIGNIN.md`). Not yet reported to production.
