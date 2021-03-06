---
layout: post
title: 事件分发和 DOM 事件流（译）
page_id: id-2018-06-19
---

# {{ page.title }}

原文链接，<a href="https://www.w3.org/TR/uievents/#event-flow" target="_blank">Event dispatch and DOM event flow</a>。

本文讲述事件分发机制和事件在 DOM 树上的传播行为。Web 应用使用 `dispatchEvent()` 方法分发事件对象，事件对象遵循 DOM 事件流，在 DOM 树上传播。

<p class="post-image"><img src="/resources/figures/2018-06-19-eventflow.svg" alt="eventflow" width="90%"></p>

<p class="post-image-title">事件分发示意图</p>

事件对象会被分发给事件目标（event target），事件目标是指最终被选中的响应事件的对象，可以从事件的 `target` 属性获取。

在事件分发开始之前，事件对象的传播路径（propagation path）必须首先确定下来。

传播路径（propagation path）是一个由当前事件目标（current event targets）组成的有序列表，事件会依次经过这些事件目标。当前事件目标可能是事件目标本身（event target），或者事件目标的祖先节点。事件不断传播时，当前事件目标也在不断发生改变。当前事件目标可以从事件的 `currentTarget` 属性获取。

传播路径列表中的最后一个条目即为事件目标。传播路径还反映了文档的分层树状结构。在事件目标之前的条目被称为祖先，紧接着事件目标之前的条目被称为父亲。

传播路径确定下来后，事件在传播的过程中会经过一个或多个阶段。事件阶段一共有三个：捕获阶段（capture phase）、目标阶段（target phase）、冒泡阶段（bubble phase）。如果事件不支持某个阶段，或者事件传播被阻止，那么这个阶段会被跳过。比如，如果事件的 `bubbles` 属性被设为 `false`，那么冒泡阶段会被跳过。如果事件的 `stopPropagation()` 方法在分发之前被调用，那么所有的阶段都会被跳过。

捕获阶段（capture phase）：在这个阶段，事件对象沿着事件目标的祖先节点传播，从 `window` 到事件目标的父节点。

目标阶段（target phase）：这个阶段也被称为 `at-target phase`，表明事件对象到达了事件目标。如果事件表明不再进行冒泡，那么事件对象在完成该阶段后便停止传播。

冒泡阶段（bubble phase）：在这个阶段，事件对象沿着事件目标的祖先节点逆向传播，从事件目标的父节点到 `window`。
