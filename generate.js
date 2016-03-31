var predefs = {};
predefs.map = "function map(items, func) {var res = []; for(var i=0;i<items.length;i++) {res.push(func(items[i]));}};"

var generated_code

var generator = {};

generator.get = function(item) {
  return generator[item.type](item);
}

generator.getAll = function(items, i) {
  i = i || 0;
  var res = []
  for(; i < items.length; i++) {
    res.push(generator.get(items[i]));
  }
  return res;
}

generator.builtins = {}

generator.infix_operators = {
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
generator.infix = function(obj) {
  var operator = generator.get(obj.cont[0]);
  if(generator.infix_operators[operator] !== true) {
    operator = generator.infix_operators[operator];
  }
  var args = generator.getAll(obj.cont.slice(1));
  return '(' + args.join(operator) + ')';
}

generator.builtins.fn = function(items) {
  var args = generator.getAll(items[0].cont.cont);
  var statements = generator.getAll(items.slice(1));
  var last = statements[statements.length - 1];
  statements[statements.length - 1] = 'return ' + last;
  var code = statements.join(';\n');
  var res = 'function(' + args.join(', ') + ') {\n';
  res += code;
  res += ';\n}'
  return res;
}

generator.builtins.defn = function(items) {
  var funcName = generator.get(items[0]);
  var args = generator.getAll(items[1].cont.cont);
  var statements = generator.getAll(items.slice(2));
  var last = statements[statements.length - 1];
  statements[statements.length - 1] = 'return ' + last;
  var code = statements.join(';\n');
  var res = 'function ' + funcName + '(' + args.join(', ') + ') {\n';
  res += code;
  res += ';\n}'
  return res;
}

generator.builtins.def = function(items) {
  return 'var ' + generator.get(items[0]) + '=' + generator.get(items[1]);
}

generator.builtins.if = function(items) {
  var condition = generator.get(items[0]);
  var ifState = generator.get(items[1]);
  var elseState = generator.get(items[2]);
  return '(' + condition + '?' + ifState + ':' + elseState + ')';
}

generator.string = function(obj) {
  return '"' + obj.cont + '"';
}

generator.number = function(obj) {
  return obj.cont;
}

generator.iden = function(obj) {
  return obj.cont;
}

generator.quote = function(obj) {
  var inner = obj.cont;
  if(inner.type === 'list') {
    var items = [];
    var contents = inner.cont;
    for(var i = 0; i < contents.length; i++) {
      var item = contents[i];
      items.push(generator.get(item));
    }
    return '[' + items.join(', ') + ']';
  } else {
    return generator.get(item);
  }
}

generator.list = function(obj) {
  var funcText = generator.get(obj.cont[0]);
  if(generator.builtins[funcText]) {
    return generator.builtins[funcText](obj.cont.slice(1));
  } else if(generator.infix_operators[funcText]) {
    return generator.infix(obj);
  } else {
    if(funcText.startsWith('.')) {
      var res = generator.get(obj.cont[1]) + funcText + '(';
      var argStart = 2;
    } else if(funcText.startsWith(':')) {
      return this.get(obj.cont[1]) + '.' + funcText.slice(1);
    } else {
      var res = funcText + '(';
      var argStart = 1;
    }
    res += generator.getAll(obj.cont, argStart).join(', ');
    res += ')'
    return res;
  }
}

module.exports.generate = function(tree) {
  var func = generator[tree.type];
  if(!func) {
    throw "Unexpected symbol " + JSON.stringify(tree.cont);
  }
  return func(tree) + ';';
}