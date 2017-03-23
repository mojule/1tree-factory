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

  var _getChildren = node.getChildren,
      _remove = node.remove,
      _add = node.add;


  var assignRoots = function assignRoots(current) {
    if (!current.state) throw new Error('Expected wrapped node');

    current.state.root = node.state.root;

    current.getChildren().forEach(assignRoots);

    return current;
  };

  var wrapped = {
    getChildren: function getChildren() {
      return _getChildren().map(Node);
    },
    remove: function remove(child) {
      if (is.undefined(child)) {
        var parent = node.getParent();

        if (is.undefined(parent)) throw new Error('Cannot remove root node');

        return parent.remove(node);
      }

      var rawChild = _remove(Raw(child));

      child.state.root = rawChild;

      return Node(rawChild);
    },
    add: function add(child, reference) {
      if (!node.accepts(child)) throw new Error('Node cannot accept this child');

      var parent = child.getParent();

      if (parent) parent.remove(child);

      var rawChild = _add(Raw(child), Raw(reference));

      return assignRoots(Node(rawChild));
    }
  };

  return wrapped;
};

module.exports = AdapterWrapper;