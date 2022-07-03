---
layout: post
title: JavaScript 原型链和继承机制
page_id: id-2018-11-21
tags:
- JavaScript
---

# {{ page.title }}

## 核心概念

js 中的继承不同于 C++、Java 此类面向对象语言，其继承机制基于原型链。当需要在 js 中使用继承机制时，构造正确的原型链即可实现继承。

![](/images/2018-11-21-javascript-object-layout.jpg)

js 原型链机制中的各对象之间的关系如上图所示。构造正确的符合继承行为的原型链的关键在于，构造函数的 prototype 属性以及 prototype 的 constructor 属性。

## 为构造函数构造原型链

{% codeblock lang:js %}
function extend(Child, Parent) {
    var F = function() {};
    F.prototype = Parent.prototype;
    Child.prototype = new F();
    Child.prototype.constructor = Child;
}
{% endcodeblock %}

为构造函数构造原型链处理的是构造函数，用于实例化出任意多的对象实例。

## 为对象实例构造原型链

{% codeblock lang:js %}
function object(o) {
    function F() {}
    F.prototype = o;
    return new F();
}
{% endcodeblock %}

为对象实例构造原型链是一次性的行为，所以 F.prototype.constructor 不需要严格设定。

## 参考文献

<a href="http://www.mollypages.org/tutorials/js.mp" target="_blank">http://www.mollypages.org/tutorials/js.mp</a>

<a href="http://blog.vjeux.com/2011/javascript/how-prototypal-inheritance-really-works.html" target="_blank">Javascript – How Prototypal Inheritance really works</a>

<a href="http://www.ruanyifeng.com/blog/2010/05/object-oriented_javascript_inheritance.html" target="_blank">Javascript面向对象编程（二）：构造函数的继承</a>

<a href="http://www.ruanyifeng.com/blog/2010/05/object-oriented_javascript_inheritance_continued.html" target="_blank">Javascript面向对象编程（三）：非构造函数的继承</a>
