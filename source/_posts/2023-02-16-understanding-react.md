---
title: React 实现原理之异步渲染
tags:
- React
---

# {{ page.title }}

React 从 v16 开始逐步引入异步可中断的渲染架构。

React 渲染过程可以分为三个阶段 Scheduling、Reconciliation、Commit。

Scheduling 阶段执行任务调度，Reconciliation 阶段更新虚拟 DOM，本文主要讲述这两个阶段。(Commit 阶段更新 UI。e.g. 在浏览器环境中更新 DOM、在移动端环境中更新 Native 视图。)

本文基于目前最新的 [React v18.2.0](https://github.com/facebook/react/tree/v18.2.0) 代码。

<!-- more -->

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

任务队列使用小顶堆保存。排序的值是上文任务模型中的 sortIndex 字段。

{% codeblock lang:js %}
// Tasks are stored on a min heap
var timerQueue = [];
var taskQueue = [];
{% endcodeblock %}

有两个队列，timerQueue 和 taskQueue。

可以延迟执行的任务，放在 timerQueue 里，任务的 sortIndex 为任务开始时间，即越早开始的任务排在队列的前面。非延迟执行的任务，放在 taskQueue 里，任务的 sortIndex 为任务结束时间，即越早结束的任务排在队列的前面。

taskQueue 中的任务才会真正被执行。timerQueue 中的任务等到延迟时间结束后，会先被加到 taskQueue 中，然后再被调度执行。

### 小结

taskQueue 中的任务被取出后，会放到浏览器的事件队列中，然后由浏览器的 {% post_link how-browser-work 事件循环机制 %}  进行调度。最简化的方案是设置一个时长为 0 的 setTimeout 调用，即 `setTimeout(任务, 0)` 。

下面代码示例描述了调度是如何执行的。

{% codeblock lang:js %}
function performWorkUntilDeadline() {
  let hasMoreWork = scheduledHostCallback();
  if (hasMoreWork) {
    schedulePerformWorkUntilDeadline();
  }
}
// 调度任务
function schedulePerformWorkUntilDeadline() {
  setTimeout(performWorkUntilDeadline, 0);
}
{% endcodeblock %}

`scheduledHostCallback()` 内实现了一个 workloop，持续执行任务队列中的任务。workloop 中有中断机制，详见下文。

## Reconciliation

源代码：[react-reconciler](https://github.com/facebook/react/tree/v18.2.0/packages/react-reconciler)

Reconciliation 阶段更新虚拟 DOM。本小节主要讲述 Fiber 架构和 DOM Diff 算法。

Fiber 架构可以参考 [React Fiber Architecture](https://github.com/acdlite/react-fiber-architecture) 这篇文章。简单来说，一个 Fiber 实例，是虚拟 DOM 中的一个节点，也是一个普通的 js 对象。在 [React 源代码](https://github.com/facebook/react/blob/v18.2.0/packages/react-reconciler/src/ReactInternalTypes.js#L67) 这个对象的类型命名为 Fiber，所以这套架构也被称为 Fiber 架构。

### Fiber

#### Stack VS Fiber

DOM 是一个树状结构，使用递归算法可以很容易的完成树的遍历，这种方式称为 Stack。在 Fiber 架构之前，React 便是采用的这种方式。Stack 方式的缺点是不够灵活，处理过程无法中断，性能较差。

Fiber 架构则重新设计了一套数据结构。

#### 数据结构

* 节点数据结构

{% codeblock lang:ts %}
interface Fiber {
  type: any;
  return: Fiber | null,
  child: Fiber | null,
  sibling: Fiber | null,
  /* 其它属性 */
}
{% endcodeblock %}

[React 源代码](https://github.com/facebook/react/blob/v18.2.0/packages/react-reconciler/src/ReactInternalTypes.js#L67)

* 节点之间的数据结构

下面左图是一个 Fiber 树示例，以及每个 Fiber 节点 return/child/sibling 属性的值。return 指向当前节点的父亲节点，child 指向当前节点的第一个孩子节点，sibling 指向当前节点的兄弟节点。

下面右图是对应示例的节点遍历的顺序。算法是先处理 child 再处理 sibling，当最后没有可处理节点时，则 Fiber 树全部处理完成。

这种处理将树结构转换成了链表结构，并通过 workInProgress 指针完成链表的遍历。workInProgress 即为当前正在处理的节点。

![Fiber结构](/images/2023-02-16-Fiber数据结构.png)

### DOM Diff

DOM Diff 算法可参考 [React 官方文档](https://reactjs.org/docs/reconciliation.html)。目前性能最好的通用算法的时间复杂度为 [O(n^3)](https://grfia.dlsi.ua.es/ml/algorithms/references/editsurvey_bille.pdf)，React 采用了一种经验算法，其时间复杂度能够降到 O(n)。这个经验算法基于以下两个假设：

1. 如果节点类型不同，则认为是两棵不同的树。比如： `<div>hello world</div>` vs `<p>hello world</p>`，类型分别是 div 和 p。

2. 开发者可以用 `key` 属性来标识一个组件。

[Preserving and Resetting State](https://beta.reactjs.org/learn/preserving-and-resetting-state) 这篇文章提供了许多生动的案例。

## 异步可中断的实现

异步可中断需要具备两项能力。

1. 如果执行时长超过阈值，能够中断执行。

2. 如果浏览器空闲，能够从中断的地方恢复执行。

### 中断

Scheduling 阶段与 Reconciliation 阶段各有一个 workloop。

[Scheduling 阶段的 workloop](https://github.com/facebook/react/blob/v18.2.0/packages/scheduler/src/forks/Scheduler.js#L199) 处理的是 taskQueue 中的任务。[Reconciliation 阶段的 workloop](https://github.com/facebook/react/blob/v18.2.0/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L1831) 处理的是 Fiber 树中的节点。它们在各自 workloop 的开头，都会检查当前已经执行的时长，若时长超过阈值，则会中断执行。

![](/images/2023-02-16-中断.png)

(上图 ReactFiberWorkLoop.new.js 中的 `shouldYield` 也是从 Scheduler.js import 而来，与 `shouldYieldToHost` 是同一个函数。)

### 恢复

Scheduling 阶段的任务使用小顶堆保存，恢复后从堆顶获取任务执行。

Reconciliation 阶段的 Fiber 树为链表结构，workInProgress 指针指向当前正在处理的节点，恢复后则从 workInProgress 节点继续执行。

## Commit

Commit 阶段才会真正将虚拟 DOM 的变更更新到视图上，且这一阶段的执行是不可中断的。

### 双缓冲

Reconciliation 阶段的任务是更新虚拟 DOM，即不断处理 workInProgress 指向的节点。Reconciliation 开始时，会从当前根节点复制出一个新节点 workInProgress，然后从这个新节点开始遍历。Reconciliation 全部完成后，workInProgress 会指向一棵新的 DOM 树的根节点。

在 Commit 阶段，React 会将虚拟 DOM 的根节点指向 workInProgress，即指向新的 DOM 树。随后，基于新的 DOM 树更新视图：在 web 环境中更新 DOM、在 ReactNative 环境中更新 Native 视图。

{% codeblock lang:ts %}
function commitRootImpl(
  root: FiberRoot,
) {
  // 节点切换 (finishedWork 为 workInProgress)
  root.current = finishedWork;
  // 更新 UI
  Scheduler.requestPaint();
}
{% endcodeblock %}

## 总结

React 的实现原理有许多主题，本文主要讲述其异步可中断的能力是如何实现的，包括：任务设计、Fiber 数据结构、DOM Diff 算法、双缓冲机制。

## 参考文档

[React v18.2.0](https://github.com/facebook/react/tree/v18.2.0)

[React Fiber Architecture](https://github.com/acdlite/react-fiber-architecture)

[Reconciliation](https://reactjs.org/docs/reconciliation.html)

[Preserving and Resetting State](https://beta.reactjs.org/learn/preserving-and-resetting-state)
