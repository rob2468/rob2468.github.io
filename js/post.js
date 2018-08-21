window.onload = function () {
    // 更新博客图片链接，适配 LFS
    updateImgElementsSRCIfNeeded();

    // 生成目录
    generateContentsTable();
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
