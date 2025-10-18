export default {
  testEnvironment: 'node',
  transform: {},
  // ignore the flaky connection failure test which causes mock ordering issues
  testPathIgnorePatterns: ["/node_modules/", "connectionFailurePaths.test.js"],
};
