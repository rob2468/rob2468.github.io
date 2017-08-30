---
layout: post
title: Git 回滚多次提交最佳实践
page_id: id-2017-08-30
---

<h1 class="title">{{ page.title }}</h1>

<h2>一、前言</h2>

在开发过程中有这么一种情况，某个特性开发的代码需要回滚，但是该特性的开发提交是和所有即将上线的提交处于统一分支的，此时需要将该特性相关的提交回滚。

`git revert` 命令用于回滚提交，该命令会创建一次新提交，新提交的内容是之前提交的逆操作，并且提交日志有丰富的信息，如下所示。

<div class="code"><pre><code>commit a35fc9cad9e1fd827fab4b991995b0f7f9b8716b
Author: jam.chenjun <jam.chenjun@gmail.com>
Date:   Wed Aug 30 16:40:34 2017 +0800

    Revert "add new line "b""

    This reverts commit d4c5ad3bd6484489c1dc80c96d06125291d0d3c3.
</code></pre></div>


保留回滚日志信息、产生一次提交记录

<h2>二、</h2>
