---
title: 理解 JSX
tags:
- React
---

# {{ page.title }}

## JSX 简介

JSX 的介绍参考 React 官方文档 [JSX 简介](https://zh-hans.reactjs.org/docs/introducing-jsx.html)。

JSX 编译后会转为名为 React.createElement 的函数调用。

## React.createElement 函数签名

{% codeblock lang:ts %}
function createElement(type: any, props?: any, ...children: ReactNode[])
{% endcodeblock %}

createElement 函数接收三个参数。

第一个参数为节点类型 type。比如，若在 JSX 中是 div，则 type 为 "div" 字符串；若在 JSX 中是自定义函数组件 CustomComponent，则 type 为 CustomComponent 函数。

第二个参数为节点属性 props。比如，若 JSX 中声明 `<div className="wrap">`，则 props 为 `{ className: "wrap" }`；若 JSX 中声明 `<div>`，则 props 为 null。

第三个参数为不定参数，每个参数值对应一个当前节点的子节点。

<!-- more -->

## JSX 编译

可以在 [这里](https://babeljs.io/repl) 验证 JSX 编译为 JS 的效果。

![JSX 编译成 JS](/images/2023-02-09-JSX编译成JS.jpg)

### 例子

#### JSX
{% codeblock JSX 示例 lang:js %}
<div className="container">
  hello

  <div className="wrap">
    <div className="second-wrap">
      <img src="https://www.reactjs.org" />
    </div>
    <CustomComponent />
  </div>
</div>
{% endcodeblock %}

#### JS

{% codeblock 编译且美化后的 JS lang:js %}
React.createElement(
  "div",
  {
    className: "container",
  },
  "hello",
  React.createElement(
    "div",
    {
      className: "wrap",
    },
    React.createElement(
      "div",
      {
        className: "second-wrap",
      },
      React.createElement("img", {
        src: "https://www.reactjs.org",
      })
    ),
    React.createElement(CustomComponent, null)
  )
);
{% endcodeblock %}

## JSX 执行

### React.createElement 的实现

下面的代码是简化版的 createElement 函数的实现。

注意：React.createElement 的函数签名有 type/props/children 的概念，React.createElement 返回的对象里里也有 type/props/children 字段。二者需要分开理解，注意不要混淆。

{% codeblock lang:ts %}
function createElement(type: any, props?: any, ...children: ReactNode[]) {
  return {
    type,
    props: {
      ...props,
      children: children.flat().map((child) => {
        return typeof child !== 'object' ? createTextElement(child) : child;
      }),
    },
  };
}
{% endcodeblock %}

* 第6行 [`flat()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/flat) 的作用：在 React 中，子组件通过 props.children 这个特殊属性接收父组件传递过来的组件。比如子组件的实现为 `React.createElement("div", null, props.children)`（对应的 JSX 是 `<div>{props.children}</div>`），如果父亲传递给孩子的组件只有一个，则 props.children 为对象；如果父亲传递给孩子的组件有多个，则 props.children 为数组，需要拍平。

* 第7行条件运算的作用：在编译后的 JSX 中，纯文本节点不是对象，如 [上文示例中的第6行](#JS) "hello" 为字符串类型。createTextElement 会将纯文本节点构造成与其它对象节点类似的结构。

### 例子

如 [上文例子所示](#JS)，JSX 是嵌套的 React.createElement 函数调用。内层的 React.createElement 的执行结果将作为外层的 React.createElement 函数的参数。

当最外层的 React.createElement 函数运行时，执行顺序是优先执行最内层的函数，然后再执行次内层的函数，如此反复，直至最外层的函数返回。(执行顺序类似深度优先搜索算法。)

[上文例子](#JS) 的函数运行结果如下：

{% codeblock lang:js %}
{
  type: "div",
  props: {
    className: "container",
    children: [
      {
        type: "HostText",
        props: {
          nodeValue: "hello",
        },
      },
      {
        type: "div",
        props: {
          className: "wrap",
          children: [
            {
              type: "div",
              props: {
                className: "second-wrap",
                children: {
                  type: "img",
                  props: {
                    src: "https://www.reactjs.org",
                  },
                },
              },
            },
            {
              type: CustomComponent,
              props: {
                children: null,
              },
            },
          ],
        },
      },
    ],
  },
};
{% endcodeblock %}

第30行的 CustomComponent 是自定义函数(组件)。React.createElement 的执行结果仍然保留函数节点，React 的 render 过程会调用该函数。见下文。

## 在 React 中执行

React.createElement 能够构造基本的 DOM 树状结构，此时 JSX 中引用的子组件并不会展开。

最先构造出来的是根节点，React render 阶段最主要的工作便是从根节点开始遍历，将子组件展开，最终获得一棵完整的 DOM 树。React render 的遍历策略本文不讨论，子组件展开的逻辑如下：

（React.createElement 返回的对象称为一个 fiber 对象。本文中如此定义，实际 React 中的 fiber 结构会更加复杂。）

{% codeblock lang:js %}
const isFunctionComponent = fiber.type instanceof Function;
if (isFunctionComponent) {
  fiber.props.children = [fiber.type(fiber.props)];
}
{% endcodeblock%}

## 总结

* JSX 不神秘，编译后也是普通的 JS 函数。

* 最新版本的 React 的执行过程异步可中断，其执行过程分为 render 阶段和 commit 阶段。（render 阶段处理虚拟 DOM，可中断；commit 阶段将虚拟 DOM 转为真实 DOM，不可中断。）

* 上文中 [“在 React 中执行”](#在-React-中执行) 对应 React 的 render 阶段，真正的 React 代码在执行过程中需要进行 DIFF 计算，并做好增/删/改的标志。（commit 阶段将根据这些增/删/改的标志更新真实 DOM。）

## 参考文档

[JSX 简介](https://zh-hans.reactjs.org/docs/introducing-jsx.html)
