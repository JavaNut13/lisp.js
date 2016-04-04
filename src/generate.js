var defaults = require('./defaults');
var builtins = require('./builtins');

function Generator() {
  this.default_methods = {};
  this.iden_to_js = {};
  this.used_idens = {};
}

var gen = Generator.prototype;

gen.get_iden = function(iden) {
  if(this.iden_to_js[iden]) {
    return this.iden_to_js[iden];
  } else {
    var san = iden.replace(/[^a-z^0-9\.]+/ig, '');
    if(san === '') {
      san = 'iden_';
    }
    var i = 0;
    while(this.used_idens[san + (i == 0 ? '' : i)]) {
      i++;
    }
    san = san + (i == 0 ? '' : i);
    this.used_idens[san] = true;
    this.iden_to_js[iden] = san;
    return san;
  }
}

builtins(gen);

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
  var operator = obj.cont[0].cont;
  if(this.infix_operators[operator] !== true) {
    operator = this.infix_operators[operator];
  }
  var args = this.getAll(obj.cont.slice(1));
  return '(' + args.join(operator) + ')';
}

gen.string = function(obj) {
  return '"' + obj.cont + '"';
}

gen.number = function(obj) {
  return obj.cont;
}

gen.iden = function(obj) {
  return this.get_iden(obj.cont);
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

gen.object = function(obj) {
  var res = '{ ';
  var items = obj.cont;
  var first = true;
  for(key in items) {
    if(!first) res += ', ';
    first = false;
    res += '"' + key + '": ' + this.get(items[key]);
  }
  return res + ' }';
}

gen.list = function(obj) {
  var first = obj.cont[0];
  var funcText;
  if(first.type === 'iden') {
    funcText = first.cont;
    if(this['builtins_' + funcText]) {
      return this['builtins_' + funcText](obj.cont.slice(1));
    } else if(this.infix_operators[funcText]) {
      return this.infix(obj);
    }
  }
  var firstChar = obj.cont[0].type === 'iden' && obj.cont[0].cont[0];
  funcText = this.get(obj.cont[0]);
  if(funcText.endsWith('}')) {
    funcText = '(' + funcText + ')';
  }
  if(defaults[funcText]) {
    this.default_methods[funcText] = true;
  }
  if(firstChar === '.') {
    var res = this.get(obj.cont[1]) + '.' + funcText + '(';
    var argStart = 2;
  } else if(firstChar === ':') {
    return this.get(obj.cont[1]) + '["' + funcText + '"]';
  } else {
    var res = funcText + '(';
    var argStart = 1;
  }
  res += this.getAll(obj.cont, argStart).join(', ');
  res += ')';
  return res;
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

module.exports.extend = function(funcName, func) {
  if(!funcName || !func) {
    throw "Function name and function must be present";
  }
  gen['builtins_' + funcName] = func
}