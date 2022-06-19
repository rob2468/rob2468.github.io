---
layout: post
title: Head Tab View
page_id: id-2015-11-02
---

# {{ page.title }}

源代码：[BDPhoneHeadTabView](https://github.com/rob2468/HeadTabView)

<!-- more -->

截图：如图1所示

<!-- <p class="post-image"><img src="/resources/figures/2015-11-02-HeadTabView_Screenshot.png" alt="" width="30%"/></p> -->

![](/images/2015-11-02-HeadTabView_Screenshot.png)

<p class="post-image-title">图1. 效果截图</p>

## 一、前言

在开发iOS百度浏览器时，有若干视图需要使用Head Tab View，因此Head Tab View作为一个独立的模块隔离开来。之前的Head Tab View采用了修改frame的方式实现布局。考虑到目前浏览器最低支持iOS 7.0，并且修改frame实现布局的方式不太优雅，因此在浏览器最新版重写了Head Tab View，使用autolayout方式实现布局。

## 二、代码结构

Head Tab View的整体结构如图2所示。

<!-- <p class="post-image"><img src="/resources/figures/2015-11-02-HeadTabView的代码整体结构.png" alt="HeadTabView的代码整体结构" width="80%"/></p> -->

![](/images/2015-11-02-HeadTabView的代码整体结构.png)

<p class="post-image-title">图2. HeadTabView的代码整体结构</p>

图2中圆角矩形表示各个模块，有向箭头表示数据通信，数据从弧尾流向弧头。Head Tab View的设计遵循MVC。外部只与BDPhoneHeadTabViewController实例打交道，从BDPhoneHeadTabViewController实例读取Head Tab View的信息，通过BDPhoneHeadTabViewController实例修改Head Tab View。

## 三、视图层次

在源代码中，BDPhoneHeadTabView表示Head Tab View的视图，其视图层次结构如图3所示。

<!-- <p class="post-image"><img src="/resources/figures/2015-11-02-BDPhoneHeadTabView的视图层次.png" alt="BDPhoneHeadTabView的视图层次" width="80%"/></p> -->

![](/images/2015-11-02-BDPhoneHeadTabView的视图层次.png)

<p class="post-image-title">图3. BDPhoneHeadTabView的视图层次</p>
