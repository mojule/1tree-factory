'use strict';

var is = require('@mojule/is');
var utils = require('@mojule/utils');

var jsonClone = utils.clone;

var Raw = function Raw(current) {
  return current.state.node;
};

var Common = function Common(node) {
  var Node = function Node(rawNode, rawParent, rawRoot) {
    return node({
      root: rawRoot || node.state.root,
      node: rawNode,
      parent: rawParent || null
    });
  };

  var state = node.state;

  // expose raw
  var get = function get() {
    return state.node;
  };
  var getRoot = function getRoot() {
    return node({ root: state.root, node: state.root, parent: null });
  };

  // functional

  var map = function map(TargetTree) {
    var valueMapper = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function (value) {
      return value;
    };

    var value = node.getValue();
    var mappedValue = valueMapper(value);
    var mappedNode = TargetTree(mappedValue);

    node.getChildren().forEach(function (child) {
      var mappedChild = child.map(TargetTree, valueMapper);
      mappedNode.add(mappedChild);
    });

    return mappedNode;
  };

  var clone = function clone() {
    var value = node.getValue();
    var clonedValue = void 0;

    try {
      clonedValue = jsonClone(value);
    } catch (e) {
      throw new Error('Node value must be JSON serializable to clone');
    }

    var rawClone = node.createNode(clonedValue);
    var clonedNode = Node(rawClone, null, rawClone);

    node.getChildren().forEach(function (child) {
      var clonedChild = child.clone();

      clonedNode.add(clonedChild);
    });

    return clonedNode;
  };

  // traversal

  var ancestors = function ancestors() {
    var nodes = [];
    var parent = node.getParent();

    if (parent) parent.walkUp(function (current) {
      nodes.push(current);
    });

    return nodes;
  };

  var childAt = function childAt(index) {
    return node.getChildren()[index];
  };

  var closest = function closest(predicate) {
    var target = void 0;

    node.walkUp(function (current) {
      if (predicate(current)) {
        target = current;

        return true;
      }
    });

    return target;
  };

  var descendants = function descendants() {
    return node.findAll(function (current) {
      return current !== node;
    });
  };

  var firstChild = function firstChild() {
    return node.getChildren()[0];
  };

  var getParent = function getParent() {
    if (node.state.parent) return Node(node.state.parent);

    if (node.state.node === node.state.root) return;

    var parent = getRoot().find(function (current) {
      return current.hasChild(node);
    });

    node.state.parent = parent.state.node;

    return parent;
  };

  var lastChild = function lastChild() {
    var children = node.getChildren();

    return children[children.length - 1];
  };

  var nextSibling = function nextSibling() {
    var parent = node.getParent();

    if (is.undefined(parent)) return parent;

    var children = parent.getChildren();

    var index = children.indexOf(node);

    return children[index + 1];
  };

  var previousSibling = function previousSibling() {
    var parent = node.getParent();

    if (is.undefined(parent)) return parent;

    var children = parent.getChildren();

    var index = children.indexOf(node);

    return children[index - 1];
  };

  var siblings = function siblings() {
    if (state.root === state.node) return [];

    var parent = node.getParent();
    var children = parent.getChildren();

    return children.filter(function (child) {
      return child !== node;
    });
  };

  /*
    walk is so important and used so much that it was worth the time to benchmark
    and improve, this version beats or equals all of the other versions we tried,
    including those from other tree/graph libraries, hence the inconsistency in
    coding style compared to the rest of the modules
  */
  var walk = function walk(callback) {
    var current = void 0,
        parent = void 0,
        depth = void 0,
        i = void 0,
        children = void 0,
        stop = void 0;
    var nodes = [node];
    var parents = [null];
    var depths = [0];

    while (nodes.length) {
      current = nodes.pop();
      parent = parents.pop();
      depth = depths.pop();

      stop = callback(current, parent, depth);

      if (stop) break;

      children = current.getChildren();

      for (i = children.length - 1; i >= 0; i--) {
        nodes.push(children[i]);
        parents.push(current);
        depths.push(depth + 1);
      }
    }

    return stop;
  };

  var walkUp = function walkUp(callback) {
    var stop = callback(node);

    if (stop) return;

    var parent = node.getParent();

    while (parent && !stop) {
      stop = callback(parent);

      if (!stop) parent = parent.getParent();
    }

    return stop;
  };

  // query

  /*
    stub - child argument is so you can test for specific nodes only accepting
    certain children, default behaviour is just not parent is empty
  */
  var accepts = function accepts(child) {
    return !node.isEmpty();
  };

  var atPath = function atPath(path) {
    var separator = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '/';

    var node = getRoot();

    var slugs = path.split(separator).filter(function (s) {
      return s !== '';
    });

    slugs.forEach(function (slug) {
      if (node) {
        var children = node.getChildren();

        node = children.find(function (child) {
          return child.slug() === slug;
        });
      }
    });

    return node;
  };

  var contains = function contains(predicate) {
    return !!node.find(predicate);
  };

  var find = function find(predicate) {
    var target = void 0;

    node.walk(function (current) {
      if (predicate(current)) {
        target = current;

        return true;
      }
    });

    return target;
  };

  var findAll = function findAll(predicate) {
    var nodes = [];

    node.walk(function (current) {
      if (predicate(current)) {
        nodes.push(current);
      }
    });

    return nodes;
  };

  var getPath = function getPath() {
    var separator = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '/';

    if (state.root === state.node) return separator;

    var slugs = [];

    node.walkUp(function (current) {
      var slug = current.slug();

      if (slug.includes(separator)) throw new Error('Node slugs should not contain the separator string "' + separator + '"');

      slugs.unshift(slug);
    });

    return slugs.join(separator);
  };

  var hasChild = function hasChild(child) {
    return node.getChildren().includes(child);
  };

  var hasChildren = function hasChildren() {
    return node.getChildren().length > 0;
  };

  var index = function index() {
    if (state.root === state.node) return;

    var parent = node.getParent();
    var children = parent.getChildren();

    return children.indexOf(node);
  };

  /*
    stub - default nodes are never empty nodes (empty in the HTML sense, cannot
    accept children, not does not have children)
  */
  var isEmpty = function isEmpty() {
    return false;
  };

  var metadata = {};

  var getMeta = function getMeta(name) {
    return metadata[name];
  };

  var nodeType = function nodeType() {
    return 'node';
  };

  var setMeta = function setMeta(name, value) {
    return metadata[name] = value;
  };

  var meta = function meta(name, value) {
    if (is.undefined(name)) return metadata;

    if (is.object(name)) return Object.assign(metadata, name);

    if (!is.string(name)) throw new Error('Expected an object or a string as first argument to meta');

    if (is.undefined(value)) return node.getMeta(name);

    return node.setMeta(name, value);
  };

  var slug = function slug() {
    return state.root === state.node ? '' : String(node.index());
  };

  // manipulation

  var append = function append(child) {
    return node.add(child);
  };

  var insertBefore = function insertBefore(child, reference) {
    return node.add(child, reference);
  };

  var empty = function empty() {
    return node.getChildren().forEach(function (child) {
      return node.remove(child);
    });
  };

  var insertAfter = function insertAfter(child, reference) {
    var children = node.getChildren();
    var index = children.indexOf(reference);
    var after = children[index + 1];

    return insertBefore(child, after);
  };

  var insertAt = function insertAt(child, index) {
    var children = node.getChildren();
    var reference = children[index];

    return insertBefore(child, reference);
  };

  var prepend = function prepend(child) {
    var children = node.getChildren();

    // if child[ 0 ] is undefined this is the same as append
    return insertBefore(child, children[0]);
  };

  var prune = function prune(predicate) {
    var removed = [];

    node.walk(function (current) {
      if (predicate(current)) removed.push(current.remove());
    });

    return removed;
  };

  var removeAt = function removeAt(index) {
    var children = node.getChildren();
    var child = children[index];

    return node.remove(child);
  };

  var replaceChild = function replaceChild(child, old) {
    insertBefore(child, old);

    return node.remove(old);
  };

  var unwrap = function unwrap() {
    if (state.root === state.node) throw new Error('Cannot unwrap root node');

    var parent = node.getParent();
    var children = node.getChildren();

    children.forEach(function (child) {
      return parent.insertBefore(child, node);
    });

    return parent.remove(node);
  };

  var value = function value(newValue) {
    if (is.undefined(newValue)) return node.getValue();

    return node.setValue(newValue);
  };

  var wrap = function wrap(wrapper) {
    var parent = node.getParent();

    if (parent) parent.insertBefore(wrapper, node);

    return wrapper.append(node);
  };

  return {
    get: get, getRoot: getRoot,

    map: map, clone: clone,

    ancestors: ancestors, childAt: childAt, closest: closest, descendants: descendants, firstChild: firstChild, getParent: getParent, lastChild: lastChild,
    nextSibling: nextSibling, previousSibling: previousSibling, siblings: siblings, walk: walk, walkUp: walkUp,

    accepts: accepts, atPath: atPath, contains: contains, find: find, findAll: findAll, getMeta: getMeta, getPath: getPath, hasChild: hasChild,
    hasChildren: hasChildren, index: index, isEmpty: isEmpty, meta: meta, nodeType: nodeType, setMeta: setMeta, slug: slug,

    append: append, empty: empty, insertAfter: insertAfter, insertAt: insertAt, insertBefore: insertBefore, prepend: prepend, prune: prune,
    removeAt: removeAt, replaceChild: replaceChild, unwrap: unwrap, value: value, wrap: wrap
  };
};

module.exports = Common;