import type { JestConfigWithTsJest } from 'ts-jest';
import dotenvFlow from 'dotenv-flow';

dotenvFlow.config({ silent: true });

const config: JestConfigWithTsJest = {
  bail: 1,
  verbose: true,
  detectOpenHandles: true,
  preset: 'ts-jest',
  setupFiles: ['<rootDir>/src/setup-tests.ts'],
  testEnvironment: 'node',
  testRunner: 'jest-jasmine2',
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
