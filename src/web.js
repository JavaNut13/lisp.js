var lispjs = require('./lispjs');

String.prototype.toJS = function () {
  lispjs.toJS(this);
}

String.prototype.evalLisp = function () {
  eval(this.toJS());
}