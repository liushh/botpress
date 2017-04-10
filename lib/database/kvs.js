'use strict';

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _helpers = require('./helpers');

var _helpers2 = _interopRequireDefault(_helpers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
  Possible options:
    - betweenGetAndSetCallback: will be called between the get and the set
    and wait for promise to resolve
    - tableName: overrides the KVS table's name
*/
module.exports = function (knex) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var getSetCallback = options.betweenGetAndSetCallback || function () {
    return _bluebird2.default.resolve();
  };
  var tableName = options.tableName || 'kvs';

  var get = function get(key, path) {
    return knex(tableName).where({ key: key }).limit(1).then().get(0).then(function (row) {
      if (!row) {
        return null;
      }

      var obj = JSON.parse(row.value);
      if (!path) {
        return obj;
      }

      return _lodash2.default.at(obj, [path])[0];
    });
  };

  var set = function set(key, value, path) {
    var now = (0, _helpers2.default)(knex).date.now();

    var setValue = function setValue(obj) {
      if (path) {
        _lodash2.default.set(obj, path, value);
        return obj;
      } else {
        return value;
      }
    };

    return get(key).then(function (original) {
      return getSetCallback().then(function () {
        if (original) {
          var newObj = setValue(Object.assign({}, original));
          return knex(tableName).where({ key: key }).update({
            value: JSON.stringify(newObj),
            modified_on: now
          }).then();
        } else {
          var obj = setValue({});
          return knex(tableName).insert({
            key: key,
            value: JSON.stringify(obj),
            modified_on: now
          }).then();
        }
      });
    });
  };

  var bootstrap = function bootstrap() {
    return (0, _helpers2.default)(knex).createTableIfNotExists(tableName, function (table) {
      table.string('key').primary();
      table.text('value');
      table.timestamp('modified_on');
    });
  };

  return { get: get, set: set, bootstrap: bootstrap };
};
//# sourceMappingURL=kvs.js.map