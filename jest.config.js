module.exports = {
  testEnvironment: 'jsdom',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'lcov', 'text'],
  collectCoverageFrom: ['packages/*/src/**/*.ts'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    'src/index.ts',
    '\\.d\\.ts$',
    'src/devtools',
    'src/hmr',
    'src/deprecated.ts',
    'src/vue2-plugin.ts',
  ],
  testMatch: ['<rootDir>/packages/*/__tests__/**/*.spec.ts'],
  transform: {
    '^.+\\.tsx?$': '@sucrase/jest-plugin',
  },
  moduleNameMapper: {
    '^@pinia/(.*?)$': '<rootDir>/packages/$1/src',
    '^pinia$': '<rootDir>/packages/pinia/src',
  },
  rootDir: __dirname,
  globals: {
    __DEV__: true,
    __TEST__: true,
    __BROWSER__: true,
  },
}
