'use strict';

var createRootPlugin = function createRootPlugin(api) {
  return {
    $createRootState: function $createRootState(rawNode) {
      if (!api.isNode(rawNode)) throw new Error('Expected a raw node');

      return { node: rawNode, root: rawNode, parent: null };
    },
    $createRoot: function $createRoot(rawNode) {
      return api(api.createRootState(rawNode));
    }
  };
};

module.exports = createRootPlugin;