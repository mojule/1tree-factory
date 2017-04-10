'use strict'

const ApiFactory = require( '@mojule/api-factory' )
const is = require( '@mojule/is' )
const adapterWrapper = require( './plugins/adapter-wrapper' )
const createState = require( './plugins/create-state' )
const createRoot = require( './plugins/create-root' )
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
    adapter,
    createRoot,
    createState,
    adapterWrapper,
    common,
    ...plugins
  ]

  const onCreate = node => node.decorateState()

  options = Object.assign( { getStateKey, isState, onCreate }, options )

  const Tree = ApiFactory( modules, options )

  return Tree
}

module.exports = TreeFactory
