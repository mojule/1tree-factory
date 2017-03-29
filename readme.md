# tree-factory

Generates a tree API over whatever tree-like backing data you may have.

If you don't have a specific tree structure that you'd like to use and just
want to stick data into a tree and get the benefits of tree-factory's common
API without having to write adapters, plugins etc. consider using the
[tree](https://github.com/mojule/tree) package instead

The API returned by the factory supports the following methods, documented more
extensively later in this document:

```javascript
const api = {
  // adapter
  isNode, isValue, createNode, getChildren, getValue, setValue, remove, add,

  // miscellaneous
  get, getRoot, map, clone,

  // traversal
  ancestors, childAt, closest, descendants, firstChild, getParent, lastChild,
  nextSibling, previousSibling, siblings, walk, walkUp,

  // query
  accepts, atPath, contains, find, findAll, getMeta, getPath, hasChild,
  hasChildren, index, isEmpty, meta, nodeType, setMeta, slug,

  // manipulation
  append, empty, insertAfter, insertAt, insertBefore, prepend, prune,
  removeAt, replaceChild, unwrap, value, wrap
}
```

## Usage

`npm install @mojule/tree-factory`

```javascript
const TreeFactory = require( '@mojule/tree-factory' )

// see below for information on how adapters work and how to create them
const adapter = require( './path/to/your/adapter' )
const plugins = require( './path/to/your/plugins' )

const MyTree = TreeFactory( adapter, plugins )

const root = MyTree( 'Root' )
const child = MyTree( 'Child' )

root.add( child )
```

## About

It takes an `adapter`, which tells the factory how to use your backing data as a
tree, then adds a bunch of commonly used functions over the top, for doing
things like querying the data, traversing the data and manipulating the data,
then any custom functions you may want to provide. Your custom functions can
also extend or override the default behaviours. The ability to map from one type
of tree to another is also provided.

The common functions are modelled on the DOM/jQuery, but they are suitable for
working with any tree-like structure, not just DOM elements - for example, all
of the following can be treated as trees:

- Various markup languages, HTML, XML etc.
- Concrete implementations of HTML, eg DOM and virtual DOM nodes
- Objects without circular references, eg JSON-compatible objects
- Natural language texts
- The directory structure of a file system
- Code (as parse trees, ASTs etc)
- Decision trees, like some flowcharts

## Basic terminology

Nodes in our trees have two important properties - their `value`, and their
`children`.

The `value` is any information that you need to know about a node.

The `children` is a list of nodes that descend from the current node.

We call the underlying representation of a node in your backing data a
`raw node`

We use `node` to refer to a object that wraps your raw data in useful functions,
such as getting or setting the node's value, adding new children etc.

### value

For very simple tree data, a string may suffice as the value, as in this
[biology tree example](http://interactivepython.org/runestone/static/pythonds/Trees/ExamplesofTrees.html)

A more complex value, like for HTML nodes, might be an object something like
this:

```javascript
const value = {
  nodeName: 'div',
  nodeType: 'element',
  attributes: {
    id: 'myDiv'
  }
}
```

### children

Regardless of how the children are actually stored in your raw data, the API
expects to always work with an array. This is covered further in the Adapter
section below.

### raw node

A `raw node` will vary according to your backing structure - let's use the case
described above of a biology tree, with the value as a string

A raw node described as an object might look like this:

```javascript
{
  value: 'Animalia',
  children: [
    {
      value: 'Chordate',
      children: [] // omitted for brevity
    },
    {
      value: 'Arthropoda',
      children: [] // omitted for brevity
    }
  ]
}
```

A raw node described as an array might look like this:

```javascript
[
  'Animalia',
  [
    'Chordate'
  ],
  [
    'Arthropoda'
  ]
]
```

A raw node in text format might look like this:

```
Animalia
  Chordate
  Arthropoda
```

### node

Finally, a `node` as created by the API would be used like this:

```javascript
const animalia = Tree( 'Animalia' )
const chordate = Tree( 'Chordate' )
const arthropoda = Tree( 'Arthropoda' )

animalia.add( chordate )
animalia.add( arthropoda )

// Animalia
console.log( animalia.getValue() )

/*
Chordate
Arthropoda
*/
animalia.getChildren().forEach( child => console.log( child.getValue() ) )

```

## Adapters

An adapter is a function that takes the node API and the current node's state
(the raw node), and returns a bag of functions, which is an object where each
key is the name of the function and the property is the function itself:

```javascript
const adapter = ( api, state ) => {
  // implement functions here

  return {
    isNode, isValue, createNode, getChildren, getValue, setValue, remove, add
  }
}
```

For examples of adapters, please see the [test fixtures](/test/fixtures),
which include raw tree data for the biology example represented as both arrays
and objects, and the adapters for working with either format

If you want a better understanding of why this pattern is used (it is used by
tree-factory for both adapters and plugins), please read the documentation for
[api-factory](https://github.com/mojule/api-factory), on which tree-factory is
built.

### Adapter functions

Adapters must implement the following functions:

`isNode, isValue, createNode, getChildren, getValue, setValue, remove, add`

The signatures for these are as follows, using similar syntax to typescript or
rtype.

`RawNode` refers to the raw underlying node data

```
isNode( rawNode:Any ) => isNode:Boolean

isValue( value:Any ) => isValue:Boolean

createNode( value:Any ) => rawNode:RawNode

getChildren() => childNodes:[RawNode]

getValue() => value:Any

setValue( value:Any ) => value:Any

remove( rawChild:RawNode ) => removedChild:RawNode

add( rawChild:RawNode, reference?:RawNode ) => addedChild:RawNode
```

### Notes

`isNode`, `isValue` and `createNode` are treated as static functions, that is,
they shouldn't depend on the state passed to your adapter

`add` called with a single argument should add the new child to the end of the
child node list, but if called with a second `reference` argument, should
insert the new child before the `reference` node.

### Adapter wrapper

Once you provide your adapter, it will be wrapped in such a way that other
functions in the API that work with it can pass it wrapped API nodes and get
the same back - this abstracts away the underlying raw implementation to make
implementing the various functions much safer and easier.

It also wraps `remove` to allow calling remove on a node with no child argument,
which instead removes the node from it's parent's children - it will throw if
you try and do this with the root node, as it doesn't have a parent.

## Common functions

These categories are a bit arbitrary - while some functions clearly fit into one
or the other, others were placed where they are by gut feel alone.

```javascript
const common = {
  // miscellaneous
  get, getRoot, map, clone,

  // traversal
  ancestors, childAt, closest, descendants, firstChild, getParent, lastChild,
  nextSibling, previousSibling, siblings, walk, walkUp,

  // query
  accepts, atPath, contains, find, findAll, getMeta, getPath, hasChild,
  hasChildren, index, isEmpty, meta, nodeType, setMeta, slug,

  // manipulation
  append, empty, insertAfter, insertAt, insertBefore, prepend, prune,
  removeAt, replaceChild, unwrap, value, wrap
}
```

### Miscellaneous

#### get

Gets the underlying raw node

```javascript
const rawNode = node.get()
```

#### getRoot

Gets the node at the root of the tree

```javascript
const root = node.getRoot()
```

#### map

Maps the tree from one type of tree to another - takes an optional value mapper
if the value expected by the target tree differs from that of the source tree

```javascript
const Tree1 = require( './path/to/implementation' )
const Tree2 = require( './path/to/implementation' )

const tree1RawData = require( './path/to/data.json' )

// our first imaginary tree's value type is just a string, our second imaginary
// tree expects an object with the string in a 'text' property
const mapper = value => ({ text: value })

const tree1Root = Tree1( tree1RawData )

const tree2Root = tree1Root.map( Tree2, mapper )
```

#### clone

Creates a true clone of the node and its children - true in the sense that the
underlying value of the cloned node will not === the original node, changes to
either will not affect the other etc.

Only use if your value is JSON serializable! Anything else will throw, as it
works behind the scenes by roundtripping `JSON.stringify`/`JSON.parse`

```javascript
const cloned = node.clone()
```

### Traversal

#### ancestors

Returns an array of the node's parent, the parent's parent etc. all the way to
the root. If called on the root node, returns an empty array

```javascript
const ancestors = node.ancestors()
```

#### childAt

Returns the child at the specified index

```javascript
const second = node.childAt( 2 )
```

#### closest

Finds the closest ancestor matching the predicate, or `undefined` if no node is
found

```javascript
const divAncestor = node.closest( n => n.nodeName() === 'div' )
```

#### descendants

Returns an array of all descendant nodes, or an empty array if the node has no
children

```javascript
const descendants = node.descendants()
```

#### firstChild

Gets the first child of the node, or `undefined` if the node has no children

```javascript
const first = node.firstChild()
```

#### getParent

Gets the parent of the current node, or `undefined` if the node is the root

```javascript
const parent = node.getParent()
```

#### lastChild

Gets the last child of the node, or `undefined` if the node has no children

```javascript
const last = node.lastChild()
```

#### nextSibling

Gets the node in the parent's children after the current node, or `undefined`
if the current node is the last node

```javascript
const next = node.nextSibling()
```

#### previousSibling

Gets the node in the parent's children before the current node, or `undefined`
if the current node is the last node

```javascript
const previous = node.previousSibling()
```

#### siblings

Gets all of the parent's children excluding the current node

```javascript
const siblings = node.siblings()
```

#### walk

Does a depth first traversal from the current node, calling the supplied
callback for each node including the start node. If your callback returns a
truthy value at any point the walk will be terminated.

The callback is passed the current node, its parent, and the current depth in
the tree (where the root is 0)

```javascript
node.walk( ( current, parent, depth ) => {
  console.log( current.getValue() )

  return depth > 5
})
```

#### walkUp

Walks up the tree from the current node, then to its parent, then the parent's
parent etc until it reaches the root, or until your callback returns a truthy
value

```javascript
node.walkUp( current => {
  const value = current.getValue()

  console.log( value )

  return value.nodeName === 'body'
})
```

### Query

#### accepts

Returns a boolean indicating whether the current node will accept the given
node as a child

Also used by the wrapper around `add` to throw an error if an unacceptable child
is added

The default implementation just returns the result of `isEmpty`, which in the
default implementation always returns false

This is provided as a stub that you can override with a plugin, using knowledge
about your specific tree, eg text nodes in the DOM can't accept children,
UL nodes can only accept LI nodes etc.

```javascript
if( !node.accepts( child ) ){
  console.log( 'Drat' )
}
```

#### atPath

Returns the node in the tree at the specified path. The path is parsed by
splitting on the provided separator if provided, or the default separator of '/'
if not provided, then walking down from the root and finding the child with a
matching `slug` (see slug below)

```javascript
const target1 = root.atPath( '/0/4/1/1/0' )

const target2 = root.atPath( '.0.4.1.1.0', '.' )
```

#### contains

Returns a boolean indicating whether the node or any of its descendants matches
the predicate

```javascript
const hasText = node.contains( n => n.nodeType() === 'text' )
```

#### find

Starting from and including the current node and walking down its descendants,
find the first node that matches the predicate

```javascript
const text = node.find( n => n.nodeType() === 'text' )
```

#### findAll

Starting from and including the current node and walking down its descendants,
find all nodes that matches the predicate and return them in an array

```javascript
const textNodes = node.findAll( n => n.nodeType() === 'text' )
```

#### getMeta

Get previously stored metadata about a node - see `setMeta`. Metadata is
persisted for the lifetime of the node API, but not stored anywhere in the raw
data. Useful for things like displaying a tree in the browser where the user can
expand or collapse nodes visually.

```javascript
if( node.getMeta( 'collapsed' ) ){
  console.log( '' )
}
```

#### getPath

Get a string representing the path to the current node - the path is generated
by walking down to the node from the root and joining each node's `slug` with
the passed in seperator, or '/' if no seperator is defined

```javascript
const path1 = node.getPath()
const path2 = node.getPath( '.' )
```

#### hasChild

Returns a boolean indicating if the current node has a child matching the
predicate

```javascript
if( node.hasChild( n => n.getValue() === 'Dang' ) ){
  console.log( 'Drat' )
}
```

#### hasChildren

Returns a boolean indicating whether the current node has any children, eg the
length of its children is > 0

Not the same as whether or not a node *can* have children - see `isEmpty`

```javascript
if( !node.hasChildren() ){
  console.log( 'So sad' )
}
```

#### index

Returns the index of the node within its parent's child list

```javascript
const index = node.index()
```

#### isEmpty

Returns a boolean indicating whether a node is not allowed to have children.

The default implementation always returns false, all nodes can have children.

Intended to be overridden by implementations that have leaf-only nodes, like a
text node in HTML for example.

Named to align with the definition of empty nodes in HTML

```javascript
if( node.isEmpty() ){
  console.log( 'Too bad' )
}
```

#### meta

Convenience function over getMeta and setMeta that does several things depending
on the shape of its arguments.

Get all metadata associated with this node - note that this is the same object
used behind the scenes, so manipulating the returned value will affect the
underlying metadata

```javascript
const meta = node.meta()
```

Set all metadata associated with this node - node that this uses Object.assign
under the hood, so any properties omitted in the object passed to meta will
retain their current values. Returns all metadata associated with the node.

```javascript
const newMeta = node.meta( { collapsed: true } )
```

Get the metadata for a named property, same as `getMeta`:

```javascript
const isCollapsed = node.meta( 'collapsed' )
```

Set the metadata for a named property, same as `setMeta`:

```javascript
node.meta( 'collapsed', true )
```

#### nodeType

Returns a string representing the type of the node. The default implementation
always returns 'node', intended as a stub that can be overridden by
implementations

```javascript
console.log( node.nodeType() )
```

#### setMeta

Sets some metadata for a node - see `getMeta` for more information on metadata.

```javascript
node.setMeta( 'collapsed', true )
```

#### slug

Returns a string that identifies a node uniquely amongst its siblings. By
default it returns the node's index within its parent, or if called on the root,
and empty string.

```javascript
const slug = node.slug()
```

### Manipulation

#### append

An alias for `add`, but won't accept a reference argument. Adds the child to the
end of the node's child list.

```javascript
node.append( child )
```

#### empty

Removes all of a node's children

```javascript
node.empty()
```

#### insertAfter

Insert the child after the reference node in the node's children

```javascript
node.insertAfter( child, reference )
```

#### insertAt

Inserts the child at the specified index within the node's children

```javascript
node.insertAt( child, 1 )
```

#### insertBefore

An alias for `add`. Inserts the child into the node's children before the
reference node.

```javascript
node.insertBefore( child, reference )
```

#### prepend

Adds the child to the beginning of the node's child list

```javascript
node.prepend( child )
```

#### prune

Searches downwards from and including the current node for all nodes that match
the predicate, and removes them from the tree

```javascript
node.prune( n => n.getValue() === 'delet this' )
```

#### removeAt

Removes the child at the specified index

```javascript
node.removeAt( 4 )
```

#### replaceChild

Replaces the old child with a new one, at the same position in the child list

```javascript
node.replaceChild( child, old )
```

#### unwrap

Removes the current node, while moving all of its children to the position in
the parent's child list previously occupied by the current node

```javascript
node.unwrap()
```

#### value

Convenience method over `getValue` and `setValue`. If called with no arguments,
the same as `getValue`. If called with an argument, the same as `setValue`

```javascript
const value = node.value()

value.text = 'Hi'

node.value( value )
```

#### wrap

Adds the current node to the wrapper node, then replaces the current node in
its parent's child list with the wrapper node

```javascript
node.wrap( wrapper )
```

## Tree

The function returned by the tree-factory.

Takes either a `raw node` or a `value`, and returns a node API, with the wrapped
node set as the root of the tree.

If you add one of these wrapped nodes to another tree, they'll be demoted from
root nodes to ordinary nodes.

```javascript
const root = Tree( 'Root' )
const child = Tree( 'Child' )

root.add( child )
```

Also has the static methods defined in the adapter attached:

```javascript
console.log( Tree.isValue( 'Root' ) )
console.log( Tree.isNode( [ 'Root' ] ) )
```
