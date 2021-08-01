---
layout: post
title: 在 UIScrollView 中使用 Autolayout
page_id: id-2015-10-26
---

# {{ page.title }}

通过为控件设定约束，Autolayout 能够实现控件布局的自适应。当 app 运行时，iOS 根据预先设定的约束布局界面元素。

以约束的方式为控件 A 设定布局，控件 A 的实际布局数据是通过约束的依赖关系计算出来的。比如，控件 A 的 leading 始终和控件 B 的 trailing 相等，则控件 A 的 leading 数据依赖于控件 B 的 trailing 数据。

## 一、问题

当在 UIScrollView 中采用 Autolayout 方式布局时，情况变得有些复杂。UIScrollView 的 contentSize 依赖于其子视图的布局，而其子视图的布局依赖于 UIScrollView 的 contentSize。如图1所示。

<p class="post-image"><img src="/resources/figures/2015-10-26-UIScrollView简单布局依赖示意图.png" alt="UIScrollView简单布局依赖示意图" width="80%"></p>

<p class="post-image-title">图1. UIScrollView 简单布局依赖示意图</p>

图1中箭头代表布局的依赖关系，弧尾依赖弧头。如图所示，ScrollView\_ContentSize 和 ScrollView\_SubviewFrame 互相依赖，iOS 无法计算出控件的布局数据。这种简单的约束设置方案无法满足要求，Xcode 会出现约束无法满足的提醒，如图2所示。

<p class="post-image"><img src="/resources/figures/2015-10-26-xib文件中UIScrollView简单布局.png" alt="xib文件中UIScrollView简单布局" width="80%"></p>

<p class="post-image-title">图2. xib 文件中 UIScrollView 简单布局</p>

## 二、方案

解决 UIScrollView 中的布局问题，关键在于消除图1中所示循环依赖的问题。

ScrollView\_SubviewFrame 对应的是目标控件视图，它的布局可以不依赖 ScrollView\_ContentSize，而是依赖于 ParentViewFrame，如图3所示。

<p class="post-image"><img src="/resources/figures/2015-10-26-UIScrollView布局依赖示意图.png" alt="UIScrollView布局依赖示意图" width="80%"></p>

<p class="post-image-title">图3. UIScrollView 布局依赖示意图</p>

## 三、经验分享

上一节叙述了解决 UIScrollView 中布局问题的解决方案，这一节分享开发经验，如图4所示。图4对应的需求如下，UIScrollView 左右贴边，其中内容仅支持上下滚动，

<p class="post-image"><img src="/resources/figures/2015-10-26-xib文件中UIScrollView布局.png" alt="xib文件中UIScrollView布局" width="80%"></p>

<p class="post-image-title">图4. xib 文件中 UIScrollView 布局</p>

该方法的关键在于添加了一个 ContainerView，ContainerView 为 UIScrolView 的子视图，并且所有原本应该直接添加到 UIScrollView 中的视图现在都添加为 ContainerView 的子视图。

Constraints 1：ContainterView 的上下左右与 UIScrollView 贴边。该约束保证了 UIScrollView 的 ContentSize 即为 ContainterView 的尺寸。

Constraints 2：ContainerView 的左右与 UIScrollView 的父视图贴边。该约束确定了 ContainerView 水平方向的布局，同时也确定了 UIScrollView 中 contentSize 的水平布局。

ContainerView 的子视图根据业务需要，相对于 ContainerView 进行布局。ContainerView 竖直方向的布局根据内容视图的布局确定，同时也确定了 UIScrollView 中 contentSize 的竖直布局。

## 四、Demo

<a href="https://github.com/rob2468/ConstraintsInScrollView" target="_blank">ConstraintsInScrollView</a>

### 参考文献:

"AutoLayout深入浅出三[相遇Scrollview]", <a href="https://grayluo.github.io/WeiFocusIo/autolayout/2015/01/27/autolayout3/" target="_blank">https://grayluo.github.io/WeiFocusIo/autolayout/2015/01/27/autolayout3/</a>
