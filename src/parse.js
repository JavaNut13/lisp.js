var types = {
  'list-start': {
    re: /^\(|^\[/,
    ignore: false
  },
  'list-end': {
    re: /^\)|^\]/,
    ignore: false
  },
  'object-start': {
    re: /^\{/,
    ignore: false
  },
  'object-end': {
    re: /^\}/,
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
  'string-start': {
    re: /^"/,
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

function parseString(cont) {
  var i = 1;
  var len = cont.length;
  while(i < len && cont[i] != '"') {
    i += cont[i] === '\\' ? 2 : 1;
  }
  var res = {
    type: 'string',
    cont: cont.substring(1, i)
  };
  return { length: i + 1, result: res };
}

function parseKeyValue(cont) {
  var res = parseAtom(cont);
  var key = res.result;
  var len = res.length;
  if(key.type === 'object-end') {
    return { length: len };
  }
  cont = cont.substring(len);
  res = parseAtom(cont);
  if(!res) {
    throw 'Expected value or }';
  }
  len += res.length;
  var val = res.result;
  if(val.type === 'object-end') {
    throw 'invalid object';
  }
  return { length: len, key: key.cont.toString(), value: val };
}

function parseObject(cont) {
  var subcont = cont.substring(1);
  var totalLength = 1;
  var len;
  var elems = {};
  while(result = parseKeyValue(subcont)) {
    var len = result.length;
    if(result.key === undefined) {
      totalLength += len;
      break;
    }
    var key = result.key;
    var value = result.value;
    elems[key] = value;
    subcont = subcont.substring(len);
    totalLength += len;
  }
  return {
    result: {
      type: 'object',
      cont: elems
    },
    length: totalLength
  };
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
  } else if(match.type === 'string-start') {
    return parseString(cont);
  } else if(match.type === 'object-start') {
    return parseObject(cont);
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
  while(true) {
    result = parseAtom(subcont);
    if(!result) {
      throw "Expected list end!";
    }
    lastMatch = result.result;
    len = result.length;
    if(lastMatch.type === 'list-end') {
      totalLength += len;
      break;
    } else {
      elems.push(lastMatch)
    }
    subcont = subcont.substring(len);
    totalLength += len;
  }
  return {
    result: {
      type: 'list',
      cont: elems,
      literal: isLiteral
    },
    length: totalLength
  };
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