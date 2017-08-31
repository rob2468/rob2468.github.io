---
layout: post
title: Git 回滚多次提交最佳实践
page_id: id-2017-08-30
---

<h1>{{ page.title }}</h1>

<h2>一、前言</h2>

在开发过程中有这么一种情况，某个特性开发的代码需要回滚，但是该特性的开发提交和所有即将上线的提交处于统一分支，此时需要将该特性相关的提交依次回滚。在回滚代码时希望满足两个要求，能够保留详细的回滚日志信息、只产生一次提交记录。


<h2>二、可选命令</h2>

`git revert` 命令用于回滚提交，该命令会创建一次新提交，新提交的内容是之前提交的逆操作。`git revert` 自动生成的提交日志有关于本次操作的详细信息，如下所示。

<div class="code"><pre><code>commit a35fc9cad9e1fd827fab4b991995b0f7f9b8716b
Author: jam.chenjun <jam.chenjun@gmail.com>
Date:   Wed Aug 30 16:40:34 2017 +0800

    Revert "add new line "b""

    This reverts commit d4c5ad3bd6484489c1dc80c96d06125291d0d3c3.
</code></pre></div>

git-revert 有 -n 或 --no-commit 选项，当执行提交回滚时添加该选项，回滚的改动会体现在工作区和暂存区，不会产生提交。如果希望只产生一次提交记录，可以在回滚每次提交时使用该选项，待所有回滚完成后再执行提交。

上面两个方法不能同时满足保留产生一次提交和保留回滚日志信息的要求。在 stackoverflow 发现了一个非常好的方法，使用 `git revert` 回滚代码和自动生成提交日志，使用 `git rebase` 将多次提交日志压缩成一个。

<div class="code"><pre><code>git revert <# all commits #>
git rebase -i
</code></pre></div>

<h2>三、Demo</h2>

使用 `git log --oneline` 查看提交日志，如下所示。

<div class="code"><pre><code>82c5dd2 (HEAD -> master) add new line "e"
528b283 add new line "d"
3fb9964 add new line "c"
d4c5ad3 add new line "b"
f625066  Initial commit
</code></pre></div>

现希望回滚 `528b283 add new line "d"` 和 `d4c5ad3 add new line "b"` 这两次提交。执行 `git revert 528b283 d4c5ad3`，完成后的提交日志如下所示。

<div class="code"><pre><code>9093fa5 (HEAD -> master) Revert "add new line "b""
ae7b6cc Revert "add new line "d""
82c5dd2 add new line "e"
528b283 add new line "d"
3fb9964 add new line "c"
d4c5ad3 add new line "b"
f625066  Initial commit
</code></pre></div>

使用 git-rebase 压缩提交，执行 `git rebase -i 82c5dd2`，出现如下交互界面。（`git rebase -i` 是交互式变基操作的命令，如果本地分支追踪某个远端分支，并且希望变基操作从最久本地提交开始，则直接执行 `git rebase -i` 指令即可，否则需要显式指定从哪个提交开始。）

<div class="code"><pre><code>pick ae7b6cc Revert "add new line "d""
pick 9093fa5 Revert "add new line "b""
</code></pre></div>

将除第一次提交外的其它提交的操作执行改为 squash，表明将所有提交压缩成一个。

<div class="code"><pre><code>pick ae7b6cc Revert "add new line "d""
squash 9093fa5 Revert "add new line "b""
</code></pre></div>

保存退出后，出现最终合成提交的提交日志编辑界面，其中包含有详细的回滚操作信息。如下所示。

<div class="code"><pre><code># This is a combination of 2 commits.
# This is the 1st commit message:

Revert "add new line "d""

This reverts commit 528b2835b03a08ce172efaf20faab9e435cb4345.

# This is the commit message #2:

Revert "add new line "b""

This reverts commit d4c5ad3bd6484489c1dc80c96d06125291d0d3c3.
</code></pre></div>

编辑、保存、退出后，即完成所有步骤。生成的回滚提交日志如下所示。

<div class="code"><pre><code>commit 5f5d572aab6eb247852546cb3ff55375d09953e6 (HEAD -> master)
Author: jam.chenjun <jam.chenjun@gmail.com>
Date:   Thu Aug 31 16:47:16 2017 +0800

    Revert "add new line "d""

    This reverts commit 528b2835b03a08ce172efaf20faab9e435cb4345.

    Revert "add new line "b""

    This reverts commit d4c5ad3bd6484489c1dc80c96d06125291d0d3c3.
</code></pre></div>

<h3>参考文献：</h3>

<a href="https://stackoverflow.com/a/19537017">https://stackoverflow.com/a/19537017</a>
