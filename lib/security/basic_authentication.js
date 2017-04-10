'use strict';

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function (_ref) {
  var dataLocation = _ref.dataLocation,
      securityConfig = _ref.securityConfig;


  // reading secret from data or creating new secret
  var secret = '';
  var secretPath = _path2.default.join(dataLocation, 'secret.key');

  var createNewSecret = function createNewSecret() {
    secret = _crypto2.default.randomBytes(256).toString();
    _fs2.default.writeFileSync(secretPath, secret);
    return secret;
  };

  if (_fs2.default.existsSync(secretPath)) {
    secret = _fs2.default.readFileSync(secretPath);
  }

  if (!secret || secret.length < 15) {
    secret = createNewSecret();
  }

  var adminPassword = process.env.BOTPRESS_ADMIN_PASSWORD || securityConfig.password;

  // a per-ip cache that logs login attempts
  var attempts = {};
  var lastCleanTimestamp = new Date();
  var maxAttempts = securityConfig.maxAttempts,
      resetAfter = securityConfig.resetAfter;


  function attempt(ip) {
    // reset the cache if time elapsed
    if (new Date() - lastCleanTimestamp >= resetAfter) {
      attempts = {};
      lastCleanTimestamp = new Date();
    }

    return (attempts[ip] || 0) < maxAttempts;
  }

  function authenticate(user, password, ip) {
    if (typeof user === 'string' && user.toLowerCase() === 'admin' && typeof password === 'string' && password === adminPassword) {
      attempts[ip] = 0;
      return {
        id: 0,
        email: 'admin@botpress.io',
        first_name: 'Admin',
        last_name: 'Admin',
        avatar_url: null,
        roles: ['admin']
      };
    } else {
      attempts[ip] = (attempts[ip] || 0) + 1;
      return null;
    }
  }

  function getSecret() {
    return secret;
  }

  function resetSecret() {
    return createNewSecret();
  }

  // Public API
  return {
    attempt: _bluebird2.default.method(attempt),
    authenticate: _bluebird2.default.method(authenticate),
    getSecret: _bluebird2.default.method(getSecret),
    resetSecret: _bluebird2.default.method(resetSecret)
  };
};
//# sourceMappingURL=basic_authentication.js.map