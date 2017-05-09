---
layout: post
title: 在UIScrollView中使用Autolayout
id: id-2015-10-26
---

# {{ page.title }}

通过为控件设定约束，Autolayout能够实现控件布局的自适应。当app运行时，iOS根据预先设定的约束布局界面元素。

以约束的方式为控件A设定布局，控件A的实际布局数据是通过约束的依赖关系计算出来的。比如，控件A的leading始终和控件B的trailing相等，则控件A的leading数据依赖于控件B的trailing数据。

## 一、问题

当在UIScrollView中采用Autolayout方式布局时，情况变得有些复杂。UIScrollView的contentSize依赖于其子视图的布局，而其子视图的布局依赖于UIScrollView的contentSize。如图1所示。

<div align="center"><img src="http://7xilqo.com1.z0.glb.clouddn.com/2015-10-26-UIScrollView简单布局依赖示意图.png" alt="UIScrollView简单布局依赖示意图" width="80%"/></div>

<div align="center">图1. UIScrollView简单布局依赖示意图</div>

图1中箭头代表布局的依赖关系，弧尾依赖弧头。如图所示，ScrollView\_ContentSize和ScrollView\_SubviewFrame互相依赖，iOS无法计算出控件的布局数据。这种简单的约束设置方案无法满足要求，Xcode会出现约束无法满足的提醒，如图2所示。

<div align="center"><img src="http://7xilqo.com1.z0.glb.clouddn.com/2015-10-26-xib文件中UIScrollView简单布局.png" alt="xib文件中UIScrollView简单布局" width="80%"/></div>

<div align="center">图2. xib文件中UIScrollView简单布局</div>

## 二、方案

解决UIScrollView中的布局问题，关键在于消除图1中所示循环依赖的问题。

ScrollView\_SubviewFrame对应的是目标控件视图，它的布局可以不依赖ScrollView\_ContentSize，而是依赖于ParentViewFrame，如图3所示。

<div align="center"><img src="http://7xilqo.com1.z0.glb.clouddn.com/2015-10-26-UIScrollView布局依赖示意图.png" alt="UIScrollView布局依赖示意图" width="80%"/></div>

<div align="center">图3. UIScrollView布局依赖示意图</div>

## 三、经验分享

上一节叙述了解决UIScrollView中布局问题的解决方案，这一节分享开发经验，如图4所示。图4对应的需求如下，UIScrollView左右贴边，其中内容仅支持上下滚动，

<div align="center"><img src="http://7xilqo.com1.z0.glb.clouddn.com/2015-10-26-xib文件中UIScrollView布局.png" alt="xib文件中UIScrollView布局" width="80%"/></div>

<div align="center">图4. xib文件中UIScrollView布局</div>

该方法的关键在于添加了一个ContainerView，ContainerView为UIScrolView的子视图，并且所有原本应该直接添加到UIScrollView中的视图现在都添加为ContainerView的子视图。

Constraints 1：ContainterView的上下左右与UIScrollView贴边。该约束保证了UIScrollView的ContentSize即为ContainterView的尺寸。

Constraints 2：ContainerView的左右与UIScrollView的父视图贴边。该约束确定了ContainerView水平方向的布局，同时也确定了UIScrollView中contentSize的水平布局。

ContainerView的子视图根据业务需要，相对于ContainerView进行布局。ContainerView竖直方向的布局根据内容视图的布局确定，同时也确定了UIScrollView中contentSize的竖直布局。

## 四、Demo

[ConstraintsInScrollView](https://github.com/rob2468/ConstraintsInScrollView)

### 参考文献:

"AutoLayout深入浅出三[相遇Scrollview]", [https://grayluo.github.io/WeiFocusIo/autolayout/2015/01/27/autolayout3/](https://grayluo.github.io/WeiFocusIo/autolayout/2015/01/27/autolayout3/)

{{ page.date | date_to_string }}
