'use strict';

var _util = require('../util');

var _util2 = _interopRequireDefault(_util);

var _stats = require('../stats');

var _stats2 = _interopRequireDefault(_stats);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function (fromVersion) {
  (0, _stats2.default)({}).track('cli', 'migration', fromVersion);

  if (!_fs2.default.existsSync('./botfile.js')) {
    throw new Error('You must be inside a bot directory to run a migration');
  }

  var files = _lodash2.default.sortBy(_fs2.default.readdirSync(_path2.default.join(__dirname, 'migrations')), function (x) {
    return x;
  });

  var toApply = _lodash2.default.filter(files, function (f) {
    if (!/.js$/i.test(f)) {
      return false;
    }

    return parseFloat(fromVersion) < parseFloat(f.replace(/\.js/i, ''));
  });

  return _bluebird2.default.mapSeries(toApply, function (file) {
    var migration = require(_path2.default.join(__dirname, 'migrations', file));
    return migration(_path2.default.resolve('.')).then(function () {
      _util2.default.print('success', 'Migration ' + file.replace('.js', '') + ' applied successfully');
    });
  }).finally(function () {
    _util2.default.print('success', 'Migration completed.');
    process.exit(0);
  });
};
//# sourceMappingURL=migrate.js.map