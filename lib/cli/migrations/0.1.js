'use strict';

var _knex = require('knex');

var _knex2 = _interopRequireDefault(_knex);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _kvs = require('../../database/kvs');

var _kvs2 = _interopRequireDefault(_kvs);

var _util = require('../../util');

var _util2 = _interopRequireDefault(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function (bot_path) {
  var botfilePath = _path2.default.join(bot_path, 'botfile.js');
  var botfile = require(botfilePath);
  var dbLocation = _path2.default.resolve(_path2.default.join(bot_path, botfile.dataDir, 'db.sqlite'));

  return migrate_database_schema(dbLocation).then(function () {
    return migrate_botfile(botfilePath);
  });
};

function migrate_database_schema(dbLocation) {

  var updateUsers = 'strftime(\'%Y-%m-%dT%H:%M:%fZ\', created_on/1000, \'unixepoch\')';

  var knex = (0, _knex2.default)({
    client: 'sqlite3',
    connection: { filename: dbLocation },
    useNullAsDefault: true
  });

  return knex.schema.table('users', function (table) {
    table.string('picture_url');
    table.string('first_name');
    table.string('last_name');
  }).then(function () {
    return knex('users').update({ created_on: knex.raw(updateUsers) });
  }).then(function (rows) {
    _util2.default.print('info', 'Updated ' + rows + ' users');
    _util2.default.print('warn', 'Users table was migrated to new schema but existing ' + 'users will miss the following fields: `picture_url`, `first_name`, ' + '`last_name`. They have been left to `null`.');
  }).catch(function () {
    _util2.default.print('warn', 'Did not migrate table `users` as schema was already up to date');
  }).then(function () {
    return (0, _kvs2.default)(knex).bootstrap();
  }).catch(function () {
    _util2.default.print('warn', 'Did not create table `kvs` as schema was already up to date');
  }).then(function () {

    if (!process.env.DELETE_TABLES) {
      _util2.default.print('warn', "This migration must delete the tables of " + "the following modules: `botpress-scheduler`, `botpress-analytics`, " + "`botpress-hitl` and `botpress-subscription`.");

      _util2.default.print('warn', "This step has been skipped because you didn't provide " + "the DELETE_TABLES=true environement variable.");

      _util2.default.print('warn', "Please backup your data if necessary then re-run with DELETE_TABLES=true");
      return false;
    }

    return dropTableIfExists(knex, 'analytics_interactions').then(function () {
      return dropTableIfExists(knex, 'analytics_runs');
    }).then(function () {
      return dropTableIfExists(knex, 'broadcast_outbox');
    }).then(function () {
      return dropTableIfExists(knex, 'broadcast_schedules');
    }).then(function () {
      return dropTableIfExists(knex, 'hitl_messages');
    }).then(function () {
      return dropTableIfExists(knex, 'hitl_sessions');
    }).then(function () {
      return dropTableIfExists(knex, 'subscription_users');
    }).then(function () {
      return dropTableIfExists(knex, 'subscriptions');
    }).then(function () {
      return dropTableIfExists(knex, 'scheduler_schedules');
    }).then(function () {
      return dropTableIfExists(knex, 'scheduler_tasks');
    }).then(function () {
      return _util2.default.print('info', 'Dropped module tables');
    });
  });
}

function dropTableIfExists(knex, tableName) {
  return knex.schema.hasTable(tableName).then(function (has) {
    if (has) {
      return knex.schema.dropTable(tableName);
    }
  });
}

function migrate_botfile(botfilePath) {
  var before = _fs2.default.readFileSync(botfilePath).toString();

  if (before.indexOf('postgres:') >= 0) {
    _util2.default.print('warn', 'Did not migrate botfile as it seemed like `postgres`' + ' was already present. Please migrate manually if this is a mistake.');
    return false;
  }

  var after = before.replace(/module\.exports.*?=.*?{/i, 'module.exports = {\n\n  /**\n  * Postgres configuration\n  */\n  postgres: {\n    enabled: process.env.DATABASE === \'postgres\',\n    host: process.env.PG_HOST || \'127.0.0.1\',\n    port: process.env.PG_PORT || 5432,\n    user: process.env.PG_USER || \'\',\n    password: process.env.PG_PASSWORD || \'\',\n    database: process.env.PG_DB || \'\'\n  },');

  _fs2.default.writeFileSync(botfilePath, after);

  _util2.default.print('info', 'Updated botfile');
}
//# sourceMappingURL=0.1.js.map