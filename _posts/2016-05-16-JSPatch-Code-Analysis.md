---
layout: post
title: JSPatch代码分析
---

# {{ page.title }}

"[JSPatch](https://github.com/bang590/JSPatch) 是一个 iOS 动态更新框架，只需在项目中引入极小的引擎，就可以使用 JavaScript 调用任何 Objective-C 原生接口，获得脚本语言的优势：为项目动态添加模块，或替换项目原生代码动态修复 bug。"

JSPatch 的实现原理可参考原作者(bang590)的相关文章。本文给出 JSPatch 部分代码分析纪录。

## 消息转发

objc_msgSend 函数的重要工作是根据某个方法的 selector 找到相应的方法实现(IMP)。IMP 类型即为函数指针。

_objc_msgForward 是 IMP 类型，当 objc_msgSend 未找到某个 selector 的 IMP，会使用该 IMP 替代。_objc_msgForward 会做消息转发的工作。

_objc_msgForward 消息转发会调用如下的方法，详细解释参考[此文](http://mxxivapp.com/2015/09/22/%E6%8B%9B%E8%81%98%E4%B8%80%E4%B8%AA%E9%9D%A0%E8%B0%B1%E7%9A%84%20iOS%E7%AD%94%E6%A1%88%E4%B8%8B/#objc_msgForward_u51FD_u6570_u662F_u505A_u4EC0_u4E48_u7684_uFF0C_u76F4_u63A5_u8C03_u7528_u5B83_u5C06_u4F1A_u53D1_u751F_u4EC0_u4E48_uFF1F)。

    + (BOOL)resolveInstanceMethod:(SEL)name; / + (BOOL)resolveClassMethod:(SEL)name;
    - (id)forwardingTargetForSelector:(SEL)aSelector;
    - (NSMethodSignature *)methodSignatureForSelector:(SEL)aSelector;
    - (void)forwardInvocation:(NSInvocation *)anInvocation;
    - (void)doesNotRecognizeSelector:(SEL)aSelector;

## 问题发现与解释

在项目中引入了 JSPatch，利用其能力实现了不少针对app线上问题的热修复。在使用过程中发现一些问题，并做了调研。

### 1. 在OC中使用快速遍历访问NSArray中的元素，转换为JS后，快速遍历无法得到数组元素。

JSPatch对OC中的数组、字典、字符串进行了封装，在JS中被封装成JPBoxing对象，而不是原生的JS数组、字典、字符串。这种处理使得对应的数据对象在OC和JS之间传输时，仍能保持其在OC中的特性。具体原因见[JSPatch-实现原理详解-jpboxing](https://github.com/bang590/JSPatch/wiki/JSPatch-%E5%AE%9E%E7%8E%B0%E5%8E%9F%E7%90%86%E8%AF%A6%E8%A7%A3#4jpboxing)。因此，在JS中快速遍历时，访问的是相应的JPBoxing对象的可枚举属性。

JS中的数组JPBoxing对象可调用方法toJS()，获取相应的原生JS数组。但此时快速遍历的元素是JS数组的下标，不同于OC中的快速遍历，仍然需要额外的操作才能获得数组元素。

JS中快速遍历的顺序依赖于具体实现，不能保证永远按照索引顺序访问。因此最好使用for(;;)语法访问数组。

### 参考文献:

"Message Forwarding", [https://developer.apple.com/library/mac/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Articles/ocrtForwarding.html](https://developer.apple.com/library/mac/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Articles/ocrtForwarding.html)

"NSObject Class Reference", [https://developer.apple.com/library/watchos/documentation/Cocoa/Reference/Foundation/Classes/NSObject_Class/#//apple_ref/occ/clm/NSObject/resolveClassMethod:](https://developer.apple.com/library/watchos/documentation/Cocoa/Reference/Foundation/Classes/NSObject_Class/#//apple_ref/occ/clm/NSObject/resolveClassMethod:)

{{ page.date | date_to_string }}
