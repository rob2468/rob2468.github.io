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

React.createElement 执行后的结果为 JSON 结构。

<!-- more -->

## JSX 编译

可以在 [这里](https://babeljs.io/repl) 验证 JSX 编译为 JS 的效果。

![JSX 编译成 JS](/images/2023-02-09-JSX编译成JS.jpg)

### 例子

#### JSX
{% codeblock JSX 示例 lang:js %}
<div className="container">
  {
  isSimple
    ? <h1>{name}</h1>
    : <h2>{formatName(name)}</h2>
  }

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
  isSimple
    ? React.createElement("h1", null, name)
    : React.createElement("h2", null, formatName(name)),
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

## 在 React 中执行 JSX

由于 Babel 会把 JSX 转译成 JS 函数，执行 JSX 也就是调用转译后的 JS 函数。

假设 `const isSimple = true; const name = "Hello"; const CustomComponent = () => <div />;`，基于上面一小节的例子，分步执行的结果如下：

1. 执行最外层的 React.createElement

{% codeblock lang:json %}
{
  "type": "div",
  "props": {
    "className": "container",
    "children": [
      isSimple
        ? React.createElement("h1", null, name)
        : React.createElement("h2", null, formatName(name)),
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
    ]
  }
}
{% endcodeblock %}

2. 执行最外层节点的第一个孩子节点

{% codeblock lang:json %}
{
  "type": "div",
  "props": {
    "className": "container",
    "children": [
      {
        "type": "h1",
        "props": {
          "children": "Hello"
        }
      },
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
    ]
  }
}
{% endcodeblock %}

3. 执行最外层节点的第二个孩子节点

{% codeblock lang:json %}
{
  "type": "div",
  "props": {
    "className": "container",
    "children": [
      {
        "type": "h1",
        "props": {
          "children": "Hello"
        }
      },
      {
        "type": "div",
        "props": {
          "className": "wrap",
          "children": [
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
          ]
        }
      }
    ]
  }
}
{% endcodeblock %}

4. 所有函数执行完成

注意：

* 若只有一个子节点，则 children 字段的值是子节点，见第9行、第21行；若有多个子节点，则 children 字段的值为子节点数组，见第5行、第16行。

* React.createElement 的函数签名有 type/props/children 的概念，React.createElement 返回的 JSON 数据里也有 type/props/children 字段。二者需要分开理解，注意不要混淆。

{% codeblock lang:json %}
{
  "type": "div",
  "props": {
    "className": "container",
    "children": [
      {
        "type": "h1",
        "props": {
          "children": "Hello"
        }
      },
      {
        "type": "div",
        "props": {
          "className": "wrap",
          "children": [
            {
              "type": "div",
              "props": {
                "className": "second-wrap",
                "children": {
                  "type": "img",
                  "props": {
                    "src": "https://www.reactjs.org"
                  }
                }
              }
            },
            {
              "type": "div",
              "props": {
                "children": null
              }
            }
          ]
        }
      }
    ]
  }
}
{% endcodeblock %}

## 总结

* JSX 不神秘，编译后也是普通的 JS 函数。

* 在 React 中执行 JSX，所有函数调用完成后，便能得到一棵 DOM 树。

* React 中虚拟 DOM 的概念总所周知，上文得到的 JSON 结构的 DOM 即为虚拟 DOM。

* 最新版本的 React 的执行过程异步可中断，其执行过程分为 render 阶段和 commit 阶段。（render 阶段处理虚拟 DOM，可中断；commit 阶段将虚拟 DOM 转为真实 DOM，不可中断。）

* 本文讲述的 “在 React 中执行 JSX” 对应 React 的 render 阶段，真正的 React 代码在执行过程中需要就行 DIFF 计算，并做好增/删/改的标志。（commit 阶段将根据这些增/删/改的标志更新真实 DOM。）

## 参考文档

[JSX 简介](https://zh-hans.reactjs.org/docs/introducing-jsx.html)
