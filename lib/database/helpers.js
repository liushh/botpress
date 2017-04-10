'use strict';

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _isLite = function _isLite(knex) {
  return knex.client.config.client === 'sqlite3';
}; /*
     The goal of these helpers is to generate SQL queries
     that are valid for both SQLite and Postgres
   */

module.exports = function (knex) {

  var dateParse = function dateParse(exp) {
    return _isLite(knex) ? knex.raw('strftime(\'%Y-%m-%dT%H:%M:%fZ\', ' + exp + ')') : knex.raw(exp);
  };

  var dateFormat = function dateFormat(date) {
    var iso = (0, _moment2.default)(date).toDate().toISOString();
    return dateParse('\'' + iso + '\'');
  };

  var columnOrDateFormat = function columnOrDateFormat(colOrDate) {
    var lite = _isLite(knex);

    if (colOrDate.sql) {
      return colOrDate.sql;
    }

    if (typeof colOrDate === 'string') {
      return lite ? dateParse(colOrDate) : '"' + colOrDate + '"';
    }

    return dateFormat(colOrDate);
  };

  return {
    isLite: function isLite() {
      return _isLite(knex);
    },

    // knex's createTableIfNotExists doesn't work with postgres
    // https://github.com/tgriesser/knex/issues/1303
    createTableIfNotExists: function createTableIfNotExists(tableName, cb) {
      return knex.schema.hasTable(tableName).then(function (exists) {
        if (exists) {
          return;
        }
        return knex.schema.createTableIfNotExists(tableName, cb);
      });
    },

    date: {
      format: dateFormat,

      now: function now() {
        return _isLite(knex) ? knex.raw("strftime('%Y-%m-%dT%H:%M:%fZ', 'now')") : knex.raw('now()');
      },

      isBefore: function isBefore(d1, d2) {
        d1 = columnOrDateFormat(d1);
        d2 = columnOrDateFormat(d2);

        return knex.raw(d1 + ' < ' + d2);
      },

      isAfter: function isAfter(d1, d2) {
        d1 = columnOrDateFormat(d1);
        d2 = columnOrDateFormat(d2);

        return knex.raw(d1 + ' > ' + d2);
      },

      isBetween: function isBetween(d1, d2, d3) {
        d1 = columnOrDateFormat(d1);
        d2 = columnOrDateFormat(d2);
        d3 = columnOrDateFormat(d3);

        return knex.raw(d1 + ' BETWEEN ' + d2 + ' AND ' + d3);
      },

      isSameDay: function isSameDay(d1, d2) {
        d1 = columnOrDateFormat(d1);
        d2 = columnOrDateFormat(d2);

        return knex.raw('date(' + d1 + ') = date(' + d2 + ')');
      },

      hourOfDay: function hourOfDay(date) {
        date = columnOrDateFormat(date);
        return _isLite(knex) ? knex.raw('strftime(\'%H\', ' + date + ')') : knex.raw('to_char(' + date + ', \'HH24\')');
      }
    },

    bool: {

      true: function _true() {
        return _isLite(knex) ? 1 : true;
      },
      false: function _false() {
        return _isLite(knex) ? 0 : false;
      },
      parse: function parse(value) {
        return _isLite(knex) ? !!value : value;
      }

    }

  };
};
//# sourceMappingURL=helpers.js.map