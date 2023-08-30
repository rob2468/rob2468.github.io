---
title: 浏览器工作原理
tags:
- Web
---

# {{ page.title }}

## 浏览器如何渲染页面

[Populating the page: how browsers work](https://developer.mozilla.org/en-US/docs/Web/Performance/How_browsers_work)

用户体验好的网页的标准：1、快速加载；2、交互流畅。

<!-- more -->

### 获取页面

#### 建立连接

![](/images/2023-01-17-ssl.jpg)

不考虑缓存，一个基于 HTTPS 的网页需要在客户端与服务端之间进行 10 次交互，才能建立链接。其中包括，2 次 DNS 查询、TCP 3 次握手、5 次 TLS 协商。

#### 获取数据

浏览器打开网页，建立连接后第一个请求的内容是 HTML 文件。按照 TCP 慢启动的算法，第一个响应数据包的大小为 14KB (若未达阈值或未遇到拥塞控制，后续数据包的大小成倍增加，28KB/56KB...)。

基于 TCP 的这个特性，Web 性能优化需要将此 14KB 作为优化重点。如，浏览器拿到首次返回的 14KB 数据，便能将页面渲染出来。

### 关键渲染路径 (CRP, Critical Rendering Path)

“关键渲染路径是浏览器将 HTML，CSS 和 JavaScript 转换为屏幕上的像素所经历的步骤序列。优化关键渲染路径可提高渲染性能。”

![关键渲染路径](/images/2023-01-17-CRP.png)

关键渲染路径包含五个部分，构建 DOM、构建 CSSOM、构建渲染树、布局、绘制。如果文档有内容绘制在单独的图层中，还会有合成操作。

构建 DOM 环节的产物是 DOM 树。DOM 树的构建过程是流式的，即浏览器边读取 HTML 文档边解析。如果遇到 CSS、图像、字体等会并行的下载和解析，不会阻塞 DOM 树的构建流程。JS 脚本的处理比较特殊，下小节单独说明。

构建 CSSOM 环节的产物是 CSSOM 树。构建 CSSOM 的速度非常快，通常不会成为性能瓶颈。

当浏览器解析出 DOM 和 CSSOM 两个基本的数据结构后，后续操作便是将其绘制到屏幕上。

### JS 脚本的处理

![JS 脚本的加载与执行](/images/2023-01-17-js-script.png)

上图中的箭头表示依赖关系，即箭头尾部的对象依赖箭头头部的对象先完成。如，所有资源都要经历先下载再解析的过程。

如上文所述，HTML 文档是边读取边解析，大部分的资源都是并行下载和执行的，不会阻塞主线程解析构建 DOM 树。

如果在解析过程中遇到 JS 脚本，则浏览器会等待 JS 脚本下载和执行完成后，再继续处理 DOM；而 JS 脚本的执行又会先等待 CSSOM 处理完成。如上图的第一部分。

如果在 script 标签加上 defer 属性。那么，当 DOM 解析时遇到 JS 脚本，浏览器会并行下载 JS 脚本且下载完成后也不会立即执行。当 DOM 已经解析完成，则浏览器会按顺序执行 defer 声明过的 JS 脚本，并在这些脚本执行完成后，发出 DOMContentLoaded 事件。如上图的第二部分。

如果在 script 标签加上 async 属性。则 JS 脚本的表现与其它普通资源的行为一致，遇到时立即下载、下载完立即执行。如上图的第三部分。

上面的描述为理论模型，现代浏览器有预加载扫描器的功能，预加载扫描器可以在后台线程扫描文档，不用等待 DOM 树解析到而提前下载和执行文档中的资源文件。

## DOM 事件流

{% post_link event-dispatch-and-dom-event-flow-translation %}

## 事件循环 (Event Loop)

并发模型与事件循环: https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/EventLoop

众所周知，JavaScript 是单线程语言。如果 JS 执行的时候，网页会卡顿，比如滑动卡顿、点击链接不响应等。但我们实际浏览网页时并不会感到卡顿，这是因为 JS 有事件循环的机制，这种机制能够保证 JS 不会一直占用着线程。

不同的 JS 引擎对事件循环的实现不会完全相同，但我们可以用理论模型来理解。

![the javascript runtime environment example](/images/2023-01-17-the_javascript_runtime_environment_example.svg)

上图中的 Queue 是事件循环机制里最主要的部分。JS 函数调用、网络请求(的回调)等等，这些任务都需要先放到 Queue 里，再以先进先出的顺序执行。（虽说 JS 是单线程的，但并不是说所有的事情都只能在主线程里执行。比如 JS 发起一个网络请求：调用网络请求 API 的代码在主线程中执行，随后浏览器的某个子线程会负责维护这个网络请求直至请求完成，最后，请求回调代码又会回到主线程执行。）

问题：setTimeout 延迟时间设为 0，会不会立即执行？

答：不会。setTimeout 的回调函数会放到事件循环里调度。当延迟时间已到，回调函数被加到 Queue 里，但如果之前还有任务未完成，那么需要先等待之前的任务完成。所以 setTimeout 的延迟时间是 *最小等待时间*，不是 *保证准确的时间*。