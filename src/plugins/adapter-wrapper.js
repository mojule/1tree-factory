'use strict'

const is = require( '@mojule/is' )

// ensure that undefined etc. is passed through to underlying adapter unchanged
const Raw = node => {
  if( node && node.state && node.state.node )
    return node.state.node

  return node
}

// must be applied after the adapter, but before anything else
const AdapterWrapper = node => {
  const Node = rawNode => node({
    root: node.state.root,
    node: rawNode
  })

  const {
    getChildren, remove, add
  } = node

  const assignRoots = current => {
    if( !current.state )
      throw new Error( 'Expected wrapped node' )

    current.state.root = node.state.root

    current.getChildren().forEach( assignRoots )

    return current
  }

  const wrapped = {
    getChildren: () => getChildren().map( Node ),
    remove: child => {
      if( is.undefined( child ) ){
        const parent = node.getParent()

        if( is.undefined( parent ) )
          throw new Error( 'Cannot remove root node' )

        return parent.remove( node )
      }

      const rawChild = remove( Raw( child ) )

      child.state.root = rawChild

      return Node( rawChild )
    },
    add: ( child, reference ) => {
      if( !node.accepts( child ) )
        throw new Error( 'Node cannot accept this child' )

      const parent = child.getParent()

      if( parent )
        parent.remove( child )

      const rawChild = add( Raw( child ), Raw( reference ) )

      return assignRoots( Node( rawChild ) )
    }
  }

  return wrapped
}

module.exports = AdapterWrapper
