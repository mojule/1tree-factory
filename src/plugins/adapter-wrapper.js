'use strict'

const is = require( '@mojule/is' )

// must be applied after the adapter, but before anything else
const AdapterWrapper = ( node, state, getState ) => {
  const { getChildren, remove, add } = node

  const wrapped = {
    getChildren: () => {
      const children = getChildren()

      return children.map( child => {
        const childState = {
          node: child,
          parent: state.node,
          root: state.root
        }

        return node( childState )
      })
    },
    remove: child => {
      // allow a node other than root to remove itself
      if( is.undefined( child ) ){
        const parent = node.getParent()

        if( is.undefined( parent ) )
          throw new Error( 'Cannot remove root node' )

        return parent.remove( node )
      }

      const childState = getState( child )

      childState.parent = null
      childState.root = childState.node

      remove( childState.node )

      return child
    },
    add: ( child, reference ) => {
      if( !node.accepts( child ) ){
        const from = node.nodeType()
        const to = child.nodeType()

        throw new Error(
          `Node of type ${ from } cannot accept children of type ${ to }.
Node value: ${ JSON.stringify( node.getValue() ) }
Child value: ${ JSON.stringify( child.getValue() ) }`

        )
      }

      const parent = child.getParent()

      // DOM does this too, adding a node moves it from its existing location
      if( parent )
        parent.remove( child )

      const childState = getState( child )

      childState.parent = state.node
      childState.root = state.root

      if( is.undefined( reference ) ){
        add( childState.node )
      } else {
        const referenceState = getState( reference )

        add( childState.node, referenceState.node )
      }

      child.decorateState()

      return child
    },
    decorateState: () => {
      node.walk( ( current, parent ) => {
        const currentState = getState( current )
        const parentState = getState( parent )

        if( parent )
          currentState.parent = parentState.node

        currentState.root = state.root
      })
    }
  }

  return wrapped
}

module.exports = AdapterWrapper
