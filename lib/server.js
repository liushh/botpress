'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _socket = require('socket.io');

var _socket2 = _interopRequireDefault(_socket);

var _socketioJwt = require('socketio-jwt');

var _socketioJwt2 = _interopRequireDefault(_socketioJwt);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _ms = require('ms');

var _ms2 = _interopRequireDefault(_ms);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

var _nodeSass = require('node-sass');

var _nodeSass2 = _interopRequireDefault(_nodeSass);

var _util = require('./util');

var _util2 = _interopRequireDefault(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new _bluebird2.default(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return _bluebird2.default.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var setupSocket = function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(server, bp) {
    var io;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            io = (0, _socket2.default)(server);

            if (!bp.botfile.login.enabled) {
              _context.next = 10;
              break;
            }

            _context.t0 = io;
            _context.t1 = _socketioJwt2.default;
            _context.next = 6;
            return bp.security.getSecret();

          case 6:
            _context.t2 = _context.sent;
            _context.t3 = {
              secret: _context.t2,
              handshake: true
            };
            _context.t4 = _context.t1.authorize.call(_context.t1, _context.t3);

            _context.t0.use.call(_context.t0, _context.t4);

          case 10:

            io.on('connection', function (socket) {
              bp.stats.track('socket', 'connected');

              socket.on('event', function (event) {
                bp.events.emit(event.name, event.data, 'client');
              });
            });

            bp.events.onAny(function (event, data, from) {
              if (from === 'client') {
                // we sent this ourselves
                return;
              }
              io.emit('event', {
                name: event,
                data: data
              });
            });

            return _context.abrupt('return', server);

          case 13:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function setupSocket(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var serveApi = function serveApi(app, bp) {
  var _this = this;

  var logsSecret = _uuid2.default.v4();
  var routersConditions = {};
  var maybeApply = function maybeApply(name, fn) {
    return function (req, res, next) {
      var router = req.originalUrl.match(/\/api\/(botpress-[^\/]+).*$/i);
      if (!router) {
        return fn(req, res, next);
      }

      if (!routersConditions[router[1]]) {
        return fn(req, res, next);
      }

      var condition = routersConditions[router[1]][name];
      if (condition === false) {
        next();
      } else if (typeof condition === 'function' && condition(req) === false) {
        next();
      } else {
        return fn(req, res, next);
      }
    };
  };

  app.use(maybeApply('bodyParser.json', _bodyParser2.default.json()));
  app.use(maybeApply('bodyParser.urlencoded', _bodyParser2.default.urlencoded({ extended: true })));

  app.post('/api/login', function () {
    var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(req, res) {
      var result;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              bp.stats.track('api', 'auth', 'login');
              _context2.next = 3;
              return bp.security.login(req.body.user, req.body.password, req.ip);

            case 3:
              result = _context2.sent;

              res.send(result);

            case 5:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this);
    }));

    return function (_x3, _x4) {
      return _ref2.apply(this, arguments);
    };
  }());

  app.use('/api/*', maybeApply('auth', authenticationMiddleware(bp)));

  app.get('/api/ping', function (req, res) {
    res.send('pong');
  });

  app.get('/api/modules', function (req, res) {
    var modules = _lodash2.default.map(bp._loadedModules, function (module) {
      return {
        name: module.name,
        homepage: module.homepage,
        menuText: module.settings.menuText || module.name,
        menuIcon: module.settings.menuIcon || 'view_module',
        noInterface: !!module.settings.noInterface
      };
    });
    res.send(modules);
  });

  app.get('/api/middlewares', function (req, res) {
    res.send(bp.middlewares.list());
  });

  app.post('/api/middlewares/customizations', function (req, res) {
    bp.stats.track('api', 'middlewares', 'customizations');
    var middlewares = req.body.middlewares;

    bp.middlewares.setCustomizations(middlewares);
    bp.middlewares.load();
    res.send(bp.middlewares.list());
  });

  app.delete('/api/middlewares/customizations', function (req, res) {
    bp.stats.track('api', 'middlewares', 'customizations');
    bp.middlewares.resetCustomizations();
    bp.middlewares.load();
    res.send(bp.middlewares.list());
  });

  app.get('/api/notifications', function (req, res) {
    res.send(bp.notifications.load());
  });

  app.get('/api/bot/information', function (req, res) {
    res.send(bp.about.getBotInformation());
  });

  app.get('/api/module/all', function (req, res) {
    bp.modules.listAllCommunityModules().then(function (modules) {
      return res.send(modules);
    });
  });

  app.get('/api/module/popular', function (req, res) {
    bp.modules.listPopularCommunityModules().then(function (popular) {
      return res.send(popular);
    });
  });

  app.get('/api/module/featured', function (req, res) {
    bp.modules.listFeaturedCommunityModules().then(function (featured) {
      return res.send(featured);
    });
  });

  app.get('/api/module/hero', function (req, res) {
    bp.modules.getRandomCommunityHero().then(function (hero) {
      return res.send(hero);
    });
  });

  app.get('/api/bot/information', function (req, res) {
    res.send(bp.bot.getInformation());
  });

  app.get('/api/bot/production', function (req, res) {
    res.send(!_util2.default.isDeveloping);
  });

  app.get('/api/bot/contributor', function (req, res) {
    res.send(bp.bot.getContributor());
  });

  app.get('/api/license', function (req, res) {
    res.send(bp.licensing.getLicenses());
  });

  app.post('/api/license', function (req, res) {
    bp.stats.track('api', 'license', 'change');
    bp.licensing.changeLicense(req.body.license).then(function () {
      res.sendStatus(200);
    }).catch(function (err) {
      return res.status(500).send({
        message: err && err.message
      });
    });
  });

  app.post('/api/module/install/:name', function (req, res) {
    bp.stats.track('api', 'modules', 'install');
    var name = req.params.name;

    bp.modules.install(name).then(function () {
      res.sendStatus(200);
      bp.restart(1000);
    }).catch(function (err) {
      return res.status(500).send({
        message: err && err.message
      });
    });
  });

  app.delete('/api/module/uninstall/:name', function (req, res) {
    bp.stats.track('api', 'modules', 'uninstall');
    var name = req.params.name;

    bp.modules.uninstall(name).then(function () {
      res.sendStatus(200);
      bp.restart(1000);
    }).catch(function (err) {
      return res.status(500).send({
        message: err && err.message
      });
    });
  });

  app.delete('/api/guided-tour', function (req, res) {
    _fs2.default.unlink(_path2.default.join(bp.projectLocation, '.welcome'), function () {
      bp.isFirstRun = false;
      res.sendStatus(200);
    });
  });

  app.get('/api/logs', function (req, res) {
    var options = {
      from: new Date() - 7 * 24 * 60 * 60 * 1000,
      until: new Date(),
      limit: req.query && req.query.limit || 50,
      start: 0,
      order: 'desc',
      fields: ['message', 'level', 'timestamp']
    };
    bp.logger.query(options, function (err, results) {
      if (err) {
        return console.log(err);
      }
      res.send(results.file);
    });
  });

  app.get('/api/logs/key', function (req, res) {
    res.send({ secret: logsSecret });
  });

  app.get('/logs/archive/:key', function (req, res) {
    bp.stats.track('api', 'logs', 'archive');
    if (req.params.key !== logsSecret) {
      return res.sendStatus(403);
    }

    bp.logger.archiveToFile().then(function (archivePath) {
      logsSecret = _uuid2.default.v4();
      res.download(archivePath);
    });
  });

  var routers = {};
  bp.getRouter = function (name, conditions) {

    if (!/^botpress-/.test(name)) {
      throw new Error('The name of a router must start with \'botpress-\'. Received: ' + name);
    }

    if (!routers[name]) {
      var router = _express2.default.Router();
      routers[name] = router;
      app.use('/api/' + name + '/', router);
    }

    if (conditions) {
      routersConditions[name] = Object.assign(routersConditions[name] || {}, conditions);
    }

    return routers[name];
  };
};

var serveStatic = function serveStatic(app, bp) {
  var _loop = function _loop(name) {
    var module = bp._loadedModules[name];
    var bundlePath = _path2.default.join(module.root, module.settings.webBundle || 'bin/web.bundle.js');
    var requestPath = '/js/modules/' + name + '.js';

    if (module.settings.menuIcon === 'custom') {
      var iconRequestPath = '/img/modules/' + name + '.png';
      var iconPath = _path2.default.join(module.root, 'icon.png');

      app.use(iconRequestPath, function (req, res) {
        try {
          var _content = _fs2.default.readFileSync(iconPath);
          res.contentType('image/png');
          res.send(_content);
        } catch (err) {
          bp.logger.warn('Could not serve module icon [' + name + '] at: ' + iconPath);
        }
      });
    }

    app.use(requestPath, function (req, res) {
      try {
        var _content2 = _fs2.default.readFileSync(bundlePath);
        res.contentType('text/javascript');
        res.send(_content2);
      } catch (err) {
        bp.logger.warn('Could not serve module [' + name + '] at: ' + bundlePath);
      }
    });
  };

  for (var name in bp._loadedModules) {
    _loop(name);
  }

  app.use('/js/env.js', function (req, res) {
    var _bp$botfile$login = bp.botfile.login,
        tokenExpiry = _bp$botfile$login.tokenExpiry,
        enabled = _bp$botfile$login.enabled;

    var optOutStats = !!bp.botfile.optOutStats;
    var isFirstRun = bp.isFirstRun,
        version = bp.version;

    res.contentType('text/javascript');
    res.send('(function(window) {\n      window.NODE_ENV = "' + (process.env.NODE_ENV || 'development') + '";\n      window.DEV_MODE = ' + _util2.default.isDeveloping + ';\n      window.AUTH_ENABLED = ' + enabled + ';\n      window.AUTH_TOKEN_DURATION = ' + (0, _ms2.default)(tokenExpiry) + ';\n      window.OPT_OUT_STATS = ' + optOutStats + ';\n      window.SHOW_GUIDED_TOUR = ' + isFirstRun + ';\n      window.BOTPRESS_VERSION = "' + version + '";\n    })(window || {})');
  });

  var customTheme = '';
  var themeLocation = _path2.default.join(bp.projectLocation, 'theme.scss');
  if (_fs2.default.existsSync(themeLocation)) {
    var content = _fs2.default.readFileSync(themeLocation);
    var compile = _nodeSass2.default.renderSync({ data: '#app {' + content + '}' });
    customTheme = compile.css.toString();
  }

  app.use('/style/custom-theme.css', function (req, res) {
    res.contentType('text/css');
    res.send(customTheme);
  });

  app.use(_express2.default.static(_path2.default.join(__dirname, '../lib/web')));

  app.get('*', function (req, res, next) {
    if (/html/i.test(req.headers.accept)) {
      return res.sendFile(_path2.default.join(__dirname, '../lib/web/index.html'));
    }
    next();
  });

  return _bluebird2.default.resolve(true);
};

var authenticationMiddleware = function authenticationMiddleware(bp) {
  return function () {
    var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(req, res, next) {
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              if (bp.botfile.login.enabled) {
                _context3.next = 2;
                break;
              }

              return _context3.abrupt('return', next());

            case 2:
              _context3.next = 4;
              return bp.security.authenticate(req.headers.authorization);

            case 4:
              if (!_context3.sent) {
                _context3.next = 8;
                break;
              }

              next();
              _context3.next = 9;
              break;

            case 8:
              res.status(401).location('/login').end();

            case 9:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    return function (_x5, _x6, _x7) {
      return _ref3.apply(this, arguments);
    };
  }();
};

var WebServer = function () {
  function WebServer(_ref4) {
    var botpress = _ref4.botpress;

    _classCallCheck(this, WebServer);

    this.bp = botpress;
  }

  _createClass(WebServer, [{
    key: 'start',
    value: function () {
      var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
        var _this2 = this;

        var app, server, port;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                app = (0, _express2.default)();
                server = _http2.default.createServer(app);
                port = this.bp.botfile.port || 3000;


                serveApi(app, this.bp);
                _context4.next = 6;
                return setupSocket(server, this.bp);

              case 6:
                serveStatic(app, this.bp);

                server.listen(port, function () {
                  _this2.bp.events.emit('ready');
                  var _iteratorNormalCompletion = true;
                  var _didIteratorError = false;
                  var _iteratorError = undefined;

                  try {
                    for (var _iterator = _lodash2.default.values(_this2.bp._loadedModules)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                      var mod = _step.value;

                      mod.handlers.ready && mod.handlers.ready(_this2.bp, mod.configuration);
                    }
                  } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                  } finally {
                    try {
                      if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                      }
                    } finally {
                      if (_didIteratorError) {
                        throw _iteratorError;
                      }
                    }
                  }

                  _this2.bp.logger.info(_chalk2.default.green.bold('Bot launched. Visit: http://localhost:' + port));
                });

              case 8:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function start() {
        return _ref5.apply(this, arguments);
      }

      return start;
    }()
  }]);

  return WebServer;
}();

module.exports = WebServer;
//# sourceMappingURL=server.js.map