/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
const config = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  projects: [
    {
      displayName: 'test',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/**/*.test.ts'],
      setupFilesAfterEnv: ['./tests/setup/setup-jest.ts'],
    },
    {
      displayName: 'lint',
      runner: 'jest-runner-eslint',
      testMatch: ['<rootDir>/src/**/*.ts'],
    },
  ],
};

export default config;
