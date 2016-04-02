/*
  Wrapper for including in Node.js projects (and the grunt plugin)
*/
var parser = require('./parse');
var generator = require('./generate');

var toJS = function(text) {
  var atoms = parser.parse(text);
  return generator.generate(atoms);
}

module.exports.toJS = toJS