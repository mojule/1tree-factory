'use strict'

const is = require( '@mojule/is' )

const $createNode = value => ({ value, children: [] })

const ObjectTreeAdapter = ( node, state ) => {
  const $isNode = rawNode =>
    is.object( rawNode ) && node.isValue( rawNode.value ) &&
    is.array( rawNode.children )

  const $isValue = value => !node.isNode( value )

  const getChildren = () => state.node.children.slice()

  const getValue = () => state.node.value

  const setValue = value => state.node.value = value

  const remove = rawChild => {
    const index = state.node.children.indexOf( rawChild )

    state.node.children.splice( index, 1 )

    return rawChild
  }

  const add = ( rawChild, rawReference ) => {
    if( is.undefined( rawReference ) ){
      state.node.children.push( rawChild )
    } else {
      const referenceIndex = state.node.children.indexOf( rawReference )

      state.node.children.splice( referenceIndex, 0, rawChild )
    }

    return rawChild
  }

  return {
    $isNode, $isValue, $createNode,
    getChildren, getValue, setValue, remove, add
  }
}

module.exports = ObjectTreeAdapter
