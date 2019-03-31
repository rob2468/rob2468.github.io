---
layout: post
title: 博客评论系统的更新历程
page_id: id-2019-03-30
---

<h1>{{ page.title }}</h1>

这个博客站点使用 Github Pages 搭建，能够提供静态页面的展示，但是没有一套现成的评论系统。从前年开始，就一直在尝试各种方法增加评论功能，每次更新都是方案的重大改变。最终的实现还是使用传统方案，自建服务器，使用数据库存储。应该以后就会围绕这个方案完善下去，好在博客一直没啥人气，我可以慢慢折腾 ==。

<h2>disqus</h2>

一开始自然是使用大名鼎鼎的 <a href="https://disqus.com/" target="_blank">disqus</a>，但是国内大部分时候都不能用，没过多久就放弃这个方案了。

<h2>GitHub API</h2>

发现一个神奇的工具 <a href="https://commentit.io/" target="_blank">Comm(ent|it)</a>。可以直接将评论提交到博客所在的代码仓库，Jekyll 生成静态站点时再从代码库中的指定文件解析出评论内容。

受这个工具启发，也开始按这个思路去开发评论系统，目标是不需要服务端系统，所有逻辑由前端完成。

从 GitHub API 文档找到一些接口，能够满足我的需要，还专门写了一篇文章描述技术细节 <a href="https://blog.jamchenjun.com/2017/04/18/commentme.html">实现 GitHub Pages 的评论系统</a>。

这个方案的缺点是，写一条评论，前端页面就需要与 GitHub 服务器进行5次通信，速度非常慢，并且很不稳定。

另一个让我耿耿于怀的问题是，因为所有逻辑写在前端，代码人人可见，跟 GitHub 通信的密钥都是公开的，虽然搞了点花招混淆了密钥字符串，但是很容易逆向混淆逻辑将密钥解析出来。

<h2>服务器 + Git</h2>

后来去 Vultr 买了台虚拟主机用于科学上网，但是仅用于科学上网有点浪费，便开始在这台虚拟主机上部署评论的后端系统。

方案仍然是将评论写入代码仓库，生成静态站点时再解析出来。与之前不同的是前端现在只需要将评论数据打包发送给后端就行，不用处理太多逻辑。后端逻辑也进行了简化，不再需要使用复杂的 GitHub API，使用脚本利用 Git 命令提交和推送即可。

<h2>服务器 + 数据库</h2>

服务器 + Git 方案的流程还是有点复杂，既然有服务器了，那么不如用最直接的方式实现好了，即数据库存储方式。现在评论系统已经改成了这种方式，这种方案是最常见的实现方式，没有什么值得多说的。

其实评论系统切换到服务器一开始就是不可用的，因为前端和服务端的通信走的是 http 协议，而博客站点使用的是 https 协议，浏览器会阻止在 https 站点中发送 http 请求的行为。

通过对服务端系统进行 https 改造，这个问题目前已经解决，参考 <a href="https://itnext.io/node-express-letsencrypt-generate-a-free-ssl-certificate-and-run-an-https-server-in-5-minutes-a730fbe528ca" target="_blank">Node + Express + LetsEncrypt : Generate a free SSL certificate and run an HTTPS server in 5 minutes or less</a> 这篇文章。
