# 1tree-factory

Basically just a thin facade over 1tree to make the use case of creating a new
1tree instance easier when you have your own adapter/plugins etc.

1tree exports a default tree that's ready to start using provided that you want
to use 1tree's default underlying data structures, and also exposes some methods
for creating trees that use your own adapter and/or plugins.

Most people just want to start using a tree, 1tree's default export assumes
this.

However, if you want to use your own adapter, or use your own plugins but also
use 1tree's base plugins, there's a bit of fiddling around. It's not difficult
but doing it often gets old fast.

This module also inserts the plugins specified *before* 1tree's base plugins -
this is to ensure that the various 1tree plugins that do things like wrap other
plugins or extend them in some way will play nicely with your plugins. If you
want to add your plugins **after** the base plugins have been added, you can
always call the `plugin` method on the tree instance.

## usage

```javascript
/*
  we use the name Mtree (mojule tree) internally but the npm package name was
  taken
*/
const Mtree = require( '1tree-factory' )

/*
 create a tree using the default adapter but with some extra plugins that are
 added before the base plugins
*/
const tree1 = Mtree( plugin1, plugin2, plugin3 )

// same, but array instead of multiple args
const tree2 = Mtree( [ plugin1, plugin2, plugin3 ] )

// same, but with a custom adapter
const tree3 = Mtree( adapter, plugin1, plugin2, plugin3 )

// pass a boolean with true to exclude the base plugins
const tree4 = Mtree( plugin1, plugin2, plugin3, true )
const tree5 = Mtree( adapter, plugin1, plugin2, plugin3, true )

// add plugins after the fact, for example to wrap or extend existing plugins
tree5.plugin( plugin4 )

// same as just using 1tree
const tree6 = Mtree()
```
