'use strict'

const ApiFactory = require( '@mojule/api-factory' )
const is = require( '@mojule/is' )
const adapterWrapper = require( './plugins/adapter-wrapper' )
const common = require( './common' )

const getStateKey = state => state.node

const isState = state =>
  is.object( state ) && [ 'node', 'root', 'parent' ].every( key => key in state )

const parseState = ( Tree, value ) => {
  if( Tree.isState( value ) ) return

  if( Tree.isValue( value ) ){
    const rawRoot = Tree.createNode( value )
    return { node: rawRoot, root: rawRoot, parent: null }
  }

  if( Tree.isNode( value ) ){
    return { node: value, root: value, parent: null }
  }
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
