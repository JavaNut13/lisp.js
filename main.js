var fs = require('fs');
var parser = require('./parse');
var generator = require('./generate')

var text = fs.readFileSync('./sample.lsp');
var atoms = parser.parse(text.toString());

var code = generator.generate(atoms);

console.log(code);
console.log('-----------');
eval(code);