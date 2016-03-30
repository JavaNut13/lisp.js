Object.prototype.strfy = function() {
  return JSON.stringify(this);
}
Object.prototype.prstrfy = function() {
  return JSON.stringify(this, null, 2);
}

var types = {
  'list-start': {
    re: /^\(/,
    ignore: false
  },
  'list-end': {
    re: /^\)/,
    ignore: false
  },
  'iden': {
    re: /^[\w\-+*!@#$%\^&\d\.]+/,
    ignore: false
  },
  'string': {
    re: /^"(.*?)"/,
    ignore: false
  },
  'number': {
    re: /^\d*\.\d+|^\d+/,
    ignore: false
  },
  'whitespace': {
    re: /\s+/,
    ignore: true
  },
  'quote': {
    re: /^'/,
    ignore: false
  }
}

function parseType(text) {
  for(type in types) {
    var match = types[type].re.exec(text);
    if(match) {
      var whole = match[0];
      var content = match[1] || whole;
      return {
        type: type,
        text: !types[type].ignore && content,
        length: whole.length
      };
    }
  }
}

function parseAtom(text) {
  var match = parseType(text);
  if(match.type === 'list-start') {
    return parseList(text);
  } else if(match.type === 'whitespace') {
    var res = parseAtom(text.substring(match.length));
    res.length += match.length;
    return res;
  } else {
    return match;
  }
}

function parseList(text) {
  var subText = text.substring(1);
  var totalLength = 1;
  var lastMatch;
  var elems = [];
  while(lastMatch = parseAtom(subText)) {
    if(lastMatch.text) {
      if(lastMatch.type === 'list-end') {
        totalLength += lastMatch.length;
        break;
      } else {
        elems.push(lastMatch)
      }
    }
    subText = subText.substring(lastMatch.length);
    totalLength += lastMatch.length;
  }
  return {
    type: 'list',
    length: totalLength,
    text: elems
  };
}

function parse(text) {
  var tree = parseList(text);
  
  
  return tree;
}

module.exports.parse = function(text) {
  var lst = parse(text);
  console.log(lst.prstrfy());
};