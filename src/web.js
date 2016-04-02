var parser = require('./parse');
var generator = require('./generate');

String.prototype.toJS = function () {
  var atoms = parser.parse(this);
  return generator.generate(atoms);
}

String.prototype.evalLisp = function () {
  eval(this.toJS());
}