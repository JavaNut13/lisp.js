var fs = require('fs');
var parser = require('./compile.js');

var text = fs.readFileSync('./sample.lsp');
parser.parse(text.toString());


