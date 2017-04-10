'use strict'

const createStatePlugin = api => {
  return {
    $createState: value => {
      if( api.isState( value ) )
        return value

      if( api.isValue( value ) ){
        const rawRoot = api.createRawNode( value )

        return api.createRootState( rawRoot )
      }

      if( api.isNode( value ) ){
        return api.createRootState( value )
      }
    }
  }
}

module.exports = createStatePlugin
