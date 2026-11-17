import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const compiler = join(root, 'node_modules/typescript-compiler/bin/tsc');

test('project checks and builds explicitly use the TypeScript 7 compiler', () => {
  assert.match(execFileSync(process.execPath, [compiler, '--version'], { encoding: 'utf8' }), /^Version 7\./);
  assert.equal(manifest.scripts.compile, 'node node_modules/typescript-compiler/bin/tsc');
  assert.equal(manifest.scripts.typecheck, `${manifest.scripts.compile} --noEmit`);
  assert.match(manifest.scripts.test, /^npm run typecheck &&/);
  assert.match(manifest.scripts.build, /&& npm run compile$/);
  assert.match(manifest.scripts['build:clean'], /&& npm run compile$/);
});

test('OpenAPI generation uses the classic compiler API and its output compiles with TypeScript 7', () => {
  const generatorRequire = createRequire(require.resolve('openapi-typescript'));
  const typescript = generatorRequire('typescript');
  assert.match(typescript.version, /^5\./);
  assert.equal(typeof typescript.createSourceFile, 'function');

  // Keep this fixture independent of the legacy, incomplete API schema. This
  // exercises the installed CLI, its peer dependency and the native compiler.
  const directory = mkdtempSync(join(tmpdir(), 'tagtool-openapi-'));
  try {
    const schema = join(directory, 'schema.json');
    const output = join(directory, 'api.d.ts');
    writeFileSync(schema, JSON.stringify({
      openapi: '3.0.3',
      info: { title: 'Toolchain regression fixture', version: '1.0.0' },
      paths: {},
      components: { schemas: { Tag: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } } } },
    }));
    const generatorPackage = dirname(require.resolve('openapi-typescript/package.json'));
    execFileSync(process.execPath, [join(generatorPackage, 'bin/cli.js'), schema, '-o', output], { cwd: directory });
    assert.match(readFileSync(output, 'utf8'), /id: string/);
    execFileSync(process.execPath, [compiler, '--noEmit', '--strict', '--target', 'ES2022', output], { cwd: directory });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
