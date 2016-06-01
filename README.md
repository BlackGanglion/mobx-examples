# mobx-examples
A collection of simple mobx examples.  All the examples below have been written in ES5 without JSX.  No transpiling required.
Please feel free to make any suggestions for improvement.

## MobX stand alone examples
Please note that I have created a console.log override that prints the
console.logs out to the results window on js fiddle.

[autorun](https://jsfiddle.net/gh/get/library/pure/mattruby/mobx-examples/tree/master/00-autorun)
Note how the autorun only fires when a referenced field changes.

[computed](https://jsfiddle.net/gh/get/library/pure/mattruby/mobx-examples/tree/master/10-computed)
Note how the computed fullName is cached.

[extendObservable](https://jsfiddle.net/gh/get/library/pure/mattruby/mobx-examples/tree/master/30-extendObservable)

[asMap](https://jsfiddle.net/gh/get/library/pure/mattruby/mobx-examples/tree/master/40-map)

[transaction](https://jsfiddle.net/gh/get/library/pure/mattruby/mobx-examples/tree/master/20-transaction)

[action](https://jsfiddle.net/gh/get/library/pure/mattruby/mobx-examples/tree/master/50-action)
Non-strict action usage.  You may still set values outside of the actions.

[action strict mode](https://jsfiddle.net/gh/get/library/pure/mattruby/mobx-examples/tree/master/51-action-strict)
Strict action usage.  OPEN YOUR CONSOLE.  You should see an error where I try to set firstName directly.
Note how easy it is to see the cause in the stack.

[when](https://jsfiddle.net/gh/get/library/pure/mattruby/mobx-examples/tree/master/60-when)

## React + MobX examples

[todo with factories, actions and the dev tools](https://jsfiddle.net/gh/get/library/pure/mattruby/mobx-examples/tree/master/react-examples/00-todo)

[array proptype example](https://jsfiddle.net/gh/get/library/pure/mattruby/mobx-examples/tree/master/react-examples/10-array-propType)
