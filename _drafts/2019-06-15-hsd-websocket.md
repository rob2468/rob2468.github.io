---
layout: post
title: 为 GCDWebServer 引入 WebSocket 支持
page_id: id-2019-06-15
---

<h1 class="title">{{ page.title }}</h1>

<h2>前言</h2>

<a href="https://github.com/rob2468/HttpServerDebug" target="_blank">HttpServerDebug</a>

<a href="https://github.com/swisspol/GCDWebServer" target="_blank">GCDWebServer</a>

<a href="https://github.com/robbiehanson/CocoaHTTPServer" target="_blank">CocoaHTTPServer</a>

是整合 WebSocket 的一次实践，不包括 WebSocket 的所有方面，如新版本的 WebSochet 协议、加密数据传输等。

<h2>WebSocket 协议</h2>

WebSocket协议是借用HTTP协议的101 switch protocol来达到协议转换的，从HTTP协议切换成WebSocket通信协议。

这个协议是基于Frame而非Stream的，也就是说，数据的传输不是像传统的流式读写一样按字节发送，而是采用一帧一帧的Frame，并且每个Frame都定义了严格的数据结构，因此所有的信息就在这个Frame载体中。（后面会详细介绍这个Frame）

<h2>持有关系</h2>

<h2>建立连接</h2>

<h2>发送信息</h2>

<h2>接收信息</h2>


dispatch_source_t

dispatch_read


<h3>参考文献：</h3>

学习WebSocket协议—从顶层到底层的实现原理（修订版）. <a href="https://github.com/abbshr/abbshr.github.io/issues/22" target="_blank">https://github.com/abbshr/abbshr.github.io/issues/22</a>
