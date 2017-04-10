'use strict';

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _listeners = require('./listeners');

var _listeners2 = _interopRequireDefault(_listeners);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function (projectLocation) {

  var licensesPath = _path2.default.join(__dirname, '../licenses');

  var getLicenses = function getLicenses() {
    var packageJsonPath = (0, _util.resolveProjectFile)('package.json', projectLocation, true);

    var _JSON$parse = JSON.parse(_fs2.default.readFileSync(packageJsonPath)),
        license = _JSON$parse.license;

    var agplContent = _fs2.default.readFileSync(_path2.default.join(licensesPath, 'LICENSE_AGPL3')).toString();
    var botpressContent = _fs2.default.readFileSync(_path2.default.join(licensesPath, 'LICENSE_BOTPRESS')).toString();

    return {
      agpl: {
        name: 'AGPL-3.0',
        licensedUnder: license === 'AGPL-3.0',
        text: agplContent
      },
      botpress: {
        name: 'Botpress',
        licensedUnder: license === 'Botpress',
        text: botpressContent
      }
    };
  };

  var changeLicense = _bluebird2.default.method(function (license) {
    var packageJsonPath = (0, _util.resolveProjectFile)('package.json', projectLocation, true);

    var licensePath = (0, _util.resolveProjectFile)('LICENSE', projectLocation, true);
    var licenseFileName = license === 'AGPL-3.0' ? 'LICENSE_AGPL3' : 'LICENSE_BOTPRESS';
    var licenseContent = _fs2.default.readFileSync(_path2.default.join(licensesPath, licenseFileName));

    var pkg = JSON.parse(_fs2.default.readFileSync(packageJsonPath));
    pkg.license = license;

    _fs2.default.writeFileSync(licensePath, licenseContent);
    _fs2.default.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
  });

  var middleware = _listeners2.default.hear(/^BOT_LICENSE$/, function (event, next) {
    var packageJsonPath = (0, _util.resolveProjectFile)('package.json', projectLocation, true);

    var _JSON$parse2 = JSON.parse(_fs2.default.readFileSync(packageJsonPath)),
        license = _JSON$parse2.license,
        name = _JSON$parse2.name,
        author = _JSON$parse2.author;

    var bp = event.bp;

    var response = 'Bot:  ' + name + '\n      Created by: ' + author + '\n      License: ' + license + '\n      Botpress: ' + bp.version;

    var userId = event.user && event.user.id;

    if (bp[event.platform] && bp[event.platform].sendText) {
      bp[event.platform].sendText(userId, response);
    } else {
      bp.middlewares.sendOutgoing({
        platform: event.platform,
        type: 'text',
        text: response,
        raw: {
          to: userId,
          message: response,
          responseTo: event
        }
      });
    }
  });

  return {
    getLicenses: getLicenses,
    changeLicense: changeLicense,
    middleware: middleware
  };
};
//# sourceMappingURL=licensing.js.map