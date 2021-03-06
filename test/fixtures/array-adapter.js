'use strict'

const is = require( '@mojule/is' )

const $createRawNode = value => [ value ]

const ArrayTreeAdapter = ( node, state ) => {
  const $isNode = rawNode => {
    return is.array( rawNode ) && node.isValue( rawNode[ 0 ] )
  }

  const $isValue = value => {
    return !node.isNode( value )
  }

  const getChildren = () => state.node.slice( 1 )

  const getValue = () => state.node[ 0 ]

  const setValue = value => state.node[ 0 ] = value

  const remove = rawChild => {
    const index = state.node.indexOf( rawChild )

    state.node.splice( index, 1 )

    return rawChild
  }

  const add = ( rawChild, rawReference ) => {
    if( is.undefined( rawReference ) ){
      state.node.push( rawChild )
    } else {
      const referenceIndex = state.node.indexOf( rawReference )

      state.node.splice( referenceIndex, 0, rawChild )
    }

    return rawChild
  }

  const adapter = {
    $isNode, $isValue, $createRawNode,
    getChildren, getValue, setValue, remove, add
  }

  return adapter
}

module.exports = ArrayTreeAdapter
