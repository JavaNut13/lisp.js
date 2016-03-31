function Generator() {
}

Generator.prototype.get = function(item) {
  return this[item.type](item);
}

Generator.prototype.getAll = function(items, i) {
  i = i || 0;
  var res = []
  for(; i < items.length; i++) {
    res.push(this.get(items[i]));
  }
  return res;
}

Generator.prototype.infix_operators = {
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

Generator.prototype.infix = function(obj) {
  var operator = this.get(obj.cont[0]);
  if(this.infix_operators[operator] !== true) {
    operator = this.infix_operators[operator];
  }
  var args = this.getAll(obj.cont.slice(1));
  return '(' + args.join(operator) + ')';
}

Generator.prototype.builtins_fn = function(items) {
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

Generator.prototype.builtins_defn = function(items) {
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

Generator.prototype.builtins_def = function(items) {
  return 'var ' + this.get(items[0]) + '=' + this.get(items[1]);
}

Generator.prototype.builtins_if = function(items) {
  var condition = this.get(items[0]);
  var ifState = this.get(items[1]);
  var elseState = this.get(items[2]);
  return '(' + condition + '?' + ifState + ':' + elseState + ')';
}

Generator.prototype.builtins_first = function(items) {
  var item = this.get(items[0]);
  return item + '[0]';
}

Generator.prototype.builtins_rest = function(items) {
  var item = this.get(items[0]);
  return item + '.slice(1)';
}

Generator.prototype.string = function(obj) {
  return '"' + obj.cont + '"';
}

Generator.prototype.number = function(obj) {
  return obj.cont;
}

Generator.prototype.iden = function(obj) {
  return obj.cont;
}

Generator.prototype.quote = function(obj) {
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

Generator.prototype.list = function(obj) {
  var funcText = this.get(obj.cont[0]);
  if(this['builtins_' + funcText]) {
    return this['builtins_' + funcText](obj.cont.slice(1));
  } else if(this.infix_operators[funcText]) {
    return this.infix(obj);
  } else {
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

module.exports.generate = function(tree) {
  var generator = new Generator();
  var func = generator[tree.type];
  if(!func) {
    throw "Unexpected symbol " + JSON.stringify(tree.cont);
  }
  return generator[tree.type](tree) + ';';
}