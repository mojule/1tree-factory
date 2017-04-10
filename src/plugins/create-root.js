'use strict'

const createRootPlugin = api => {
  return {
    $createRootState: rawNode => {
      if( !api.isNode( rawNode ) )
        throw new Error( 'Expected a raw node' )

      return { node: rawNode, root: rawNode, parent: null }
    },
    $createRoot: rawNode => api( api.createRootState( rawNode ) )
  }
}

module.exports = createRootPlugin
