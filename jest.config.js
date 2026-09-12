/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/src/domain/**/*.test.ts',
        '<rootDir>/src/lib/**/*.test.ts',
        '<rootDir>/src/db/**/*.test.ts',
      ],
      transform: {
        '^.+\\.tsx?$': ['babel-jest', { presets: ['babel-preset-expo'] }],
      },
      // Repository tests run against an in-memory better-sqlite3 database
      // (see src/db/testClient.ts) instead of the real expo-sqlite client,
      // which has no native binding available under plain Node/Jest.
      moduleNameMapper: {
        '^@/src/db/client$': '<rootDir>/src/db/testClient.ts',
        '^@/(.*)$': '<rootDir>/$1',
      },
    },
    {
      displayName: 'app',
      preset: 'jest-expo',
      testMatch: [
        '<rootDir>/app/**/__tests__/**/*.test.{ts,tsx}',
        '<rootDir>/components/**/*.test.{ts,tsx}',
        '<rootDir>/src/**/*.test.tsx',
      ],
    },
  ],
};
