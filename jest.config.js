/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: 'domain',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/domain/**/*.test.ts'],
      transform: {
        '^.+\\.tsx?$': ['babel-jest', { presets: ['babel-preset-expo'] }],
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
