---
layout: post
title: JSPatch 代码分析
page_id: id-2016-05-16
---

<h1 class="title">{{ page.title }}</h1>

"[JSPatch](https://github.com/bang590/JSPatch) 是一个 iOS 动态更新框架，只需在项目中引入极小的引擎，就可以使用 JavaScript 调用任何 Objective-C 原生接口，获得脚本语言的优势：为项目动态添加模块，或替换项目原生代码动态修复 bug。"

JSPatch 的实现原理可参考原作者(bang590)的相关文章。本文给出 JSPatch 部分代码分析纪录。

<!-- more -->

<h2 id="section_1">一、OC (Objective-C) 运行时</h2>

OC 是运行时语言，即能够在程序运行的时候执行编译后的代码。OC 中的方法调用通过消息转发（objc_msgSend）实现，即先根据方法名寻找到方法实现，再调用方法实现。并且，通过 Method Swizzling 技术，可以动态修改方法名和方法实现的对应关系。

<h3>1. 消息转发</h3>

objc_msgSend 函数的重要工作是根据某个方法的 selector 找到相应的方法实现(IMP)。IMP 类型即为函数指针。

_objc_msgForward 是 IMP 类型，当 objc_msgSend 未找到某个 selector 的 IMP，会使用该 IMP 替代。_objc_msgForward 会做消息转发的工作。

_objc_msgForward 消息转发会依次调用如下的方法。

{% codeblock lang:objc %}
+ (BOOL)resolveInstanceMethod:(SEL)name; / + (BOOL)resolveClassMethod:(SEL)name;
- (id)forwardingTargetForSelector:(SEL)aSelector;
- (NSMethodSignature *)methodSignatureForSelector:(SEL)aSelector;
- (void)forwardInvocation:(NSInvocation *)anInvocation;
- (void)doesNotRecognizeSelector:(SEL)aSelector;
{% endcodeblock %}

<h3>2. Method Swizzling</h3>

Method Swizzling 用于修改目标类的方法名和方法实现的对应关系，比如可以增加新方法、替换已有方法的方法实现。

常用函数如下所示：

{% codeblock lang:objc %}
BOOL class_addMethod(Class cls, SEL name, IMP imp, const char *types);
IMP class_replaceMethod(Class cls, SEL name, IMP imp, const char *types);
void method_exchangeImplementations(Method m1, Method m2);
{% endcodeblock %}

下面代码片段是一种情况下的使用示例：

{% codeblock lang:objc %}
SEL originalSelector = @selector(viewWillAppear:);
SEL swizzledSelector = @selector(xxx_viewWillAppear:);

Method originalMethod = class_getInstanceMethod(class, originalSelector);
Method swizzledMethod = class_getInstanceMethod(class, swizzledSelector);

// When swizzling a class method, use the following:
// Class class = object_getClass((id)self);
// ...
// Method originalMethod = class_getClassMethod(class, originalSelector);
// Method swizzledMethod = class_getClassMethod(class, swizzledSelector);

BOOL didAddMethod = class_addMethod(class, originalSelector, method_getImplementation(swizzledMethod), method_getTypeEncoding(swizzledMethod));

if (didAddMethod) {
    class_replaceMethod(class, swizzledSelector, method_getImplementation(originalMethod), method_getTypeEncoding(originalMethod));
} else {
    method_exchangeImplementations(originalMethod, swizzledMethod);
}
{% endcodeblock %}

<h2 id="section_2">二、JavaScriptCore.framework</h2>

JSCore 是从 UIWebView 提取出的 JS 解析引擎，封装了 JS 和 OC 桥接的 OC API，使得不依赖于 UIWebView 便能实现 JS 环境和 OC 环境的通信。JSCore 提供不同运行环境之间方法互调的接口，并对不同类型的数据格式进行封装。

<h3>1. 方法互调</h3>

JSCore 提供了多种方式实现 JS 和 OC 的通信，最常用的方式是使用 Block，如下代码所示：

{% codeblock lang:objc %}
JSContext *context = [[JSContext alloc] init];
context[@"log"] = ^() {
    NSLog(@"-------Log-------");
};
[context evaluateScript:@"log()"];
{% endcodeblock %}

JSContext 是 JS 的运行环境。上述代码中，在 JSContext 中声明了名为 log 的函数，该函数的实现是 OC block，实现了在 JS 环境中调用 OC 方法。

`[context evaluateScript:@"log()"]` 是调用名为 log 的 JS 函数，实现了在 OC 环境中调用 JS 函数。

除了通过 Block 通信，JSCore 还提供 JSExport。JSExport 是协议，JS 能方便的操纵实现了该协议的 OC 对象。

<h3>2. 类型转换关系</h3>

JS 和 OC 环境通信还伴随着数据的传递，下表是各类型数据的对应关系。

<pre><code>-----------------------------------------------------------------------------
|  Objective-C Types                                    |  Javascript Types |
|-------------------------------------------------------|-------------------|
|  nil                                                  |  undefined        |
|  NSNull                                               |  null             |
|  NSString                                             |  String           |
|  NSNumber                                             |  Number, Boolean  |
|  NSDictionary                                         |  Object           |
|  NSArray                                              |  Array            |
|  NSDate                                               |  Date             |
|  object (id or AnyObject) / class (Class or AnyClass) |  Object           |
|  Structure types: NSRange, CGRect, CGPoint, CGSize    |  Object           |
|  Objective-C Block                                    |  Function         |
-----------------------------------------------------------------------------
</code></pre>

<h2 id="section_3">三、方法调用</h2>

JSPatch 通过运行时系统，将错误的 OC 代码逻辑替换为正确的 JS 代码逻辑。本小节描述 OC 方法被替换后，方法调用流程如何发生，包括如下两种情况，调用修改后的方法（即 JS 函数）和调用原始方法（即 JS 环境中调用 OC 方法）。

<h3 id="section_3_1">1. 调用修改后方法</h3>

![](/images/2016-05-16-JSPatch_MessageSend.png)

上图描述了调用修改后方法的程序执行流程。

每个方法可以看作两部分组成，selector 和 IMP，分别表示方法的名称和方法的实现。JSPatch 希望将类中错误方法实现修改为 JS 实现时，会执行两处方法修改。一是，将错误方法的实现修改为 _objc_msgForward；二是，将该类的 forwardInvocation 实现替换为自定义的方法实现（JPForwardInvocation）。这样，在调用该错误方法时便会执行到该类的 forwardInvocation 方法中，而 JPForwardInvocation 会判断是否执行相应的 JS 实现。

<h3 id="section_3_2">2. 调用原始方法</h3>

![](/images/2016-05-16-JSPatch_callSelector.png)

上图描述 JS 环境中调用 OC 方法是如何发生的，即 JS 如何调用 OC 类中的任意方法。

JSPatch 通过 __c 元函数实现 JS 调用 OC 方法。如上图所示，整个流程可以分为三个环节，JSPatch 引擎开始、注入修复脚本和程序运行。

开始 JSPatch 引擎时，在 OC 中定义通用回调接口，并在 JS 环境中定义元函数 __c，__c 负责调用通用回调接口。

注入修复脚本时，JSPatch 会修改脚本中 JS 函数的调用方式。使用正则表达式，将所有函数调用交由元函数 __c 解析。

程序运行时，当调用某个元函数 __c 时，__c 会转发到 OC 的通用回调接口，通用回调接口通过类名、方法名和参数实现调用流程，并将结果反馈给 JS 环境。

<h2 id="section_4">四、问题发现与解释</h2>

在项目中引入了 JSPatch，利用其能力实现了不少针对 app 线上问题的热修复。在使用过程中发现一些问题，并做了调研。

<h3>1. 在 OC 中使用快速遍历访问NSArray 中的元素，转换为 JS 后，快速遍历无法得到数组元素。</h3>

JSPatch 对 OC 中的数组、字典、字符串进行了封装，在 JS 中被封装成 JPBoxing 对象，而不是原生的 JS 数组、字典、字符串。这种处理使得对应的数据对象在 OC 和 JS 之间传输时，仍能保持其在 OC 中的特性。具体原因见<a href="https://github.com/bang590/JSPatch/wiki/JSPatch-%E5%AE%9E%E7%8E%B0%E5%8E%9F%E7%90%86%E8%AF%A6%E8%A7%A3#4jpboxing" target="_blank">JSPatch-实现原理详解-JPBoxing</a>。因此，在JS中快速遍历时，访问的是相应的JPBoxing对象的可枚举属性。

JS中的数组 JPBoxing 对象可调用方法 toJS()，获取相应的原生 JS 数组。但此时快速遍历的元素是 JS 数组的下标，不同于 OC 中的快速遍历，仍然需要额外的操作才能获得数组元素。

JS中快速遍历的顺序依赖于具体实现，不能保证永远按照索引顺序访问。因此最好使用for(;;)语法访问数组。

<h3>2. 通过调用未实现方法以测试自定义的 forwardInvocation 时，在一些情况下直接抛出方法未实现错误，而不是执行 forwardInvocation 中逻辑。</h3>

Objective-C 的消息转发会调用一系列方法。在调用 forwardInvocation 之前，methodSignatureForSelector 会被调用。如果 methodSignatureForSelector 能够返回有效的 NSMethodSignature 对象，forwardInvocation 会在后续步骤中被调用，否则 forwardInvocation 将不会被调用（因为 forwardInvocation 的 NSInvocation 参数的形成依赖于 methodSignatureForSelector 返回的 NSMethondSignature 对象）。

所以有两种方法解决这个问题。

a. 在待测试的类中添加方法，并将该方法的实现设置为空（_objc_msgForward）。此时 methodSignatureForSelector 能够基于该方法生成合适的 NSMethodSignature 对象。

b. 直接在待测试类中重载 methodSignatureForSelector 方法，手动构造并返回一个有效的 NSMethodSignature 对象。

<h3>参考文献:</h3>

[Message Forwarding](https://developer.apple.com/library/mac/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Articles/ocrtForwarding.html)

[NSObject Class Reference](https://developer.apple.com/library/watchos/documentation/Cocoa/Reference/Foundation/Classes/NSObject_Class/#//apple_ref/occ/clm/NSObject/resolveClassMethod:)

[Method Swizzling](http://nshipster.cn/method-swizzling/)

[JavaScriptCore](https://developer.apple.com/reference/javascriptcore?language=objc)
