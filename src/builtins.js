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

module.exports = function(gen) {
  gen.builtins_fn = function(items) {
    return createFunction(this, items, true);
  }

  gen.builtins_defn = function(items) {
    return createFunction(this, items);
  }

  gen.builtins_def = function(items) {
    return 'var ' + this.get(items[0]) + '=' + this.get(items[1]);
  }

  gen.builtins_set = function(items) {
    return this.get(items[0]) + '=' + this.get(items[1]);
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

  gen.builtins_require = function(items) {
    var res = 'var ';
    var first = true;
    for(var i = 0; i < items.length; i++) {
      if(!first) res += ', ';
      first = false;
      var str = this.get(items[i]);
      var split = str.split('/')
      var name = split[split.length - 1].split('.')[0].replace(/"/g, '');
      res += name + '=require(' + str + ')'
    }
    return res;
  }
  
  gen['builtins_:'] = function(items) {
    var obj = this.get(items[1]);
    var index = this.get(items[0]);
    return obj + '[' + index + ']';
  }
}