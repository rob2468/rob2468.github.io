---
layout: post
title: JSPatch代码分析
---

# {{ page.title }}

"[JSPatch](https://github.com/bang590/JSPatch) 是一个 iOS 动态更新框架，只需在项目中引入极小的引擎，就可以使用 JavaScript 调用任何 Objective-C 原生接口，获得脚本语言的优势：为项目动态添加模块，或替换项目原生代码动态修复 bug。"

JSPatch的实现原理可参考原作者(bang590)的相关文章。本文给出JSPatch部分代码分析纪录。

## 消息传递




### 参考文献:

"Message Forwarding", [https://developer.apple.com/library/mac/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Articles/ocrtForwarding.html](https://developer.apple.com/library/mac/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Articles/ocrtForwarding.html)

{{ page.date | date_to_string }}
