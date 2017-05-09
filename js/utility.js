function simpleStrEncode(code) {
  var c = String.fromCharCode(code.charCodeAt(0) + code.length);
  for(var i = 1; i < code.length; i++) {
    c += String.fromCharCode(code.charCodeAt(i) + code.charCodeAt(i - 1));
  }
  return escape(c);
}

function simpleStrDecode(code) {
  code = unescape(code);
  var c = String.fromCharCode(code.charCodeAt(0) - code.length);
  for(var i = 1; i < code.length; i++) {
    c += String.fromCharCode(code.charCodeAt(i) - c.charCodeAt(i - 1));
  }
  return c;
}
