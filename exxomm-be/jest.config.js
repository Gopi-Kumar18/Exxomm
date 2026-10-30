module.exports = {
  rootDir: ".",
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  setupFiles: ["<rootDir>/tests/setup/env.js"],
  collectCoverage: false,
  collectCoverageFrom: [
    "backend/**/*.js",
    "!backend/server.js",
    "!backend/seederScript.js",
  ],
  coverageDirectory: "<rootDir>/coverage",
  verbose: true,
};
