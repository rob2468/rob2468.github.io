---
layout: default
title: iOS工程默认源代码文件简介（main.m和AppDelegate.h/.m）
---

# {{ page.title }}

翻译自Apple iOS developer library

## 源代码简介

app工程创建后通常会自动生成一些源代码文件，通过这些源代码文件构建app。其中大部分的工作是由`UIApplicationMain`函数完成的，`UIApplicationMain`函数在`main.m`文件中自动被调用。`UIApplicationMain`函数创建一个应用程序对象，该应用程序对象为app创建与iOS操作系统协同工作的基础设施环境，包括创建一个向app分发输入事件的*run loop*。

## `main.m`文件和`UIApplicationMain`函数

`main.m`文件中的`main`函数在一个autorelease池中调用`UIApplicationMain`函数。

    @autoreleasepool {
        return UIApplicationMain(argc, argv, nil, NSStringFromClass([AppDelegate class]));
    }

`@autoreleasepool`语句支持app内存管理。ARC(Automatic Reference Counting)机制让编译器跟踪对象的持有者，使得内存管理工作变得简单；`@autoreleasepool`是内存管理架构的一部分。

调用`UIApplicationMain`函数为app创建了两个重要的初始组件：

- 一个`UIApplication`类的实例，称为应用程序对象(*application object*)

    应用程序对象管理app的事件循环，并且协调其它高层次的app行为。`UIApplication`类不需要用户书写额外的代码来完成这些工作，该类定义在UIKit框架中。

- 一个`AppDelegate`类的实例，称为app委托(**app delegate**)

    使用Xcode的Single View Application模版创建工程会自动生成`AppDelegate`类。app委托创建包含app绘制内容的window，并且提供一个响应状态转换的地方。用户自定义的代码写在app委托中。`AppDelegate`类定义在两个源代码文件中，接口文件`AppDelegate.h`和实现文件`AppDelegate.m`。

app开始运行后，应用程序对象会调用app委托中预定义的方法，用户自定义的代码因此能够得以运行（实现app中丰富有趣的功能）。

## app委托源代码文件

本节通过阅读app委托源代码文件（`AppDelegate.h/.m`）来更深入的了解app委托承担的角色。app委托接口文件只包含一个属性：`window`。app的内容都绘制在window中，app委托通过`window`属性保持跟踪。

app委托实现文件中包含一些重要方法的“骨架”。应用程序对象通过这些预定义的方法跟app委托通信。当发生一些运行时事件时（比如，app启动、低内存警告、app终止），应用程序对象会调用app委托中的对应方法。用户不需要做额外的工作来保证这些方法在正确的时间被调用，应用程序对象会处理这部分工作。

这些自动实现的方法都有其默认行为。如果保持“骨架”中方法实现为空，或者从`AppDelegate.m`文件中删除这些方法，那么当这些方法被调用时就执行其默认行为。如果用户想要当某个方法被调用时执行特定行为，可以在“骨架”中填充自定义的代码。

{{ page.date | date_to_string }}
