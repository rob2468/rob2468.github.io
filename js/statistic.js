async function initStatistic() {
  // 获取访问者信息，生成如下全局变量
  // var returnCitySN = {"cip": "111.111.111.111", "cid": "111111", "cname": "上海市"};
  const script = document.createElement('script');
  script.setAttribute('src', 'https://pv.sohu.com/cityjson?ie=utf-8');
  document.getElementsByTagName('body')[0].appendChild(script);

  // 初始化 LeanCloud 的服务
  initLeadCloud();
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

  const CounterClass = AV.Object.extend('counter');
  const counter = new CounterClass();

  var acl = new AV.ACL();
  acl.setPublicReadAccess(true);
  acl.setPublicWriteAccess(true);

  const date = new Date();
  counter.save({
    pageId,
    title,
    behaviorId: 'exposure',
    createTime: date.getTime(),
    createDate: getFormattedDateString(date),
    cityName: returnCitySN && returnCitySN['cname'] || '',
    ipAddr: returnCitySN && returnCitySN['cip'] || '',
  }).then(function (todo) {
    // 成功保存记录
  }, function (error) {
    // 异常错误
  });
}
