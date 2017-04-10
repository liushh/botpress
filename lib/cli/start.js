'use strict';

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _util = require('../util');

var _util2 = _interopRequireDefault(_util);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Entry point of botpress
 *
 * It will do the following things:
 *
 * 1. Find botpress instance creator in `node_modules` folder in current project.
 * 2. Find the `botfile.js` which will be injected into the creator to create the instance.
 * 3. Start the botpress instance.
 */
module.exports = function (projectPath, options) {
  var Botpress = null;

  if (!projectPath || typeof projectPath !== 'string') {
    projectPath = '.';
  }

  projectPath = _path2.default.resolve(projectPath);

  try {
    Botpress = require(_path2.default.join(projectPath, 'node_modules', 'botpress')).Botpress;
  } catch (err) {
    _util2.default.print('error', err.message);
    _util2.default.print('error', err.stack);
    _util2.default.print('error', '(fatal) Could not load the local version of botpress');
    _util2.default.print('Hint: 1) have you used `botpress init` to create a new bot the proper way?');
    _util2.default.print('Hint: 2) Do you have read and write permissions on the current directory?');
    _util2.default.print('-------------');
    _util2.default.print('If none of the above works, this might be a bug in botpress. ' + 'Please contact the Botpress Team on gitter and provide the printed error above.');
    process.exit(1);
  }

  var botfile = _path2.default.join(projectPath, 'botfile.js');
  if (!_fs2.default.existsSync(botfile)) {
    _util2.default.print('error', '(fatal) No ' + _chalk2.default.bold('botfile.js') + ' file found at: ' + botfile);
    process.exit(1);
  }

  var bot = new Botpress({ botfile: botfile });
  bot.start();
};
//# sourceMappingURL=start.js.map