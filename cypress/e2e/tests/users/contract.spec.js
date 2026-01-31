// Responsibility: Basic contract assertions (status + shape) for users
const usersService = require('../../../services/usersService');

describe('Users - Contract', () => {
  it('List response has expected keys', () => {
    usersService.list().then((res) => {
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      if (res.body.length > 0) {
        const u = res.body[0];
        expect(u).to.have.property('id');
        expect(u).to.have.property('name');
        expect(u).to.have.property('email');
      }
    });
  });
});
