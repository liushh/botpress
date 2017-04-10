'use strict';

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _basic_authentication = require('./basic_authentication');

var _basic_authentication2 = _interopRequireDefault(_basic_authentication);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

// BPEE

/**
 * Security helper for botpress
 *
 * Constructor of following functions
 *
 *   - login(user, password, ip)
 *   - authenticate(token)
 *   - getSecret()
 *
 * It will find or create a secret.key in `dataLocation`, then setup the adminPassword for user login.
 *
 */
module.exports = function (_ref) {
  var dataLocation = _ref.dataLocation,
      securityConfig = _ref.securityConfig,
      db = _ref.db;


  var authentication = (0, _basic_authentication2.default)({ dataLocation: dataLocation, securityConfig: securityConfig, db: db });
  var tokenExpiry = securityConfig.tokenExpiry;

  // login function that returns a {success, reason, token} object
  // accounts for number of bad attempts

  var login = function () {
    var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee(user, password) {
      var ip = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'all';
      var canAttempt, loginUser, secret;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return authentication.attempt(ip);

            case 2:
              canAttempt = _context.sent;

              if (canAttempt) {
                _context.next = 5;
                break;
              }

              return _context.abrupt('return', { success: false, reason: 'Too many login attempts. Try again later.' });

            case 5:
              _context.next = 7;
              return authentication.authenticate(user, password, ip);

            case 7:
              loginUser = _context.sent;

              if (!loginUser) {
                _context.next = 15;
                break;
              }

              _context.next = 11;
              return authentication.getSecret();

            case 11:
              secret = _context.sent;
              return _context.abrupt('return', {
                success: true,
                token: _jsonwebtoken2.default.sign({ user: loginUser }, secret, { expiresIn: tokenExpiry })
              });

            case 15:
              return _context.abrupt('return', {
                success: false,
                reason: 'Bad username / password'
              });

            case 16:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    return function login(_x, _x2) {
      return _ref2.apply(this, arguments);
    };
  }();

  /**
   * @param {string} token
   * @return {boolean} whether the token is valid
   */
  var authenticate = function () {
    var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(token) {
      var secret, decoded;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.prev = 0;
              _context2.next = 3;
              return authentication.getSecret();

            case 3:
              secret = _context2.sent;
              decoded = _jsonwebtoken2.default.verify(token, secret);
              return _context2.abrupt('return', decoded.user && decoded.user.roles && _lodash2.default.includes(decoded.user.roles, 'admin'));

            case 8:
              _context2.prev = 8;
              _context2.t0 = _context2['catch'](0);
              return _context2.abrupt('return', false);

            case 11:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, this, [[0, 8]]);
    }));

    return function authenticate(_x4) {
      return _ref3.apply(this, arguments);
    };
  }();

  return {
    login: login,
    authenticate: authenticate,
    getSecret: authentication.getSecret
  };
};
//# sourceMappingURL=index.js.map