var defaults = require('./defaults');
var builtins = require('./builtins');

function Generator() {
  this.default_methods = {};
}

var gen = Generator.prototype;

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
  var operator = this.get(obj.cont[0]);
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

module.exports.extend = function(funcName, func) {
  if(!funcName || !func) {
    throw "Function name and function must be present";
  }
  gen['builtins_' + funcName] = func
}