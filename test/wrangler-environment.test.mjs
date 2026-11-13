import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { prepareConfig } from '../scripts/wrangler-environment.mjs';

const source = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
const devId = '11111111-1111-4111-8111-111111111111';
const productionId = '22222222-2222-4222-8222-222222222222';
const placeholder = '00000000-0000-0000-0000-000000000000';
const vars = { TAGTOOL_DEV_D1_DATABASE_ID: devId, TAGTOOL_PRODUCTION_D1_DATABASE_ID: productionId };

test('injects only the selected environment and leaves local configuration unchanged', () => {
  const dev = prepareConfig(source, 'dev', vars);
  assert.equal(dev.env.dev.d1_databases[0].database_id, devId);
  assert.equal(dev.env.production.d1_databases[0].database_id, placeholder);
  assert.equal(dev.d1_databases[0].database_id, placeholder);
  const production = prepareConfig(source, 'production', vars);
  assert.equal(production.env.production.d1_databases[0].database_id, productionId);
  assert.equal(production.env.dev.d1_databases[0].database_id, placeholder);
});

test('fails closed for missing, malformed, zero and wrong-environment IDs', () => {
  for (const invalid of [undefined, '', placeholder, 'not-a-uuid']) {
    assert.throws(() => prepareConfig(source, 'dev', { TAGTOOL_DEV_D1_DATABASE_ID: invalid }));
  }
  assert.throws(() => prepareConfig(source, 'production', { TAGTOOL_DEV_D1_DATABASE_ID: devId }));
  assert.throws(() => prepareConfig(source, 'preview', vars));
});
