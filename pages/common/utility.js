/**
 * 网络请求通用接口
 * @param {object} params 请求参数
 * @return {Promise} Promise 对象
 */
function getHttpDataPromise(params = {
  url: '',
  method: '',
  head: {},
  param: {},
}) {
  const {
    url = '',
    method = 'GET',
    head = {},
    param = {},
  } = params;
  return new Promise((resolve) => {
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
    Object.keys(head).forEach(key => {
      xhr.setRequestHeader(key, head[key]);
    });
    xhr.send(JSON.stringify(param));
  });
}

/**
 *
 * @param {Date} date
 * @return 2019-06-09
 */
function getFormattedDateString(date) {
  const year = `${date.getFullYear()}`;
  let month;
  if (date.getMonth() + 1 < 10) {
    month = `0${date.getMonth() + 1}`;
  } else {
    month = `${date.getMonth() + 1}`;
  }
  let day;
  if (date.getDate() < 10) {
    day = `0${date.getDate()}`;
  } else {
    day = `${date.getDate()}`;
  }
  return `${year}-${month}-${day}`;
}

/**
 * 北京时间格式化显示
 * @param {number} timestamp time interval since 1970
 * @return {string} 如，2019-06-12
 */
function getFormattedBeijingDateString(timestamp) {
  const utcDate = new Date(timestamp + 8 * 60 * 60 * 1000);
  const year = `${utcDate.getUTCFullYear()}`;
  let month;
  if (utcDate.getUTCMonth() + 1 < 10) {
    month = `0${utcDate.getUTCMonth() + 1}`;
  } else {
    month = `${utcDate.getUTCMonth() + 1}`;
  }
  let day;
  if (utcDate.getUTCDate() < 10) {
    day = `0${utcDate.getUTCDate()}`;
  } else {
    day = `${utcDate.getUTCDate()}`;
  }
  return `${year}-${month}-${day}`;
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
