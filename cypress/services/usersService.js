// Responsibility: Service Object for 'users' resource, using BaseService for HTTP
const { baseService } = require('../support/baseService');

const USERS_PATH = '/api/users';

module.exports = {
  list(params) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return baseService.get(`${USERS_PATH}${qs}`);
  },

  get(id) {
    return baseService.get(`${USERS_PATH}/${id}`);
  },

  create(payload) {
    return baseService.post(USERS_PATH, payload);
  },

  update(id, payload) {
    return baseService.put(`${USERS_PATH}/${id}`, payload);
  },

  remove(id) {
    return baseService.delete(`${USERS_PATH}/${id}`);
  }
};
