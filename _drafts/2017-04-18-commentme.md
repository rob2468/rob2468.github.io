---
layout: post
title: （利用GitHub API）实现GitHub Pages的评论系统
page_id: id-2017-04-18
---

<h1>{{ page.title }}</h1>

本博客系统使用 GitHub Pages 服务。基本上所有文件为纯文本文件，使用 Git 执行版本控制并托管于 GitHub。GitHub Pages 在后台使用 [Jekyll](https://jekyllrb.com/) 将当前提交内容编译成静态站点，实现网站发布。

我希望通过提供评论系统实现和读者的沟通。最开始使用 Disqus 作为评论系统，无奈国内已无法使用，并且没有找到好的替代品，便打算自己实现。

我预想的评论系统使用现有的构建博客的技术便能实现，即静态站点，无需额外的后端计算和存储成本。查阅一番资料并加以实践，目前已实现一套可用的评论系统，本文对该解决方案加以记录说明。

<h2>一、整体架构</h2>

不考虑技术细节，整个评论系统可以分为三个部分。一是评论入口，由前端提供表单，可输入评论内容并提交。二是评论内容存储，实现评论内容持久化。三是评论展示，能够读取已持久化存储的评论内容。如下图所示。

<div align="center"><img src="/tmp/2017-04-18-overall-architecture.png" alt="" width="60%" /></div>

评论入口使用 HTML 和 JS 实现评论表单的展现和交互逻辑。评论内容采用约定组织结构，存储于同一个 Git 仓库中，由前端页面利用 GitHub API 实现。评论展示利用 Jekyll 实现，生成静态站点时解析有固定结构的评论内容，并将内容填充在网页中。

<h2>二、Git 底层原理与 GitHub API</h2>

整个评论系统得益于 Git 以及 GitHub 提供的 API。

Git 本质上是一个内容寻址文件系统，它以特定方式存储文件，并提供访问这些文件的能力。Git 主要包含如下几种对象（blob、tree、commit、ref、tag），这些对象使用长度为40个字符的 SHA-1 标示。

Git 中的文件内容以 blob 类型存储，blob 对象只存储文件的内容，不包含文件的名称。tree 类型能够存储文件名，同时也能够存储文件。所有内容以 tree 或 blob 对象存储，其中 tree 对象对应于 UNIX 中的目录，blob 对象则大致对应于 inodes 或文件内容。一个单独的 tree 对象包含一条或多条记录，每一条记录含有一个指向 blob 或子 tree 对象的 SHA-1 指针，并附有该对象的权限模式、类型和文件名信息。

仅使用 blob 和 tree 便能实现文件的存储和访问，但是还需要更多的信息才能成为版本控制系统。commit 对象对应 Git 管理下的所有文件一个版本快照，包含了提交时的 tree 对象、前次提交的 commit 对象、提交时间等信息。所有的对象都是根据40个字符的 SHA-1 值索引访问的，但是更方便的做法是使用 ref。ref 是一个指针，指向 commit 对象，方便使用者以已于理解的方式操作。tag 对象用于创建里程碑，类似于分支引用，但是永远不会变化。tag 可以标记任何 Git 对象，比如，blob、tree、commit。

由上述内容可知，只要构造好 blob、tree 和 commit 对象，并将指针指向新创建的 commit，便能达到类似使用 Git 命令行工具提交文件内容的效果。GitHub 提供了实现该功能的 API。



<h2>三、实现细节</h2>


<h3>参考文献：</h3>
1. <a href="https://mdswanson.com/blog/2011/07/23/digging-around-the-github-api-take-2.html" target="_blank">Making a commit with the Github API</a>
2. <a href="https://git-scm.com/book/zh/v1/Git-%E5%86%85%E9%83%A8%E5%8E%9F%E7%90%86" target="_blank">Git 内部原理</a>
