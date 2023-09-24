---
layout: post
title: 边框可拉伸的盒子
tags:
  - CSS
---

# {{ page.title }}

## 问题

前端开发中有时会遇到如下图所示的需求，即在一个不规则边框的容器中显示内容。本文讲述如何拆解这个需求，并通过 border-image CSS 属性实现。(下文讲解使用的原始图片是[这个](/images/2023-09-22-dialog.png)。)

![](/images/2023-09-22-示例.jpg)

<!-- more -->

border-image 的完整语法很复杂，不关心细节可以直接跳到 [后面的章节](#简化)。

## 需求拆解

1. 准备图片。首先我们需要一张图片，图片的四个角可以是不规则的，但四条边和背景色是可以拉伸的；

2. 测量四个角需要保留的长度；

3. 测量边的宽度；

4. 尺寸调整。因为图片渲染是不会超出盒模型的，所以很有可能视觉效果上边框与内容会靠的太近，因此需要让图片渲染的超出盒模型一些。

## 方案

使用 [border-mage](https://developer.mozilla.org/zh-CN/docs/Web/CSS/border-image) CSS 属性可以实现这个需求。从 2012 年下半年开始，Chrome Android 和 Safari on iOS 都已经支持了该属性。

border-image 的值是一组 CSS 属性的缩写，分别是 [border-image-source](https://developer.mozilla.org/zh-CN/docs/Web/CSS/border-image-source) / [border-image-slice](https://developer.mozilla.org/zh-CN/docs/Web/CSS/border-image-slice) / [border-image-width](https://developer.mozilla.org/zh-CN/docs/Web/CSS/border-image-width) / [border-image-outset](https://developer.mozilla.org/zh-CN/docs/Web/CSS/border-image-outset) / [border-image-repeat](https://developer.mozilla.org/zh-CN/docs/Web/CSS/border-image-repeat)。他们各自的含义可以参考官方 MDN 文档，下面只讲述一下要点。

### border-image-slice 的作用

图片渲染的要求是四个角固定、剩余区域拉伸，border-image-slice 的作用就是将固定区域与可拉伸区域划分出来。

border-image-slice 对于图片不同区域的划分如下图所示。

![(来自 MDN 文档)](/images/2023-09-22-border-image-slice-position.png)

border-image-slice 的值相对的是图片本身的大小。

比如，`border-image-slice: 40` 划分出的区域如下图所示。(红色方块为固定区域、剩余的为可拉伸区域)

![](/images/2023-09-22-border-image-slice-demo.jpg)

### border-image-width 的作用

border-image-width 用户指定边框的宽度。比如，当 border-image-width 指定四个值时，则分别表示上右下左，含义如下图所示。

![](/images/2023-09-22-border-image-width-demo.jpg)

注意，border-image-slice 的值相对的是图片本身的大小，border-image-width 的值是 DOM 元素的大小。所以，如果 border-image-width 的值大于 border-image-slice 的值，则固定区域的图像会被拉伸；反之固定区域的图像会被压缩。

### border-image-outset 的作用

“border-image-outset 属性定义边框图像可超出边框盒的大小。”

下图示例可以看懂 border-image-outset 属性的作用。

![](/images/2023-09-22-border-image-outset-demo.jpg)

## 简化

实现本文开头所说的需求，关键点是将 border-image-slice 和 border-image-width 设置一样的值，这样保证四个角内的图像按原始大小显示。

### 代码

```
// React 组件
const StretchBorderBox = (props) => {
  const { imgUrl, fixedLength, outset, content } = props;
  return (
    <div
      className="stretch-border-box"
      style={{
        borderImageSource: `url(${imgUrl})`,
        borderImageSlice: `${fixedLength} fill`,
        borderImageWidth: `${fixedLength}px`,
        borderImageOutset: outset,
        borderImageRepeat: 'stretch',
      }}
    >
      {content}
    </div>
  );
};

// 渲染组件
ReactDOM.render(
  <StretchBorderBox imgUrl="https://mdn.alipayobjects.com/huamei_kmi0zi/afts/img/A*vLdFTYMEEzkAAAAAAAAAAAAADv17AQ/original"
    fixedLength={40}
    outset="19px 19px 19px 35px"
    content="这个孩子会非常有名， 我们世界里的每一个人都会知道他的名字。"

  />,
  document.getElementById('app')
);
```

### Demo

<iframe
  width="100%"
  height="300"
  src="https://rob2468.github.io/mypage/stretch-border-box-demo/"
>
</iframe>

## 结语

本文讲述的是实现一个边框可拉伸盒子（比如对话框）的相关技术。

其中的一些知识点对你理解 border-image CSS 属性也有帮助。
