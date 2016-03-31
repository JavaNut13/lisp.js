var defaults = require('./defaults');

function Generator() {
  this.default_methods = {}
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
  var args = this.getAll(items[0].cont.cont);
  var statements = this.getAll(items.slice(1));
  var last = statements[statements.length - 1];
  statements[statements.length - 1] = 'return ' + last;
  var code = statements.join(';\n');
  var res = 'function(' + args.join(', ') + ') {\n';
  res += code;
  res += ';\n}'
  return res;
}

gen.builtins_defn = function(items) {
  var funcName = this.get(items[0]);
  var args = this.getAll(items[1].cont.cont);
  var statements = this.getAll(items.slice(2));
  var last = statements[statements.length - 1];
  statements[statements.length - 1] = 'return ' + last;
  var code = statements.join(';\n');
  var res = 'function ' + funcName + '(' + args.join(', ') + ') {\n';
  res += code;
  res += ';\n}'
  return res;
}

gen.builtins_def = function(items) {
  return 'var ' + this.get(items[0]) + '=' + this.get(items[1]);
}

gen.builtins_if = function(items) {
  var condition = this.get(items[0]);
  var ifState = this.get(items[1]);
  var elseState = this.get(items[2]);
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
    code += defaults[method];
  }
  for(var i = 0; i < lines.length; i++) {
    code += lines[i];
  }
  return code;
}