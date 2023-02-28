---
title: React 实现原理之异步渲染
tags:
- React
---

# {{ page.title }}

React 从 v16 开始逐步引入异步可中断的渲染架构。

React 渲染过程可以分为三个阶段 Scheduling、Reconciliation、Commit。

Scheduling 阶段执行任务调度；Reconciliation 阶段更新虚拟 DOM，本文主要讲述这两个阶段。(Commit 阶段更新 UI。e.g. 在浏览器环境中更新 DOM、在移动端环境中更新 Native 视图。)

本文基于目前最新的 [React v18.2.0](https://github.com/facebook/react/tree/v18.2.0) 代码。

## Scheduling

Scheduling 阶段执行调度操作，调度的对象是任务。该模块在 React 中的命名为 [scheduler](https://github.com/facebook/react/tree/v18.2.0/packages/scheduler)。虽然 scheduler 目前仅在 React 内部使用，但是它的设计目标是成为一个通用的解决方案。

### 任务的数据结构

任务的数据结构如下所示，其中关键字段是 callback。对于外部来说，你传递给 scheduler 的函数即等同于一个任务，scheduler 会适时调用这个函数。[相关 React 代码](https://github.com/facebook/react/blob/v18.2.0/packages/scheduler/src/forks/Scheduler.js#L345)

{% codeblock lang:js%}
{
  callback: Function;
  priorityLevel: number; // 任务优先级
  sortIndex: number; // 用于构造小顶堆
}
{% endcodeblock %}

### 任务队列

小顶堆

// Tasks are stored on a min heap
var timerQueue = [];
var taskQueue = [];

有两个队列。可以延迟执行的任务，放在 timerQueue 里，任务的 sortIndex 为任务开始时间，即越早开始的任务排在队列的前面。不是延迟执行的任务，放在 taskQueue 里，任务的 sortIndex 为任务结束时间，即越早结束的任务排在队列的前面。

taskQueue 中的任务才会真正被执行。timerQueue 中的任务等到延迟时间结束后，会先被加到 taskQueue 中，然后再被调度执行。

### 小结

taskQueue 中的任务被取出后，会放到浏览器的事件队列中，然后由浏览器的 {% post_link how-browser-work 事件循环机制 %}  进行调度。最简化的方案是设置一个时长为 0 的 setTimeout 调用。`setTimeout(任务, 0);`

下面代码示例描述了调度是如何执行的。

{% codeblock lang:js %}
function performWorkUntilDeadline() {
  let hasMoreWork = scheduledHostCallback(); // 执行任务
  if (hasMoreWork) {
    schedulePerformWorkUntilDeadline();
  }
}
function schedulePerformWorkUntilDeadline() {
  setTimeout(performWorkUntilDeadline, 0);
}
{% endcodeblock %}

代码 [scheduler](https://github.com/facebook/react/tree/v18.2.0/packages/scheduler)


## Reconciliation

### fiber 的数据结构

#### 节点的数据结构

{
  type: any;
}

#### 节点之间的数据结构

链表

### Diff 算法

https://reactjs.org/docs/reconciliation.html

经验算法

### 小结

代码 [react-reconciler](https://github.com/facebook/react/tree/v18.2.0/packages/react-reconciler)


## 异步可中断的实现

react-reconciler 和 scheduler 是为了解决不同的问题，且不是为对方专用而设计的

全局变量指针

如何中断的：
shouldYield

如何恢复的：

上文已经讲到了。

任务(函数)执行中断后会返回一个 hasMoreWork 的布尔值，若 hasMoreWork 为 true，则会将任务加入到浏览器的事件循环队列中。

    // `hasMoreWork` will remain true, and we'll continue the work loop.
    let hasMoreWork = true;
    try {
      hasMoreWork = scheduledHostCallback(hasTimeRemaining, currentTime);
    } finally {
      if (hasMoreWork) {
        // If there's more work, schedule the next message event at the end
        // of the preceding one.
        schedulePerformWorkUntilDeadline();
      } else {


## 总结

[Commit](https://github.com/facebook/react/tree/v18.2.0/packages/react-dom)

React 渲染的三个阶段： Schedule、Render、Commit

未覆盖所有特性

## 参考文档

[React Fiber Architecture](https://github.com/acdlite/react-fiber-architecture)
