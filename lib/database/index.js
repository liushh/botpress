'use strict';

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _core_tables = require('./core_tables');

var _core_tables2 = _interopRequireDefault(_core_tables);

var _kvs = require('./kvs');

var _kvs2 = _interopRequireDefault(_kvs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var initializeCoreDatabase = function initializeCoreDatabase(knex) {
  if (!knex) {
    throw new Error('You must initialize the database before');
  }

  return _bluebird2.default.mapSeries(_core_tables2.default, function (fn) {
    return fn(knex);
  });
};

module.exports = function (_ref) {
  var sqlite = _ref.sqlite,
      postgres = _ref.postgres;


  var knex = null;

  var getDb = function getDb() {
    if (knex) {
      return _bluebird2.default.resolve(knex);
    }

    if (postgres.enabled) {
      knex = require('knex')({
        client: 'pg',
        connection: {
          host: postgres.host,
          port: postgres.port,
          user: postgres.user,
          password: postgres.password,
          database: postgres.database,
          ssl: postgres.ssl
        },
        useNullAsDefault: true
      });
    } else {
      knex = require('knex')({
        client: 'sqlite3',
        connection: { filename: sqlite.location },
        useNullAsDefault: true
      });
    }

    return initializeCoreDatabase(knex).then(function () {
      return knex;
    });
  };

  var saveUser = function saveUser(_ref2) {
    var id = _ref2.id,
        platform = _ref2.platform,
        gender = _ref2.gender,
        timezone = _ref2.timezone,
        locale = _ref2.locale,
        picture_url = _ref2.picture_url,
        first_name = _ref2.first_name,
        last_name = _ref2.last_name;

    var userId = platform + ':' + id;
    var userRow = {
      id: userId,
      userId: id,
      platform: platform,
      gender: gender || 'unknown',
      timezone: timezone || null,
      locale: locale || null,
      created_on: (0, _moment2.default)(new Date()).toISOString(),
      picture_url: picture_url,
      last_name: last_name,
      first_name: first_name
    };

    return getDb().then(function (knex) {
      var query = knex('users').insert(userRow).where(function () {
        return this.select(knex.raw(1)).from('users').where('id', '=', userId);
      });

      if (postgres.enabled) {
        query = query + ' on conflict (id) do nothing';
      } else {
        // SQLite
        query = query.toString().replace(/^insert/i, 'insert or ignore');
      }

      return knex.raw(query);
    });
  };

  var kvs_instance = null;
  var getKvs = function getKvs() {
    if (!kvs_instance) {
      return getDb().then(function (knex) {
        kvs_instance = new _kvs2.default(knex);
        return kvs_instance.bootstrap().then(function () {
          return kvs_instance;
        });
      });
    } else {
      return _bluebird2.default.resolve(kvs_instance);
    }
  };

  var kvsGet = function kvsGet() {
    var args = arguments;
    return getKvs().then(function (instance) {
      return instance.get.apply(null, args);
    });
  };

  var kvsSet = function kvsSet() {
    var args = arguments;
    return getKvs().then(function (instance) {
      return instance.set.apply(null, args);
    });
  };

  return {
    get: getDb,
    saveUser: saveUser,
    location: postgres.enabled ? 'postgres' : sqlite.location,
    kvs: { get: kvsGet, set: kvsSet }
  };
};
//# sourceMappingURL=index.js.map