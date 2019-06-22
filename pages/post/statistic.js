async function initStatistic() {
  // 获取访问者信息，生成如下全局变量
  // var returnCitySN = {"cip": "111.111.111.111", "cid": "111111", "cname": "上海市"};
  const script = document.createElement('script');
  script.setAttribute('src', 'https://pv.sohu.com/cityjson?ie=utf-8');
  document.getElementsByTagName('body')[0].appendChild(script);
}

/**
 * 曝光统计
 * @param {object} params 统计参数
 */
function exposure(params = {
  pageId: '',
  title: '',
}) {
  const {
    pageId,
    title,
  } = params;
  const timestamp = Date.now();

  getHttpDataPromise({
    url: `https://${kCommentServiceHost}:443/api/addstat`,
    method: 'POST',
    head: {
      'Content-Type': 'application/json',
    },
    param: {
      pageId,
      title,
      behaviorId: 'exposure',
      cityName: returnCitySN && returnCitySN['cname'] || '',
      ipAddr: returnCitySN && returnCitySN['cip'] || '',
      timestamp,
      displayTime: getFormattedBeijingDateString(timestamp),
    },
  });
}
