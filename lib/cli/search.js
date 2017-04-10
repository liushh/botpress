'use strict';

var _prompt = require('prompt');

var _prompt2 = _interopRequireDefault(_prompt);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function (argument, options) {

  var getKeywords = _bluebird2.default.method(function (argument) {

    if (typeof argument === 'string') {
      return argument;
    } else {
      var schema = {
        properties: {
          keyword: {
            description: _chalk2.default.white('keyword:'),
            pattern: /^[a-zA-Z0-9][a-zA-Z0-9-_\.]+$/,
            message: 'keyword must be letters, digits, dashes, underscores and dots.',
            required: true
          }
        }
      };

      _prompt2.default.message = '';
      _prompt2.default.delimiter = '';
      _prompt2.default.start();

      return _bluebird2.default.fromCallback(function (callback) {
        _prompt2.default.get(schema, callback);
      }).then(function (result) {
        return result.keyword;
      });
    }
  });

  var printResult = function printResult(keyword) {
    console.log("You are actualy looking for: " + keyword);
  };

  getKeywords(argument).then(printResult);
};
//# sourceMappingURL=search.js.map