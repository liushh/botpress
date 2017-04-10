'use strict';

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _init = require('./init');

var _init2 = _interopRequireDefault(_init);

var _start = require('./start');

var _start2 = _interopRequireDefault(_start);

var _create = require('./create');

var _create2 = _interopRequireDefault(_create);

var _install = require('./install');

var _install2 = _interopRequireDefault(_install);

var _uninstall = require('./uninstall');

var _uninstall2 = _interopRequireDefault(_uninstall);

var _migrate = require('./migrate');

var _migrate2 = _interopRequireDefault(_migrate);

var _list = require('./list');

var _list2 = _interopRequireDefault(_list);

var _util = require('../util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_commander2.default.command('init').description('Create a new bot in current directory').option('-y, --yes', 'Say yes to every prompt and use default values').action(_init2.default);

_commander2.default.command('start [path]').alias('s').description('Starts running a bot').action(_start2.default);

_commander2.default.command('install <module> [modules...]').alias('i').description('Add modules to the current bot').action(_install2.default);

_commander2.default.command('uninstall <module> [modules...]').alias('u').description('Remove modules from the current bot').action(_uninstall2.default);

_commander2.default.command('list').alias('ls').description('List installed modules').action(_list2.default);

_commander2.default.command('create').alias('c').description('Create a new module for development or distribution').action(_create2.default);

_commander2.default.command('migrate <fromVersion>').description('Migrates the current bot from version X').action(_migrate2.default);

_commander2.default.version((0, _util.getBotpressVersion)()).description('Easily create, manage and extend chatbots.').parse(process.argv);

if (!_commander2.default.args.length) {
  _commander2.default.help();
}
//# sourceMappingURL=index.js.map