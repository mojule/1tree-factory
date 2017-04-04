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

  let options = {}

  if( plugins.length > 0 && is.object( plugins[ plugins.length - 1 ] ) )
    options = plugins.pop()

  if( plugins.length === 1 && is.array( plugins[ 0 ] ) )
    plugins = plugins[ 0 ]

  if( !plugins.every( is.function ) )
    throw new Error( 'Expected every plugin to be a function' )

  const modules = [
    adapter, adapterWrapper,
    common,
    ...plugins
  ]

  const onCreate = node => node.decorateState()

  options = Object.assign( { getStateKey, isState, onCreate }, options )

  const Tree = ApiFactory( modules, options )

  const { createNode, isNode, isValue } = Tree

  const parseState = ( ...args ) => {
    const value = options.parseState ? options.parseState( ...args ) : args[ 0 ]

    if( Tree.isState( value ) ) return value

    let rawRoot

    if( isValue( value ) ){
      rawRoot = createNode( value )
    } else if( isNode( value ) ){
      rawRoot = value
    } else {
      throw new Error( 'Tree requires a raw node or a node value' )
    }

    return { node: rawRoot, root: rawRoot, parent: null }
  }

  Tree.parseState = parseState

  return Tree
}

module.exports = TreeFactory
