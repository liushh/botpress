'use strict';

var _child_process = require('child_process');

var _prompt = require('prompt');

var _prompt2 = _interopRequireDefault(_prompt);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _util = require('../util');

var _util2 = _interopRequireDefault(_util);

var _stats = require('../stats');

var _stats2 = _interopRequireDefault(_stats);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var introductionText = "\nHey there, thanks for using botpress!" + "\nWe'll walk you through the creation of your new bot." + "\nFor more information or help, please visit http://github.com/botpress/botpress" + "\n---------------";

var waitingText = 'please wait, we are installing everything for you...';
var nextStepText = 'now run ' + _chalk2.default.bold('`bp start`') + ' in your terminal';

var assertDoesntExist = function assertDoesntExist(file) {
  if (_fs2.default.existsSync(file)) {
    _util2.default.print('error', 'package.json or botfile.js are already in repository, ' + 'remove them before running this command again.');
    process.exit(1);
  }
};

var getTemplate = function getTemplate(template) {
  var templatePath = _path2.default.join(__dirname, 'templates/init', template);
  var templateContent = _fs2.default.readFileSync(templatePath);
  return _lodash2.default.template(templateContent);
};

var generateTemplate = function generateTemplate(filename) {
  var variables = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var template = getTemplate(filename);
  var compiled = template(variables);
  var destination = _path2.default.join(filename.replace(/_\._/, '.'));
  _fs2.default.writeFileSync(destination, compiled);
};

var generate = function generate(result) {
  generateTemplate('package.json', result);
  generateTemplate('LICENSE');
  generateTemplate('botfile.js');
  generateTemplate('index.js');
  generateTemplate('_._gitignore');
  generateTemplate('_._welcome');
  generateTemplate('theme.scss');

  _fs2.default.mkdirSync('data');
  _fs2.default.writeFileSync('data/bot.log', '');
  _fs2.default.writeFileSync('data/notification.json', '[]');

  _fs2.default.mkdirSync('modules_config');

  _util2.default.print(waitingText);
  var install = (0, _child_process.spawn)(_util2.default.npmCmd, ['install']);

  install.stdout.on('data', function (data) {
    process.stdout.write(data.toString());
  });

  install.stderr.on('data', function (data) {
    process.stdout.write(data.toString());
  });

  install.on('close', function (code) {
    if (code > 0) {
      _util2.default.print('error', 'an error occured during installation');
    } else {
      _util2.default.print('success', 'installation has completed successfully');
      _util2.default.print(nextStepText);
    }
  });
};

module.exports = function (program) {
  (0, _stats2.default)({}).track('cli', 'bot', 'init');

  _util2.default.print(introductionText);

  _lodash2.default.each(['package.json', 'botfile.js', 'index.js'], assertDoesntExist);

  var currentDirectoryName = _path2.default.basename(_path2.default.resolve('./'));

  var schema = {
    properties: {
      name: {
        description: _chalk2.default.white('name:'),
        pattern: /^[a-z0-9][a-z0-9-_\.]+$/,
        message: 'name must be only lowercase letters, ' + 'digits, dashes, underscores and dots.',
        required: true,
        default: currentDirectoryName
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
        default: '0.0.1'
      }
    }
  };

  if (program.yes) {
    generate({
      name: currentDirectoryName,
      description: '',
      author: '',
      version: '0.0.1'
    });
  } else {
    _prompt2.default.message = '';
    _prompt2.default.delimiter = '';
    _prompt2.default.start();
    _prompt2.default.get(schema, function (err, result) {
      generate(result);
    });
  }
};
//# sourceMappingURL=init.js.map