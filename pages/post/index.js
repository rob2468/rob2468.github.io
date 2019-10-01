var returnCitySN; // 访问者信息
const kCommentServiceHost = 'vps.jamchenjun.com';  // 评论服务 host

window.onload = function () {
  const pageId = document.getElementById('page-id').innerText;
  const headEle = document.getElementsByTagName('h1');
  const title = headEle && headEle[0] && headEle[0].innerText || '';

  // 更新博客图片链接，适配 LFS
  updateImgElementsSRCIfNeeded();

  // 生成目录
  generateContentsTable();

  // 获取并显示评论
  initComments(pageId);

  // 开发环境不进行访问量统计
  if (!window.JEKYLL_ENV || window.JEKYLL_ENV !== 'development') {
    // 初始化统计服务
    initStatistic();

    // initStatistic 中需要通过网络获取访问者信息，延时 500ms 执行
    setTimeout(() => {
      // 曝光统计
      exposure({
        pageId,
        title,
      });
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
    const tmpEle = document.createElement('a');
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

/* 评论 */
var timeoutID;
/**
 * 提交评论
 * @param {string} pageId 文章 id
 * @param {string} title 文章标题
 */
async function submitForm(pageId, title) {
  var displayNameEle = $('.comment_area .input[name="display-name"]');
  var emailEle = $(".comment_area .input[name='email']");
  var contentEle = $(".comment_area .input[name='content']");
  if ($('.comment_area .submit_normal').length > 0) {
    var email = emailEle.val().trim();
    const timestamp = Date.now();
    var displayName = displayNameEle.val().trim();
    var content = contentEle.val().trim();

    // 字段有效性检查
    function validateDisplayName() {
      var res;
      if (displayName.length === 0) {
        res = '姓名没有可见内容';
      }
      return res;
    }
    function validateEmail() {
      var res;
      var reg = /^[.a-zA-Z0-9_-]+@[.a-zA-Z0-9_-]+$/;
      if (email.length === 0) {
        res = "电子邮箱没有可见内容";
      } else if (!reg.test(email)) {
        res = "电子邮箱格式不正确";
      }
      return res;
    }
    function validateContent() {
      var res;
      if (content.length === 0) {
        res = "评论内容没有可见内容";
      }
      return res;
    }
    // 显示反馈
    function showPrompt(prompt) {
      $(".comment_area .prompt").html(prompt);

      // 延时清除
      clearTimeout(timeoutID);
      timeoutID = setTimeout(function() {
        $(".comment_area .prompt").html("");
      }, 3000);
    }
    var displayNameValidation = validateDisplayName();
    var emailValidation = validateEmail();
    var contentValidation = validateContent();
    if (!displayNameValidation && !emailValidation && !contentValidation) {
      $(".comment_area .submit").removeClass("submit_normal");
      $(".comment_area .submit").addClass("submit_loading");
      function finnalyCompleteLoading() {
        $(".comment_area .submit").addClass("submit_normal");
        $(".comment_area .submit").removeClass("submit_loading");
      }
      // 将评论请求发送给服务端
      const result = await getHttpDataPromise({
        url: `https://${kCommentServiceHost}:443/api/submitcomment`,
        method: 'POST',
        head: {
          'Content-Type': 'application/json',
        },
        param: {
          pageId,
          title,
          email,
          displayName,
          content,
          timestamp,
          displayTime: getFormattedBeijingDateString(timestamp),
        },
      });
      if (result) {
        finnalyCompleteLoading();

        // 解析返回值
        const success = result.success;
        const comment = result.result;
        if (success) {
          $(".comment_area .input").removeClass("input_error");
          $(".comment_area .input").val("");

          // 显示新评论
          const commentEle = createCommentElement(comment);
          const commentsEle = document.getElementsByClassName('comments')[0];
          commentsEle.insertBefore(commentEle, commentsEle.firstChild);
        } else {
          showPrompt('内部错误');
        }
      }
    } else {
      var prompt;
      // 存在字段无效情况
      prompt = displayNameValidation? displayNameValidation + "；": "";
      prompt += emailValidation? emailValidation + "；": "";
      prompt += contentValidation? contentValidation + "；": "";
      if (displayNameValidation) {
        displayNameEle.addClass("input_error");
      } else {
        displayNameEle.removeClass("input_error");
      }
      if (emailValidation) {
        emailEle.addClass("input_error");
      } else {
        emailEle.removeClass("input_error");
      }
      if (contentValidation) {
        contentEle.addClass("input_error");
      } else {
        contentEle.removeClass("input_error");
      }
      showPrompt(prompt);
    }
  } else {
    // loading
    console.log("loading");
  }
}

/**
 * 获取并显示评论内容
 * @param {string} pageId 文章 id
 */
async function initComments(pageId) {
  const url = `https://${kCommentServiceHost}:443/api/comments?page_id=` + pageId;
  const comments = await getHttpDataPromise({
    url,
  });

  const commentsEle = document.getElementsByClassName('comments')[0];
  comments.forEach(element => {
    const commentEle = createCommentElement(element);
    commentsEle.appendChild(commentEle);
  });
}

/**
 * 根据评论内容创建 dom 元素
 * @param {object} comment
 */
function createCommentElement(comment) {
  // 解析字段
  const displayName = comment.displayName;
  const time = getFormattedBeijingDateString(comment.timestamp);
  const content = comment.content;

  const commentEle = document.createElement('div');
  commentEle.setAttribute('class', 'comment');

  const infoEle = document.createElement('p');
  infoEle.setAttribute('class', 'display-name');
  infoEle.innerHTML = `${displayName} <span class="comment-date">${time}</span>`;
  commentEle.appendChild(infoEle);

  const contentEle = document.createElement('p');
  contentEle.setAttribute('class', 'content');
  contentEle.innerHTML = content;
  commentEle.appendChild(contentEle);
  return commentEle;
}
