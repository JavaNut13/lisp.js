(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = {
  'map': "function map(f, l){var r=[];for(var i=0;i<l.length;i++)r.push(f(l[i]));return r;}",
  'filter': "function filter(f, l){var r=[];for(var i=0;i<l.length;i++)f(l[i])&&r.push(l[i]);return r;}",
  'reduce': "function reduce(f, v, l){for(var i=0;i<l.length;i++)v=f(v,l[i]);return v;}",
  'type': "function type(a) {return typeof a;}",
  'range': "function range(a) {var r=[];for(var i=0;i<a;i++)r[i]=i;return r;}",
  'apply': "function apply(f, a) {return f.apply(null, a);}"
}
},{}],2:[function(require,module,exports){
var defaults = require('./defaults');

function Generator() {
  this.default_methods = {};
}

function blockWithReturn(gener, items) {
  var statements = gener.getAll(items);
  var last = statements[statements.length - 1];
  statements[statements.length - 1] = 'return ' + last;
  return statements.join(';\n');
}

function createMatcher(gener, items) {
  if(items.cont[0].type === 'iden' && items.cont[0].cont === 'else') {
    return blockWithReturn(gener, items.cont.slice(1));
  }
  var argsVals = items.cont[0].cont.cont;
  var ifStatement = '';
  var initializers = 'var ';
  var firstMatch = true;
  var firstInit = true;
  for(var i = 0; i < argsVals.length; i++) {
    if(argsVals[i].type !== 'iden') {
      if(!firstMatch) ifStatement += '&&';
      firstMatch = false;
      ifStatement += 'arguments[' + i + ']===' + gener.get(argsVals[i]);
    } else {
      if(!firstInit) initializers += ',';
      firstInit = false;
      initializers += argsVals[i].cont + '=arguments[' + i + ']'
    }
  }
  if(!firstMatch) ifStatement += '&&';
  ifStatement += 'arguments.length===' + argsVals.length
  if(firstInit) {
    initializers = '';
  }
  var code = blockWithReturn(gener, items.cont.slice(1));
  return 'if(' + ifStatement + ') {\n' + initializers + ';\n' + code + ';\n}';
}

function createFunction(gener, items, anon) {
  var st = anon ? -1 : 0;
  var funcName = anon ? '' : gener.get(items[0]);
  if(items[st + 1].type == 'quote') { // it's a single func
    var args = gener.getAll(items[st + 1].cont.cont);
    var code = blockWithReturn(gener, items.slice(st + 2))
    var res = 'function ' + funcName + '(' + args.join(', ') + ') {\n';
    res += code;
    res += ';\n}'
    return res;
  } else {
    var matches = items.slice(st + 1);
    var res = 'function ' + funcName + '() {\n';
    for(var i = 0; i < matches.length; i++) {
      res += createMatcher(gener, matches[i]) + '\n';
    }
    return res + ';throw "Unexhaustive matching";\n}';
  }
}

var gen = Generator.prototype;

gen.get = function(item) {
  return this[item.type](item);
}

gen.getAll = function(items, i) {
  i = i || 0;
  var res = []
  for(; i < items.length; i++) {
    res.push(this.get(items[i]));
  }
  return res;
}

gen.infix_operators = {
  '+': true,
  '-': true,
  '/': true,
  '*': true,
  '%': true,
  '&&': true,
  '||': true,
  '<': true,
  '>': true,
  '<=': true,
  '>=': true,
  '=': '==='
}

gen.infix = function(obj) {
  var operator = this.get(obj.cont[0]);
  if(this.infix_operators[operator] !== true) {
    operator = this.infix_operators[operator];
  }
  var args = this.getAll(obj.cont.slice(1));
  return '(' + args.join(operator) + ')';
}

gen.builtins_fn = function(items) {
  return createFunction(this, items, true);
}

gen.builtins_defn = function(items) {
  return createFunction(this, items);
}

gen.builtins_def = function(items) {
  return 'var ' + this.get(items[0]) + '=' + this.get(items[1]);
}

gen.builtins_if = function(items) {
  var condition = this.get(items[0]);
  var ifState = this.get(items[1]);
  var elseState = items[2] ? this.get(items[2]) : 'undefined';
  return '(' + condition + '?' + ifState + ':' + elseState + ')';
}

gen.builtins_first = function(items) {
  var item = this.get(items[0]);
  return item + '[0]';
}

gen.builtins_rest = function(items) {
  var item = this.get(items[0]);
  return item + '.slice(1)';
}

gen.builtins_try = function(items) {
  var attempt = this.get(items[0]);
  var except = items[1] ? this.get(items[1]) : 'null';
  return 'try {\n' + attempt + '\n} catch(error) {\n' + except + ';\n}';
}

gen.string = function(obj) {
  return '"' + obj.cont + '"';
}

gen.number = function(obj) {
  return obj.cont;
}

gen.iden = function(obj) {
  return obj.cont;
}

gen.quote = function(obj) {
  var inner = obj.cont;
  if(inner.type === 'list') {
    var items = [];
    var contents = inner.cont;
    for(var i = 0; i < contents.length; i++) {
      var item = contents[i];
      items.push(this.get(item));
    }
    return '[' + items.join(', ') + ']';
  } else {
    return this.get(item);
  }
}

gen.list = function(obj) {
  var funcText = this.get(obj.cont[0]);
  if(funcText.endsWith('}')) {
    funcText = '(' + funcText + ')';
  }
  if(this['builtins_' + funcText]) {
    return this['builtins_' + funcText](obj.cont.slice(1));
  } else if(this.infix_operators[funcText]) {
    return this.infix(obj);
  } else {
    if(defaults[funcText]) {
      this.default_methods[funcText] = true;
    }
    if(funcText.startsWith('.')) {
      var res = this.get(obj.cont[1]) + funcText + '(';
      var argStart = 2;
    } else if(funcText.startsWith(':')) {
      return this.get(obj.cont[1]) + '.' + funcText.slice(1);
    } else {
      var res = funcText + '(';
      var argStart = 1;
    }
    res += this.getAll(obj.cont, argStart).join(', ');
    res += ')'
    return res;
  }
}

module.exports.generate = function(atoms) {
  var generator = new Generator();
  var lines = [];
  for(var i = 0; i < atoms.length; i++) {
    var tree = atoms[i];
    var func = generator[tree.type];
    if(!func) {
      throw "Unexpected symbol " + JSON.stringify(tree.cont);
    }
    lines.push(generator[tree.type](tree) + ';\n');
  }
  var code = '';
  for(method in generator.default_methods) {
    code += defaults[method] + ';\n';
  }
  for(var i = 0; i < lines.length; i++) {
    code += lines[i];
  }
  return code;
}
},{"./defaults":1}],3:[function(require,module,exports){
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
},{"./generate":2,"./parse":4}],4:[function(require,module,exports){
var types = {
  'list-start': {
    re: /^\(|^\[/,
    ignore: false
  },
  'list-end': {
    re: /^\)|^\]/,
    ignore: false
  },
  'number': {
    re: /^\d*\.\d+|^\d+/,
    ignore: false
  },
  'iden': {
    re: /^[\w\-+*!@#$%\^&\d\.=<>:]+/,
    ignore: false
  },
  'string': {
    re: /^"(.*?)"/,
    ignore: false
  },
  'whitespace': {
    re: /^\s+|^;.*?\n/,
    ignore: true
  },
  'quote': {
    re: /^'/,
    ignore: false
  }
}

function parseType(cont) {
  for(type in types) {
    var match = types[type].re.exec(cont);
    if(match) {
      var whole = match[0];
      var content = match[1] || whole;
      return {
        type: type,
        cont: !types[type].ignore && content,
        length: whole.length
      };
    }
  }
}

function parseAtom(cont) {
  var match = parseType(cont);
  if(!match) {
    return null;
  }
  var len = match.length;
  delete match.length;
  if(match.type === 'list-start') {
    return parseList(cont);
  } else if(match.type === 'whitespace') {
    var res = parseAtom(cont.substring(len));
    res.length += len;
    return res;
  } else if(match.type === 'quote') {
    var next = parseAtom(cont.substring(len));
    len += next.length;
    delete next.length;
    match.cont = next.result;
    return { length: len, result: match };
  } else {
    return { length: len, result: match };
  }
}

function parseList(cont) {
  var isLiteral = cont.startsWith('[');
  var subcont = cont.substring(1);
  var totalLength = 1;
  var lastMatch;
  var len;
  var elems = [];
  while(result = parseAtom(subcont)) {
    lastMatch = result.result;
    len = result.length;
    if(lastMatch.cont) {
      if(lastMatch.type === 'list-end') {
        totalLength += len;
        break;
      } else {
        elems.push(lastMatch)
      }
    }
    subcont = subcont.substring(len);
    totalLength += len;
  }
  if(isLiteral) {
    return {
      result: {
        type: 'quote',
        cont: {
          type: 'list',
          cont: elems
        }
      },
      length: totalLength
    }
  } else {
    return {
      result: {
        type: 'list',
        cont: elems
      },
      length: totalLength
    };
  }
}

module.exports.parse = function(cont) {
  var subcont = cont;
  var atoms = [];
  while(result = parseAtom(subcont)) {
    atoms.push(result.result);
    subcont = subcont.substring(result.length);
  }
  return atoms;
}
},{}],5:[function(require,module,exports){
var lispjs = require('./lispjs');

String.prototype.toJS = function () {
  lispjs.toJS(this);
}

String.prototype.evalLisp = function () {
  eval(this.toJS());
}
},{"./lispjs":3}]},{},[5]);
