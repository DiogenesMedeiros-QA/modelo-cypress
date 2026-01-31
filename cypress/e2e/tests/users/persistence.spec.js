// Responsibility: Persistence test using API + DB task to validate data persisted
const usersService = require('../../../services/usersService');

describe('Users - Persistence', () => {
  it('Create user and validate persisted in DB', () => {
    const random = Math.floor(Math.random() * 100000);
    const payload = { name: `Test ${random}`, email: `test+${random}@example.test` };

    usersService.create(payload).then((res) => {
      expect([200,201]).to.include(res.status);
      const created = res.body;
      expect(created).to.have.property('id');

      // Validate in DB via cy.task
      cy.task('queryDatabase', { query: 'SELECT id, name, email FROM users WHERE id = $1', values: [created.id] }).then((rows) => {
        expect(rows).to.be.an('array');
        expect(rows[0]).to.include({ name: payload.name, email: payload.email });
      });
    });
  });
});
