---
layout: post
title: 事件分发和 DOM 事件流
page_id: id-2018-06-19
---

# {{ page.title }}

原文链接，<a href="https://www.w3.org/TR/uievents/#event-flow" target="_blank">Event dispatch and DOM event flow</a>。

本文讲述事件分发机制和事件在 DOM 树上的传播方式。Web 应用使用 `dispatchEvent()` 方法分发事件对象，事件对象遵循 DOM 事件流，在 DOM 树上传播。

<div align="center"><img src="http://7xilqo.com1.z0.glb.clouddn.com/2018-06-19-eventflow.svg" alt="eventflow" width="70%" /></div>

<p align="center">事件分发示意图</p>

事件对象会被分发给事件目标（event target），事件目标是最终被选中的响应事件的对象，可以从事件的 `target` 属性获取。

在事件分发开始之前，事件对象的传播路径（propagation path）必须首先确定下来。

传播路径（propagation path）是一个由当前事件目标（current event targets）组成的有序列表，事件会依次经过这些事件目标。当前事件目标可能是事件目标本身（event target），或者事件目标的祖先节点。事件不断传播时，当前事件目标也在不断发生改变。当前事件目标可以从事件的 `currentTarget` 属性获取。

传播路径列表中的最后一个条目即为事件目标。传播路径还反映了文档的分层树状结构。在事件目标之前的条目被称为祖先，紧接着事件目标之前的条目被称为父亲。

传播路径确定下来后，事件在传播的过程中会经过一个或多个阶段。事件阶段一共有三个：捕获阶段（capture phase）、目标阶段（target phase）、冒泡阶段（bubble phase）。如果事件不支持某个阶段，或者事件传播被阻止，那么这个阶段会被跳过。比如，如果事件的 `bubbles` 属性被设为 `false`，那么冒泡阶段会被跳过。如果事件的 `stopPropagation()` 方法在分发之前被调用，那么所有的阶段都会被跳过。



The capture phase: The event object propagates through the target’s ancestors from the Window to the target’s parent. This phase is also known as the capturing phase.

The target phase: The event object arrives at the event object’s event target. This phase is also known as the at-target phase. If the event type indicates that the event doesn’t bubble, then the event object will halt after completion of this phase.

The bubble phase: The event object propagates through the target’s ancestors in reverse order, starting with the target’s parent and ending with the Window. This phase is also known as the bubbling phase.

{{ page.date | date_to_string }}
