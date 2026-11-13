# Cloudflare Worker migration (in progress)

`npm run db:worker:local` applies the D1 schema to an isolated local database;
`npm run dev:worker` runs the Worker locally, and `npm run test:worker` exercises
the Worker against local D1. `npm run check:worker` packages it without deployment.
The all-zero default database ID in `wrangler.jsonc` is a local placeholder,
not a production binding. The `dev` environment uses the separate `tagtool-dev`
D1 database and has no public Worker route or preview URL.

The Worker is not ready for production: the MySQL export, import, client changes,
Google OAuth settings and cutover must be validated with representative data.
Do not route production traffic to it yet.

Sign-in uses a Google ID token sent as `{ "credential": "..." }` to `POST /login`
with an existing `x-session-id`. Configure `GOOGLE_CLIENT_ID` for the intended
Google OAuth client and set `USERID_UUID_NAMESPACE` to the exact UUID namespace
used by the existing Tagtool installation. The client ID and namespace in the
local configuration are deliberately blank. A successful login rotates the
session ID, associates Google's stable subject with the legacy email-derived
user ID, and returns the new session ID. Clients must replace their stored ID.
Any valid Google subject can sign in. Only Google-authoritative verified Gmail
and Workspace addresses may claim legacy email-derived ownership; other addresses
receive a separate account and need a separate verified migration path to recover
legacy tags. Google account email changes retain ownership after the first link.
Email verification for other addresses is tracked in
https://github.com/tjsr/tagtool/issues/265.

## Integrating another system

Tagtool supports anonymous tagging: call `GET /session` and send the returned
`sessionId` as `x-session-id` when adding or deleting tags. The session ID is
a bearer credential; protect it. When this anonymous session signs in, its tags
move to the authenticated identity. Signing in from a session that is already
authenticated does not move the previous account's tags. Sessions created before
the anonymous marker was introduced do not transfer automatically.

Each integrating backend authenticates its own users. Configure
`INTEGRATION_PROVIDERS` as a JSON array of trusted issuer records:

```json
[
  {
    "issuer": "https://backend.example",
    "audience": "tagtool-production",
    "publicKey": { "kty": "RSA", "n": "<base64url modulus>", "e": "AQAB" }
  }
]
```

Use a unique issuer and signing key per integration, an environment-specific
audience and an RSA signing key of at least 2048 bits. Configure public keys only; the private
key stays on the integrating backend. To rotate keys, coordinate an update to the
provider configuration and issuance; only one public key per issuer is supported.
Do not reuse the production audience or keys in development.

After verifying a user, the trusted backend issues a compact RS256 JWT with
`iss` and `aud` matching its configured entry, a stable per-user `sub`, a
unique unpredictable `jti`, `iat` and `exp` no more than five minutes apart,
and `session_id` set to the caller's current Tagtool session ID. The client
sends `{ "assertion": "<JWT>" }` to `POST /login/integration` with that session
ID in `x-session-id`; replace the session ID with the one in the response.
Assertions are single-use and bound to that session. Do not expose the backend
signing key to clients. Any opaque integration token must be verified by the
backend before it issues the assertion. Identities are scoped by issuer: equal
subject strings from different integrations are separate users. Cross-provider
account linking and claiming historical email-owned tags are not automatic.

Restore a MySQL dump into an isolated development MySQL database first. Then
`node scripts/export-mysql-for-d1.mjs <new-file.d1-export.sql>` exports a
consistent read-only snapshot from the MySQL connection described by `MYSQL_HOST`,
`MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER` and `MYSQL_PASSWORD`. The file contains
private users, tags and anonymous session tokens. Legacy email-authenticated
sessions are excluded because the old login did not verify ownership. Store the file securely, never commit it,
and import it only into a newly migrated, empty D1 database. The script refuses to
overwrite an existing file; a failed export must not be imported. A snapshot alone
does not capture later writes: quiesce writes and reconcile counts before cutover.
Retain a verified backup and rollback plan before changing production traffic.
