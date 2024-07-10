import { defineConfig } from 'vitest/config';
import { findEnvFile } from '@tjsr/testutils';
import path from 'path';

const setupTestPath = path.resolve(__dirname, 'src/setup-tests.ts');
// const setupTestPath = './src/setup-tests.ts';
console.log('setupTestPath:', setupTestPath);
const testEnvFile = findEnvFile('.env.test', __dirname);
const envFilePath = path.resolve(testEnvFile);
console.log('envFilePath:', envFilePath);

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    env: {
      DOTENV_DEBUG: 'false',
      DOTENV_FLOW_PATH: path.dirname(testEnvFile) || '.env.test',
      DOTENV_FLOW_PATTERN: '.env.test',
    },
    globals: true,
    include: ['**/*.test.tsx', '**/*.test.ts'],
    setupFiles: [setupTestPath],
  },
});
