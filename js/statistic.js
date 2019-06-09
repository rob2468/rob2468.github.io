async function initStatistic() {
  // 获取访问者信息，生成如下全局变量
  // var returnCitySN = {"cip": "111.111.111.111", "cid": "111111", "cname": "上海市"};
  const script = document.createElement('script');
  script.setAttribute('src', 'https://pv.sohu.com/cityjson?ie=utf-8');
  document.getElementsByTagName('body')[0].appendChild(script);

  // 初始化 LeanCloud 的服务
  var APP_ID = 'hp8Ka9CYnCligvMrF1PHVpRP-gzGzoHsz';
  var APP_KEY = 'S4l5k49pr8jkzHmmuaekqFAN';
  AV.init({
    appId: APP_ID,
    appKey: APP_KEY
  });
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

  counter.save({
    pageId,
    title,
    behaviorId: 'exposure',
    time: Date.now(),
    cityName: returnCitySN && returnCitySN['cname'] || '',
    ipAddr: returnCitySN && returnCitySN['cip'] || '',
  }).then(function (todo) {
    // 成功保存记录
  }, function (error) {
    // 异常错误
  });
}
