window.onload = function () {
    // 更新博客图片链接，适配 LFS
    updateImgElementsSRCIfNeeded();

    // 生成目录
    generateContentsTable();

    // 更新评论时间的显示格式
    updateCommentDate();
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
    var contentTableEle = document.createElement("div");
    var tmpEle = document.createElement("p");
    tmpEle.innerHTML = "目录";
    contentTableEle.appendChild(tmpEle);

    var identifier = "section";
    var firstLevelNum = 1;
    var loopID = identifier + "_" + firstLevelNum;
    var loopEle = document.getElementById(loopID);
    while (loopEle) {
        // 创建一级标题目录
        tmpEle = document.createElement("a");
        tmpEle.setAttribute("href", "#" + loopID);
        tmpEle.innerHTML = loopEle.innerHTML;
        contentTableEle.appendChild(tmpEle);
        // 换行
        var br = document.createElement("br");
        contentTableEle.appendChild(br);

        var secondLevelNum = 1;
        var innerLoopID = loopID + "_" + secondLevelNum;
        var innerLoopEle = document.getElementById(innerLoopID);
        while (innerLoopEle) {
            // 创建二级标题目录
            tmpEle = document.createElement("a");
            tmpEle.setAttribute("href", "#" + innerLoopID);
            tmpEle.innerHTML = innerLoopEle.innerHTML;
            contentTableEle.appendChild(tmpEle);
            // 换行
            br = document.createElement("br");
            contentTableEle.appendChild(br);

            secondLevelNum++;
            innerLoopID = loopID + "_" + secondLevelNum;
            innerLoopEle = document.getElementById(innerLoopID);
        }

        firstLevelNum++;
        loopID = identifier + "_" + firstLevelNum;
        loopEle = document.getElementById(loopID);
    }

    // 插入到标题后面
    var titleEle = document.querySelectorAll(".title");
    if (titleEle.length > 0) {
        titleEle = titleEle[0];
        titleEle.parentNode.insertBefore(contentTableEle, titleEle.nextSibling);
    }
}

/* 评论 */
var timeoutID;
function submitForm(pageID) {
    var displayNameEle = $(".comment_area .input[name='display_name']");
    var emailEle = $(".comment_area .input[name='email']");
    var contentEle = $(".comment_area .input[name='content']");
    if ($(".comment_area .submit_normal").length > 0) {
        var BRANCH_NAME = "comments";
        var OWNER_NAME = "rob2468";
        var REPO_NAME = "rob2468.github.io";
        var email = emailEle.val().trim();
        var date = new Date().getTime();
        var display_name = displayNameEle.val().trim();
        var content = contentEle.val().trim();

        // 字段有效性检查
        function validateDisplayName() {
            var res;
            if (display_name.length === 0) {
                res = "姓名没有可见内容";
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
            // 将评论请求发送给服务端，服务端负责跟 github 交互
            var xhr = new XMLHttpRequest();
            xhr.open('POST', 'http://207.148.118.121:8888/api/submitcomment');
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        finnalyCompleteLoading();

                        var responseText = xhr.responseText;
                        var responseJSON = JSON.parse(responseText);
                        var error = responseJSON.error;
                        var message = responseJSON.message;
                        if (error === 0) {
                            $(".comment_area .input").removeClass("input_error");
                            $(".comment_area .input").val("");

                            var link = responseJSON.link;
                            showPrompt("评论已提交成功，可到<a href='" + link + "' target='_blank'>这里</a>临时查看（该信息3秒后消失）");
                        } else {
                            showPrompt("内部错误（" + message + "）");
                        }
                    }
                }
            };
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(JSON.stringify({'page_id': pageID,
                'email': email,
                'date': date,
                'display_name': display_name,
                'content': content
            }));
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

function updateCommentDate() {
    // 获取所有评论日期
    const dateEles = document.querySelectorAll('.comment-date');
    const commentsNum = dateEles.length;
    for (var i = 0; i < commentsNum; i++) {
        const dateEle = dateEles.item(i);
        const seconds = parseInt(dateEle.innerHTML, 10);

        // 重新格式化
        const date = new Date(seconds);
        const dateStr = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
        dateEle.innerHTML = dateStr;
    }
}
