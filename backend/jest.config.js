module.exports = {
    // Where Jest runs — Node.js (not browser)
    testEnvironment: 'node',

    // Which files are test files
    testMatch: [
        '**/__tests__/**/*.test.js',
    ],

    // Ignore these paths when searching for tests
    testPathIgnorePatterns: [
        '/node_modules/',
    ],

    // What files to include in coverage report
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/index.js',
        '!src/app.js',
        '!src/__tests__/**',
        '!src/db/migrations/**',
        '!src/db/migrate.js',
    ],

    // Where coverage reports are generated
    coverageDirectory: 'coverage',

    // Print each test as it runs
    verbose: true,

    // Give tests more time (DB queries can be slow)
    testTimeout: 30000,

    // Clear mocks between each test automatically
    clearMocks: true,

    // Force tests to exit after completion (some DB connections linger)
    forceExit: true,

    setupFiles: ['<rootDir>/src/__tests__/loadTestEnv.js'],
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
};