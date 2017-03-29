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
  const Node = ( rawNode, rawParent, rawRoot ) => node({
    root: is.undefined( rawRoot ) ? node.state.root : rawRoot,
    node: rawNode,
    parent: rawParent
  })

  const {
    getChildren, remove, add
  } = node

  const assignRoots = ( current, rawParent ) => {
    if( !current.state )
      throw new Error( 'Expected wrapped node' )

    current.state.root = node.state.root
    current.state.parent = rawParent

    current.getChildren().forEach( child => assignRoots( child, current.state.node ) )

    return current
  }

  const wrapped = {
    getChildren: () => {
      const children = getChildren()

      return children.map( child => Node( child, Raw( node ) ) )
    },
    remove: child => {
      // allow a node other than root to remove itself
      if( is.undefined( child ) ){
        const parent = node.getParent()

        if( is.undefined( parent ) )
          throw new Error( 'Cannot remove root node' )

        return parent.remove( node )
      }

      const rawChild = remove( Raw( child ) )

      child.state.root = rawChild
      child.state.parent = null

      return Node( rawChild, null, rawChild )
    },
    add: ( child, reference ) => {
      if( !node.accepts( child ) )
        throw new Error( 'Node cannot accept this child' )

      const parent = child.getParent()

      // DOM does this too, adding a node moves it from its existing location
      if( parent )
        parent.remove( child )

      const rawChild = add( Raw( child ), Raw( reference ) )

      return assignRoots( Node( rawChild, Raw( node ) ), Raw( node ) )
    }
  }

  return wrapped
}

module.exports = AdapterWrapper
