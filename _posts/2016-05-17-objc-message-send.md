---
layout: post
title: Objective-C 消息传递
page_id: id-2016-05-17
---

# {{ page.title }}

OC 为动态运行时语言，其将许多决策从编译和链接时延迟到运行时执行。OC 中的方法调用本质为消息传递，[receiver message] 可以解释为向 receiver 对象发送 message 消息。今天阅读了 Apple 开发文档的 [Messaging 章节](https://developer.apple.com/library/mac/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Articles/ocrtHowMessagingWorks.html#//apple_ref/doc/uid/TP40008048-CH104-SW1])，利用运行时系统提供的相关方法，OC 消息传递式的方法调用最终转换成了标准 C 语言函数调用方式，实现了统一。

本文以 Apple 开发文档为基础，讲述 OC 以消息传递方式实现方法调用的执行流程。第一节介绍执行消息解析的函数；第二节讲述消息解析过程中，消息对应的方法实现是如何寻找的；第三节讲述方法实现找到后，如何执行。

## 一、objc_msgSend 函数

[objc_msgSend](https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/index.html#//apple_ref/c/func/objc_msgSend) 为 OC 运行时系统提供的函数。

<p></p>

<div class="code"><pre><code>Declaration
id objc_msgSend(id self, SEL op, ...)

Parameters
self
A pointer that points to the instance of the class that is to receive the message.
op
The selector of the method that handles the message.
...
A variable argument list containing the arguments to the method.

Return Value
The return value of the method.
</code></pre></div>

编译后，OC 中的消息传递实现将转换为 objc_msgSend 函数调用。比如，[receiver message] 会转换成相应的 objc_msgSend(receiver, selector)。selector 的类型是 SEL，为要执行方法的名称，objc_msgSend 的重要工作就是找到 selector 对应的方法实现。

## 二、寻找方法实现

上节说到 selector 为要执行方法的名称，但是真正的方法实现还需进一步寻找。

OC 类结构体中有两个属性：指向父类的指针；分发表（dispatch table）。

分发表中保存的是方法名和相应的方法实现的对应关系。若已取得某个方法的方法名，查询分发表即可获得相应的方法实现。

如果在分发表中未找到某个方法的实现，通过 OC 类结构体中的指向父类的指针获取到父类的分发表，在父类的分发表中寻找。若未找到，再获取父类的父类，以此类推，直到找到为止。

如果执行完所有的查找操作后，仍未找到，运行时系统会继续转发消息，最终调用到 forwardInvocation。具体参考[上一篇博客](http://rob2468.github.io/2016/05/16/JSPatch-Code-Analysis.html)。

此外，运行时系统为寻找方法实现提供了缓存机制，如果缓存命中，就直接从缓存中取方法实现。

## 三、方法执行

objc_msgSend 获取到方法实现后，便调用该方法实现。该方法实现为普通 C 函数，objc_msgSend 会传入所需的参数。传递的参数除了最初发送消息时传入的参数，还有两个隐藏参数，分别是接收消息的对象和相应的 selector。

下面的代码片段说明了如何主动调用消息传递解析后的函数。

<div class="code"><pre><code>void (*setter)(id, SEL, BOOL);
setter = (void (*)(id, SEL, BOOL))[target methodForSelector:@selector(setFilled:)];
setter(target, @selector(setFilled:), YES);
</code></pre></div>

objc_msgSend 自动调用函数时，会自动传如两个隐藏参数，但是主动调用需要显式的传入。

主动调用函数能够节省消息传递与解析的时间，比如上面的代码段在如下的一个 for 循环中。

<div class="code"><pre><code>void (*setter)(id, SEL, BOOL);
setter = (void (*)(id, SEL, BOOL))[target methodForSelector:@selector(setFilled:)];
for (int i = 0 ; i < 1000 ; i++ )
    setter(targetList[i], @selector(setFilled:), YES);
</code></pre></div>

附 methodForSelector: 方法的[说明](https://developer.apple.com/documentation/objectivec/nsobject/1418863-methodforselector?language=objc)：

<p></p>

<div class="code"><pre><code>Locates and returns the address of the receiver’s implementation of a method so it can be called as a function.

Declaration
- (IMP)methodForSelector:(SEL)aSelector;

Parameters
aSelector
A Selector that identifies the method for which to return the implementation address. The selector must be a valid and non-NULL. If in doubt, use the respondsToSelector: method to check before passing the selector to methodForSelector:.

Return Value
The address of the receiver’s implementation of the aSelector.

Discussion
If the receiver is an instance, aSelector should refer to an instance method; if the receiver is a class, it should refer to a class method.
</code></pre></div>

<p></p>

## 四、总结

OC 消息传递经过一系列 C 函数处理，最终也转变成标准 C 语言函数调用方式。运行时系统给 OC 语言带来了极大的灵活性，但最终的执行方式与 C 语言并没有什么不同。
