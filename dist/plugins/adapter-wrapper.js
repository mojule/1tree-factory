'use strict';

var is = require('@mojule/is');

// must be applied after the adapter, but before anything else
var AdapterWrapper = function AdapterWrapper(node, state, getState) {
  var _getChildren = node.getChildren,
      _remove = node.remove,
      _add = node.add;


  var wrapped = {
    getChildren: function getChildren() {
      var children = _getChildren();

      return children.map(function (child) {
        var childState = {
          node: child,
          parent: state.node,
          root: state.root
        };

        return node(childState);
      });
    },
    remove: function remove(child) {
      // allow a node other than root to remove itself
      if (is.undefined(child)) {
        var parent = node.getParent();

        if (is.undefined(parent)) throw new Error('Cannot remove root node');

        return parent.remove(node);
      }

      var childState = getState(child);

      childState.parent = null;
      childState.root = childState.node;

      _remove(childState.node);

      return child;
    },
    add: function add(child, reference) {
      if (!node.accepts(child)) {
        var from = node.nodeType();
        var to = child.nodeType();

        throw new Error('Node of type ' + from + ' cannot accept children of type ' + to + '.\nNode value: ' + JSON.stringify(node.getValue()) + '\nChild value: ' + JSON.stringify(child.getValue()));
      }

      var parent = child.getParent();

      // DOM does this too, adding a node moves it from its existing location
      if (parent) parent.remove(child);

      var childState = getState(child);

      childState.parent = state.node;
      childState.root = state.root;

      if (is.undefined(reference)) {
        _add(childState.node);
      } else {
        var referenceState = getState(reference);

        _add(childState.node, referenceState.node);
      }

      child.decorateState();

      return child;
    },
    decorateState: function decorateState() {
      node.walk(function (current, parent) {
        var currentState = getState(current);
        var parentState = getState(parent);

        if (parent) currentState.parent = parentState.node;

        currentState.root = state.root;
      });
    }
  };

  return wrapped;
};

module.exports = AdapterWrapper;