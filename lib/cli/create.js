'use strict';

var _child_process = require('child_process');

var _prompt = require('prompt');

var _prompt2 = _interopRequireDefault(_prompt);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _util = require('../util');

var _util2 = _interopRequireDefault(_util);

var _stats = require('../stats');

var _stats2 = _interopRequireDefault(_stats);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MODULE_NAME_CONVENTION_BEGINS = 'botpress-';
var MODULE_NAME_REGEX = new RegExp(/^botpress-.*/g);

var introductionText = "This program will bootstrap a new Botpress module";
var doneText = "You're all set! The module is boostrapped and ready to be developed.";
var documentation = "Tip: when coding your bot, use the command `npm run watch` to recompile" + " your module automatically. Also, we strongly recommend that you install your module using " + "`npm link ../path/to/botpress-module` so that your bot always points to the most recent version.";

var getTemplate = function getTemplate(template) {
  var templatePath = _path2.default.join(__dirname, 'templates/create', template);
  var templateContent = _fs2.default.readFileSync(templatePath);
  return _lodash2.default.template(templateContent);
};

var generateTemplate = function generateTemplate(directory, filename) {
  var variables = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var template = getTemplate(filename);
  var compiled = template(variables);
  var destination = _path2.default.join(directory, filename.replace(/_\._/, '.'));
  _fs2.default.writeFileSync(destination, compiled);
};

var prefixModuleNameWithBotpress = function prefixModuleNameWithBotpress(name) {

  if (!MODULE_NAME_REGEX.test(name)) {
    _util2.default.print('warn', 'the name of your module needs to begin by "botpress-"');
    _util2.default.print('warn', 'we renamed your module to ' + _chalk2.default.bold(MODULE_NAME_CONVENTION_BEGINS + name));
    name = MODULE_NAME_CONVENTION_BEGINS + name;
  }

  return name;
};

module.exports = function () {
  var moduleDirectory = _path2.default.resolve('.');
  var dirname = _path2.default.basename(moduleDirectory);

  (0, _stats2.default)({}).track('cli', 'modules', 'create');

  _util2.default.print(introductionText);

  var schema = {
    properties: {
      name: {
        description: _chalk2.default.white('module name:'),
        pattern: /^[a-z0-9][a-z0-9-_\.]+$/,
        message: 'name must be only lowercase letters, ' + 'digits, dashes, underscores and dots.',
        required: true,
        default: dirname
      },
      description: {
        required: false,
        description: _chalk2.default.white('description:')
      },
      author: {
        required: false,
        description: _chalk2.default.white('author:')
      },
      version: {
        required: false,
        description: _chalk2.default.white('version:'),
        default: '1.0.0'
      }
    }
  };

  _prompt2.default.message = '';
  _prompt2.default.delimiter = '';

  _prompt2.default.start();

  _prompt2.default.get(schema, function (err, result) {
    result.name = prefixModuleNameWithBotpress(result.name);

    if (dirname !== result.name) {
      _util2.default.print('warn', 'We usually recommend that the name of the module directory' + (' (' + dirname + ') be the same as the module name (' + result.name + ')'));
    }

    if (_fs2.default.existsSync(_path2.default.join(moduleDirectory, 'package.json'))) {
      _util2.default.print('error', "Expected module directory to be empty / uninitialized");
      process.exit(1);
    } else {
      generateTemplate(moduleDirectory, 'package.json', result);
      generateTemplate(moduleDirectory, 'LICENSE');
      generateTemplate(moduleDirectory, 'webpack.js');
      generateTemplate(moduleDirectory, '_._gitignore');
      generateTemplate(moduleDirectory, '_._npmignore');

      _fs2.default.mkdirSync(moduleDirectory + '/src');
      generateTemplate(moduleDirectory, 'src/index.js');

      _fs2.default.mkdirSync(moduleDirectory + '/src/views');
      generateTemplate(moduleDirectory, 'src/views/index.jsx');
      generateTemplate(moduleDirectory, 'src/views/style.scss');

      _util2.default.print('Installing dependencies, please wait...');

      var install = (0, _child_process.spawn)(_util2.default.npmCmd, ['install']);

      install.stdout.on('data', function (data) {
        process.stdout.write(data.toString());
      });

      install.stderr.on('data', function (data) {
        process.stdout.write(data.toString());
      });

      install.on('close', function (code) {
        if (code > 0) {
          _util2.default.print('error', 'An error occured during the dependencies installation of your module');
        } else {
          _util2.default.print('success', 'Module dependencies installed');
          _util2.default.print(doneText);
          _util2.default.print(documentation);
        }
      });
    }
  });
};
//# sourceMappingURL=create.js.map