'use strict'

const utils = require( '@mojule/utils' )
const is = require( '@mojule/is' )

const { id } = utils

const isValueObject = node => {
  // get the existing isValue
  const { isValue } = node

  return {
    // add additional constraint
    isValue: value => isValue( value ) && is.object( value )
  }
}

const isNodeWithId = node => {
  const Node = rawNode => node({
    node: rawNode,
    root: node.state.root
  })

  // get the existing isValue
  const { isNode } = node

  return {
    // add additional constraint
    isNode: rawNode => {
      const current = Node( rawNode )
      const value = current.getValue()

      return isNode( rawNode ) &&
        is.object( value ) && is.string( value.id ) && value.id.length > 0
    }
  }
}

const createNodeWithId = node => {
  const Node = rawNode => node({
    node: rawNode,
    root: node.state.root
  })

  const { createNode } = node

  return {
    createNode: value => {
      value = Object.assign( {}, value, { id: id( 'node' ) } )

      return createNode( value )
    }
  }
}

const decorateChildrenWithIndex = node => {
  const { getChildren } = node

  return {
    getChildren: () => {
      const children = getChildren()

      children.forEach( ( child, i ) => {
        const value = child.getValue()

        value.index = i

        child.setValue( value )
      })

      return children
    }
  }
}

const getValueOrValueProperty = node => {
  const { getValue } = node

  return {
    getValue: name => {
      let value = getValue()

      if( !is.undefined( name ) ){
        value = value[ name ]
      }

      return value
    }
  }
}

const setValueOrValueProperty = node => {
  const { getValue, setValue, isValue } = node

  return {
    setValue: ( ...args ) => {
      if( isValue( args[ 0 ] ) )
        return setValue( args[ 0 ] )

      const name = args[ 0 ]
      const propertyValue = args[ 1 ]
      const value = getValue()

      value[ name ] = propertyValue

      return setValue( value )
    }
  }
}

const decorateRemoved = node => {
  const { remove } = node

  return {
    remove: child => {
      child = remove( child )

      child.setValue( 'removed', true )

      return child
    }
  }
}

const onlyAcceptNodesWithId = node => {
  const { add } = node

  return {
    add: ( child, reference ) => {
      const id = child.getValue( 'id' )

      if( !is.string( id ) || id.length < 1 )
        throw new Error( 'Cannot add a child without an id' )

      return add( child, reference )
    }
  }
}

const nodeTypeFromValue = node => {
  const { nodeType, getValue } = node

  return {
    nodeType: () => {
      const valueNodeType = getValue( 'nodeType' )

      if( is.string( valueNodeType ) )
        return valueNodeType

      return nodeType()
    }
  }
}

const emptyFromNodeType = node => {
  const { isEmpty, nodeType } = node

  return {
    isEmpty: () => nodeType() === 'empty' || isEmpty()
  }
}

const boxOnlyAcceptsText = node => {
  const { accepts, isEmpty } = node

  return {
    accepts: child => {
      if( node.nodeType() === 'box' && child.nodeType() !== 'text' )
        return false

      return accepts( child )
    },
    isEmpty: () => node.nodeType() === 'text' || isEmpty()
  }
}

const secondChild = node => ({
  secondChild: () => node.getChildren()[ 1 ]
})

module.exports = {
  isValueObject, isNodeWithId, createNodeWithId, decorateChildrenWithIndex,
  getValueOrValueProperty, setValueOrValueProperty, decorateRemoved,
  onlyAcceptNodesWithId, nodeTypeFromValue, emptyFromNodeType,
  boxOnlyAcceptsText, secondChild
}
