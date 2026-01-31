// Responsibility: Smoke test for users endpoint (basic availability)
const usersService = require('../../../services/usersService');

describe('Users - Smoke', () => {
  it('GET /api/users returns 200', () => {
    usersService.list().then((res) => {
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
    });
  });
});
