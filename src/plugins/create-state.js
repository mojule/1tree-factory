'use strict'

const createStatePlugin = api => {
  return {
    $createState: value => {
      if( api.isState( value ) )
        return value

      if( api.isValue( value ) ){
        const rawRoot = api.createNode( value )

        return { node: rawRoot, root: rawRoot, parent: null }
      }

      if( api.isNode( value ) ){
        return { node: value, root: value, parent: null }
      }
    }
  }
}

module.exports = createStatePlugin
