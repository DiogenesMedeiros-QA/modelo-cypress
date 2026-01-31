// Responsibility: Encapsula cy.request com headers, auth (Bearer), logs e tratamento de erros (CommonJS)
class BaseService {
  constructor() {
    this.token = null;
    this.refreshHook = null;
  }

  setToken(token) {
    this.token = token;
  }

  setRefreshHook(fn) {
    this.refreshHook = fn;
  }

  _buildHeaders(customHeaders) {
    const headers = Object.assign({}, customHeaders || {});
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    return headers;
  }

  request(options = {}) {
    const { method = 'GET', url, body, headers } = options;
    const h = this._buildHeaders(headers);
    const start = Date.now();

    return cy.request({
      method,
      url,
      body,
      headers: h,
      failOnStatusCode: false
    }).then((resp) => {
      const duration = resp.duration || Date.now() - start;
      const out = {
        status: resp.status,
        body: resp.body,
        headers: resp.headers,
        duration
      };
      cy.log(`Request: ${method} ${url} -> ${resp.status} (${duration}ms)`);
      // expose full response for debugging
      return out;
    }).catch((err) => {
      cy.log('Request error: ' + (err.message || err));
      if (this.refreshHook) {
        // optional refresh token flow
        return Promise.resolve(this.refreshHook()).then(() => this.request(options));
      }
      throw {
        message: 'BaseService request failed',
        original: err
      };
    });
  }

  get(url, opts = {}) { return this.request(Object.assign({}, opts, { method: 'GET', url })); }
  post(url, body, opts = {}) { return this.request(Object.assign({}, opts, { method: 'POST', url, body })); }
  put(url, body, opts = {}) { return this.request(Object.assign({}, opts, { method: 'PUT', url, body })); }
  patch(url, body, opts = {}) { return this.request(Object.assign({}, opts, { method: 'PATCH', url, body })); }
  delete(url, opts = {}) { return this.request(Object.assign({}, opts, { method: 'DELETE', url })); }
}

module.exports = { BaseService, baseService: new BaseService() };
