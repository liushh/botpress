'use strict';

var _util = require('../util');

var _util2 = _interopRequireDefault(_util);

var _modules = require('../modules');

var _modules2 = _interopRequireDefault(_modules);

var _stats = require('../stats');

var _stats2 = _interopRequireDefault(_stats);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var waitingText = 'please wait, we are trying to uninstall the modules...';

module.exports = function (module, modules) {
  (0, _stats2.default)({}).track('cli', 'modules', 'install');
  _util2.default.print('info', waitingText);
  var modulesManager = (0, _modules2.default)(null, './', null);
  modulesManager.uninstall.apply(modulesManager, [module].concat(_toConsumableArray(modules)));
};
//# sourceMappingURL=uninstall.js.map