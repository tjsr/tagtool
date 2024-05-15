import type { JestConfigWithTsJest } from 'ts-jest';
import { loadEnv } from '@tjsr/simple-env-utils';

loadEnv({ path: process.cwd() });

const config: JestConfigWithTsJest = {
  bail: 1,
  verbose: true,
  detectOpenHandles: true,
  preset: 'ts-jest',
  setupFiles: ['<rootDir>/src/setup-tests.ts'],
  testEnvironment: 'node',
  testRunner: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['js', 'mjs', 'json', 'ts'],
  moduleNameMapper: {
    '\\.(css|less)$': '<rootDir>/test/mocks/styleMock.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^.+\\.env.*$': '$1',
  },
  modulePathIgnorePatterns: ['amplify', 'dist', 'build', 'node_modules'],
};

export default config;
