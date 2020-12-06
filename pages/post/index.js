var returnCitySN; // 访问者信息
const kCommentServiceProtocol = 'https';
const kCommentServiceHost = 'vps.jamchenjun.com';  // 评论服务 host
const kCommentServicePort = '443';
// const kCommentServiceProtocol = 'http';
// const kCommentServiceHost = 'localhost';  // 评论服务 host
// const kCommentServicePort = '80';

window.onload = function () {
  const pageId = document.getElementById('page-id').innerText;
  const headEle = document.getElementsByTagName('h1');
  const title = headEle && headEle[0] && headEle[0].innerText || '';

  // 更新博客图片链接，适配 LFS
  updateImgElementsSRCIfNeeded();

  // 生成目录
  generateContentsTable();

  // 开发环境不进行访问量统计
  if (!window.JEKYLL_ENV || window.JEKYLL_ENV !== 'development') {
    // 初始化统计服务
    // initStatistic();

    // initStatistic 中需要通过网络获取访问者信息，延时 500ms 执行
    setTimeout(() => {
      // 曝光统计
      // exposure({
      //   pageId,
      //   title,
      // });
    }, 500);
  }
};

/* git pages 不支持存储在 LFS 中的博客图片，调整引用链接 */
function updateImgElementsSRCIfNeeded() {
  var imgs = document.querySelectorAll('img');
  for (var i = imgs.length - 1; i >= 0; i--) {
    var imgEle = imgs[i];
    var imgSRC = imgEle.src;
    var imgSRCSplits = imgSRC.split('//');
    var start = imgSRCSplits[1].indexOf('/');
    var domain = imgSRCSplits[1].substring(0, start);
    if (domain.indexOf('localhost') !== 0 &&
      domain.indexOf('127.0.0.1') !== 0) {
      // 不是本地服务
      var path = imgSRCSplits[1].substring(start);
      if (path.indexOf('/resources/figures') === 0) {
          // 引用了 LFS 中的资源，更新 src
          imgEle.src = 'https://github.com/rob2468/rob2468.github.io/raw/master' + path;
      }
    }
  }
}

/* 生成目录 */
function generateContentsTable() {
  // 创建目录
  const contentTableEle = document.createElement('div');

  const identifier = 'section';
  var firstLevelNum = 1;
  var loopID = identifier + '_' + firstLevelNum;
  var loopEle = document.getElementById(loopID);
  while (loopEle) {
    if (firstLevelNum === 1) {
      const tmpEle = document.createElement('p');
      tmpEle.innerHTML = '目录';
      contentTableEle.appendChild(tmpEle);
    }

    // 创建一级标题目录
    let tmpEle = document.createElement('a');
    tmpEle.setAttribute('href', '#' + loopID);
    tmpEle.setAttribute('class', 'first-level');
    tmpEle.innerHTML = loopEle.innerText;
    contentTableEle.appendChild(tmpEle);
    // 换行
    var br = document.createElement('br');
    contentTableEle.appendChild(br);

    var secondLevelNum = 1;
    var innerLoopID = loopID + '_' + secondLevelNum;
    var innerLoopEle = document.getElementById(innerLoopID);
    while (innerLoopEle) {
      // 创建二级标题目录
      tmpEle = document.createElement('a');
      tmpEle.setAttribute('href', '#' + innerLoopID);
      tmpEle.setAttribute('class', 'second-level');
      tmpEle.innerHTML = innerLoopEle.innerText;
      contentTableEle.appendChild(tmpEle);
      // 换行
      br = document.createElement('br');
      contentTableEle.appendChild(br);

      secondLevelNum++;
      innerLoopID = loopID + '_' + secondLevelNum;
      innerLoopEle = document.getElementById(innerLoopID);
    }

    firstLevelNum++;
    loopID = identifier + '_' + firstLevelNum;
    loopEle = document.getElementById(loopID);
  }

  // 插入到标题后面
  var titleEle = document.querySelectorAll('.title');
  if (titleEle.length > 0) {
    titleEle = titleEle[0];
    titleEle.parentNode.insertBefore(contentTableEle, titleEle.nextSibling);
  }
}
