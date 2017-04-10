'use strict';

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function (projectLocation) {

  var getBotInformation = function getBotInformation() {
    var packageJsonPath = (0, _util.resolveProjectFile)('package.json', projectLocation, true);
    var packageJson = JSON.parse(_fs2.default.readFileSync(packageJsonPath));

    return {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description || '<no description>',
      author: packageJson.author || '<no author>',
      license: packageJson.license || 'AGPL-v3.0'
    };
  };

  return { getBotInformation: getBotInformation };
};
//# sourceMappingURL=about.js.map