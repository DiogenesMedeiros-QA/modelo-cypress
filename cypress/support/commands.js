// Responsibility: Custom Cypress commands (reusable test behaviors)
const { baseService } = require('./baseService');

// set auth token to be used by BaseService
Cypress.Commands.add('setAuthToken', (token) => {
  baseService.setToken(token);
  cy.log('Auth token set');
});

// shorthand to call API via service path
Cypress.Commands.add('apiRequest', (opts) => {
  return baseService.request(opts);
});
