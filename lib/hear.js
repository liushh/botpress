'use strict';

var _mware = require('mware');

var _mware2 = _interopRequireDefault(_mware);

var _listeners = require('./listeners');

var _listeners2 = _interopRequireDefault(_listeners);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function () {

  var chain = (0, _mware2.default)();
  var handler = function handler(event, next) {
    chain.run(event, function () {
      next.apply(this, arguments);
    });
  };

  var middleware = {
    name: 'hear',
    type: 'incoming',
    order: 20,
    module: 'botpress',
    description: 'The built-in hear convenience middleware',
    handler: handler
  };

  var hear = function hear(condition, callback) {
    chain(_listeners2.default.hear(condition, callback));
  };

  return { hear: hear, middleware: middleware };
};
//# sourceMappingURL=hear.js.map