'use strict';

var createStatePlugin = function createStatePlugin(api) {
  return {
    $createState: function $createState(value) {
      if (api.isState(value)) return value;

      if (api.isValue(value)) {
        var rawRoot = api.createNode(value);

        return api.createRootState(rawRoot);
      }

      if (api.isNode(value)) {
        return api.createRootState(value);
      }
    }
  };
};

module.exports = createStatePlugin;