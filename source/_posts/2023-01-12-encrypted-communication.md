---
title: 加密通信
tags:
- 网络
---

# {{ page.title }}

## OSI 模型

OSI将计算机网络体系结构划分为以下七层，标有1～7，第1层在底部。

### 第7层 应用层
应用层（Application Layer）提供为应用软件而设计的接口，以设置与另一应用软件之间的通信。例如：HTTP、HTTPS、FTP、Telnet、SSH、SMTP、POP3等。

### 第6层 表现层
表现层（Presentation Layer）把数据转换为能与接收者的系统格式兼容并适合传输的格式。

### 第5层 会话层
会话层（Session Layer）负责在数据传输中设置和维护计算机网络中两台计算机之间的通信连接。

### 第4层 传输层
传输层（Transport Layer）把传输表头（TH）加至资料以形成分组。传输表头包含了所使用的协议等发送信息。例如:传输控制协议（TCP）等。

### 第3层 网络层
网络层（Network Layer）决定数据的路径选择和转寄，将网络表头（NH）加至数据包，以形成分组。网络表头包含了网络资料。例如:互联网协议（IP）等。

### 第2层 数据链路层
数据链路层（Data Link Layer）负责网络寻址、错误侦测和改错。当表头和表尾被加至数据包时，会形成信息框（Info Box）。数据链表头（DLH）是包含了物理地址和错误侦测及改错的方法。数据链表尾（DLT）是一串指示数据包末端的字符串。例如以太网、无线局域网（Wi-Fi）和通用分组无线服务（GPRS）等。

分为两个子层：逻辑链路控制（logical link control，LLC）子层和介质访问控制（Media access control，MAC）子层。

### 第1层 物理层

物理层（Physical Layer）在局域网上发送数据帧（Data Frame），它负责管理电脑通信设备和网络媒体之间的互通。包括了针脚、电压、线缆规范、集线器、中继器、网卡、主机接口卡、路由器等。

## 加密通信

我们通过分类的方式，来理解加密通信。

最顶层的分类分为 VPN 和代理。

“VPN 是通过使用专用线路或在现有网络上，使用隧道协议创建一个虚拟的点对点连接而形成的。”VPN 可以用于 IP 层之上的所有协议。

代理仅可被用于通过代理服务器转发 TCP 连接（shadowsocks 支持代理 UDP）。

### VPN

VPN 的定义参考 [维基百科](https://en.wikipedia.org/wiki/Virtual_private_network)。

![VPN classification tree based on the topology first, then on the technology used](/images/2023-01-12-VPN_classification-en.png)

### 代理

常见的代理协议：

[Shadowsocks](https://shadowsocks.org/)，A fast tunnel proxy that helps you bypass firewalls。

[HTTPS](https://en.wikipedia.org/wiki/HTTPS) 最常见的用途是提供 Web 服务，同时它也可用作实现代理协议。

## 总结

* 协议，是为了实现特定目的而人为约定的一种规则，理论上可以有无穷多的协议种类。

* 一个协议通常只解决一个问题，若要解决更复杂的问题，可以组合使用多个协议，这样一组协议称为协议栈。比如，L2TP (Layer Two Tunneling Protocol) 协议自身不提供加密与可靠性验证的功能，可以和安全协议搭配使用，从而实现数据的加密传输。经常与 L2TP 协议搭配的加密协议是 IPsec，当这两个协议搭配使用时，通常合称 L2TP/IPsec。

* 协议是一种约定的规则，需要软件来实现。如，Libreswan 是 Linux 平台上实现 IPsec 功能的一种实现。

* 对于客户端配置，目前在 iPhone 上，*VPN* 相关的协议使用 iOS 系统提供的功能即可完成配置，但是 *代理协议* 需要使用第三方提供的 App 才行。常见的 App 有 Spectre、Shadowrocket 等。在国内受政策限制，此类 App 不允许在 App Store 内上架。

## 参考文档

浅谈vpn、vps、Proxy以及shadowsocks之间的联系和区别: https://blog.sumtruth.me/2018/05/vpnvpsproxyshadowsocks.html?m=1

各种加密代理协议的简单对比: https://blankwonder.medium.com/%E5%90%84%E7%A7%8D%E5%8A%A0%E5%AF%86%E4%BB%A3%E7%90%86%E5%8D%8F%E8%AE%AE%E7%9A%84%E7%AE%80%E5%8D%95%E5%AF%B9%E6%AF%94-1ed52bf7a803

VPN: https://en.wikipedia.org/wiki/Virtual_private_network

OSI模型: https://zh.wikipedia.org/zh-cn/OSI%E6%A8%A1%E5%9E%8B

trojan ("Trojan is not a fixed program or protocol. It's an idea, an idea that imitating the most common service, to an extent that it behaves identically, could help you get across the Great FireWall permanently, without being identified ever."): https://github.com/trojan-gfw/trojan
