module.exports = {
  'map': "function map(f, l){var r=[];for(var i=0;i<l.length;i++)r.push(f(l[i]));return r;}",
  'filter': "function filter(f, l){var r=[];for(var i=0;i<l.length;i++)f(l[i])&&r.push(l[i]);return r;}",
  'reduce': "function reduce(f, v, l){for(var i=0;i<l.length;i++)v=f(v,l[i]);return v;}",
  'type': "function type(a) {return typeof a;}",
  'range': "function range(a) {var r=[];for(var i=0;i<a;i++)r[i]=i;return r;}",
  'apply': "function apply(f, a) {return f.apply(null, a);}"
}