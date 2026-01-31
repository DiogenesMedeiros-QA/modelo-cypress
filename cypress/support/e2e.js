// Responsibility: Cypress support entrypoint (loads commands and global hooks)
require('./commands');

// global beforeEach example: clear auth token between tests
beforeEach(() => {
  // Reset token for test isolation
  const { baseService } = require('./baseService');
  baseService.setToken(null);
});
