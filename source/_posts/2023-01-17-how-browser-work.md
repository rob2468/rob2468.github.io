---
title: 浏览器工作原理
tags:
- Web
---

# {{ page.title }}

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
