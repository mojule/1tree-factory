'use strict'

const assert = require( 'assert' )
const utils = require( '@mojule/utils' )
const is = require( '@mojule/is' )
const TreeFactory = require( '../src' )
const arrayAdapter = require( './fixtures/array-adapter' )
const objectAdapter = require( './fixtures/object-adapter' )
const biologyArray = require( './fixtures/biology-array.json' )
const biologyObject = require( './fixtures/biology-object.json' )
const plugins = require( './fixtures/plugins' )

const { capitalizeFirstLetter, clone } = utils

const adapters = {
  array: arrayAdapter,
  object: objectAdapter
}

const trees = {
  array: TreeFactory( arrayAdapter ),
  object: TreeFactory( objectAdapter )
}

const data = {
  array: biologyArray,
  object: biologyObject
}

const getData = adapterName => clone( data[ adapterName ] )

const expects = {
  array: {
    add: [ 'Root', [ 'Child' ] ],
    root: [ 'Root' ],
    move: [ 'Root', [ 'Child' ], [ 'Grandchild' ] ]
  },
  object: {
    add: {
      value: 'Root',
      children: [
        {
          value: 'Child',
          children: []
        }
      ]
    },
    root: {
      value: 'Root',
      children: []
    },
    move: {
      value: 'Root',
      children: [
        {
          value: 'Child',
          children: []
        },
        {
          value: 'Grandchild',
          children: []
        }
      ]
    }
  }
}

const testAdapter = ( adapterName, testCommon = true ) => {
  const Tree = trees[ adapterName ]
  const expect = expects[ adapterName ]

  const treeName = capitalizeFirstLetter( adapterName ) + ' Tree'

  describe( treeName, () => {
    it( 'fails with bad factory args', () => {
      assert.throws( () => TreeFactory() )
      assert.throws( () => TreeFactory( adapters[ adapterName ], 'a' ) )
    })

    it( 'creates a tree from a value', () => {
      const root = Tree( 'Root' )

      assert( root )
    })

    it( 'createState static', () => {
      const createStateModule = api => {
        const { createState } = api

        return {
          $createState: value => {
            if( is.array( value ) && value.every( is.string ) ){
              const rawNode = api.createNode( value.join( '' ) )

              return { node: rawNode, root: rawNode, parent: null }
            }

            return createState( value )
          }
        }
      }

      const adapter = adapters[ adapterName ]
      const Tree = TreeFactory( adapter, createStateModule )

      const root = Tree( [ 'R', 'o', 'o', 't' ] )
      const child = Tree( 'Child' )

      assert.equal( root.getValue(), 'Root' )
      assert.equal( child.getValue(), 'Child' )
    })

    /*
      getChildren, getValue, setValue, remove, add, isNode, isValue, createNode
    */
    describe( 'adapter functions', () => {
      it( 'getChildren', () => {
        const root = Tree( 'Root' )
        const children = root.getChildren()

        assert( Array.isArray( children ) )
        assert.equal( children.length, 0 )
      })

      it( 'getValue', () => {
        const root = Tree( 'Root' )
        const value = root.getValue()

        assert.equal( value, 'Root' )
      })

      it( 'setValue', () => {
        const root = Tree( 'Root' )
        root.setValue( 'New Root' )
        const value = root.getValue()

        assert.equal( value, 'New Root' )
      })

      it( 'add', () => {
        const root = Tree( 'Root' )
        const child = Tree( 'Child' )

        root.add( child )

        const children = root.getChildren()

        assert( Array.isArray( children ) )
        assert.equal( children.length, 1 )

        const firstChild = children[ 0 ]
        const value = firstChild.getValue()

        assert.equal( value, 'Child' )

        assert.deepEqual( root.get(), expect.add )
      })

      it( 'add by value', () => {
        // not implemented yet
        assert( true )
      })

      it( 'remove', () => {
        const root = Tree( 'Root' )
        const child = Tree( 'Child' )

        root.add( child )
        root.remove( child )

        const children = root.getChildren()

        assert( Array.isArray( children ) )
        assert.equal( children.length, 0 )

        assert.deepEqual( root.get(), expect.root )
      })

      it( 'removes self if no argument', () => {
        const root = Tree( 'Root' )
        const child = Tree( 'Child' )

        root.add( child )
        child.remove()

        const children = root.getChildren()

        assert( Array.isArray( children ) )
        assert.equal( children.length, 0 )

        assert.deepEqual( root.get(), expect.root )

        assert.throws( () => root.remove() )
      })

      it( 'correct root after adding', () => {
        const root = Tree( 'Root' )
        const child = Tree( 'Child' )
        const grandchild = Tree( 'Grandchild' )

        child.add( grandchild )
        root.add( child )

        const childRoot = child.getRoot()
        const grandchildRoot = grandchild.getRoot()

        assert.deepEqual( root.get(), childRoot.get() )
        assert.deepEqual( root.get(), grandchildRoot.get() )
      })

      it( 'moves child within same tree', () => {
        const root = Tree( 'Root' )
        const child = Tree( 'Child' )
        const grandchild = Tree( 'Grandchild' )

        child.add( grandchild )
        root.add( child )

        root.add( grandchild )

        assert.deepEqual( root.get(), expect.move )
      })
    })

    if( !testCommon ) return

    /*
      get, getRoot,

      ancestors, childAt, closest, descendants, firstChild, getParent, lastChild,
      nextSibling, previousSibling, siblings, walk, walkUp,

      atPath, contains, find, findAll, getPath, hasChildren, index, isEmpty,
      nodeType, slug,

      append, empty, insertAfter, insertAt, insertBefore, prepend, removeAt,
      replaceChild, unwrap, wrap
    */
    describe( 'common functions', () => {
      it( 'get', () => {
        const root = Tree( 'Root' )

        assert.deepEqual( root.get(), expect.root )
      })

      it( 'getRoot', () => {
        const root = Tree( 'Root' )
        let child = Tree( 'Child' )

        child = root.add( child )

        const parent = child.getParent()

        assert.equal( root.get(), parent.get() )
      })

      it( 'getParent', () => {
        const root = Tree( 'Root' )
        let child = Tree( 'Child' )

        child = root.add( child )

        const parent = child.getParent()

        assert.equal( root.get(), parent.get() )
      })

      it( 'clone', () => {
        const root = Tree( 'Root' )
        const child = Tree( 'Child' )
        const grandchild = Tree( 'Grandchild' )

        root.add( child )
        child.add( grandchild )

        const cloned = root.clone()

        root.add( cloned )

        const clonedRoot = cloned.getRoot()

        assert.equal( root.getChildren().length, 2 )
        assert.equal( clonedRoot, root )

        child.empty()

        const childClone = cloned.firstChild()

        assert.equal( childClone.getChildren().length, 1 )

        const foo = {}
        const bar = {}

        foo.bar = bar
        bar.foo = foo

        const circular = Tree( foo )

        assert.throws( () => circular.clone() )
      })

      it( 'ancestors', () => {
        const root = Tree( 'Root' )
        const child = Tree( 'Child' )
        const grandchild = Tree( 'Grandchild' )

        root.add( child )
        child.add( grandchild )

        const ancestors = grandchild.ancestors()

        assert.equal( ancestors.length, 2 )
        assert.equal( ancestors[ 0 ], child )
        assert.equal( ancestors[ 1 ], root )
        assert.deepEqual( root.ancestors(), [] )
      })

      it( 'childAt', () => {
        const root = Tree( 'Root' )
        const child0 = Tree( 'Child 0' )
        const child1 = Tree( 'Child 1' )

        root.add( child0 )
        root.add( child1 )

        assert.equal( root.childAt( 0 ), child0 )
        assert.equal( root.childAt( 1 ), child1 )
      })

      it( 'closest', () => {
        const root = Tree( 'Root' )
        const child = Tree( 'Child' )
        const grandchild = Tree( 'Grandchild' )
        const greatGrandchild = Tree( 'Great grandchild' )

        root.add( child )
        child.add( grandchild )
        grandchild.add( greatGrandchild )

        const foundChild = greatGrandchild.closest( current => current.getValue() === 'Child' )

        assert.equal( foundChild, child )
      })

      it( 'descendants', () => {
        const root = Tree( 'Root' )
        const child = Tree( 'Child' )
        const grandchild = Tree( 'Grandchild' )
        const greatGrandchild = Tree( 'Great grandchild' )

        root.add( child )
        child.add( grandchild )
        grandchild.add( greatGrandchild )

        const descendants = root.descendants()

        assert.equal( descendants[ 0 ], child )
        assert.equal( descendants[ 1 ], grandchild )
        assert.equal( descendants[ 2 ], greatGrandchild )
      })

      it( 'firstChild', () => {
        const root = Tree( 'Root' )
        const child0 = Tree( 'Child 0' )
        const child1 = Tree( 'Child 1' )

        root.add( child0 )
        root.add( child1 )

        assert.equal( root.firstChild(), child0 )
      })

      it( 'lastChild', () => {
        const root = Tree( 'Root' )
        const child0 = Tree( 'Child 0' )
        const child1 = Tree( 'Child 1' )

        root.add( child0 )
        root.add( child1 )

        assert.equal( root.lastChild(), child1 )
      })

      it( 'nextSibling', () => {
        const root = Tree( 'Root' )
        const child0 = Tree( 'Child 0' )
        const child1 = Tree( 'Child 1' )

        root.add( child0 )
        root.add( child1 )

        assert.equal( child0.nextSibling(), child1 )
        assert.equal( child1.nextSibling(), undefined )
        assert.equal( root.nextSibling(), undefined )
      })

      it( 'previousSibling', () => {
        const root = Tree( 'Root' )
        const child0 = Tree( 'Child 0' )
        const child1 = Tree( 'Child 1' )

        root.add( child0 )
        root.add( child1 )

        assert.equal( child1.previousSibling(), child0 )
        assert.equal( child0.previousSibling(), undefined )
        assert.equal( root.previousSibling(), undefined )
      })

      it( 'siblings', () => {
        const root = Tree( 'Root' )
        const child0 = Tree( 'Child 0' )
        const child1 = Tree( 'Child 1' )
        const child2 = Tree( 'Child 2' )

        root.add( child0 )
        root.add( child1 )
        root.add( child2 )

        const siblings = child1.siblings()

        assert.equal( siblings.length, 2 )
        assert.equal( siblings[ 0 ], child0 )
        assert.equal( siblings[ 1 ], child2 )
        assert.equal( root.siblings().length, 0 )
      })

      it( 'walk', () => {
        const root = Tree( 'Root' )
        const values = [ 'Root' ]
        let last = root

        for( let i = 1; i < 20; i++ ){
          const value = String( i )
          const node = Tree( value )

          values.push( value )
          last.add( node )
          last = node
        }

        let lastParent

        root.walk( ( current, parent, depth ) => {
          const value = values[ depth ]

          assert.equal( current.getValue(), value )
          assert.equal( parent, lastParent )

          lastParent = current
        })
      })

      it( 'walkUp', () => {
        const root = Tree( 'Root' )
        const values = [ 'Root' ]
        let last = root

        for( let i = 1; i < 20; i++ ){
          const value = String( i )
          const node = Tree( value )

          values.push( value )
          last.add( node )
          last = node
        }

        last.walkUp( current => {
          const value = values.pop()

          assert.equal( current.getValue(), value )
        })

        let eighteen

        last.walkUp( current => {
          eighteen = current

          const value = current.getValue()

          return value === '18'
        })

        assert.equal( eighteen.getValue(), '18' )

        let nineteen

        last.walkUp( current => {
          nineteen = current

          const value = current.getValue()

          return value === '19'
        })

        assert.equal( nineteen.getValue(), '19' )
      })

      it( 'accepts', () => {
        const root = Tree( 'Root' )
        const child = Tree( 'Child' )

        assert( root.accepts( child ) )
      })

      it( 'atPath', () => {
        const root = Tree( 'Root' )
        const child = Tree( 'Child' )
        const grandchild = Tree( 'Grandchild' )
        const greatGrandchild = Tree( 'Great grandchild' )

        root.add( child )
        child.add( grandchild )
        grandchild.add( greatGrandchild )

        assert.equal( root.atPath( '/' ), root )
        assert.equal( root.atPath( '/0/0/0' ), greatGrandchild )
        assert.equal( root.atPath( '-0-0-0', '-' ), greatGrandchild )

        assert.throws( () => root.atPath( '/0/0/0/0' ) )
      })

      it( 'contains', () => {
        const root = Tree( 'Root' )
        const child = Tree( 'Child' )
        const grandchild = Tree( 'Grandchild' )
        const greatGrandchild = Tree( 'Great grandchild' )

        root.add( child )
        child.add( grandchild )
        grandchild.add( greatGrandchild )

        assert( root.contains( current => current.getValue() === 'Great grandchild' ) )
        assert( !grandchild.contains( current => current.getValue() === 'Child' ) )
      })

      it( 'find', () => {
        const root = Tree( 'Root' )
        const child = Tree( 'Child' )
        const grandchild = Tree( 'Grandchild' )
        const greatGrandchild = Tree( 'Great grandchild' )

        root.add( child )
        child.add( grandchild )
        grandchild.add( greatGrandchild )

        const startsWithG = root.find( current => current.getValue().startsWith( 'G' ) )
        const startsWithZ = root.find( current => current.getValue().startsWith( 'Z' ) )

        assert.equal( startsWithG, grandchild )
        assert.equal( startsWithZ, undefined )
      })

      it( 'findAll', () => {
        const root = Tree( 'Root' )
        const child = Tree( 'Child' )
        const grandchild = Tree( 'Grandchild' )
        const greatGrandchild = Tree( 'Great grandchild' )

        root.add( child )
        child.add( grandchild )
        grandchild.add( greatGrandchild )

        const startsWithG = root.findAll( current => current.getValue().startsWith( 'G' ) )
        const startsWithZ = root.findAll( current => current.getValue().startsWith( 'Z' ) )

        assert.equal( startsWithG.length, 2 )
        assert.equal( startsWithG[ 0 ], grandchild )
        assert.equal( startsWithG[ 1 ], greatGrandchild )
        assert.equal( startsWithZ.length, 0 )
      })

      it( 'getPath', () => {
        const root = Tree( 'Root' )
        const child = Tree( 'Child' )
        const grandchild = Tree( 'Grandchild' )
        const greatGrandchild = Tree( 'Great grandchild' )

        root.add( child )
        child.add( grandchild )
        grandchild.add( greatGrandchild )

        assert.equal( root.getPath(), '/' )
        assert.equal( greatGrandchild.getPath(), '/0/0/0' )
        assert.equal( greatGrandchild.getPath( '-' ), '-0-0-0' )

        assert.throws( () => {
          greatGrandchild.getPath( '' )
        })
      })

      it( 'hasChild', () => {
        const root = Tree( 'Root' )
        const child = Tree( 'Child' )
        const nope = Tree( 'Nope' )

        root.add( child )

        assert( root.hasChild( child ) )
        assert( !root.hasChild( nope ) )
      })

      it( 'hasChildren', () => {
        const root = Tree( 'Root' )
        const child = Tree( 'Child' )

        root.add( child )

        assert( root.hasChildren() )
        assert( !child.hasChildren() )
      })

      it( 'index', () => {
        const root = Tree( 'Root' )
        const child0 = Tree( 'Child 0' )
        const child1 = Tree( 'Child 1' )

        root.add( child0 )
        root.add( child1 )

        assert.equal( child0.index(), 0 )
        assert.equal( child1.index(), 1 )
        assert.equal( root.index(), undefined )
      })

      it( 'isEmpty', () => {
        const root = Tree( 'Root' )
        const child = Tree( 'Child' )

        root.add( child )

        assert( !root.isEmpty() )
        assert( !child.isEmpty() )
      })

      it( 'meta', () => {
        const root = Tree( 'Root' )
        const child = Tree( 'Child' )

        child.setMeta( 'id', 'child' )
        root.setMeta( 'id', 'root' )

        assert.equal( child.getMeta( 'id' ), 'child' )
        assert.equal( root.getMeta( 'id' ), 'root' )
        assert.deepEqual( child.meta(), { id: 'child' } )

        root.add( child )

        assert.equal( root.firstChild().getMeta( 'id' ), 'child' )

        child.meta( 'id', 'newchild' )
        root.meta( 'id', 'newroot' )

        assert.equal( child.meta( 'id' ), 'newchild' )
        assert.equal( root.meta( 'id' ), 'newroot' )

        assert.equal( child.getMeta( 'nope' ), undefined )
        assert.equal( child.meta( 'nope' ), undefined )

        child.meta( { name: 'Bob' } )

        assert.deepEqual( child.meta(), { id: 'newchild', name: 'Bob' } )

        assert.throws( () => child.meta( 1 ) )
      })

      it( 'nodeType', () => {
        const root = Tree( 'Root' )

        assert.equal( root.nodeType(), 'node' )
      })

      it( 'slug', () => {
        const root = Tree( 'Root' )
        const child = Tree( 'Child' )

        root.add( child )

        assert.equal( root.slug(), '' )
        assert.equal( child.slug(), 0 )
      })

      it( 'append', () => {
        const root = Tree( 'Root' )
        const child = Tree( 'Child' )

        root.append( child )

        assert.equal( root.getChildren().length, 1 )
        assert.equal( root.firstChild(), child )
      })

      it( 'empty', () => {
        const root = Tree( 'Root' )
        const child0 = Tree( 'Child 0' )
        const child1 = Tree( 'Child 1' )

        root.add( child0 )
        root.add( child1 )

        root.empty()

        assert.equal( root.getChildren().length, 0 )
      })

      it( 'insertAfter', () => {
        const root = Tree( 'Root' )
        const child0 = Tree( 'Child 0' )
        const child1 = Tree( 'Child 1' )
        const child2 = Tree( 'Child 2' )

        root.add( child0 )
        root.add( child2 )

        root.insertAfter( child1, child0 )

        const children = root.getChildren()

        assert.equal( children[ 0 ], child0 )
        assert.equal( children[ 1 ], child1 )
        assert.equal( children[ 2 ], child2 )
      })

      it( 'insertAt', () => {
        const root = Tree( 'Root' )
        const child0 = Tree( 'Child 0' )
        const child1 = Tree( 'Child 1' )
        const child2 = Tree( 'Child 2' )

        root.add( child0 )
        root.add( child2 )

        root.insertAt( child1, 1 )

        const children = root.getChildren()

        assert.equal( children[ 0 ], child0 )
        assert.equal( children[ 1 ], child1 )
        assert.equal( children[ 2 ], child2 )
      })

      it( 'insertBefore', () => {
        const root = Tree( 'Root' )
        const child0 = Tree( 'Child 0' )
        const child1 = Tree( 'Child 1' )
        const child2 = Tree( 'Child 2' )

        root.add( child0 )
        root.add( child2 )

        root.insertBefore( child1, child2 )

        const children = root.getChildren()

        assert.equal( children[ 0 ], child0 )
        assert.equal( children[ 1 ], child1 )
        assert.equal( children[ 2 ], child2 )
      })

      it( 'prepend', () => {
        const root = Tree( 'Root' )
        const child0 = Tree( 'Child 0' )
        const child1 = Tree( 'Child 1' )
        const child2 = Tree( 'Child 2' )

        root.add( child1 )
        root.add( child2 )

        root.prepend( child0 )

        const children = root.getChildren()

        assert.equal( children[ 0 ], child0 )
        assert.equal( children[ 1 ], child1 )
        assert.equal( children[ 2 ], child2 )
      })

      it( 'prune', () => {
        const root = Tree( 'Root' )
        const child = Tree( 'Child' )
        const grandchild = Tree( 'Grandchild' )
        const greatGrandchild = Tree( 'Great grandchild' )

        root.add( child )
        child.add( grandchild )
        grandchild.add( greatGrandchild )

        root.prune( current => current.getValue() === 'Grandchild' )

        assert.equal( child.getChildren().length, 0 )
      })

      it( 'removeAt', () => {
        const root = Tree( 'Root' )
        const child0 = Tree( 'Child 0' )
        const child1 = Tree( 'Child 1' )
        const child2 = Tree( 'Child 2' )

        root.add( child0 )
        root.add( child1 )
        root.add( child2 )

        root.removeAt( 1 )

        const children = root.getChildren()

        assert.equal( children.length, 2 )
        assert.equal( children[ 0 ], child0 )
        assert.equal( children[ 1 ], child2 )
      })

      it( 'replaceChild', () => {
        const root = Tree( 'Root' )
        const child0 = Tree( 'Child 0' )
        const child1 = Tree( 'Child 1' )
        const child2 = Tree( 'Child 2' )
        const newChild1 = Tree( 'New Child 1' )

        root.add( child0 )
        root.add( child1 )
        root.add( child2 )

        root.replaceChild( newChild1, child1 )

        const children = root.getChildren()

        assert.equal( children.length, 3 )
        assert.equal( children[ 0 ], child0 )
        assert.equal( children[ 1 ], newChild1 )
        assert.equal( children[ 2 ], child2 )
      })

      it( 'unwrap', () => {
        const root = Tree( 'Root' )
        const child = Tree( 'Child' )
        const grandchild = Tree( 'Grandchild' )
        const greatGrandchild = Tree( 'Great grandchild' )

        root.add( child )
        child.add( grandchild )
        grandchild.add( greatGrandchild )

        grandchild.unwrap()

        assert.equal( greatGrandchild.getParent(), child )
        assert.equal( child.firstChild(), greatGrandchild )

        assert.throws( () => root.unwrap() )
      })

      it( 'value', () => {
        const root = Tree( 'Root' )

        assert.equal( root.value(), 'Root' )

        root.value( 'New Value' )

        assert.equal( root.value(), 'New Value' )
      })

      it( 'wrap', () => {
        const root = Tree( 'Root' )
        const child = Tree( 'Child' )
        const grandchild = Tree( 'Grandchild' )
        const greatGrandchild = Tree( 'Great grandchild' )

        root.add( child )
        child.add( greatGrandchild )

        greatGrandchild.wrap( grandchild )

        assert.equal( child.getChildren().length, 1 )
        assert.equal( child.firstChild(), grandchild )
        assert.equal( grandchild.getParent(), child )
        assert.equal( greatGrandchild.getParent(), grandchild )

        const newRoot = Tree( 'New Root' )
        root.wrap( newRoot )

        assert.equal( root.getRoot(), newRoot )
        assert.equal( greatGrandchild.getRoot(), newRoot )
      })
    })

    describe( 'from data', () => {
      it( 'Creates a tree from data', () => {
        const rawData = getData( adapterName )
        const root = Tree( rawData )

        assert( root )
      })

      it( 'Trees accept nodes from raw data', () => {
        const rawData = getData( adapterName )
        const root = Tree( 'Root' )
        const raw = Tree( rawData )

        root.add( raw )

        assert( root )
      })

      it( 'Can perform operations', () => {
        const rawData = getData( adapterName )
        const root = Tree( 'Root' )
        const raw = Tree( rawData )

        root.add( raw )

        const values = {}

        root.walk( current => {
          const value = current.getValue()
          const path = current.getPath()
          values[ path ] = value
        })

        const paths = Object.keys( values )

        paths.forEach( path => {
          const value = values[ path ]
          const node = root.atPath( path )

          assert.equal( node.getRoot(), root )

          if( node === root ) return

          const parent = node.getParent()
          const parentPath = parent.getPath()
          const parentValue = parent.getValue()

          assert.equal( values[ parentPath ], parentValue )
        })
      })
    })

    describe( 'Takes options', () => {
      it( 'Overrides exposeState', () => {
        const adapter = adapters[ adapterName ]
        const options = { exposeState: true }
        const Tree = TreeFactory( adapter, options )

        const root = Tree( 'Root' )

        assert( is.object( root.state ) )
      })
    })
  })
}

testAdapter( 'array' )
testAdapter( 'object' )

describe( 'Functional', () => {
  describe( 'map', () => {
    const ArrayTree = trees.array
    const ObjectTree = trees.object

    it( 'Array to Object', () => {
      const arrayData = getData( 'array' )
      const objectData = getData( 'object' )

      const arrayTree = ArrayTree( arrayData )
      const objectTree = arrayTree.map( ObjectTree )

      assert.deepEqual( objectTree.get(), objectData )
    })

    it( 'Object to Array', () => {
      const arrayData = getData( 'array' )
      const objectData = getData( 'object' )

      const objectTree = ObjectTree( objectData )
      const arrayTree = objectTree.map( ArrayTree )

      assert.deepEqual( arrayTree.get(), arrayData )
    })
  })
})

/*
  - you can override things in the adapter
  - you can override things in common
  - you can add new things
*/
describe( 'Plugins', () => {
  const {
    isValueObject, isNodeWithId, createNodeWithId, decorateChildrenWithIndex,
    getValueOrValueProperty, setValueOrValueProperty, decorateRemoved,
    onlyAcceptNodesWithId, nodeTypeFromValue, emptyFromNodeType,
    boxOnlyAcceptsText, secondChild
  } = plugins

  describe( 'Override adapter', () => {
    it( 'isValue', () => {
      const PluginTree = TreeFactory( arrayAdapter, isValueObject )

      const root = PluginTree( { text: 'Root' } )

      assert( root )

      assert.throws( () => PluginTree( 'Root' ) )
    })

    it( 'isNode', () => {
      const PluginTree = TreeFactory( arrayAdapter, isNodeWithId )

      assert( PluginTree.isNode( [ { id: 'Root' } ] ) )
      assert( !PluginTree.isNode( [ { name: 'Root' } ] ) )
    })

    it( 'createNode', () => {
      const PluginTree = TreeFactory( arrayAdapter, isValueObject, createNodeWithId )

      const root = PluginTree( { name: 'Root' } )

      const value = root.getValue()

      assert( is.object( value ) && is.string( value.id ) && value.id.length > 0 )
    })

    it( 'getChildren', () => {
      const PluginTree = TreeFactory( arrayAdapter, isValueObject, decorateChildrenWithIndex )

      const root = PluginTree( { name: 'Root' } )
      const child0 = PluginTree( { expect: 0 })
      const child1 = PluginTree( { expect: 1 })

      root.add( child0 )
      root.add( child1 )

      root.getChildren().forEach( child => {
        const value = child.getValue()

        assert.equal( value.expect, value.index )
      })
    })

    it( 'getValue', () => {
      const PluginTree = TreeFactory( arrayAdapter, isValueObject, getValueOrValueProperty )

      const root = PluginTree( { name: 'Root' } )

      const value = root.getValue()

      assert.deepEqual( value, { name: 'Root' } )

      const name = root.getValue( 'name' )

      assert.equal( name, 'Root' )
      assert.equal( root.getValue( 'nope' ), undefined )
    })

    it( 'setValue', () => {
      const PluginTree = TreeFactory( arrayAdapter, isValueObject, setValueOrValueProperty )

      const root = PluginTree( { name: 'None' } )

      root.setValue( { name: 'Root' } )

      const value = root.getValue()

      assert.deepEqual( value, { name: 'Root' } )

      root.setValue( 'name', 'New Value' )

      const newValue = root.getValue()

      assert.deepEqual( value, { name: 'New Value' } )
    })

    it( 'remove', () => {
      const plugins = [
        isValueObject, getValueOrValueProperty, setValueOrValueProperty,
        decorateRemoved
      ]

      const PluginTree = TreeFactory( arrayAdapter, plugins )

      const root = PluginTree( { name: 'Root' } )
      const child0 = PluginTree( { name: 'Child 0' } )
      const child1 = PluginTree( { name: 'Child 1' } )

      root.add( child0 )
      root.add( child1 )

      const removed0 = root.remove( child0 )

      assert.equal( root.getChildren().length, 1 )
      assert( removed0.getValue( 'removed' ) )

      const removed1 = child1.remove()

      assert.equal( root.getChildren().length, 0 )
      assert( removed1.getValue( 'removed' ) )
    })

    it( 'add', () => {
      const plugins = [
        isValueObject, getValueOrValueProperty, onlyAcceptNodesWithId
      ]

      const PluginTree = TreeFactory( arrayAdapter, plugins )

      const root = PluginTree( { name: 'Root' } )
      const child0 = PluginTree( { name: 'Child 0' } )
      const child1 = PluginTree( { name: 'Child 1' } )
    })
  })

  describe( 'Override common', () => {
    it( 'nodeType', () => {
      const plugins = [
        isValueObject, getValueOrValueProperty, nodeTypeFromValue
      ]

      const PluginTree = TreeFactory( arrayAdapter, plugins )

      const supernode = PluginTree( { nodeType: 'supernode' } )
      const node = PluginTree( { name: 'Root' } )

      assert.equal( supernode.nodeType(), 'supernode' )
      assert.equal( node.nodeType(), 'node' )
    })

    it( 'isEmpty', () => {
      const plugins = [
        isValueObject, getValueOrValueProperty, nodeTypeFromValue,
        emptyFromNodeType
      ]

      const PluginTree = TreeFactory( arrayAdapter, plugins )

      const emptyNode = PluginTree( { nodeType: 'empty' } )
      const node = PluginTree( { name: 'Root' } )

      assert( emptyNode.isEmpty() )
      assert( !node.isEmpty() )

      assert.throws( () => emptyNode.add( node ) )
      assert.doesNotThrow( () => node.add( emptyNode ) )
    })

    it( 'accepts', () => {
      const plugins = [
        isValueObject, getValueOrValueProperty, nodeTypeFromValue,
        boxOnlyAcceptsText
      ]

      const PluginTree = TreeFactory( arrayAdapter, plugins )

      const boxNode = PluginTree( { nodeType: 'box' } )
      const textNode = PluginTree( { nodeType: 'text' } )
      const node = PluginTree( { name: 'Jemima' } )

      assert.throws( () => boxNode.add( node ) )
      assert.throws( () => textNode.add( node ) )
      assert.doesNotThrow( () => boxNode.add( textNode ) )
      assert.doesNotThrow( () => node.add( boxNode ) )
      assert.doesNotThrow( () => node.add( textNode ) )
    })
  })

  describe( 'User defined plugins', () => {
    it( 'New plugin', () => {
      const PluginTree = TreeFactory( arrayAdapter, secondChild )

      const root = PluginTree( 'Root' )
      const child0 = PluginTree( 'Child 0' )
      const child1 = PluginTree( 'Child 1' )
      const child2 = PluginTree( 'Child 2' )

      root.add( child0 )
      root.add( child1 )
      root.add( child2 )

      const second = root.secondChild()

      assert.equal( child1, second )
    })
  })
})
