'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _mware = require('mware');

var _mware2 = _interopRequireDefault(_mware);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _licensing2 = require('./licensing');

var _licensing3 = _interopRequireDefault(_licensing2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var createMiddleware = function createMiddleware(bp, middlewareName) {
  var _use = (0, _mware2.default)();
  var _error = (0, _mware2.default)();

  var use = function use(middleware) {
    if (typeof middleware !== 'function') {
      throw new TypeError('Expected all middleware arguments to be functions');
    }

    if (middleware.length === 2) {
      _use(middleware);
    } else if (middleware.length === 3) {
      _error(middleware);
    }
  };

  var dispatch = function dispatch(event) {
    if (!_lodash2.default.isPlainObject(event)) {
      throw new TypeError('Expected all dispatch arguments to be plain event objects');
    }

    var conformity = {
      type: function type(value) {
        return typeof value === 'string';
      },
      platform: function platform(value) {
        return typeof value === 'string';
      },
      text: function text(value) {
        return typeof value === 'string';
      },
      raw: function raw() {
        return true;
      }
    };

    if (!_lodash2.default.conformsTo(event, conformity)) {
      throw new TypeError('Expected event to contain (type: string), ' + '(platform: string), (text: string), (raw: any)');
    }

    // Provide botpress to the event handlers
    event.bp = bp;

    _use.run(event, function (err) {
      if (err) {
        _error.run(err, event, function () {
          bp.logger.error('[BOTPRESS] Unhandled error in middleware (' + middlewareName + '). Error: ' + err.message);
        });
      }
    });
  };

  return { use: use, dispatch: dispatch };
};

module.exports = function (bp, dataLocation, projectLocation, logger) {
  var middlewaresFilePath = _path2.default.join(dataLocation, 'middlewares.json');
  var incoming = void 0,
      outgoing = void 0,
      middlewares = void 0,
      customizations = void 0;

  var noopChain = function noopChain() {
    var message = 'Middleware called before middlewares have been loaded. This is a no-op.' + ' Have you forgotten to call `bp.loadMiddlewares()` in your bot?';

    if (arguments && _typeof(arguments[0]) === 'object') {
      message += '\nCalled with: ' + JSON.stringify(arguments[0], null, 2);
    }

    logger.warn(message);
  };

  var readCustomizations = function readCustomizations() {
    if (!_fs2.default.existsSync(middlewaresFilePath)) {
      _fs2.default.writeFileSync(middlewaresFilePath, '{}');
    }
    return JSON.parse(_fs2.default.readFileSync(middlewaresFilePath));
  };

  var writeCustomizations = function writeCustomizations() {
    _fs2.default.writeFileSync(middlewaresFilePath, JSON.stringify(customizations));
  };

  var setCustomizations = function setCustomizations(middlewares) {
    _lodash2.default.each(middlewares, function (middleware) {
      var name = middleware.name,
          order = middleware.order,
          enabled = middleware.enabled;

      customizations[name] = { order: order, enabled: enabled };
    });
    writeCustomizations();
  };

  var resetCustomizations = function resetCustomizations() {
    customizations = {};
    writeCustomizations();
  };

  var register = function register(middleware) {
    if (!middleware || !middleware.name) {
      logger.error('A unique middleware name is mandatory');
      return false;
    }

    if (!middleware.handler) {
      logger.error('A middleware handler is mandatory');
      return false;
    }

    if (!middleware.type || middleware.type !== 'incoming' && middleware.type !== 'outgoing') {
      logger.error('A middleware type (incoming or outgoing) is required');
      return false;
    }

    middleware.order = middleware.order || 0;
    middleware.enabled = typeof middleware.enabled === 'undefined' ? true : !!middleware.enabled;

    if (_lodash2.default.some(middlewares, function (m) {
      return m.name === middleware.name;
    })) {
      logger.error('Another middleware with the same name has already been registered');
      return false;
    }

    middlewares.push(middleware);
  };

  var list = function list() {
    return _lodash2.default.orderBy(middlewares.map(function (middleware) {
      var customization = customizations[middleware.name];
      if (customization) {
        return Object.assign({}, middleware, customization);
      }
      return middleware;
    }), 'order');
  };

  var load = function load() {
    incoming = createMiddleware(bp, 'incoming');
    outgoing = createMiddleware(bp, 'outgoing');

    var _licensing = (0, _licensing3.default)(projectLocation),
        licenseMiddleware = _licensing.middleware;

    incoming.use(licenseMiddleware);

    _lodash2.default.each(list(), function (m) {
      if (!m.enabled) {
        return logger.debug('SKIPPING middleware:', m.name, ' [Reason=disabled]');
      }

      logger.debug('Loading middleware:', m.name);

      if (m.type === 'incoming') {
        incoming.use(m.handler);
      } else {
        outgoing.use(m.handler);
      }
    });
  };

  var sendToMiddleware = function sendToMiddleware(type) {
    return function (event) {
      var mw = type === 'incoming' ? incoming : outgoing;
      mw.dispatch ? mw.dispatch(event) : mw(event);
    };
  };

  var sendIncoming = sendToMiddleware('incoming');
  var sendOutgoing = sendToMiddleware('outgoing');

  incoming = outgoing = noopChain;
  middlewares = [];
  customizations = readCustomizations();

  return {
    load: load,
    list: list,
    register: register,
    sendIncoming: sendIncoming,
    sendOutgoing: sendOutgoing,
    getCustomizations: function getCustomizations() {
      return customizations;
    },
    setCustomizations: setCustomizations,
    resetCustomizations: resetCustomizations
  };
};
//# sourceMappingURL=middlewares.js.map