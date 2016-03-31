var fs = require('fs');
var parser = require('./parse');
var generator = require('./generate')

var text = fs.readFileSync('./sample.lsp');
var atoms = parser.parse(text.toString());

var code = '';
for(var i = 0; i < atoms.length; i++) {
  code += generator.generate(atoms[i]) + '\n';
}

console.log(code);
console.log('-----------');
function map(func, items) {
  var res = [];
  for(var i=0; i < items.length; i++) res[i] = func(items[i]);
  return res;
}
eval(code);