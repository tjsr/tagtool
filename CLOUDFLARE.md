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
Only Google-authoritative verified Gmail and Workspace addresses may claim legacy
email-derived ownership; other email addresses need a separate verified migration
path. Google account email changes retain ownership after the first verified link.

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
