'use strict'

const ApiFactory = require( '@mojule/api-factory' )
const is = require( '@mojule/is' )
const adapterWrapper = require( './plugins/adapter-wrapper' )
const common = require( './common' )

const getStateKey = state => state.node

const isState = state =>
  is.object( state ) && [ 'node', 'root', 'parent' ].every( key => key in state )

const TreeFactory = ( adapter, ...plugins ) => {
  if( !is.function( adapter ) )
    throw new Error( 'An adapter module is required' )

  if( plugins.length === 1 && is.array( plugins[ 0 ] ) )
    plugins = plugins[ 0 ]

  if( !plugins.every( is.function ) )
    throw new Error( 'Expected every plugin to be a function' )

  const modules = [
    adapter, adapterWrapper,
    common,
    ...plugins
  ]

  const TreeApi = ApiFactory( modules, { getStateKey, isState } )
  const statics = TreeApi({ node: null, root: null, parent: null })
  const { createNode, isNode, isValue } = statics

  const Tree = value => {
    let rawRoot

    if( isValue( value ) ){
      rawRoot = createNode( value )
    } else if( isNode( value ) ){
      rawRoot = value
    } else {
      throw new Error( 'Tree requires a raw node or a node value' )
    }

    const nodeApi = TreeApi( { node: rawRoot, root: rawRoot, parent: null } )

    nodeApi.walk( ( current, parent ) => {
      if( parent )
        current.state.parent = parent.state.node

      current.state.root = rawRoot
    })

    return nodeApi
  }

  Object.assign( Tree, { createNode, isNode, isValue } )

  return Tree
}

module.exports = TreeFactory
