import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const variables = { dev: 'TAGTOOL_DEV_D1_DATABASE_ID', production: 'TAGTOOL_PRODUCTION_D1_DATABASE_ID' };
const placeholder = '00000000-0000-0000-0000-000000000000';
const validId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const prepareConfig = (source, target, env) => {
  const variable = variables[target];
  if (!Object.hasOwn(variables, target)) throw new Error('Choose dev or production');
  const id = env[variable];
  if (typeof id !== 'string' || !validId.test(id) || id.toLowerCase() === placeholder) {
    throw new Error(`${variable} must be a non-placeholder D1 database UUID`);
  }
  const parsed = ts.parseConfigFileTextToJson('wrangler.jsonc', source);
  if (parsed.error || !parsed.config || typeof parsed.config !== 'object') throw new Error('Invalid Wrangler configuration');
  const config = parsed.config;
  const targetConfig = config.env?.[target];
  if (!targetConfig || !Array.isArray(targetConfig.d1_databases) ||
      targetConfig.d1_databases.length !== 1 || targetConfig.d1_databases[0].binding !== 'DB' ||
      targetConfig.d1_databases[0].database_id !== placeholder) {
    throw new Error('Expected exactly one placeholder DB binding in the selected environment');
  }
  targetConfig.d1_databases[0].database_id = id;
  // The generated file is under .wrangler; keep source paths relative to the project.
  config.main = resolve(root, config.main);
  for (const scope of [config, ...Object.values(config.env)]) {
    for (const binding of scope.d1_databases ?? []) {
      if (binding.migrations_dir) binding.migrations_dir = resolve(root, binding.migrations_dir);
    }
  }
  delete config.$schema;
  return config;
};

const run = () => {
  const [target, separator, ...args] = process.argv.slice(2);
  if (separator !== '--' || !args.length || args.some((arg) =>
    /^(?:--config|--env|--cwd)(?:=|$)/.test(arg) || /^-[ce]/.test(arg))) {
    throw new Error('Usage: node scripts/wrangler-environment.mjs <dev|production> -- <wrangler command>');
  }
  const config = prepareConfig(readFileSync(join(root, 'wrangler.jsonc'), 'utf8'), target, process.env);
  const generatedRoot = join(root, '.wrangler');
  mkdirSync(generatedRoot, { recursive: true });
  const directory = mkdtempSync(join(generatedRoot, 'environment-'));
  try {
    const configPath = join(directory, 'wrangler.json');
    writeFileSync(configPath, JSON.stringify(config), { mode: 0o600, flag: 'wx' });
    const result = spawnSync(process.execPath,
      [join(root, 'node_modules', 'wrangler', 'bin', 'wrangler.js'), ...args, '--config', configPath, '--env', target],
      { cwd: root, env: process.env, stdio: 'inherit' });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { run(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
