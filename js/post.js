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
