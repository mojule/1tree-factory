'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var Tree = require('1tree');
var defaultAdapter = require('1tree/dist/adapter/default');

var basePlugins = Object.keys(Tree.plugins).map(function (key) {
  return Tree.plugins[key];
});

var Mtree = function Mtree() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  var excludeBase = args.some(function (arg) {
    return typeof arg === 'boolean' && arg;
  });

  var adapter = defaultAdapter;
  var plugins = excludeBase ? [] : basePlugins;

  args.forEach(function (arg) {
    if (Array.isArray(arg)) {
      plugins = arg.concat(plugins);
    } else if (typeof arg === 'function') {
      plugins = [arg].concat(plugins);
    } else if ((typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'object') {
      adapter = arg;
    }
  });

  return Tree.adapter(adapter, plugins);
};

module.exports = Mtree;