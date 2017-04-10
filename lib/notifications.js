'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// TODO this can be an util
var createJsonStore = function createJsonStore(filePath, initData) {
  return {
    load: function load() {
      if (_fs2.default.existsSync(filePath)) {
        return JSON.parse(_fs2.default.readFileSync(filePath));
      }

      return initData;
    },

    save: function save(data) {
      _fs2.default.writeFileSync(filePath, JSON.stringify(data));
    }
  };
};

var bindEvents = function bindEvents(loadNotifs, saveNotifs, events) {
  events.on('notifications.getAll', function () {
    events.emit('notifications.all', loadNotifs());
  });

  var markReadIf = function markReadIf(cond) {
    var notifications = loadNotifs().map(function (notif) {
      if (cond(notif)) {
        notif.read = true;
      }
      return notif;
    });

    saveNotifs(notifications);
    events.emit('notifications.all', notifications);
  };

  events.on('notifications.read', function (id) {
    markReadIf(function (notif) {
      return notif.id === id;
    });
  });

  events.on('notifications.allRead', function () {
    markReadIf(function () {
      return true;
    });
  });

  events.on('notifications.trashAll', function () {
    saveNotifs([]);
    events.emit('notifications.all', []);
  });
};

exports.default = function (dataLocation, notifConfig, modules, events, logger) {
  var notificationsFile = _path2.default.join(dataLocation, notifConfig.file);

  var _createJsonStore = createJsonStore(notificationsFile, []),
      loadNotifs = _createJsonStore.load,
      saveNotifs = _createJsonStore.save;

  bindEvents(loadNotifs, saveNotifs, events);

  var sendNotif = function sendNotif(_ref) {
    var message = _ref.message,
        url = _ref.url,
        level = _ref.level;


    if (!message || typeof message !== 'string') {
      throw new Error('\'message\' is mandatory and should be a string');
    }

    if (!level || typeof level !== 'string' || !_lodash2.default.includes(['info', 'error', 'success'], level.toLowerCase())) {
      level = 'info';
    } else {
      level = level.toLowerCase();
    }

    var callingFile = getOriginatingModule();
    var callingModuleRoot = callingFile && (0, _util.resolveModuleRootPath)(callingFile);

    var module = _lodash2.default.find(modules, function (mod) {
      return mod.root === callingModuleRoot;
    });

    var options = {
      // TODO should probably go in settings as defaults
      moduleId: 'botpress',
      icon: 'view_module',
      name: 'botpress',
      url: url || '/'
    };

    if (module) {
      // because the bot itself can send notifications
      options = {
        moduleId: module.name,
        icon: module.settings.menuIcon,
        name: module.settings.menuText,
        url: url
      };

      if (!url || typeof url !== 'string') {
        options.url = '/modules/' + module.name;
      }
    }

    var notification = {
      id: _uuid2.default.v4(),
      message: message,
      level: level,
      moduleId: options.moduleId,
      icon: options.icon,
      name: options.name,
      url: options.url,
      date: new Date(),
      read: false
    };

    var notifications = loadNotifs();
    if (notifications.length >= notifConfig.maxLength) {
      notifications.pop();
    }

    notifications.unshift(notification);
    saveNotifs(notifications);

    events.emit('notifications.new', notification);

    var logMessage = '[notification::' + notification.moduleId + '] ' + notification.message;
    if (logger) {
      (logger[level] || logger.info)(logMessage);
    }
  };

  return {
    load: loadNotifs,
    save: saveNotifs,
    send: sendNotif
  };
};

function getOriginatingModule() {
  // TODO Explain hack
  var origPrepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = function (_, stack) {
    return stack;
  };
  var err = new Error();
  var stack = err.stack;
  Error.prepareStackTrace = origPrepareStackTrace;
  stack.shift();

  return stack[1].getFileName();
}
//# sourceMappingURL=notifications.js.map