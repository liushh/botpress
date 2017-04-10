'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('source-map-support/register');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _cluster = require('cluster');

var _cluster2 = _interopRequireDefault(_cluster);

var _bus = require('./bus');

var _bus2 = _interopRequireDefault(_bus);

var _middlewares = require('./middlewares');

var _middlewares2 = _interopRequireDefault(_middlewares);

var _logger = require('./logger');

var _logger2 = _interopRequireDefault(_logger);

var _security = require('./security');

var _security2 = _interopRequireDefault(_security);

var _notifications = require('./notifications');

var _notifications2 = _interopRequireDefault(_notifications);

var _hear = require('./hear');

var _hear2 = _interopRequireDefault(_hear);

var _database = require('./database');

var _database2 = _interopRequireDefault(_database);

var _licensing = require('./licensing');

var _licensing2 = _interopRequireDefault(_licensing);

var _about = require('./about');

var _about2 = _interopRequireDefault(_about);

var _modules = require('./modules');

var _modules2 = _interopRequireDefault(_modules);

var _stats = require('./stats');

var _stats2 = _interopRequireDefault(_stats);

var _package = require('../package.json');

var _package2 = _interopRequireDefault(_package);

var _server = require('./server');

var _server2 = _interopRequireDefault(_server);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RESTART_EXIT_CODE = 107;

var getDataLocation = function getDataLocation(dataDir, projectLocation) {
  return dataDir && _path2.default.isAbsolute(dataDir) ? _path2.default.resolve(dataDir) : _path2.default.resolve(projectLocation, dataDir || 'data');
};

var mkdirIfNeeded = function mkdirIfNeeded(path, logger) {
  if (!_fs2.default.existsSync(path)) {
    logger.info('Creating data directory: ' + path);

    try {
      _fs2.default.mkdirSync(path);
    } catch (err) {
      logger.error('[FATAL] Error creating directory: ' + err.message);
      process.exit(1);
    }
  }
};

/**
 * Global context botpress
*/

var botpress = function () {
  /**
   * Create botpress
   *
   * @param {string} obj.botfile - the config path
   */
  function botpress(_ref) {
    var botfile = _ref.botfile;

    _classCallCheck(this, botpress);

    this.version = (0, _util.getBotpressVersion)();
    /**
     * The project location, which is the folder where botfile.js located
     */
    this.projectLocation = _path2.default.dirname(botfile);

    /**
     * The botfile config object
     */
    this.botfile = require(botfile);

    this.stats = (0, _stats2.default)(this.botfile);

    this.interval = null;
  }

  /**
   * Start the bot instance
   *
   * It will do the following initiation steps:
   *
   * 1. setup logger
   * 2. resolve paths (dataLocation)
   * 3. inject security functions
   * 4. load modules
   */


  _createClass(botpress, [{
    key: '_start',
    value: function _start() {
      var _this = this;

      this.stats.track('bot', 'started');

      if (!this.interval) {
        this.inverval = setInterval(function () {
          _this.stats.track('bot', 'running');
        }, 30 * 1000);
      }

      // change the current working directory to botpress's installation path
      // the bot's location is kept in this.projectLocation
      process.chdir(_path2.default.join(__dirname, '../'));

      var projectLocation = this.projectLocation,
          botfile = this.botfile;


      var isFirstRun = _fs2.default.existsSync(_path2.default.join(projectLocation, '.welcome'));
      var dataLocation = getDataLocation(botfile.dataDir, projectLocation);
      var modulesConfigDir = getDataLocation(botfile.modulesConfigDir, projectLocation);
      var dbLocation = _path2.default.join(dataLocation, 'db.sqlite');
      var version = _package2.default.version;

      var logger = (0, _logger2.default)(dataLocation, botfile.log);
      mkdirIfNeeded(dataLocation, logger);
      mkdirIfNeeded(modulesConfigDir, logger);

      logger.info('Starting botpress version ' + version);

      var db = (0, _database2.default)({
        sqlite: { location: dbLocation },
        postgres: botfile.postgres
      });

      var security = (0, _security2.default)({
        dataLocation: dataLocation,
        securityConfig: botfile.login,
        db: db
      });

      var modules = (0, _modules2.default)(logger, projectLocation, dataLocation, db.kvs);

      var moduleDefinitions = modules._scan();

      var events = new _bus2.default();
      var notifications = (0, _notifications2.default)(dataLocation, botfile.notification, moduleDefinitions, events, logger);
      var about = (0, _about2.default)(projectLocation);
      var licensing = (0, _licensing2.default)(projectLocation);
      var middlewares = (0, _middlewares2.default)(this, dataLocation, projectLocation, logger);

      var _createHearMiddleware = (0, _hear2.default)(),
          hear = _createHearMiddleware.hear,
          hearMiddleware = _createHearMiddleware.middleware;

      middlewares.register(hearMiddleware);

      _lodash2.default.assign(this, {
        dataLocation: dataLocation,
        isFirstRun: isFirstRun,
        version: version,
        logger: logger,
        security: security, // login, authenticate, getSecret
        events: events,
        notifications: notifications, // load, save, send
        about: about,
        middlewares: middlewares,
        hear: hear,
        licensing: licensing,
        modules: modules,
        db: db
      });

      var loadedModules = modules._load(moduleDefinitions, this);

      this.stats.track('bot', 'modules', 'loaded', loadedModules.length);

      _lodash2.default.assign(this, {
        _loadedModules: loadedModules
      });

      var server = new _server2.default({ botpress: this });
      server.start();

      var projectEntry = require(projectLocation);
      if (typeof projectEntry === 'function') {
        projectEntry.call(projectEntry, this);
      } else {
        logger.error('[FATAL] The bot entry point must be a function that takes an instance of bp');
        process.exit(1);
      }

      process.on('uncaughtException', function (err) {
        logger.error('[FATAL] An unhandled exception occured in your bot', err);
        if (_util.isDeveloping) {
          logger.error(err.stack);
        }

        _this.stats.trackException(err.message);
        process.exit(1);
      });

      process.on('unhandledRejection', function (reason, p) {
        logger.error('Unhandled Rejection in Promise: ', p, 'Reason:', reason);

        _this.stats.trackException(reason);
        if (_util.isDeveloping && reason && reason.stack) {
          logger.error(reason.stack);
        }
      });
    }
  }, {
    key: 'start',
    value: function start() {
      var _this2 = this;

      if (_cluster2.default.isMaster) {
        _cluster2.default.fork();

        _cluster2.default.on('exit', function (worker, code /* , signal */) {
          if (code === RESTART_EXIT_CODE) {
            _cluster2.default.fork();

            _this2.stats.track('bot', 'restarted');
            (0, _util.print)('info', '*** restarted worker process ***');
          } else {
            process.exit(code);
          }
        });
      }

      if (_cluster2.default.isWorker) {
        this._start();
      }
    }
  }, {
    key: 'restart',
    value: function restart() {
      var interval = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

      setTimeout(function () {
        process.exit(RESTART_EXIT_CODE);
      }, interval);
    }
  }]);

  return botpress;
}();

module.exports = botpress;
//# sourceMappingURL=botpress.js.map