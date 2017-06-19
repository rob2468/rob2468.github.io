---
layout: post
title: （利用GitHub API）实现GitHub Pages的评论系统
page_id: id-2017-04-18
---

<h1>{{ page.title }}</h1>

本博客系统使用 GitHub Pages 服务。基本上所有文件为纯文本文件，使用 Git 执行版本控制并托管于 GitHub。GitHub Pages 在后台使用 [Jekyll](https://jekyllrb.com/) 将当前提交内容编译成静态站点，实现网站发布。

我希望通过提供评论系统实现和读者的沟通。最开始使用 Disqus 作为评论系统，无奈国内已无法使用，并且当时没有找到好的替代品，便打算自己实现。

我预想的评论系统使用现有的构建博客的技术便能实现，即静态站点，无需额外的后端计算和存储成本。查阅一番资料并加以实践，目前已实现一套可用的评论系统，本文对该解决方案加以记录说明。

<h2>一、整体架构</h2>

不考虑技术细节，整个评论系统可以分为三个部分。一是评论入口，由前端提供表单，可输入评论内容并提交。二是评论内容存储，实现评论内容持久化。三是评论展示，能够读取已持久化存储的评论内容。如下图所示。

<div align="center"><img src="http://7xilqo.com1.z0.glb.clouddn.com/2017-04-18-overall-architecture.png" alt="" width="60%" /></div>

评论入口使用 HTML 和 JS 实现评论表单的展现和交互逻辑。评论内容采用约定组织结构，存储于同一个 Git 仓库中，由前端页面利用 GitHub API 实现。评论展示利用 Jekyll 实现，生成静态站点时解析有固定结构的评论内容，并将内容填充在网页中。

<h2>二、Git 底层原理与 GitHub API</h2>

整个评论系统得益于 Git 以及 GitHub 提供的 API。

Git 本质上是一个内容寻址文件系统，它以特定方式存储文件，并提供访问这些文件的能力。Git 主要包含如下几种对象（blob、tree、commit、ref、tag），这些对象使用长度为40个字符的 SHA-1 标示。

Git 中的文件内容以 blob 类型存储，blob 对象只存储文件的内容，不包含文件的名称。tree 类型能够存储文件名，同时也允许存储一组文件。所有内容以 tree 或 blob 对象存储，其中 tree 对象对应于 UNIX 中的目录，blob 对象则大致对应于 inodes 或文件内容。一个单独的 tree 对象包含一条或多条记录，每一条记录含有一个指向 blob 或子 tree 对象的 SHA-1 指针，并附有该对象的权限模式、类型和文件名信息。

仅使用 blob 和 tree 便能实现文件的存储和访问，但是还需要更多的信息才能成为版本控制系统。commit 对象对应 Git 管理下的所有文件一个版本快照，包含了提交时的 tree 对象、前次提交的 commit 对象、提交时间等信息。Git 中的所有对象都是根据40个字符的 SHA-1 值索引访问的，但是更方便的做法是使用 ref。ref 是一个指针，指向 commit 对象，方便使用者以已于理解的方式操作。tag 对象用于创建里程碑，类似于分支引用，但是永远不会变化。tag 可以标记任何 Git 对象，比如，blob、tree、commit。

由上述内容可知，只要构造好 blob、tree 和 commit 对象，并将指针指向新创建的 commit，便能达到类似使用 Git 命令行工具提交文件内容的效果。GitHub 提供了实现该功能的 API，需要如下5个接口：<a href="https://developer.github.com/v3/git/refs/#get-a-reference" target="_blank">获取引用</a>、<a href="https://developer.github.com/v3/git/commits/#get-a-commit" target="_blank">获取提交</a>、<a href="https://developer.github.com/v3/git/trees/#create-a-tree" target="_blank">创建 tree</a>、<a href="https://developer.github.com/v3/git/commits/#create-a-commit" target="_blank">创建提交</a>、<a href="https://developer.github.com/v3/git/refs/#update-a-reference" target="_blank">更新引用</a>。

<h2>三、实现细节</h2>

<h3>1. 评论信息存储方式</h3>

所有评论以纯文本方式存储，置于 _data/comments.json 文件中。单条评论信息的结构如下所示：

<div class="code"><pre><code>{
  "email": <# email #>,
  "date": <# date #>,
  "author": {
    "display_name": <# display_name #>,
  },
  "content": content
}
</code></pre></div>

_data/comments.json 中所有评论信息的结构如下所示。每篇文章使用键 page_id 唯一标示，page_id 的值为该篇文章的所有评论。

<div class="code"><pre><code>{
  <# page_id #>: [<# comment_info #>, <# comment_info #>, ...],
  <# page_id #>: [<# comment_info #>, <# comment_info #>, ...],
  ...
}</code></pre></div>

<h3>2. 评论信息的获取</h3>

根据上一小节说明的评论的存储结构，使用如下代码获取评论内容。Jekyll 将内容编译成静态站点时执行下面代码的逻辑，将评论填充到网页中。

<div class="code"><pre><code>assign pageid = page.page_id    # 获取文章标识符
if site.data.comments[pageid]   # 如果该文章有评论
  assign sorted_comments = (site.data.comments[pageid] | sort: 'date') # 获取评论并按时间排序
endif
for c in sorted_comments reversed # 按时间倒序遍历
  c.author.display_name on c.date | date: "%Y-%m-%d"  # 显示评论者和评论时间
  c.content | newline_to_br       # 显示评论内容
else
  这篇文章暂没有评论。
endfor
</code></pre></div>

<h3>3. 提交评论</h3>

提交评论是整个评论系统的核心操作。利用 GitHub API，使用 XMLHttpRequest 实现客户端和 GitHub 的通信。提交评论操作的本质是在博客代码库的 comments 分支基于当前最新提交创建一次提交，并将分支引用指向该次提交。新创建提交的内容是，_data/raw_comments/ 下创建的一个临时文件，保存评论者提交的评论信息。

下面描述客户端和 GitHub 通信的流程。

<div align="center"><img src="http://7xilqo.com1.z0.glb.clouddn.com/2017-04-18-UA-and-GitHub-communication-process.png" alt="" width="70%" /></div>

如上图所示，提交评论需要进行5次客户端和 GitHub 的通信，并且后3次 POST 请求需要在请求中附加身份验证信息。

a）首先获取目标分支的最新提交，取得 commit id；

b）获取最新提交对应的 tree，取得 tree id；

c）基于取得的 tree id，创建新的 tree 对象，并取得该对象的 id；

POST 请求发送的数据格式如下所示。path 字段指明评论信息存储的临时文件，content 字段是评论信息，base_tree 字段是最新提交对应的 tree 对象的 id。

<div class="code"><pre><code>{
  "tree": [{
    "path": "_data/raw_comments/comment_" + new Date().getTime(),
    "mode": "100644",
    "type": "blob",
    "content": JSON.stringify(comment),
  }],
  "base_tree": treeID,
}
</code></pre></div>

d）基于新创建的 tree 对象，创建提交，并取得提交对象的 id；

POST 请求发送的数据格式如下所示。message 字段为提交日志，tree 字段为新创建的 tree 对象的 id，parents 字段是最新提交的 id。服务端接受到这个请求后创建新的提交对象，并返回该对象的 id。

<div class="code"><pre><code>{
  "message": "comment by " + display_name + " on " + date,
  "tree": newTreeID,
  "parents": [lastCommitID]
}
</code></pre></div>

e）修改分支引用为最新提交。

<h3>4. 评论整合</h3>

前面说到，评论者提交的评论信息是存储在 _data/raw_comments/ 下的临时文件。评论提交成功后，前端页面会显示几秒钟的查看评论的跳转链接。这种实现方式既提供了评论者查看自己评论的方法，也让我有机会先查看一下评论内容，再合入 _data/comments.json 中。（其实是没有想到方法可以直接将评论的内容整合到 _data/comments.json 中。）

评论信息以 json 格式存储，使用 JS 脚本便能方便的处理。读取 _data/comments.json 获得所有评论，遍历所有临时评论文件并合入所有评论，写回 _data/comments.json 文件，最后删除所有临时评论文件。

<h2>四、后记</h2>

在前人思考的基础上开发一套可用的评论系统，当然问题是存在的（比如高并发情况、通信次数多、token 管理等），但也算是满足我的要求。

专业的评论系统还是有不少的，比如前段时间有个同事提到<a href="https://livere.com/">来必力</a>，看起来挺不错。

<h3>参考文献：</h3>
1. <a href="https://mdswanson.com/blog/2011/07/23/digging-around-the-github-api-take-2.html" target="_blank">Making a commit with the Github API</a>
2. <a href="https://git-scm.com/book/zh/v1/Git-%E5%86%85%E9%83%A8%E5%8E%9F%E7%90%86" target="_blank">Git 内部原理</a>
