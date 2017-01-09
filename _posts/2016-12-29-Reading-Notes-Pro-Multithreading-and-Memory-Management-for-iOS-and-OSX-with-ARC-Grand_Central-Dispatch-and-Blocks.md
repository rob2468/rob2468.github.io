---
layout: post
title: 读书笔记 - Pro Multithreading and Memory Management for iOS and OS X with ARC, Grand Central Dispatch, and Blocks
---

# {{ page.title }}

iOS Objective-C 开发中用到许多 block 语法。block 给开发带来了许多便利，但是相关的内存管理得加以小心，避免引入如循环引用这样的内存问题。在查阅相关资料的时候找到这本书，初读后颇有收获，现再读作本读书笔记以加深记忆与理解，并方便以后查阅。

本书篇幅不多，可分为如下3部分，共8个章节。

内存管理基础知识：第一章、Life Before Automatic Reference Counting；第二章、ARC Rules；第三章、ARC Implementation。

Block：第四章、Getting Started with Blocks；第五章、Blocks Implementation。

GCD：第六章、Grand Central Dispatch；第七章、GCD Basics；第八章、GCD Implementation。

## 一、内存管理

OC 使用引用计数来实现内存管理。引用计数是内存管理的基本原理，与是否采用 ARC 开发没有关系。开发者不必亲自记录每个对象的引用计数，遵循如下规则即可。

* 当 create 对象，你对该对象拥有所有权。
* 当 retain 对象，你对该对象拥有所有权。
* 当不再需要某个你拥有的对象时，你必须放弃对该对象的所有权。
* 当不拥有某个对象时，你不能放弃对该对象的所有权。

<p></p>

### 1. [GNUstep](http://gnustep.org/) 和 Apple 存储引用计数的不同方式

下面两幅图描述 GNUstep 和 Apple 存储对象引用计数的方式。

<div align="center"><img src="http://7xilqo.com1.z0.glb.clouddn.com/2016-12-29-GNUstep-Memory-image-of-an-object-returned-by-alloc.png" alt="" width="70%" /></div>

<div align="center">图 GNUstep 存储引用计数的方式</div>

GNUstep 实现，对象实例的内存结构就包含了存储引用计数的字段。struct obj_layout 的定义如下所示：

<div class="code"><pre><code>struct obj_layout {
    NSUInteger retained; 
};
</code></pre></div>
<div align="center"><img src="http://7xilqo.com1.z0.glb.clouddn.com/2016-12-29-Apple-Managing-Reference-Counts-with-a-hash-table.png" alt="" width="70%" /></div>

<div align="center">图 Apple 存储引用计数的方式</div>

Apple 实现，使用一个独立的哈希表存储对象实例的引用计数。

GNUstep 实现方式的优点：

* 更少的代码。
* 简单的生命周期管理（引用计数和对象实例处于同一块内存区域）。

Apple 实现方式的优点：

* 对象实例不包含额外的头部，不必考虑因为存在头部而引入的内存对齐问题。
* 可以简单的通过遍历哈希表，访问到所有对象实例的内存空间。（尤其便于调试）

<p></p>

### 2. autorelease

当采用 ARC 方式开发时，很少用到 autorelease 语法，但是其相关的知识点值得了解一下。

autorelease 可以类比 C 语言中的自动变量。如下代码，花括号指定了一片作用域，在该作用域中声明了变量a，离开该作用域后，变量a被自动释放。autorelease 的工作方式与此类似，指定一片代码块，在该代码块中向目标对象发送 autorelease 消息，当执行超出该代码块后，目标对象被自动释放。

<div class="code"><pre><code>{
    int a;
}</code></pre></div>

autorelease 中，该指定的代码块称为自动释放池。在自动释放池内向目标对象发送 autorelease 消息即注册了该目标对象，表明离开自动释放池后需要被释放。

通常，自动释放池在 Cocoa 框架中广泛存在，不要手动创建、持有和释放。比如，在 NSRunLoop 的每次 loop 中，都伴随着自动释放池的创建、持有和释放。

在某些时候，默认存在的自动释放池不能满足需求。比如，在某个循环体内创建了许多对象，分配了大量内存，如果等到循环体执行完毕，最后离开自动释放池的时候才整体释放这些对象，会带来严重的内存问题。这时候可以通过手动创建和释放自动释放池解决。（可以看出，自动释放池是可以嵌套使用的，最内层的为当前自动释放池。）

<p></p>

### 3. ARC 中的所有权修饰符（Ownership Qualifiers）

开启 ARC 后，编译器会承担内存管理的工作，开发者不必再手动调用 retain 和 release。本章节开头所述的内存管理的4条规则仍然适用。

ARC 引入了如下4个所有权描述符，开发者需要合理的使用所有权描述符，才能正确实现 ARC 下的内存管理。

* __strong
* __weak
* __unsafe_unretained
* __autoreleasing

OC 中的每个对象实例都有类型，或者是具体的类的指针，或者是 id（类似于 C 语言中的 void*）。当 ARC 开启后，所有对象实例必须有一个所有权描述符。

#### 3.1. __strong 所有权描述符

#### 3.2. __weak 所有权描述符

#### 3.3. __unsate_unretained 所有权描述符

#### 3.4. __autoreleasing 所有权描述符

## 二、Block

## 三、GCD


{{ page.date | date_to_string }}
