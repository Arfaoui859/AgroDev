// React Native's Animated implementation branches on process.env.NODE_ENV and,
// outside 'test', throws "Unable to locate attached view in the native tree"
// when a host ref cannot be resolved under the jsdom-free jest renderer. Jest
// only defaults NODE_ENV to 'test' when it is unset, so an ambient
// NODE_ENV=development (e.g. exported by a dev shell) silently breaks the whole
// component suite. Pin it here so runs are reproducible regardless of the shell.
process.env.NODE_ENV = 'test';

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/tests/env.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.test.tsx'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@supabase/.*))',
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};
