'use strict';

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _module = require('module');

var _module2 = _interopRequireDefault(_module);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// comment to make sure things are updated.

var IS_DEV = process.env.NODE_ENV !== 'production';

var NPM_CMD = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';

var print = function print() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  var mapping = {
    info: _chalk2.default.white,
    warn: function warn() {
      return _chalk2.default.yellow.apply(_chalk2.default, ['WARN'].concat(Array.prototype.slice.call(arguments)));
    },
    error: function error() {
      return _chalk2.default.red.apply(_chalk2.default, ['ERR'].concat(Array.prototype.slice.call(arguments)));
    },
    success: function success() {
      return _chalk2.default.green.apply(_chalk2.default, ['OK'].concat(Array.prototype.slice.call(arguments)));
    }
  };

  var level = mapping[args[0]];
  var matched = !!level;

  if (!matched) {
    level = mapping.info;
  } else {
    args.splice(0, 1);
  }

  console.log(_chalk2.default.black.bgWhite('[botpress]'), '\t', level.apply(undefined, args));
};

var resolveFromDir = function resolveFromDir(fromDir, moduleId) {
  fromDir = _path2.default.resolve(fromDir);
  var fromFile = _path2.default.join(fromDir, 'noop.js');
  try {
    return _module2.default._resolveFilename(moduleId, {
      id: fromFile,
      filename: fromFile,
      paths: _module2.default._nodeModulePaths(fromDir)
    });
  } catch (err) {
    return null;
  }
};

var resolveModuleRootPath = function resolveModuleRootPath(entryPath) {
  var current = _path2.default.dirname(entryPath);
  while (current !== '/') {
    var lookup = _path2.default.join(current, 'package.json');
    if (_fs2.default.existsSync(lookup)) {
      return current;
    }
    current = _path2.default.resolve(_path2.default.join(current, '..'));
  }
  return null;
};

var resolveProjectFile = function resolveProjectFile(file, projectLocation, throwIfNotExist) {
  var packagePath = _path2.default.resolve(projectLocation || './', file);

  if (!_fs2.default.existsSync(packagePath)) {
    if (throwIfNotExist) {
      throw new Error('Could not find bot\'s package.json file');
    }
    return null;
  }

  return packagePath;
};

var getBotpressVersion = function getBotpressVersion() {
  var botpressPackagePath = _path2.default.join(__dirname, '../package.json');
  var botpressJson = JSON.parse(_fs2.default.readFileSync(botpressPackagePath));
  return botpressJson.version;
};

module.exports = {
  print: print,
  resolveFromDir: resolveFromDir,
  isDeveloping: IS_DEV,
  resolveModuleRootPath: resolveModuleRootPath,
  resolveProjectFile: resolveProjectFile,
  npmCmd: NPM_CMD,
  getBotpressVersion: getBotpressVersion
};
//# sourceMappingURL=util.js.map