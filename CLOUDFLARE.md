# Cloudflare Worker migration (in progress)

`npm run db:worker:local` applies the D1 schema to an isolated local database;
`npm run dev:worker` runs the Worker locally, and `npm run test:worker` exercises
the Worker against local D1. `npm run check:worker` packages it without deployment.
The all-zero database ID in `wrangler.jsonc` is a local placeholder, not a production binding.

The Worker is not ready for production: registered-user sign-in needs a verified
identity provider, and the MySQL export, import, compatibility and cutover need
to be validated with representative data. Do not route production traffic to it yet.

`node scripts/export-mysql-for-d1.mjs <new-file.d1-export.sql>` exports a
consistent read-only snapshot from the MySQL connection described by `MYSQL_HOST`,
`MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER` and `MYSQL_PASSWORD`. The file contains
private users, tags and live session tokens. Store it securely, never commit it,
and import it only into a newly migrated, empty D1 database. The script refuses to
overwrite an existing file; a failed export must not be imported. A snapshot alone
does not capture later writes: quiesce writes and reconcile counts before cutover.
Retain a verified backup and rollback plan before changing production traffic.
