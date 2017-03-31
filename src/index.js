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

  const { createNode, isNode, isValue } = TreeApi

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

    nodeApi.decorateState()

    return nodeApi
  }

  // attach statics
  Object.assign( Tree, TreeApi )

  return Tree
}

module.exports = TreeFactory
