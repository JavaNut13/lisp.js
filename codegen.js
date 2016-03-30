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

generator.builtins.defn = function(items) {
  var funcName = generator.get(items[0]);
  var args = generator.getAll(items[1].cont.cont);
  var code = generator.get(items[2]);
  var res = 'function ' + funcName + '(' + args.join(', ') + ') {\n';
  res += code;
  res += '\n}'
  return res;
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
  } else {
    if(funcText.startsWith('.')) {
      var res = generator.get(tree.cont[1]) + funcText + '(';
      var argStart = 2;
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
  return generator[tree.type](tree);
}