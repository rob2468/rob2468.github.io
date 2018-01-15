---
layout: post
title: 像素如何被绘制到屏幕上（Getting Pixels onto the Sceen）（译）
page_id: id-2018-01-14
---

<h1 class="title">{{ page.title }}</h1>

将内容显示到屏幕上，有许多方式可以实现。这个过程包含许多框架，依靠许多函数和方法的组合实现。本文讨论该过程的底层原理。当你需要考虑相关性能问题时，本文内容能够帮助挑选最优的 API。本文研究的对象是 iOS 系统，不过其中大部分内容也适用于 OS X。

<h2 id="section_1">一、图形栈（Graphics Stack）</h2>

内容显示到屏幕的过程有许多工作。但当内容显示到屏幕上后，当前的结构就很简单，每个像素都是由3个颜色单元组成：红色、绿色和蓝色。屏幕上某个像素点显示了特定颜色，本质上就是，组成该像素的红绿蓝这3个颜色单元被使用特定亮度点亮。在 iPhone 5上，屏幕有 1,136×640 = 727,040 个像素，因此有 2,181,120 个颜色单元。在拥有视网膜显示屏的 15" MacBook Pro 上，这个数值超过一千五百万。整个显示系统的软硬件通力合作，确保每个颜色单元使用了正确的亮度点亮。当你滑动视图时，百万数量级的亮点必须每秒钟更新60次。这是一个巨大的工作量。

<h3 id="section_1_1">1.1 软件组件（The Software Components）</h3>

下面相关软件组件的简图：

<div align="center"><img src="https://www.objc.io/images/issue-3/pixels-software-stack@2x-1ae69f5a.png" alt="" width="70%" /></div>

紧靠着 Display 的是 GPU（graphics processing unit）。GPU 为图形并行计算量身定制，是一个高度并发的处理器单元。因此，它能够处理大量的像素计算并将处理结果显示到屏幕上。GPU 的并行计算能力也使得 Texture 的合成非常高效，本文后面会详细讨论。重点是，GPU 是非常专业的处理器，擅长处理这种类型的计算，比起 CPU，它计算更快，功耗更小。普通 CPU 的设计考虑的是一般性的计算，它可以做很多不同类型的事情，但是比如纹理合成这种工作，执行起来会比 GPU 慢一点。

GPU Driver 是一些直接与 GPU 通信的代码。GPU Driver 可以看成是对各种复杂 GPU 的封装，为调用方提供标准化的接口。相邻 GPU Driver 的调用方通常是 OpenGL / OpenGL ES。

OpenGL（<a href="https://en.wikipedia.org/wiki/OpenGL">Open Graphics Library</a>）是用来进行 2D 和 3D 图形绘制的 API。上文说到 GPU 是非常专业化的硬件，OpenGL 能够与 GPU 密切合作，释放 GPU 性能，实现硬件加速渲染。对很多人来说，OpenGL 似乎是非常底层的 API，但是1992年首次发布时，它是与 GPU 通信的第一个主要标准化方式。程序员不再需要为每一种 GPU 重写他们的代码，这个一个巨大的进步。

上图中，OpenGL 再往后有些分散。当前的 iOS 系统中，几乎所有的事情都得经过 Core Animation，但是 OS X 系统中，Core Graphics 绕过 Core Animation 的情况并不罕见。对于一些专门的应用程序，尤其是游戏应用，可能会直接与 Open GL / OpenGL ES 通信。Core Animation 会利用 Core Graphics 来实现一些绘制，这让事情变的更加混乱。一些框架，比如 AVFoundation、Core Image，会用到其中的多种技术。

上面说了这么多，需要记住以下几点。GPU 是一个非常强大的图形硬件，在显示内容过程中起着中心作用。GPU 通过一些总线与 CPU 相连。OpenGL、Core Animation、Core Graphics 这些框架组织着 GPU 和 CPU 之间的数据传输。为了在屏幕上显示内容，首先需要在 CPU 上进行一些处理，然后数据被传输到 GPU，再经过 GPU 处理，最后像素在屏幕上显示出来。

这个过程中的每一步都有自己的挑战，并且需要做各种权衡。

<h3 id="section_1_2">1.2 硬件组件（The Hardware Players）</h3>

<div align="center"><img src="https://www.objc.io/images/issue-3/pixels,%20hardware@2x-861825d9.png" alt="" width="70%" /></div>

上文说的挑战一个非常简单的例子可能是这样的：GPU 有许多合成好的 Texture（位图），这些 Texture 是为每一帧（1秒钟60次）准备的。每一个 Texture 需要占用部分 VRAM（video RAM），GPU 能够持有的 Texture 总数存在上限。虽然 GPU 很擅长合成，但总有一些合成任务要比另一些任务更加复杂，GPU 在16.7毫秒（1/60秒）内能够完成的工作存在上限。

下一个挑战是把数据传送到 GPU。数据需要从 RAM 转移到 VRAM，GPU 才能够处理。这被称为上传到GPU。这项工作似乎微不足道，但对于大的 Texture，这仍然是一项耗时的工作。

最后，CPU 运行着你的程序，你要求 CPU 从磁盘载入一张 PNG 并解压。这些都工作都发生在 CPU 上。当你想在屏幕上显示这张解压的 PNG，就需要将数据上传到 GPU。一些普通操作，比如在屏幕上显示文本，对 CPU 来说也是非常复杂的任务，CPU 需要紧密整合 Core Text 和 Core Graphics 框架，从文本生成位图。这项工作完成后，数据被当成 Texture 上传到 GPU，准备展示。当你在屏幕上移动文本，相同的 Texture 是能够复用的。CPU 只需告诉 GPU 新的位置，GPU 便能重用已经存在的 Texture。CPU 不必重新渲染文本，且位图不必重新上传。

上文描述了目前为止遇到的复杂问题，后面本文深入讲述其中涉及的技术。

<h2 id="section_2">二、合成（Compositing）</h2>

合成是图像领域的术语，描述的是不同的位图是如何整合在一起并最终形成屏幕上看到的图像。从许多方面来看，这件事情是如此显而易见，以至于我们很容易忽略其中的复杂程度和计算。

暂且忽略一些复杂深奥的情况，假设屏幕上所有东西是一个 Texture。Texture 是一个由 RGBA 值组成的矩形区域，也就是说每个像素包含有红色、绿色和蓝色值，还有透明度值。Core Animation 中的 CALayer，本质上就是 Texture。

在上述简单设定下，每个层是一个 Texture，所有的 Texture 以特定方式互相堆叠在一起。对于屏幕上的每个像素，GPU 需要弄清楚如何混合这些 Texture 以得到该像素的 RGB 值。这便是合成的含义。

如果我们只有一个 Texture，这个 Texture 的尺寸和屏幕相同，并且和屏幕的像素对齐，那么屏幕上的每个像素都对应了 Texture 中的一个像素。这个 Texture 的像素最终成为屏幕上显示的像素。

如果我们需要将第二个 Texture 放到第一个 Texture 的上面，GPU 就需要将这个 Texture 合成到第一个 Texture 上。Texture 有不同的混合方式，假设两个 Texture 按像素对齐并且采用正常混合的方式，每个像素可以使用下面的公式计算出最终的颜色：

<div class="code"><pre><code>R = S + D * (1 - Sa)</code></pre></div>

R 表示最终颜色；S 表示源颜色，对应的是上层的 Texture；D 表示目标颜色，对应的是下层的 Texture；Sa 表示源颜色的透明度值。这个公式中的所有颜色（R、S、D）都已经预先乘以了它们的透明度值。

下面通过几个例子来理解上面这个公式。假设所有的 Texture 都是不透明的，也就是说透明度值为1。如果下层 Texture 的一个像素为蓝色（RGB = 0, 0, 1），上层 Texture 的对应像素为红色（RGB = 1, 0, 0），因为 Sa = 1，代入公式计算：

<div class="code"><pre><code>R = S</code></pre></div>

最终颜色值为上层 Texture 的红色。符合实际情况。

基于上面的例子，假设上层 Texture 有 50% 的透明度，也就是说透明度值为0.5，则 S = （0.5, 0, 0）。代入公式计算：

<div class="code"><pre><code>                       0.5   0               0.5
R = S + D * (1 - Sa) = 0   + 0 * (1 - 0.5) = 0
                       0     1               0.5
</code></pre></div>

最终得到颜色值为（0.5, 0, 0.5），是一种紫色。半透明的红色叠加到蓝色背景上，从直觉上判断正是这种颜色。

我们上面做的计算处理的是，将一个 Texture 的一个像素合成到另一个 Texture 中的一个像素。GPU 需要计算的是两个 Texture 重叠部分的所有像素。通常情况下，大多数应用包含了大量的视图层级，这些内容需要被合成到一起。尽管 GPU 为此高度优化，但这些工作已足以使得 GPU 处于忙碌状态。

<h3>Opaque vs. Transparent</h3>

<h3></h3>

<h3></h3>

<h3></h3>

<h3></h3>

<h3></h3>


<h2 id="section_3">三、Core Animation & OpenGL ES</h2>

<h2 id="section_4">四、Core Graphics / Quartz 2D</h2>

<h2 id="section_5">五、Pixels</h2>

<h2 id="section_6">六、Image Formats</h2>

<h2 id="section_7">七、UIKit and Pixels</h2>

<h2 id="section_8">八、CALayer Odds and Ends</h2>

<h3>参考文献：</h3>

<a href="http://twitter.com/danielboedewadt">Daniel Eggert</a>. <a href="https://www.objc.io/issues/3-views/moving-pixels-onto-the-screen/?from=timeline&isappinstalled=0">Getting Pixels onto the Screen</a>