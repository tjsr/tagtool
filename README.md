# Tagtool

Tagtool stores user tags against data elements. Its API runs on Cloudflare Workers
and stores tags and sessions in D1.

Run `npm ci --allow-git=root`, `npm run db:worker:local`, and
`npm run dev:worker` for local development. Run `npm test` for Worker/D1 tests,
type checking and lint; `npm run check:worker` checks Worker packaging.

See [CLOUDFLARE.md](CLOUDFLARE.md) for configuration, current migration
limitations and the one-time legacy MySQL import procedure. MySQL and its
historical migrations are retained only for migration tooling and its test fixture;
the Worker does not connect to MySQL.

## TypeScript toolchain

Use `npm run typecheck` and `npm run compile` (also used by `npm test` and
`npm run build`) for TypeScript 7. The native compiler is installed as the npm
alias `typescript-compiler`. These scripts invoke its CLI explicitly because
both compiler packages expose a `tsc` binary; plain `npx tsc` is not the canonical
project check, and editor integrations may still use the classic compiler.
The explicit `rootDir: "./src"` preserves the emitted file layout with the
native compiler.

The `typescript` dependency intentionally remains on 5.x for consumers of the
classic JavaScript compiler API, including `openapi-typescript`, ESLint,
`ts-node` and the Wrangler environment configuration helper. TypeScript 7 does
not provide that API. Keep the two dependencies separate until those tools support the native compiler; do not bypass their
peer requirements. The toolchain regression tests verify TypeScript 7 selection,
generate a valid OpenAPI fixture with the classic API and compile the generated
declarations with TypeScript 7.

`npm run build:api` uses the installed OpenAPI generator, without an `npx`
download fallback. The legacy `src/api/schema/api.yml` is currently incomplete
(missing the OpenAPI document header and referenced `Tag`/`Error` components),
so generating that schema remains blocked independently of dependency resolution.
