---
layout: post
title: 设计模式
page_id: id-2019-01-12
tags:
- 设计模式
- MVC
---

# {{ page.title }}

## 前言

模型是在某情景（context）下，针对某问题的某种解决方案。

根据模式的目标可以分成三个不同的类目：创建型、行为型和结构型。

面向对象基础：抽象、封装、多态、继承

## 面向对象设计原则

* 找出应用中可能需要变化之处，把它们独立出来，不要和那些不需要变化的代码混在一起。

* 多用组合，少用继承。

* 针对接口编程，而不是针对实现编程。

* 为了交互对象之间的松耦合设计而努力。

* 对扩展开放，对修改关闭。

* 要依赖抽象，不要依赖具体类。

* 最少知识原则：只和你的密友谈话。

* 别找我，我会找你。（由超类主控一切，当它们需要的时候，自然会去调用子类。）

* 一个类应该只有一个引起变化的原因。

## 设计模式分类

### 中英文对照

| 序号 | 英文名 | 中文名 |
| :-------: | :------: | :------: |
| 1 | Abstract Factory | 抽象工厂 |
| 2 | Builder | 生成器 |
| 3 | Factory Method | 工厂方法 |
| 4 | Prototype | 原型 |
| 5 | Singleton | 单件 |
| 6 | Adapter | 适配器 |
| 7 | Bridge | 桥接 |
| 8 | Composite | 组合 |
| 9 | Decorator | 装饰者 |
| 10 | Facade | 外观 |
| 11 | Flyweight | 享元 |
| 12 | Proxy | 代理 |
| 13 | Chain of Responsibility | 职责链 |
| 14 | Command | 命令 |
| 15 | Interpreter | 解释器 |
| 16 | Iterator | 迭代器 |
| 17 | Mediator | 中介者 |
| 18 | Memento | 备忘录 |
| 19 | Observer | 观察者 |
| 20 | State | 状态 |
| 21 | Strategy | 策略 |
| 22 | Template Method | 模板方法 |
| 23 | Visitor | 访问者 |

### 组织编目

根据两条准则对模式进行分类。

第一是目的准则，即模式是用来完成什么工作的。模式根据其目的可分为创建型、结构型、或行为三种型

第二是范围准则，指定模式主要是用于类还是用于对象。

<table>
  <thead>
    <td></td>
    <td></td>
    <td colspan="3" style="text-align:center">目的</td>
    <td></td>
    <td></td>
  </thead>
  <tr>
    <td></td>
    <td></td>
    <td>创建型</td>
    <td>结构型</td>
    <td>行为型</td>
  </tr>
  <tr>
    <td rowspan="11">范围</td>
    <td rowspan="2">类</td>
    <td>Factory Method</td>
    <td>Adapter(类)</td>
    <td>Interpreter</td>
  </tr>
  <tr>
    <td></td>
    <td></td>
    <td>Template Method</td>
  </tr>
  <tr>
    <td rowspan="9">对象</td>
    <td>Abstract Factory</td>
    <td>Adapter(对象)</td>
    <td>Chain of Responsibility</td>
  </tr>
  <tr>
    <td>Builder</td>
    <td>Bridge</td>
    <td>Command</td>
  </tr>
  <tr>
    <td>Prototype</td>
    <td>Composite</td>
    <td>Iterator</td>
  </tr>
  <tr>
    <td>Singleton</td>
    <td>Decorator</td>
    <td>Mediator</td>
  </tr>
  <tr>
    <td></td>
    <td>Facade</td>
    <td>Memonto</td>
  </tr>
  <tr>
    <td></td>
    <td>Flyweight</td>
    <td>Observer</td>
  </tr>
  <tr>
    <td></td>
    <td>Proxy</td>
    <td>State</td>
  </tr>
  <tr>
    <td></td>
    <td></td>
    <td>Strategy</td>
  </tr>
  <tr>
    <td></td>
    <td></td>
    <td>Visitor</td>
  </tr>
</table>

### 设计模式支持的可变的方面

软件开发过程中永远不会变化的就是“变化”。我们需要考虑如何应对变化，使得变化发生时不会引起重新设计。最主要的一点是 *封装变化* 的概念。

下表列出了设计模式允许你独立变化的方面，你可以改变它们而又不会导致重新设计。

<table>
<thead>
  <tr>
    <td>目的</td>
    <td>设计模式</td>
    <td>可变的方面</td>
  </tr>
</thead>
<tbody>
  <tr>
    <td rowspan="5">创建</td>
    <td>Abstract Fatory</td>
    <td>产品对象家族</td>
  </tr>
  <tr>
    <td>Builder</td>
    <td>如何创建一个组合对象</td>
  </tr>
  <tr>
    <td>Factory Method</td>
    <td>被实例化的子类</td>
  </tr>
  <tr>
    <td>Prototype</td>
    <td>被实例化的类</td>
  </tr>
  <tr>
    <td>Singleton</td>
    <td>一个类的唯一实例</td>
  </tr>
  <tr>
    <td rowspan="7">结构</td>
    <td>Adapter</td>
    <td>对象的接口</td>
  </tr>
  <tr>
    <td>Bridge</td>
    <td>对象的实现</td>
  </tr>
  <tr>
    <td>Composite</td>
    <td>一个对象的结构和组成</td>
  </tr>
  <tr>
    <td>Decorator</td>
    <td>对象的职责，不生成子类</td>
  </tr>
  <tr>
    <td>Facade</td>
    <td>一个子系统的接口</td>
  </tr>
  <tr>
    <td>Flyweight</td>
    <td>对象的存储开销</td>
  </tr>
  <tr>
    <td>Proxy</td>
    <td>如何访问一个对象；该对象的位置</td>
  </tr>
  <tr>
    <td rowspan="11">行为</td>
    <td>Chain of Responsibility</td>
    <td>满足一个请求的对象</td>
  </tr>
  <tr>
    <td>Command</td>
    <td>何时、怎样满足一个请求</td>
  </tr>
  <tr>
    <td>Interpreter</td>
    <td>一个语言的文法及解释</td>
  </tr>
  <tr>
    <td>Iterator</td>
    <td>如何遍历、访问一个聚合的各元素</td>
  </tr>
  <tr>
    <td>Mediator</td>
    <td>对象间怎样交互、和谁交互</td>
  </tr>
  <tr>
    <td>Memento</td>
    <td>一个对象中哪些私有信息存放在该对象之外，以及在什么时候进行存储</td>
  </tr>
  <tr>
    <td>Observer</td>
    <td>多个对象依赖于另外一个对象，而这些对象又如何保持一致</td>
  </tr>
  <tr>
    <td>State</td>
    <td>对象的状态</td>
  </tr>
  <tr>
    <td>Strategy</td>
    <td>算法</td>
  </tr>
  <tr>
    <td>Template Method</td>
    <td>算法中的某些步骤</td>
  </tr>
  <tr>
    <td>Visitor</td>
    <td>某些可作用于一个(组)对象上的操作，但不修改这些对象的类</td>
  </tr>
</tbody>
</table>

## 设计模式描述

### 1. Abstract Factory / 抽象工厂

意图：提供一个创建一系列相关或相互依赖对象的接口，而无需指定它们具体的类。

### 2. Builder / 生成器

意图：将一个复杂对象的构建与它的表示分离，使得同样的构建过程可以创建不同的表示。

### 3. Factory Method / 工厂方法

意图：定义了一个创建对象的接口，但由子类决定要实例化的类是哪一个。工厂方法让类把实例化推迟到子类。

简单工厂不是设计模式，而是一种编程习惯。它经常被用于封装创建对象的代码。

### 4. Prototype / 原型

当创建给定类的实例的过程很昂贵或很复杂时，就使用原型模式。

### 5. Singleton / 单件

确保一个类只有一个实例，并提供一个全局访问点。

### 6. Adapter / 适配器

将一个类的接口，转换成客户期望的另一个接口。适配器让原本接口不兼容的类可以合作无间。

### 7. Bridge / 桥接

使用桥接模式不只改变你的实现，也改变你的抽象。

### 8. Composite / 组合

允许你将对象组合成树形结构来表现“整体/部分”层次结构。组合能让客户以一致的方式处理个别对象以及对象组合。

### 9. Decorator / 装饰者

动态地将责任附加到对象上。若要扩展功能，装饰者提供了比继承更有弹性的替代方案。

### 10. Facade / 外观

提供了一个统一的接口，用来访问子系统中的一群接口。外观定义了一个高层接口，让子系统更容易使用。

### 11. Flyweight / 享元

意图：运用共享技术有效地支持大量细粒度的对象。

如想让某个类的一个实例能用来提供许多“虚拟实例”，就使用享元模式。

### 12. Proxy / 代理

为另一个对象提供一个替身或占位符以控制对这个对象的访问。

### 13. Chain of Responsibility / 责任链

当你想要让一个以上的对象有机会能够处理某个请求的时候，就使用责任链模式。

### 14. Command / 命令

将“请求”封装成对象，以便使用不同的请求、队列或者日志来参数化其他对象。命令模式也支持可撤销的操作。

### 15. Interpreter / 解释器

使用解释器模式为语言创建解释器。

### 16. Iterator / 迭代器

提供一种方法顺序访问一个聚合对象中的各个元素，而又不暴露其内部的表示。

### 17. Mediator / 中介者

使用中介者模式来集中相关对象之间复杂的沟通和控制方式。

### 18. Memento / 备忘录

当你需要让对象返回之前的状态时（例如，你的用户请求“撤销”），就使用备忘录模式。

### 19. Observer / 观察者

定义对象之间的一对多依赖，这样一来，当一个对象改变状态时，它的所有依赖者都会收到通知并自动更新。

### 20. State / 状态

允许对象在内部状态改变时改变它的行为，对象看起来好像修改了它的类。

### 21. Strategy / 策略

定义算法族，分别封装起来，让它们之间可以相互替换，此模式让算法的变化独立于使用算法的客户。

### 22. Template Method / 模板方法

在一个方法中定义一个算法的骨架，而将一些步骤延迟到子类中。模板方法使得子类可以在不改变算法结构的情况下，重新定义算法中的某些步骤。

### 23. Visitor / 访问者

当你想要为一个对象的组合增加新的能力，且封装并不重要时，就使用访问者模式。

## MVC 复合模式

MVC 包含观察者模式、策略模式和组合模式。

模型利用“观察者”让控制器和视图可以随最新的状态改变而更新。
视图和控制器实现了“策略模式”，控制器是视图的行为，如果你希望有不同的行为，可以直接换一个控制器。
视图内部使用组合模式来管理窗口、按钮以及其他显示组件。

## 反模式

反模式告诉你如何采用一个不好的解决方案解决一个问题。

反模式看起来总像是一个好的解决方案，但是当它真正被采用后，就会带来麻烦。通过将反模式归档，我们能够帮助其他人在实现他们之前，分辨出不好的解决方案。

## 参考文献

Eric Freemain, Elisabeth Freeman, Kathy Sierra, Bert Bates. [Head First 设计模式](https://book.douban.com/subject/2243615/). 中国电力出版社.

Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides. [设计模式-可复用面向对象软件的基础](https://book.douban.com/subject/1052241/). 机械工业出版社
