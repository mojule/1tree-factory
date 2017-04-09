'use strict';

var createStatePlugin = function createStatePlugin(api) {
  return {
    $createState: function $createState(value) {
      if (api.isState(value)) return value;

      if (api.isValue(value)) {
        var rawRoot = api.createNode(value);

        return { node: rawRoot, root: rawRoot, parent: null };
      }

      if (api.isNode(value)) {
        return { node: value, root: value, parent: null };
      }
    }
  };
};

module.exports = createStatePlugin;