'use strict';

var _eventemitter = require('eventemitter2');

var _eventemitter2 = _interopRequireDefault(_eventemitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventBus = function (_EventEmitter) {
  _inherits(EventBus, _EventEmitter);

  function EventBus() {
    _classCallCheck(this, EventBus);

    return _possibleConstructorReturn(this, (EventBus.__proto__ || Object.getPrototypeOf(EventBus)).call(this, {
      wildcard: true,
      maxListeners: 100
    }));
  }

  return EventBus;
}(_eventemitter2.default);

module.exports = EventBus;
//# sourceMappingURL=bus.js.map