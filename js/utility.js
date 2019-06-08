/**
 * 网络请求通用接口
 * @param {object} params 请求参数
 * @return {Promise} Promise 对象
 */
function getHttpDataPromise(params = {
  url: '',
  method: 'GET',
  param: {},
}) {
  return new Promise((resolve) => {
    const {
      url,
      method,
      param
    } = params;

    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.onload = function() {
      if (xhr.status === 200) {
        const responseText = xhr.responseText;
        const responseJSON = JSON.parse(responseText);
        resolve(responseJSON);
      } else {
        resolve();
      }
    };
    xhr.send(JSON.stringify(param));
  });
}

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
