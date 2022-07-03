---
layout: post
title: ARC 内存管理和 GCD
page_id: id-2016-12-29
tags:
- 读书笔记
- iOS
---

<h1 class="title">{{ page.title }}</h1>

<h2>前言</h2>

Pro Multithreading and Memory Management for iOS and OS X with ARC, Grand Central Dispatch, and Blocks 这本书篇幅不多，可分为如下3部分，共8个章节。

内存管理基础知识：第一章、Life Before Automatic Reference Counting；第二章、ARC Rules；第三章、ARC Implementation。

Block：第四章、Getting Started with Blocks；第五章、Blocks Implementation。

GCD：第六章、Grand Central Dispatch；第七章、GCD Basics；第八章、GCD Implementation。

本文为该本书的读书笔记，Block 相关的内容比较多，参考<a href="/2018/09/30/block">这篇文章</a>。

<!-- more -->

<h2 id="section_1">一、内存管理</h2>

OC 使用引用计数来实现内存管理。引用计数是内存管理的基本原理，与是否采用 ARC 开发没有关系。开发者不必亲自记录每个对象的引用计数，遵循如下规则即可。

* 当 create 对象，你对该对象拥有所有权。
* 当 retain 对象，你对该对象拥有所有权。
* 当不再需要某个你拥有的对象时，你必须放弃对该对象的所有权。
* 当不拥有某个对象时，你不能放弃对该对象的所有权。

<h3 id="section_1_1">1. GNUstep 和 Apple 存储引用计数的不同方式</h3>

下面两幅图描述 <a href="http://gnustep.org/" target="_blank">GNUstep</a> 和 Apple 存储对象引用计数的方式。

![](/images/2016-12-29-GNUstep-Memory-image-of-an-object-returned-by-alloc.png)

<p class="post-image-title">图 GNUstep 存储引用计数的方式</p>

GNUstep 实现，对象实例的内存结构就包含了存储引用计数的字段。struct obj_layout 的定义如下所示：

{% codeblock lang:objc %}
struct obj_layout {
    NSUInteger retained;
};
{% endcodeblock %}

![](/images/2016-12-29-Apple-Managing-Reference-Counts-with-a-hash-table.png)

<p class="post-image-title">图 Apple 存储引用计数的方式</p>

Apple 实现，使用一个独立的哈希表存储对象实例的引用计数。

GNUstep 实现方式的优点：

* 更少的代码。
* 简单的生命周期管理（引用计数和对象实例处于同一块内存区域）。

Apple 实现方式的优点：

* 对象实例不包含额外的头部，不必考虑因为存在头部而引入的内存对齐问题。
* 可以简单的通过遍历哈希表，访问到所有对象实例的内存空间。（尤其便于调试）

<h3 id="section_1_2">2. autorelease</h3>

当采用 ARC 方式开发时，很少用到 autorelease 语法，但是其相关的知识点值得了解一下。

autorelease 可以类比 C 语言中的自动变量。如下代码，花括号指定了一片作用域，在该作用域中声明了变量a，离开该作用域后，变量a被自动释放。autorelease 的工作方式与此类似，指定一片代码块，在该代码块中向目标对象发送 autorelease 消息，当执行超出该代码块后，目标对象被自动释放。

{% codeblock lang:objc %}
{
    int a;
}
{% endcodeblock %}

autorelease 中，该指定的代码块称为自动释放池。在自动释放池内向目标对象发送 autorelease 消息即注册了该目标对象，表明离开自动释放池后需要被释放。

通常，自动释放池在 Cocoa 框架中广泛存在，不要手动创建、持有和释放。比如，在 NSRunLoop 的每次 loop 中，都伴随着自动释放池的创建、持有和释放。

在某些时候，默认存在的自动释放池不能满足需求。比如，在某个循环体内创建了许多对象，分配了大量内存，如果等到循环体执行完毕，最后离开自动释放池的时候才整体释放这些对象，会带来严重的内存问题。这时候可以通过手动创建和释放自动释放池解决。（可以看出，自动释放池是可以嵌套使用的，最内层的为当前自动释放池。）

<h3 id="section_1_3">3. ARC 中的所有权修饰符（Ownership Qualifiers）</h3>

开启 ARC 后，编译器会承担内存管理的工作，开发者不必再手动调用 retain 和 release。ARC 引入了如下4个所有权描述符，开发者需要合理的使用所有权描述符，才能正确实现 ARC 下的内存管理。

* __strong
* __weak
* __unsafe_unretained
* __autoreleasing

OC 中的每个对象实例都有类型，或者是具体的类的指针，或者是 id（类似于 C 语言中的 void*）。当 ARC 开启后，所有对象实例必须有一个所有权描述符。

所有使用 __strong、__weak 和 __autoreleasing 所有权描述符的对象实例都会被初始化为nil，如下两处代码块的效果相同。

{% codeblock lang:objc %}
id __strong obj0;
id __weak obj1;
id __autoreleasing obj2;
{% endcodeblock %}

<p></p>

{% codeblock lang:objc %}
id __strong obj0 = nil;
id __weak obj1 = nil;
id __autoreleasing obj2 = nil;
{% endcodeblock %}

本章节开头所述的内存管理的4条规则仍然适用。将对象赋给 __strong 变量即满足了前两条规则。第三条规则在不同的情况下自动满足，比如，离开变量的作用域；将值赋给变量；持有成员变量的对象实例被释放。因为不再需要手动调用 release，第四条规则显然满足。

#### 3.1. __strong 所有权描述符

__strong 所有权描述符是默认描述符。即如果描述符缺失，编译器默认使用 __strong。使用 __strong 所有权描述符修饰变量，表明该变量对目标对象具有强引用（该变量对目标对象有所有权）。

#### 3.2. __weak 所有权描述符

使用 __weak 所有权描述符修饰变量，表明该变量对目标对象具有弱引用（该变量对目标对象没有所有权）。__weak 所有权描述符的重要用途就是避免产生循环引用导致内存泄漏。

{% codeblock lang:objc %}
id __weak obj = [[NSObject alloc] init];
{% endcodeblock %}

编译这段代码编译器有可能给出编译警告。该段代码创建了一个 NSObject 对象并赋给 obj 变量，obj 使用 __weak 修饰，对该 NSObject 对象没有所有权。当编译器开启编译优化后，该 NSObject 对象刚创建出来就被销毁。下面的写法能解决这个问题。

{% codeblock lang:objc %}
id __strong obj0 = [[NSObject alloc] init];
id __weak obj1 = obj0;
{% endcodeblock %}

__weak 所有权描述符还存在如下一个重要特性。当对象实例销毁后，所有引用该对象实例的 __weak 变量会自动设置为 nil。

#### 3.3. __unsafe_unretained 所有权描述符

__unsafe_unretained 的行为和 __weak 类似，使用该所有权描述符修饰的变量对目标对象具有弱引用（该变量对目标对象没有所有权）。

__unsafe_unretained 和 __weak 的区别在于，当对象实例销毁后，引用该对象实例的 __unsafe_unretained 变量不会自动设置为 nil。

除非有特殊需求（比如需要支持iOS 5 和 OSX Lion 之前版本的系统），否则尽量使用 __weak 代替 __unsafe_unretained。

#### 3.4. __autoreleasing 所有权描述符

autorelease 的相关知识见上文介绍，ARC 和 non-ARC 下的原理相同。ARC 引入新的语法让操作变得简单直观。如下两处代码段分别是 non-ARC 和 ARC 下 autorelease 的使用方式。

{% codeblock lang:objc %}
/* non-ARC */
NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
id obj = [[NSObject alloc] init];
[obj autorelease];
[pool drain];
{% endcodeblock %}

<p></p>

{% codeblock lang:objc %}
/* ARC */
@autoreleasepool {
    id __autoreleasing obj = [[NSObject alloc] init];
}
{% endcodeblock %}

两种写法的对应关系如下图所示。

![](/images/2016-12-29-@autoreleasepool-and-a-variable-with-__autoreleasing-qualifier.png)

<p class="post-image-title">图 @autoreleasepool 和 __autoreleasing 描述符</p>

得益于编译器的自动化操作，简化了开发者的许多工作，在实际使用中，很少使用到 __autoreleasing 语法。下面分情况对背后的细节进行说明。(使用下面方法调试查看自动释放池状态，`extern void _objc_autoreleasePoolPrint(); /* 声明 */ _objc_autoreleasePoolPrint(); /* 调用 */`)

##### 情况分析一

在 non-ARC 下创建对象实例有如下规则，通过以 alloc/new/copy/mutableCopy 开头的方法返回对象实例，调用者才能拥有该对象实例的所有权。在各种情况下，需要配合使用 autorelease、retain 和 release 方法才能合理的管理内存。

通过以 alloc/new/copy/mutableCopy 开头的方法返回对象实例，调用者才能拥有该对象实例的所有权，这条规则在 ARC 下仍然成立。在 ARC 下开发时情况变的简单，虽然引入了所有权描述符，但是编译器默认做了许多工作，开发者需要考虑的问题减少了许多。后面以如下代码段说明 ARC 下，__autoreleasing 是如何发生作用的。

{% codeblock lang:objc %}
@implementation NSMutableArray
+ (id)array
{
    id obj = [[NSMutableArray alloc] init];     // part 1
    return obj;                                 // part 2
}
@end

@autoreleasepool {
    id obj = [NSMutableArray array];            // part 3
}
{% endcodeblock %}

查看 @autoreleasepool 中的代码，part 3 语句以 [NSMutableArray array] 的方式创建了对象实例，方法的名称不符合以 alloc/new/copy/mutableCopy 开头的规则，所以调用者没有该对象实例的所有权，该对象实例注册在自动释放池中。因为 obj 变量使用 __strong 所有权描述符修饰，其会持有该对象实例。

深入 NSMutableArray 的 array 方法中查看。part 1 语句创建了对象实例，并由变量 obj 持有。part 2 将 obj 持有的对象实例返回给调用者。part 2 语句执行之后，obj 持有的对象实例会被释放。在此之前，编译器检测到该对象实例会被返回给调用者，会将该对象实例注册到自动释放池中。

##### 情况分析二

当使用 __weak 所有权描述符修饰的变量时，该变量引用的对象实例总是会被注册到自动释放池中。

{% codeblock lang:objc %}
id __weak obj1 = obj0;
NSLog(@"class=%@", [obj1 class]);
{% endcodeblock %}

上述代码等同于如下代码段。

{% codeblock lang:objc %}
id __weak obj1 = obj0;
id __autoreleasing tmp = obj1;
NSLog(@"class=%@", [tmp class]);
{% endcodeblock %}

因为使用 __weak 所有权描述符修饰的变量不持有对象实例，该对象实例可能会在任一时刻被释放，为了能安全的使用该对象实例，编译器总是会先将该对象实例注册到自动释放池中再使用。

由于每次使用 __weak 变量都会导致对象实例注册到自动释放池，为了提升性能，可先将 __weak 变量赋给 __strong 变量再使用。

我使用 `_objc_autoreleasePoolPrint();` 方法调试验证时，并未发现该行为（使用 __weak 变量导致对象实例自动注册自动释放池）。

##### 情况分析三

`"id obj"` 的默认行为是 `"id __strong obj"`，但是 `"id *obj"` 的默认行为却是 `"id __autoreleasing *obj"`，同样的，`"NSObject **obj"` 的默认行为是 `"NSObject * __autoreleasing *obj"`。这种方式的默认行为是由该种语法的通常用途决定的，即方法调用通过参数返回值，如下代码所示。

{% codeblock lang:objc %}
NSError *error = nil;
BOOL result = [obj performOperationWithError:&error];
{% endcodeblock %}

因为只有通过以 alloc/new/copy/mutableCopy 开头的方法返回对象实例，调用者才能拥有该对象实例的所有权。上述通过参数返回调用结果的方式不属于规则中约定的条件，所以应该使用 __autoreleasing 所有权修饰符。

给对象实例的指针赋值还有一个要求，即声明的对象实例指针的所有权描述符必须与赋值给该对象实例指针的所有权描述符相同。如下代码。

{% codeblock lang:objc %}
/* 错误示例 */
NSError *error =nil;
NSError **error = &error;   // __strong 赋给 __autoreleasing

/* 正确示例 */
NSError *error =nil;
NSError * __strong *error = &error;

NSError __weak *error =nil;
NSError * __weak *error = &error;

NSError __unsafe_unretained *error =nil;
NSError * __unsafe_unretained *error = &error;
{% endcodeblock %}

在实际开发中经常书写本小节开头的那段示例代码，但是并不会报错，原因是编译器自动做了处理，实际转化后的代码如下所示。

{% codeblock lang:objc %}
NSError __strong *error = nil;
NSError __autoreleasing *tmp = error;
BOOL result = [obj performOperationWithError:&tmp];
error = tmp;
{% endcodeblock %}

<h3 id="section_1_4">4. 类型转换与内存管理</h3>

OC 环境下开发会遇到多种类型的对象实例，而且对象实例可能需要在不同的类型之间转换。比如有如下对象实例类型，Foundation 框架下的对象实例，原生 C 语言下的对象实例，Core Foundation 框架下的对象实例。本小节描述这三种类型的对象实例之间的转换以及内存管理。

在 non-ARC 环境下，所有的内存管理都是开发者手动操作的，对象实例可以轻易的在这三种类型之间转换。

在 ARC 环境下，编译器不再允许对象实例直接在这三种类型之间转换，但是可以通过 `__bridge` 转换符实现类型转换，如下代码所示。

{% codeblock lang:objc %}
id obj = [[NSObject alloc] init];
void *p = (__bridge void *)obj;
id o = (__bridge id)p;
{% endcodeblock %}

`__bridge` 只能使得对象实例在不同的类型之间转换，若要实现内存管理，需要使用 `__bridge_retained` 和 `__bridge_transfer` 这两个转换符。下面用两段示例代码说明。

{% codeblock lang:objc %}
/* ARC */
id obj = [[NSObject alloc] init];
void *p = (__bridge_retained void *)obj;

/* 等效的 non-ARC 实现*/
id obj = [[NSObject alloc] init];
void *p = obj;
[(id)p retain];
{% endcodeblock %}

`__bridge_retained` 使得被赋值的变量拥有对象实例的所有权。

{% codeblock lang:objc %}
/* ARC */
id obj = (__bridge_transfer id)p;

/* 等效的 non-ARC 实现*/
id obj = (id)p;
[obj retain];
[(id)p release];
{% endcodeblock %}

`__bridge_transfer` 将赋值变量对对象实例的所有权转交给被赋值变量。

Core Foundation 框架主要使用 C 语言实现，其中创建的对象实例和 Foundation 框架下创建的对象实例差异很小，可以在没有任何资源损耗的情况下实现二者的转换，但是开发者需要关心二者转换之间的内存管理。

除了上面所述的 `__bridge_retained` 和 `__bridge_transfer` 转换符，Core Foundation 框架引入了两个函数实现相同的功能，分别是 `CFBridgingRetain` 和 `CFBridgingRelease`。见如下代码示例。

{% codeblock lang:objc %}
CFMutableArrayRef cfObject = NULL;
{
    id obj = [[NSMutableArray alloc] init];
    cfObject = CFBridgingRetain(obj);   // 等同于 cfObject = (__bridge_retained CFMutableArrayRef)obj;
}
CFRelease(cfObject);
{% endcodeblock %}

<p></p>

{% codeblock lang:objc %}
CFMutableArrayRef cfObject = CFArrayCreateMutable(kCFAllocatorDefault, 0, NULL);
id obj = CFBridgingRelease(cfObject);   // 等同于 id obj = (__bridge_transfer id)cfObject;
{% endcodeblock %}

<h3 id="section_1_5">5. 属性</h3>

ARC 引入了所有权描述符，同时也引入了新的属性修饰符，二者存在对应关系，如下表所示。

<pre><code>----------------------------------------------------------------------------
|  属性修饰符            |  所有权描述符                                       |
|----------------------|---------------------------------------------------|
|  assign              |  __unsafe_unretained                              |
|  copy                |  __strong (note: new copied object is assigned.)  |
|  retain              |  __strong                                         |
|  strong              |  __strong                                         |
|  unsafe_unretained   |  __unsafe_unretained                              |
|  weak                |  __weak                                           |
----------------------------------------------------------------------------
</code></pre>

<h3 id="section_1_6">6. ARC 的实现方式</h3>

这一小节揭示 ARC 的实现方式和部分底层机制。编译器会将 OC 代码翻译成机器码，为了方便理解，本小节使用伪代码进行描述。

#### 6.1. __strong所有权描述符

下面三组代码示例展示 OC 源代码与翻译后的对应伪代码。

示例1
{% codeblock lang:objc %}
{
    id __strong obj = [[NSObject alloc] init];
}

/* pseudo code by the compiler */
id obj = objc_msgSend(NSObject, @selector(alloc));
objc_msgSend(obj, @selector(init));
objc_release(obj);
{% endcodeblock %}

示例2
{% codeblock lang:objc %}
{
    id __strong obj = [NSMutableArray array];
}

/* pseudo code by the compiler */
id obj = objc_msgSend(NSMutableArray, @selector(array));
objc_retainAutoreleasedReturnValue(obj);
objc_release(obj);
{% endcodeblock %}

示例3
{% codeblock lang:objc %}
+ (id)array
{
    return [[NSMutableArray alloc] init];
}

/* pseudo code by the compiler */
+ (id) array
{
    id obj = objc_msgSend(NSMutableArray, @selector(alloc));
    objc_msgSend(obj, @selector(init));
    return objc_autoreleaseReturnValue(obj);
}
{% endcodeblock %}

示例3和示例2的伪代码中调用了一对函数，objc_autoreleaseReturnValue() 和 objc_retainAutoreleasedReturnValue()，这对函数调用对应“3.4. 情况分析一”小节的解释。objc_autoreleaseReturnValue() 的作用是将对象注册到自动释放池中，objc_retainAutoreleasedReturnValue() 的作用是持有目标对象。

实际情况下，objc_autoreleaseReturnValue() 并不总会将对象注册到对象释放池。objc_autoreleaseReturnValue() 会检测调用者的执行代码，如果调用者接下来调用了 objc_retainAutoreleasedReturnValue() 函数，便跳过将对象注册到自动释放池的步骤，以提升性能。见下图。

![](/images/2016-12-29-Skip-registration-to-the-autorelease-pool.jpeg)

<p class="post-image-title">图 跳过对象加入自动释放池步骤</p>

<h3 id="section_1_7">7. _objc_rootRetainCount</h3>

iOS 提供了查看对象实例引用计数的函数，`uintptr_t _objc_rootRetainCount(id obj)`。该函数可在调试时使用，但是其返回的值也并不总是正确的，需慎用。在 ARC 下只要遵循各所有权描述符的规则即可实现内存管理，不需要关注引用计数的数值。

<h2 id="section_2">二、GCD</h2>

GCD 是一种执行多线程任务的技术方案。使用 GCD，开发者需要定义好任务并加入到分发队列中，线程管理的相关工作由系统完成。

分发队列是先进先出的队列结构，可以分为串行队列和并发队列。加入到串行队列中的任务会依次有序执行，当前任务完成后再执行队列中下一个任务。并发队列中的任务执行不会等待前次任务执行完成。

![](/images/2016-12-29-Relationship-of-Serial-Dispatch-Queue-Concurrent-Dispatch-Queue-and-threads.png)

<p class="post-image-title">图 串行队列、并发队列与线程的关系</p>

上图描述了分发队列和线程的关系。XNU kernel 是 iOS 和 OS X 的核心部分，负责线程的管理，创建、销毁和调度线程。比如，8个任务添加至并发队列中，XNU kernel 提供了4个线程执行任务，可能有如下执行顺序。

<pre><code>--------------------------------------------------
|  Thread0  |  Thread1  |  Thread 2  |  Thread3  |
|-----------|-----------|------------|-----------|
|  blk0     |  blk1     |  blk2      |  blk3     |
|  blk4     |  blk6     |  blk5      |           |
|  blk7     |           |            |           |
--------------------------------------------------
</code></pre>

在非 ARC 情况下，分发队列创建后需手动释放。

当创建了一个串行队列并向其中添加了任务，系统会创建一个对应的线程。如果创建了2000个串行队列，系统也会创建2000个线程。开发者需要了解这个特性，避免过多线程造成额外的开销。

<h3>参考文献：</h3>

Sakamoto, Kazuki, and Tomohiko Furumoto. Pro Multithreading and Memory Management for IOS and OS X. Apress, 2012.
