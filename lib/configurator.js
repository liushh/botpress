'use strict';

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var validations = {
  'any': function any(value, validation) {
    return validation(value);
  },
  'string': function string(value, validation) {
    return typeof value === 'string' && validation(value);
  },
  'choice': function choice(value, validation) {
    return _lodash2.default.includes(validation, value);
  },
  'bool': function bool(value, validation) {
    return (value === true || value === false) && validation(value);
  }
};

var defaultValues = {
  'any': null,
  'string': '',
  'bool': false
};

var amendOption = function amendOption(option, name) {

  var validTypes = _lodash2.default.keys(validations);
  if (!option.type || !_lodash2.default.includes(validTypes, option.type)) {
    throw new Error('Invalid type (' + (option.type || '') + ') for config key (' + name + ')');
  }

  var validation = option.validation || function () {
    return true;
  };

  if (typeof option.default !== 'undefined' && !validations[option.type](option.default, validation)) {
    throw new Error('Invalid default value (' + option.default + ') for (' + name + ')');
  }

  if (!option.default && !_lodash2.default.includes(_lodash2.default.keys(defaultValues), option.type)) {
    throw new Error('Default value is mandatory for type ' + option.type + ' (' + name + ')');
  }

  return {
    type: option.type,
    required: option.required || false,
    env: option.env || null,
    default: option.default || defaultValues[option.type],
    validation: validation
  };
};

var amendOptions = function amendOptions(options) {
  return _lodash2.default.mapValues(options, amendOption);
};

var validateSet = function validateSet(options, name, value) {

  // if name is not in options, throw
  if (!_lodash2.default.includes(_lodash2.default.keys(options), name)) {
    throw new Error('Unrecognized configuration key: ' + name);
  }

  if (!validations[options[name].type](value, options[name].validation)) {
    throw new Error('Invalid value for key: ' + name);
  }
};

var validateSave = function validateSave(options, object) {
  var objKeys = _lodash2.default.keys(object);
  var requiredKeys = _lodash2.default.filter(_lodash2.default.keys(options), function (key) {
    return options[key].required;
  });

  _lodash2.default.each(requiredKeys, function (required) {
    if (!_lodash2.default.includes(objKeys, required)) {
      throw new Error('Missing required configuration: \'' + required + '\'');
    }
  });

  _lodash2.default.each(objKeys, function (name) {
    validateSet(options, name, object[name]);
  });
};

var validateName = function validateName(name) {
  if (!name || !/^[A-Z0-9._-]+$/i.test(name)) {
    throw new Error('Invalid configuration name: ' + name + '. The name must only contain letters, _ and -');
  }
};

var overwriteFromDefaultValues = function overwriteFromDefaultValues(options, object) {
  _lodash2.default.each(_lodash2.default.keys(options), function (name) {
    if (typeof object[name] === 'undefined') {
      object[name] = options[name].default;
    }
  });

  return object;
};

var overwriteFromEnvValues = function overwriteFromEnvValues(options, object) {
  return _lodash2.default.mapValues(object, function (_v, name) {
    if (options[name] && options[name].env && process.env[options[name].env]) {
      return process.env[options[name].env];
    }

    return _v;
  });
};

var overwriteFromBotfileValues = function overwriteFromBotfileValues(config_name, options, botfile, object) {
  return _lodash2.default.mapValues(object, function (_v, name) {
    if (botfile && botfile.config && botfile.config[config_name] && typeof botfile.config[config_name][name] !== 'undefined') {
      return botfile.config[config_name][name];
    }

    return _v;
  });
};

var removeUnusedKeys = function removeUnusedKeys(options, object) {
  var final = {};

  _lodash2.default.each(_lodash2.default.keys(options), function (name) {
    if (typeof object[name] !== 'undefined') {
      final[name] = object[name];
    }
  });

  return final;
};

var createConfig = function createConfig(_ref) {
  var kvs = _ref.kvs,
      name = _ref.name,
      _ref$botfile = _ref.botfile,
      botfile = _ref$botfile === undefined ? {} : _ref$botfile,
      _ref$options = _ref.options,
      options = _ref$options === undefined ? {} : _ref$options;


  if (!kvs || !kvs.get || !kvs.set) {
    throw new Error('A valid \'kvs\' is mandatory to createConfig');
  }

  validateName(name);
  options = amendOptions(options);

  var saveAll = function saveAll(obj) {
    validateSave(options, obj);
    return kvs.set('__config', obj, name);
  };

  var loadAll = function loadAll() {
    return kvs.get('__config', name).then(function (all) {
      return overwriteFromDefaultValues(options, all || {});
    }).then(function (all) {
      return overwriteFromBotfileValues(name, options, botfile, all);
    }).then(function (all) {
      return overwriteFromEnvValues(options, all);
    }).then(function (all) {
      return removeUnusedKeys(options, all);
    });
  };

  var get = function get(name) {
    return kvs.get('__config', name + '.' + name).then(function (value) {
      return overwriteFromDefaultValues(options, _defineProperty({}, name, value));
    }).then(function (all) {
      return overwriteFromBotfileValues(name, options, botfile, all);
    }).then(function (all) {
      return overwriteFromEnvValues(options, all);
    }).then(function (obj) {
      return obj[name];
    });
  };

  var set = function set(name, value) {
    validateSet(options, name, value);
    return kvs.set('__config', value, name + '.' + name);
  };

  return { saveAll: saveAll, loadAll: loadAll, get: get, set: set, options: options };
};

module.exports = { createConfig: createConfig };
//# sourceMappingURL=configurator.js.map