var fs = require('fs');
var parser = require('./parse.js');

var text = fs.readFileSync('./sample.lsp');
parser.parse(text.toString());


