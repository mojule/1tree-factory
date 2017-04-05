'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var ApiFactory = require('@mojule/api-factory');
var is = require('@mojule/is');
var adapterWrapper = require('./plugins/adapter-wrapper');
var common = require('./common');

var getStateKey = function getStateKey(state) {
  return state.node;
};

var isState = function isState(state) {
  return is.object(state) && ['node', 'root', 'parent'].every(function (key) {
    return key in state;
  });
};

var parseState = function parseState(Tree) {
  var value = arguments.length <= 1 ? undefined : arguments[1];

  if (Tree.isState(value)) return;

  var rawRoot = void 0;

  if (Tree.isValue(value)) {
    rawRoot = Tree.createNode(value);
  } else if (Tree.isNode(value)) {
    rawRoot = value;
  } else {
    throw new Error('Tree requires a raw node or a node value');
  }

  return { node: rawRoot, root: rawRoot, parent: null };
};

var defaultStateParsers = [parseState];

var TreeFactory = function TreeFactory(adapter) {
  for (var _len = arguments.length, plugins = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    plugins[_key - 1] = arguments[_key];
  }

  if (!is.function(adapter)) throw new Error('An adapter module is required');

  var options = {};

  if (plugins.length > 0 && is.object(plugins[plugins.length - 1])) options = plugins.pop();

  if (plugins.length === 1 && is.array(plugins[0])) plugins = plugins[0];

  if (!plugins.every(is.function)) throw new Error('Expected every plugin to be a function');

  var modules = [adapter, adapterWrapper, common].concat(_toConsumableArray(plugins));

  var onCreate = function onCreate(node) {
    return node.decorateState();
  };

  options = Object.assign({ getStateKey: getStateKey, isState: isState, onCreate: onCreate }, options);

  if (is.array(options.stateParsers)) {
    options.stateParsers = options.stateParsers.concat(defaultStateParsers);
  } else {
    options.stateParsers = defaultStateParsers;
  }

  var Tree = ApiFactory(modules, options);

  return Tree;
};

module.exports = TreeFactory;