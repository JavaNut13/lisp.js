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