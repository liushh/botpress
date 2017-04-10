'use strict';

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _universalAnalytics = require('universal-analytics');

var _universalAnalytics2 = _interopRequireDefault(_universalAnalytics);

var _nodeMachineId = require('node-machine-id');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function (botfile) {

  var visitor = null;
  var queued = [];

  (0, _nodeMachineId.machineId)().catch(function () {
    var hash = _crypto2.default.createHash('sha256');
    hash.update(_os2.default.arch() + _os2.default.hostname() + _os2.default.platform() + _os2.default.type());
    return hash.digest('hex');
  }).then(function (mid) {
    visitor = (0, _universalAnalytics2.default)('UA-90044826-1', mid, { strictCidFormat: false });
    queued.forEach(function (a) {
      return a();
    });
    queued = [];
  });

  var track = function track(category, action) {
    var label = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var value = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

    if (!!botfile.optOutStats) {
      return; // Don't track if bot explicitly opted out from stats collection
    }

    if (!visitor) {
      queued.push(function () {
        return track(category, action, label, value);
      });
      return;
    }

    visitor.event(category, action, label, value, function () {/* ignore errors */});
  };

  var trackException = function trackException(message) {
    if (!!botfile.optOutStats) {
      return; // Don't track if bot explicitly opted out from stats collection
    }

    if (!visitor) {
      queued.push(function () {
        return trackException(message);
      });
      return;
    }

    visitor.event(message, function () {/* ignore errors */});
  };

  return { track: track, trackException: trackException };
};
//# sourceMappingURL=stats.js.map