'use strict'

const is = require( '@mojule/is' )
const utils = require( '@mojule/utils' )

const jsonClone = utils.clone

const Common = ( node, state, getState ) => {
  const Node = ( rawNode, rawParent, rawRoot ) => node({
    root: rawRoot || state.root,
    node: rawNode,
    parent: rawParent || null
  })

  // expose raw
  const get = () => state.node
  const getRoot = () => node( { root: state.root, node: state.root, parent: null } )

  // functional

  const map = ( TargetTree, valueMapper = value => value ) => {
    const value = node.getValue()
    const mappedValue = valueMapper( value )
    const mappedNode = TargetTree( mappedValue )

    node.getChildren().forEach( child => {
      const mappedChild = child.map( TargetTree, valueMapper )
      mappedNode.add( mappedChild )
    })

    return mappedNode
  }

  const clone = () => {
    const value = node.getValue()
    let clonedValue

    try{
      clonedValue = jsonClone( value )
    } catch( e ){
      throw new Error( 'Node value must be JSON serializable to clone' )
    }

    const rawClone = node.createNode( clonedValue )
    const clonedNode = Node( rawClone, null, rawClone )

    node.getChildren().forEach( child => {
      const clonedChild = child.clone()

      clonedNode.add( clonedChild )
    })

    return clonedNode
  }

  // traversal

  const ancestors = () => {
    const nodes = []
    const parent = node.getParent()

    if( parent )
      parent.walkUp( current => {
        nodes.push( current )
      })

    return nodes
  }

  const childAt = index => node.getChildren()[ index ]

  const closest = predicate => {
    let target

    node.walkUp( current => {
      if( predicate( current ) ) {
        target = current

        return true
      }
    })

    return target
  }

  const descendants = () => node.findAll( current => current !== node )

  const firstChild = () => node.getChildren()[ 0 ]

  const getParent = () => {
    if( state.node === state.root )
      return

    if( state.parent )
      return Node( state.parent )

    const parent = getRoot().find( current =>
      current.hasChild( node )
    )

    const parentState = getState( parent )
    state.parent = parentState.node

    return parent
  }

  const lastChild = () => {
    const children = node.getChildren()

    return children[ children.length - 1 ]
  }

  const nextSibling = () => {
    const parent = node.getParent()

    if( is.undefined( parent ) )
      return parent

    const children = parent.getChildren()

    const index = children.indexOf( node )

    return children[ index + 1 ]
  }

  const previousSibling = () => {
    const parent = node.getParent()

    if( is.undefined( parent ) )
      return parent

    const children = parent.getChildren()

    const index = children.indexOf( node )

    return children[ index - 1 ]
  }

  const siblings = () => {
    if( state.root === state.node )
      return []

    const parent = node.getParent()
    const children = parent.getChildren()

    return children.filter( child => child !== node )
  }

  /*
    walk is so important and used so much that it was worth the time to benchmark
    and improve, this version beats or equals all of the other versions we tried,
    including those from other tree/graph libraries, hence the inconsistency in
    coding style compared to the rest of the modules
  */
  const walk = callback => {
    let current, parent, depth, i, children, stop
    const nodes = [ node ]
    const parents = [ null ]
    const depths = [ 0 ]

    while( nodes.length ){
      current = nodes.pop()
      parent = parents.pop()
      depth = depths.pop()

      stop = callback( current, parent, depth )

      if( stop ) break

      children = current.getChildren()

      for( i = children.length - 1; i >= 0; i-- ){
        nodes.push( children[ i ] )
        parents.push( current )
        depths.push( depth + 1 )
      }
    }

    return stop
  }

  const walkUp = callback => {
    let stop = callback( node )

    if( stop ) return

    let parent = node.getParent()

    while( parent && !stop ){
      stop = callback( parent )

      if( !stop )
        parent = parent.getParent()
    }

    return stop
  }

  // query

  /*
    stub - child argument is so you can test for specific nodes only accepting
    certain children, default behaviour is just not parent is empty
  */
  const accepts = child => !node.isEmpty()

  const atPath = ( path, separator = '/' ) => {
    let node = getRoot()

    const slugs = path.split( separator ).filter( s => s !== '' )

    slugs.forEach( slug => {
      if( node ){
        const children = node.getChildren()

        node = children.find( child =>
          child.slug() === slug
        )
      }
    })

    return node
  }

  const contains = predicate => !!node.find( predicate )

  const find = predicate => {
    let target

    node.walk( current => {
      if( predicate( current ) ) {
        target = current

        return true
      }
    })

    return target
  }

  const findAll = predicate => {
    const nodes = []

    node.walk( current => {
      if( predicate( current ) ){
        nodes.push( current )
      }
    })

    return nodes
  }

  const getPath = ( separator = '/' ) => {
    if( state.root === state.node ) return separator

    const slugs = []

    node.walkUp( current => {
      const slug = current.slug()

      if( slug.includes( separator ) )
        throw new Error(
          `Node slugs should not contain the separator string "${ separator }"`
        )

      slugs.unshift( slug )
    })

    return slugs.join( separator )
  }

  const hasChild = child => node.getChildren().includes( child )

  const hasChildren = () => node.getChildren().length > 0

  const index = () => {
    if( state.root === state.node ) return

    const parent = node.getParent()
    const children = parent.getChildren()

    return children.indexOf( node )
  }

  /*
    stub - default nodes are never empty nodes (empty in the HTML sense, cannot
    accept children, not does not have children)
  */
  const isEmpty = () => false

  const metadata = {}

  const getMeta = name => metadata[ name ]

  const nodeType = () => 'node'

  const setMeta = ( name, value ) => metadata[ name ] = value

  const meta = ( name, value ) => {
    if( is.undefined( name ) )
      return metadata

    if( is.object( name ) )
      return Object.assign( metadata, name )

    if( !is.string( name ) )
      throw new Error(
        'Expected an object or a string as first argument to meta'
      )

    if( is.undefined( value ) )
      return node.getMeta( name )

    return node.setMeta( name, value )
  }

  const slug = () => state.root === state.node ? '' : String( node.index() )

  // manipulation

  const append = child => node.add( child )

  const insertBefore = ( child, reference ) => node.add( child, reference )

  const empty = () => node.getChildren().forEach( child => node.remove( child ) )

  const insertAfter = ( child, reference ) => {
    const children = node.getChildren()
    const index = children.indexOf( reference )
    const after = children[ index + 1 ]

    return insertBefore( child, after )
  }

  const insertAt = ( child, index ) => {
    const children = node.getChildren()
    const reference = children[ index ]

    return insertBefore( child, reference )
  }

  const prepend = child => {
    const children = node.getChildren()

    // if child[ 0 ] is undefined this is the same as append
    return insertBefore( child, children[ 0 ] )
  }

  const prune = predicate => {
    const removed = []

    node.walk( current => {
      if( predicate( current ) )
        removed.push( current.remove() )
    })

    return removed
  }

  const removeAt = index => {
    const children = node.getChildren()
    const child = children[ index ]

    return node.remove( child )
  }

  const replaceChild = ( child, old ) => {
    insertBefore( child, old )

    return node.remove( old )
  }

  const unwrap = () => {
    if( state.root === state.node )
      throw new Error( 'Cannot unwrap root node' )

    const parent = node.getParent()
    const children = node.getChildren()

    children.forEach( child =>
      parent.insertBefore( child, node )
    )

    return parent.remove( node )
  }

  const value = newValue => {
    if( is.undefined( newValue ) )
      return node.getValue()

    return node.setValue( newValue )
  }

  const wrap = wrapper => {
    const parent = node.getParent()

    if( parent )
      parent.insertBefore( wrapper, node )

    return wrapper.append( node )
  }

  return {
    get, getRoot,

    map, clone,

    ancestors, childAt, closest, descendants, firstChild, getParent, lastChild,
    nextSibling, previousSibling, siblings, walk, walkUp,

    accepts, atPath, contains, find, findAll, getMeta, getPath, hasChild,
    hasChildren, index, isEmpty, meta, nodeType, setMeta, slug,

    append, empty, insertAfter, insertAt, insertBefore, prepend, prune,
    removeAt, replaceChild, unwrap, value, wrap
  }
}

module.exports = Common
