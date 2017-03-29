'use strict';

var is = require('@mojule/is');

// ensure that undefined etc. is passed through to underlying adapter unchanged
var Raw = function Raw(node) {
  if (node && node.state && node.state.node) return node.state.node;

  return node;
};

// must be applied after the adapter, but before anything else
var AdapterWrapper = function AdapterWrapper(node) {
  var Node = function Node(rawNode) {
    return node({
      root: node.state.root,
      node: rawNode
    });
  };

  var getChildren = node.getChildren,
      _getParent = node.getParent,
      _remove = node.remove,
      _add = node.add;


  var wrapped = {
    getParent: function getParent() {
      if (node.state.parent) return Node(node.state.parent);

      var parent = _getParent();

      node.state.parent = parent.state.node;

      return parent;
    },
    remove: function remove(child) {
      if (child === undefined) return _remove();

      child.state.parent = null;

      return _remove(child);
    },
    add: function add(child, reference) {
      child.state.parent = Raw(node);

      return _add(child, reference);
    }
  };

  return wrapped;
};

module.exports = AdapterWrapper;