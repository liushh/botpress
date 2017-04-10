'use strict';

var _winston = require('winston');

var _winston2 = _interopRequireDefault(_winston);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function (dataLocation, logConfig) {
  var logger = new _winston2.default.Logger({
    level: _util.isDeveloping ? 'debug' : 'info',
    transports: [new _winston2.default.transports.Console({
      prettyPrint: true,
      colorize: true,
      timestamp: function timestamp() {
        return (0, _moment2.default)().format('HH:mm:ss');
      }
    })]
  });

  logger.enableFileTransport = function () {
    var logFile = _path2.default.join(dataLocation, logConfig.file);

    logger.add(_winston2.default.transports.File, {
      filename: logFile,
      maxsize: logConfig.maxSize
    });
  };

  logger.archiveToFile = function () {
    var logFile = _path2.default.join(dataLocation, logConfig.file);

    return _bluebird2.default.resolve(logFile);
  };

  if (!logConfig.disableFileLogs) {
    logger.enableFileTransport();
  }

  return logger;
};
//# sourceMappingURL=logger.js.map