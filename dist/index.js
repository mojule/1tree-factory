'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var ApiFactory = require('@mojule/api-factory');
var is = require('@mojule/is');
var adapterWrapper = require('./plugins/adapter-wrapper');
var common = require('./common');

var getStateKey = function getStateKey(state) {
  return state.node;
};

var TreeFactory = function TreeFactory(adapter) {
  for (var _len = arguments.length, plugins = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    plugins[_key - 1] = arguments[_key];
  }

  if (!is.function(adapter)) throw new Error('An adapter module is required');

  if (plugins.length === 1 && is.array(plugins[0])) plugins = plugins[0];

  if (!plugins.every(is.function)) throw new Error('Expected every plugin to be a function');

  var modules = [adapter, adapterWrapper, common].concat(_toConsumableArray(plugins));
  var TreeApi = ApiFactory(modules, { getStateKey: getStateKey });
  var statics = TreeApi({});
  var createNode = statics.createNode,
      isNode = statics.isNode,
      isValue = statics.isValue;


  var Tree = function Tree(value) {
    var rawRoot = void 0;

    if (isValue(value)) {
      rawRoot = createNode(value);
    } else if (isNode(value)) {
      rawRoot = value;
    } else {
      throw new Error('Tree requires a node or a node value');
    }

    var nodeApi = TreeApi({ node: rawRoot, root: rawRoot });

    return nodeApi;
  };

  Object.assign(Tree, { createNode: createNode, isNode: isNode, isValue: isValue });

  return Tree;
};

module.exports = TreeFactory;