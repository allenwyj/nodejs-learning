// console.log(arguments);
// console.log(require('module').wrapper);

const C = require('./test-module-1');
const calc1 = new C();

console.log(calc1.add(2, 3));

// exports
const calc2 = require('./test-module-2');
const { add, multiple } = require('./test-module-2');

console.log(calc2.add(2, 3));

//caching
require('./test-module-3')();
require('./test-module-3')();
require('./test-module-3')();
// results:
// Hello, from the module 3 // caching in the memory
// Hiiiiiiii
// Hiiiiiiii
// Hiiiiiiii
