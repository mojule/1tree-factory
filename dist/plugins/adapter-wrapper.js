'use strict';

var is = require('@mojule/is');

// ensure that undefined etc. is passed through to underlying adapter unchanged
var Raw = function Raw(node) {
  if (node && node.state && node.state.node) return node.state.node;

  return node;
};

// must be applied after the adapter, but before anything else
var AdapterWrapper = function AdapterWrapper(node) {
  var Node = function Node(rawNode, rawParent, rawRoot) {
    return node({
      root: is.undefined(rawRoot) ? node.state.root : rawRoot,
      node: rawNode,
      parent: rawParent
    });
  };

  var _getChildren = node.getChildren,
      _remove = node.remove,
      _add = node.add;


  var assignRoots = function assignRoots(current, rawParent) {
    if (!current.state) throw new Error('Expected wrapped node');

    current.state.root = node.state.root;
    current.state.parent = rawParent;

    current.getChildren().forEach(function (child) {
      return assignRoots(child, current.state.node);
    });

    return current;
  };

  var wrapped = {
    getChildren: function getChildren() {
      var children = _getChildren();

      return children.map(function (child) {
        return Node(child, Raw(node));
      });
    },
    remove: function remove(child) {
      // allow a node other than root to remove itself
      if (is.undefined(child)) {
        var parent = node.getParent();

        if (is.undefined(parent)) throw new Error('Cannot remove root node');

        return parent.remove(node);
      }

      var rawChild = _remove(Raw(child));

      child.state.root = rawChild;
      child.state.parent = null;

      return Node(rawChild, null, rawChild);
    },
    add: function add(child, reference) {
      if (!node.accepts(child)) throw new Error('Node cannot accept this child');

      var parent = child.getParent();

      // DOM does this too, adding a node moves it from its existing location
      if (parent) parent.remove(child);

      var rawChild = _add(Raw(child), Raw(reference));

      return assignRoots(Node(rawChild, Raw(node)), Raw(node));
    }
  };

  return wrapped;
};

module.exports = AdapterWrapper;