'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var hear = function hear(conditions, callback) {
  if (!_lodash2.default.isPlainObject(conditions)) {
    conditions = { text: conditions };
  }

  return function (event, next) {
    var pairs = _lodash2.default.toPairs(conditions);
    var result = _lodash2.default.every(pairs, function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2),
          key = _ref2[0],
          comparrer = _ref2[1];

      var eventValue = _lodash2.default.get(event, key, null);

      if (_lodash2.default.isFunction(comparrer)) {
        return comparrer(eventValue, event) === true;
      } else if (_lodash2.default.isRegExp(comparrer)) {
        return comparrer.test(eventValue);
      } else {
        return _lodash2.default.isEqual(comparrer, eventValue);
      }
    });

    if (result && _lodash2.default.isFunction(callback)) {
      if (callback.length <= 1) {
        if (_lodash2.default.isFunction(next)) {
          next();
        }
        callback(event);
      } else {
        callback(event, next);
      }
    } else {
      if (_lodash2.default.isFunction(next)) {
        next();
      }
    }
  };
};

module.exports = { hear: hear };
//# sourceMappingURL=listeners.js.map