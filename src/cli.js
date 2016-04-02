#!/usr/bin/env node
var fs = require('fs');

var lispjs = require('./lispjs');

function runOptions(options) {
  if (options['-c']) {
    var inFiles = options['-c'];
    if(inFiles.length === 0) {
      inFiles = ['STDIN'];
    }
    var outFiles = options['-o'] || [];
    for (var i = 0; i < inFiles.length; i++) {
      var file = inFiles[i] || 'STDIN';
      var outFile = outFiles[i];
      if (file === 'STDIN') {
        file = '/dev/stdin';
        var func = function(file, callback) {
          var data = fs.readFileSync(file);
          callback(null, data);
        }
      } else {
        var func = fs.readFile;
      }
      func(file, function(err, data) {
        if (err) throw err;
        var out = lispjs.toJS(data.toString().trim());
        if (outFile) {
          fs.writeFile(outFile, out, function(err) {
            if (err) throw err;
          });
        } else {
          console.log(out);
        }
      });
    }
  }
  if (options['-x']) {
    var inFiles = options['-x'];
    for (var i = 0; i < inFiles.length; i++) {
      var file = inFiles[i];
      if (file === 'STDIN') {
        file = '/dev/stdin';
      }
      eval(lispjs.toJS(fs.readFileSync(file).toString().trim()));
    }
  }
}

function main(args) {
  if (args.length === 0) {
    var options = {
      "-x": ['STDIN']
    };
  } else {
    var options = {};
    var lastOption = '-x';
    for (var i = 0; i < args.length; i++) {
      if (args[i].startsWith('-')) {
        lastOption = args[i];
        if (!options[lastOption]) {
          options[lastOption] = [];
        }
      } else {
        options[lastOption].push(args[i]);
      }
    }
  }
  runOptions(options);
}

main(process.argv.slice(2));
