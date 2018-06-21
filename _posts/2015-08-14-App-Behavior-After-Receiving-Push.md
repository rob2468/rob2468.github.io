---
layout: post
title: iOS App 在不同状态下收到 push 通知的行为
page_id: id-2015-08-14
---

# {{ page.title }}

iOS App有多种运行状态，并且可能在任一状态下接收到APNS (Apple Push Notification Service)发送来的push通知；针对一条push通知，用户可能采取不同动作。

为了合理的处理push通知，需要开发者在合适的地方提供处理代码。通过测试，本文总结出iOS App在不同状态下接收到push通知的行为。本文只是简单的总结处理push通知的时机，针对更加复杂的push功能未做调研。

App的状态：1. 未运行；2. 在后台运行；3. 在前台运行。

1. App未运行：

	<pre>
	接收到push通知，系统处理。
		用户忽略或者清除push通知，结束。
		用户打开push通知：App启动，在application:didFinishLaunchingWithOptions:中提供代码处理。
	</pre>

2. App在后台运行：

	<pre>
	接收到push通知，系统处理。
		用户忽略或者清除push通知，结束。
		用户打开push通知：App启动，在application:didReceiveRemoteNotification:中提供代码处理。
	</pre>

3. App在前台运行：

	<pre>
	接收到push通知，App处理。在application:didReceiveRemoteNotification:中提供代码处理。
	</pre>
