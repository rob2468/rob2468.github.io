---
layout: post
title: 美国住宅IP&Claude注册-从原理到实操
tags:
  - AI
  - 网络
---

# {{ page.title }}

如何配置美国住宅 IP 代理、注册 Claude。

<!-- more -->

## 网络配置

### 原理

Shadowrocket 工作在网络层。它接管**默认路由**和**系统 DNS**：

```plain
路由表（Shadowrocket 启动后）：
0.0.0.0/0        → utun_shadow  ← Shadowrocket 的默认路由（接管所有流量）

DNS：
系统 DNS: 198.18.0.2            ← Shadowrocket 劫持 DNS
```

Shadowrocket 支持复杂的规则配置，核心是 DNS 劫持与假 IP 机制。

+ DNS 劫持与假 IP 机制

Shadowrocket 将系统 DNS 改为 `198.18.0.2`，所有域名被解析为 `198.18.0.x`（RFC 2544 保留段）。

+ 为什么要解析为假 IP？

Shadowrocket 内部维护一张假 IP 与域名之间的映射表，如 `198.18.0.18 ↔ www.google.com`。当 IP 包经过时，通过假 IP 反查原始域名，实现 IP 层到域名层的规则匹配。

```plain
DOMAIN-SUFFIX,google.com,PROXY
DOMAIN-SUFFIX,baidu.com,DIRECT
```

+ 例子：走代理

```plain
规则配置：

DOMAIN-SUFFIX,google.com,PROXY

完整链路：

1. 浏览器请求 DNS → Shadowrocket 拦截
   → 分配假 IP: 198.18.0.5
   → 内部记下: 198.18.0.5 ↔ google.com

2. 浏览器连接 198.18.0.5:443
   → Shadowrocket TUN 捕获
   → 根据假 IP 查到原始域名 google.com

3. 规则匹配 → google.com → PROXY
   → SOCKS5 协议发送: CONNECT google.com:443
   → 发给代理服务器

4. ★ 代理服务器收到 "google.com:443"
   → 代理服务器的网络环境中做 DNS 解析 → 142.250.x.x
   → 连接真实 IP → 访问 Google ★
```

+ 例子：直连

```plain
规则配置：

DOMAIN-SUFFIX,baidu.com,DIRECT

完整链路：

1. 浏览器请求 DNS → Shadowrocket 拦截
   → 分配假 IP: 198.18.0.6
   → 内部记下: 198.18.0.6 ↔ baidu.com

2. 浏览器连接 198.18.0.6:443
   → Shadowrocket TUN 捕获
   → 根据假 IP 查到原始域名 baidu.com

3. 规则匹配 → baidu.com → DIRECT
   → 本机自己做 DNS 解析 → 110.242.68.66
   → 从本机 VPN 扩展进程直连 110.242.68.66:443
```

### 实操

#### 购买美国住宅网络代理

https://www.vircs.com/

![](/images/2026-06-21-vircs住宅代理介绍.png)

![](/images/2026-06-21-vircs设备机柜.png)

+ 购买“高速代理”方案

支持支付宝支付。

![](/images/2026-06-21-vircs套餐价格.png)

+ 购买后的控制台

![](/images/2026-06-21-vircs控制台.png)

+ 两个方案的区别：

“高速代理”需要自行中转：本地 → <u>普通代理</u> → 住宅代理。也就是说你需要自己额外准备一个前置代理节点做中转。

“专线隧道”自带流量中转：本地 → 住宅代理。开箱即用，无需自备中转。

#### Apple 账户礼品卡充值

购买代理软件（Shadowrocket）、Claude 服务都通过 Apple 支付完成，需要为 Apple 账户充值，最方便的方式是礼品卡。

+ 前提：有一个美区 Apple ID

+ 在支付宝里购买美区 Apple 礼品卡

![](/images/2026-06-21-支付宝礼品卡入口.png?width=50%)

![](/images/2026-06-21-支付宝搜索惠出境.png?width=50%)

![](/images/2026-06-21-惠出境礼品卡专区.png?width=50%)

![](/images/2026-06-21-pockyt礼品卡分类.png?width=50%)

![](/images/2026-06-21-pockyt购买苹果礼品卡.png?width=50%)

+ 在 App Store / 设置里核销礼品卡

![](/images/2026-06-21-pockyt确认购买苹果礼品卡.png?width=50%)

![](/images/2026-06-21-苹果账户兑换礼品卡.png?width=50%)

#### 购买 Shadowrocket

+ 价格 $2.99
+ 用 Apple 账户余额支付

![](/images/2026-06-21-shadowrocket商店页.png)

#### Shadowrocket 配置

参考：https://www.youtube.com/watch?v=yGgq0sB9HeA

本文描述的网络配置过程有点简化：因为购买了 vircs 的“高速代理”服务，需要自己进行流量中转。

参考视频中有教程，讲述了如何购买机场代理服务完成中转。

如果公司里日常有代理服务，比如代理到国外某个机房，可以通过配置 Shadowrocket，让流量先经过公司代理再转发到住宅 IP，省掉了买机场代理的钱。

#### 网络出口检测

https://ping0.cc/

![](/images/2026-06-21-ping0出口检测.png)

## Claude 注册

参考教程：https://www.youtube.com/watch?v=OGEjsgYHHb4

## Claude 购买

![](/images/2026-06-21-claude购买成功.png?width=50%)

## 其它

+ 检测 IP 出口：[https://ping0.cc/](https://ping0.cc/)
+ 住宅 IP 教程：[https://www.youtube.com/watch?v=yGgq0sB9HeA](https://www.youtube.com/watch?v=yGgq0sB9HeA)
+ Claude 注册教程：[https://www.youtube.com/watch?v=OGEjsgYHHb4](https://www.youtube.com/watch?v=OGEjsgYHHb4)
