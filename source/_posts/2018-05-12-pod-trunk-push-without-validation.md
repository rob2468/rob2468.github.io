---
layout: post
title: 如何在验证失败的情况下发布 Pod
page_id: id-2018-05-12
---

# {{ page.title }}

## 前言

在 CocoaPods 发布 Pod 的最后一步是执行 `pod trunk push` 命令，pod-trunk 首先会对你创建的 Pod 进行验证，验证通过才允许上传。

有时，希望在 Pod 验证失败的情况下也能够上传，关于这种做法是否合理 <a href="https://github.com/CocoaPods/CocoaPods/issues/5801" target="_blank">这里</a> 有相关讨论。讨论中 <a href="https://github.com/mxcl" target="_blank">@mxcl</a> 给出了一种绕过发布前验证的方法，如下文所述。

## 正文

pod 命令使用 Ruby 写成，使用解释型语言的好处是我们可以方便的修改命令的逻辑。只要找到目标代码，注释掉验证 Pod 的逻辑便能达到目的。

首先执行 `gem env`，如下变量给出了 Ruby 库安装的位置。

<div class="code"><pre><code>  - INSTALLATION DIRECTORY: /usr/local/lib/ruby/gems/2.4.0
</code></pre></div>

当前，`pod trunk push` 命令文件对于 Ruby 库根目录的相对位置是 `gems/cocoapods-trunk-1.3.0/lib/pod/command/trunk/push.rb`，只要注释掉如下一行代码即可。

<div class="code"><pre><code>def run
    update_master_repo
    # validate_podspec  # 删除验证逻辑
    status, json = push_to_trunk
    update_master_repo

    # ...
end
</code></pre></div>
