'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _child_process = require('child_process');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _configurator = require('./configurator');

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var MODULES_URL = 'https://s3.amazonaws.com/botpress-io/all-modules.json';
var POPULAR_URL = 'https://s3.amazonaws.com/botpress-io/popular-modules.json';
var FEATURED_URL = 'https://s3.amazonaws.com/botpress-io/featured-modules.json';
var FETCH_TIMEOUT = 5000;

module.exports = function (logger, projectLocation, dataLocation, kvs) {

  var log = function log(level) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    if (logger && logger[level]) {
      logger[level].apply(undefined, args);
    } else {
      _util.print.apply(undefined, [level].concat(args));
    }
  };

  var fetchAllModules = function fetchAllModules() {
    return _axios2.default.get(MODULES_URL, { timeout: FETCH_TIMEOUT }).then(function (_ref) {
      var data = _ref.data;
      return data;
    }).catch(function () {
      return logger.error('Could not fetch modules');
    });
  };

  var fetchPopular = function fetchPopular() {
    return _axios2.default.get(POPULAR_URL, { timeout: FETCH_TIMEOUT }).then(function (_ref2) {
      var data = _ref2.data;
      return data;
    }).catch(function () {
      return logger.error('Could not fetch popular modules');
    });
  };

  var fetchFeatured = function fetchFeatured() {
    return _axios2.default.get(FEATURED_URL, { timeout: FETCH_TIMEOUT }).then(function (_ref3) {
      var data = _ref3.data;
      return data;
    }).catch(function () {
      return logger.error('Could not fetch featured modules');
    });
  };

  var loadModules = function loadModules(moduleDefinitions, botpress) {
    var loadedCount = 0;
    var loadedModules = {};

    moduleDefinitions.forEach(function (mod) {
      var loader = require(mod.entry);

      if ((typeof loader === 'undefined' ? 'undefined' : _typeof(loader)) !== 'object') {
        return logger.warn('Ignoring module ' + mod.name + '. Invalid entry point signature.');
      }

      mod.handlers = loader;

      try {
        mod.configuration = (0, _configurator.createConfig)({
          kvs: kvs,
          name: mod.name,
          botfile: botpress.botfile,
          options: loader.config || {}
        });
      } catch (err) {
        logger.error('Invalid module configuration in module ' + mod.name + ':', err);
      }

      try {
        loader.init && loader.init(botpress, mod.configuration);
      } catch (err) {
        logger.warn('Error during module initialization: ', err);
      }

      loadedModules[mod.name] = mod;
      loadedCount++;
    });

    if (loadedCount > 0) {
      logger.info('Loaded ' + loadedCount + ' modules');
    }

    return loadedModules;
  };

  var scanModules = function scanModules() {
    var packagePath = _path2.default.join(projectLocation, 'package.json');

    if (!_fs2.default.existsSync(packagePath)) {
      return logger.warn('No package.json found at project root, ' + 'which means botpress can\'t load any module for the bot.');
    }

    var botPackage = require(packagePath);

    var deps = botPackage.dependencies || {};
    if (_util.isDeveloping) {
      deps = _lodash2.default.merge(deps, botPackage.devDependencies || {});
    }

    return _lodash2.default.reduce(deps, function (result, value, key) {
      if (!/^botpress-/i.test(key)) {
        return result;
      }
      var entry = (0, _util.resolveFromDir)(projectLocation, key);
      if (!entry) {
        return result;
      }
      var root = (0, _util.resolveModuleRootPath)(entry);
      if (!root) {
        return result;
      }

      var modulePackage = require(_path2.default.join(root, 'package.json'));
      if (!modulePackage.botpress) {
        return result;
      }

      return result.push({
        name: key,
        root: root,
        homepage: modulePackage.homepage,
        settings: modulePackage.botpress,
        entry: entry
      }) && result;
    }, []);
  };

  var getRandomCommunityHero = _bluebird2.default.method(function () {
    var modulesCachePath = _path2.default.join(dataLocation, './modules-cache.json');

    return listAllCommunityModules().then(function () {
      var _JSON$parse = JSON.parse(_fs2.default.readFileSync(modulesCachePath)),
          modules = _JSON$parse.modules;

      var module = _lodash2.default.sample(modules);

      if (!module) {
        return {
          username: 'danyfs',
          github: 'https://github.com/danyfs',
          avatar: 'https://avatars1.githubusercontent.com/u/5629987?v=3',
          contributions: 'many',
          module: 'botpress'
        };
      }

      var hero = _lodash2.default.sample(module.contributors);

      return {
        username: hero.login,
        github: hero.html_url,
        avatar: hero.avatar_url,
        contributions: hero.contributions,
        module: module.name
      };
    });
  });

  var mapModuleList = function mapModuleList(modules) {
    var installed = listInstalledModules();
    return modules.map(function (mod) {
      return {
        name: mod.name,
        stars: mod.github.stargazers_count,
        forks: mod.github.forks_count,
        docLink: mod.homepage,
        version: mod['dist-tags'].latest,
        keywords: mod.keywords,
        fullName: mod.github.full_name,
        updated: mod.github.updated_at,
        issues: mod.github.open_issues_count,
        icon: mod.package.botpress.menuIcon,
        description: mod.description,
        installed: _lodash2.default.includes(installed, mod.name),
        license: mod.license,
        author: mod.author.name
      };
    });
  };

  var listAllCommunityModules = _bluebird2.default.method(function () {

    if (!_fs2.default) {
      return []; // TODO Fetch & return
    }

    var modulesCachePath = _path2.default.join(dataLocation, './modules-cache.json');
    if (!_fs2.default.existsSync(modulesCachePath)) {
      _fs2.default.writeFileSync(modulesCachePath, JSON.stringify({
        modules: [],
        updated: null
      }));
    }

    var _JSON$parse2 = JSON.parse(_fs2.default.readFileSync(modulesCachePath)),
        modules = _JSON$parse2.modules,
        updated = _JSON$parse2.updated;

    if (updated && (0, _moment2.default)().diff((0, _moment2.default)(updated), 'minutes') <= 30) {
      return mapModuleList(modules);
    }

    return _bluebird2.default.props({
      newModules: fetchAllModules(),
      popular: fetchPopular(),
      featured: fetchFeatured()
    }).then(function (_ref4) {
      var newModules = _ref4.newModules,
          featured = _ref4.featured,
          popular = _ref4.popular;


      if (!newModules || !featured || !popular || !newModules.length || !featured.length || !popular.length) {
        if (modules.length > 0) {
          logger.debug('Fetched invalid modules. Report this to the Botpress Team.');
          return mapModuleList(modules);
        } else {
          newModules = newModules || [];
          popular = popular || [];
          featured = featured || [];
        }
      }

      _fs2.default.writeFileSync(modulesCachePath, JSON.stringify({
        modules: newModules,
        popular: popular,
        featured: featured,
        updated: new Date()
      }));

      return mapModuleList(newModules);
    });
  });

  var listPopularCommunityModules = _bluebird2.default.method(function () {
    var modulesCachePath = _path2.default.join(dataLocation, './modules-cache.json');

    return listAllCommunityModules().then(function (modules) {
      var _JSON$parse3 = JSON.parse(_fs2.default.readFileSync(modulesCachePath)),
          popular = _JSON$parse3.popular;

      return _lodash2.default.filter(modules, function (m) {
        return _lodash2.default.includes(popular, m.name);
      });
    });
  });

  var listFeaturedCommunityModules = _bluebird2.default.method(function () {
    var modulesCachePath = _path2.default.join(dataLocation, './modules-cache.json');

    return listAllCommunityModules().then(function (modules) {
      var _JSON$parse4 = JSON.parse(_fs2.default.readFileSync(modulesCachePath)),
          featured = _JSON$parse4.featured;

      return _lodash2.default.filter(modules, function (m) {
        return _lodash2.default.includes(featured, m.name);
      });
    });
  });

  var resolveModuleNames = function resolveModuleNames(names) {
    return names.map(function (name) {
      if (!name || typeof name !== 'string') {
        throw new TypeError('Expected module name to be a string');
      }

      var basename = _path2.default.basename(name);
      var prefix = '';

      if (basename !== name) {
        prefix = name.substr(0, name.length - basename.length - 1);
      }

      if (basename.replace(/botpress-?/i, '').length === 0) {
        throw new Error('Invalid module name: ' + basename);
      }

      if (!/^botpress-/i.test(basename)) {
        basename = 'botpress-' + basename;
      }

      return prefix + basename;
    });
  };

  var runSpawn = function runSpawn(command) {
    return new _bluebird2.default(function (resolve, reject) {
      command.stdout.on('data', function (data) {
        log('info', data.toString());
      });

      command.stderr.on('data', function (data) {
        log('error', data.toString());
      });

      command.on('close', function (code) {
        if (code > 0) {
          reject();
        } else {
          resolve();
        }
      });
    });
  };

  var installModules = _bluebird2.default.method(function () {
    for (var _len2 = arguments.length, names = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      names[_key2] = arguments[_key2];
    }

    var modules = resolveModuleNames(names);

    var install = (0, _child_process.spawn)(_util.npmCmd, ['install', '--save'].concat(_toConsumableArray(modules)), {
      cwd: projectLocation
    });

    log('info', 'Installing modules: ' + modules.join(', '));

    return runSpawn(install).then(function () {
      return log('success', 'Modules successfully installed');
    }).catch(function (err) {
      log('error', 'An error occured during modules installation.');
      throw err;
    });
  });

  var uninstallModules = _bluebird2.default.method(function () {
    for (var _len3 = arguments.length, names = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      names[_key3] = arguments[_key3];
    }

    var modules = resolveModuleNames(names);
    var uninstall = (0, _child_process.spawn)(_util.npmCmd, ['uninstall', '--save'].concat(_toConsumableArray(modules)), {
      cwd: projectLocation
    });

    log('info', 'Uninstalling modules: ' + modules.join(', '));

    return runSpawn(uninstall).then(function () {
      return log('success', 'Modules successfully removed');
    }).catch(function (err) {
      log('error', 'An error occured during modules removal.');
      throw err;
    });
  });

  var listInstalledModules = function listInstalledModules() {
    var packagePath = (0, _util.resolveProjectFile)('package.json', projectLocation, true);

    var _JSON$parse5 = JSON.parse(_fs2.default.readFileSync(packagePath)),
        dependencies = _JSON$parse5.dependencies;

    var prodDeps = _lodash2.default.keys(dependencies);

    return _lodash2.default.filter(prodDeps, function (dep) {
      return (/botpress-.+/i.test(dep)
      );
    });
  };

  return {
    listAllCommunityModules: listAllCommunityModules,
    listPopularCommunityModules: listPopularCommunityModules,
    listFeaturedCommunityModules: listFeaturedCommunityModules,
    getRandomCommunityHero: getRandomCommunityHero,
    install: installModules,
    uninstall: uninstallModules,
    listInstalled: listInstalledModules,
    _scan: scanModules,
    _load: loadModules
  };
};
//# sourceMappingURL=modules.js.map