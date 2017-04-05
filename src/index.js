'use strict'

const ApiFactory = require( '@mojule/api-factory' )
const is = require( '@mojule/is' )
const adapterWrapper = require( './plugins/adapter-wrapper' )
const common = require( './common' )

const getStateKey = state => state.node

const isState = state =>
  is.object( state ) && [ 'node', 'root', 'parent' ].every( key => key in state )

const parseState = ( Tree, ...args ) => {
  const value = args[ 0 ]

  if( Tree.isState( value ) ) return

  let rawRoot

  if( Tree.isValue( value ) ){
    rawRoot = Tree.createNode( value )
  } else if( Tree.isNode( value ) ){
    rawRoot = value
  } else {
    throw new Error( 'Tree requires a raw node or a node value' )
  }

  return { node: rawRoot, root: rawRoot, parent: null }
}

const defaultStateParsers = [ parseState ]

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

  if( is.array( options.stateParsers ) ){
    options.stateParsers = options.stateParsers.concat( defaultStateParsers )
  } else {
    options.stateParsers = defaultStateParsers
  }

  const Tree = ApiFactory( modules, options )

  return Tree
}

module.exports = TreeFactory
