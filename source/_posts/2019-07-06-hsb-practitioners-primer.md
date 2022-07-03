---
layout: post
title: HSB 颜色系统实践入门（译）
page_id: id-2019-07-06
tag:
- 翻译
- 读书笔记
---

<h1 class="title">{{ page.title }}</h1>

<h2>前言</h2>

本文翻译自 <a href="https://learnui.design/blog/the-hsb-color-system-practicioners-primer.html" target="_blank">The HSB Color System: A Practitioner's Primer</a>。

<!-- more -->

为什么网上没有一篇好的解释 HSB 颜色系统的文章，我觉得这很蠢。Google 有 250 万的 HSB 搜索结果，但是实际使用这套系统的人有多少呢？我必须自己做这件事吗？

好的方面是，现在在我喝完这杯啤酒的时候，我有了事情可做。

我们将要讲解 H、S、B 是什么。然后，我会告诉你，为什么这是广泛使用的最好的颜色系统。最后，我会讲解在日常数字设计中使用它的一些复杂问题。

如果你已经熟悉了 H、S、B，你可以直接跳到 <a href="#section_2">HSB 实践</a>。

<h2 id="section_1">依次解释各个字母</h2>

你的电脑内部都是由 0 和 1 组成，对于你的电脑来说，颜色只不过是一个个的比特位。如果你认为颜色是由空灵的魔法生成的神秘彩虹，那你知道事实可能会变得沮丧。实际上，这个星球上的每一台电脑呈现的任意一种颜色，只不过需要3个数字就能表示。

不过，这3个数字的差别很大。

如果你曾今使用 HTML 和 CSS 写过代码，你可能对 RGB 比较熟悉。每一种颜色由3个数字表示：(1)红色的程度用 R 表示，(2)绿色的程度用 G 表示，(3)蓝色的程度用 B 表示。这听起来像是某个人在他喝高的时候编出来的，实际上，RGB 非常简单可靠，它是计算机处理颜色的默认方式。

但是，只是因为计算机容易理解 RGB，并不表示人类也容易理解。这里就引出了 HSB。

HSB 代表色调 (hue) - 饱和度 (saturation) - 亮度 (brightness)，它是对人类非常友好的描述颜色的方法。为什么它这么棒？因为它的思想基于我们平常使用的描述颜色的想法。接下来，我会讲给你听。

<h3 id="section_1_1">色调 = “彩虹的颜色”</h3>

色调是一个 0 到 360 的数字。它的单位是度，就像一个圆的度数。记得色彩环吗？色调就是色彩环上的某个值。

<!-- <p class="post-image"><img src="/resources/figures/2019-07-06-color-wheel.png" alt="The color wheel" width="35%"></p> -->

![](/images/2019-07-06-color-wheel.png)

<p class="post-image-title">The color wheel – AKA the hue wheel</p>

现在，这忽略了颜色有多暗、明亮、丰富或者苍白。我们待会儿就会讲到这些。现在只要知道，要找到色调，想想它在色彩轮上最接近的颜色。

如果你想对 HSB 有一个直观的理解，你应该考虑几个固定点。我使用红色、绿色和蓝色，因为它们在色彩轮上的距离各自相等。

<ul>
<li>红色是 0°</li>
<li>绿色是 120°</li>
<li>蓝色是 240°</li>
<li>红色也是 360°，跟 0° 相同</li>
</ul>

因此，当我考虑要添加什么颜色时，我可以快速地输入一个数字。通过考虑这三个点的位置，我可以非常接近正确的色调。

<h3 id="section_1_2">饱和度 = “丰富度”</h3>

饱和度是一个介于 0 和 100 之间的数字。所以，无论你选择了什么色调，100% 的饱和度是该颜色最丰富的版本，0% 的饱和度是该颜色的灰色版本（也就是说，如果颜色较浅，则为浅灰色；如果颜色较暗，则为深灰色）。

想要看看吗？

<!-- <p class="post-image"><img src="/resources/figures/2019-07-06-saturation.png" alt="saturation" width="80%"></p> -->

![](/images/2019-07-06-saturation.png)

饱和度很简单。我有时会把它想象成向灰色中注入的颜色的数量。所以，0% 是纯灰色，100% 是你的显示器能做出的最多彩的颜色。

<h3 id="section_1_3">亮度 = 亮度，额...</h3>

亮度是介于 0 和 100 之间的数字。像饱和度一样，它有时被写成一个百分比。亮度的含义显而易见，但很快会有下面的发现。

<ul>
<li>0% 亮度的颜色是黑色，无论色调和饱和度是多少。</li>
<li>只有当饱和度为 0%，100% 亮度的颜色才为白色。否则，100% 的亮度只是…非常明亮的颜色。</li>
</ul>

听起来很困惑？可以这样想。想象一下亮度是个有色灯泡。0% 表示灯泡关闭（房间内变黑）。100% 表示光的强度最大，亮度最大的灯泡是一种明亮的颜色。如果光已经是白色的，那么 100% 的亮度是纯白色的。

<!-- <p class="post-image"><img src="/resources/figures/2019-07-06-brightness.png" alt="brightness" width="80%"></p> -->

![](/images/2019-07-06-brightness.png)

好了，回顾一下，我们可以用三个合理的数字来描述一种颜色：

<ul>
<li>色调：色彩轮上最接近的颜色，取值范围是 0° 到 360°</li>
<li>饱和度：如何注入色彩，取值范围是 0% 到 100%</li>
<li>亮度：“灯泡”开了多少，取值范围是 0% 到 100%</li>
</ul>

<h2 id="section_2">HSB 实践</h2>

如果你还在，我想开始讨论使用这个系统的实用性。如果你从未使用过 HSB，不要对即将出现的细节感到太多恐惧……先试一下吧。把事情搞得一团糟，然后再回来。使用一段时间后，一切会更有意义。

<h3 id="section_2_1">随色调变化的颜色</h3>

首先，色调是一种创造色彩变化的绝佳方式。因为从 0° 到 360° 你有很多的选择，而不是简单地把蓝色设为“蓝色”。你可以稍微向下或向上改变一下色调，很容易就能得到漂亮的变体。

<!-- <p class="post-image"><img src="/resources/figures/2019-07-06-blue-color-variations.png" alt="blue-color-variations" width="80%"></p> -->

![](/images/2019-07-06-blue-color-variations.png)

我们从一个标准的蓝色开始，它在色彩环 240° 的位置。但是，我们不会选择最无聊的颜色，而是决定稍微加点变化。

即使只是把色调调低 30° 变成 210°，也能营造出一种凉爽的氛围，更轻，更有趣，更随意。有点像来到 Twitter 的页面，但这只是第一步。

把色调调到 260°，得到了靛蓝。仅仅 20 度的变化，就带来一种完全不同的感觉 —— 一些更酷的东西，可能适用于霓虹灯颜色或者深色背景；给一些东西带来微妙的女性气息。等等之类。你明白的。

<!-- <p class="post-image"><img src="/resources/figures/2019-07-06-red-color-variations.png" alt="color-variations" width="80%"></p> -->

![](/images/2019-07-06-red-color-variations.png)

同样的，红色。这是相当棘手的颜色，出门时很难搭配。超级大胆，超级强势。但是，根据我们想要做的，比如说这是我们的错误信息颜色或者其他什么，我们可以通过注入少量的粉色（将色调降低 10°），使其更友好。或者，我们可以通过添加一些橙色，来获得一种更稳重的变体。

所以，使用色调可以给自己很多选择。帮自己一个忙：不要把你的调色板限定在你在幼儿园学到的颜色上。多玩玩它。

<h3 id="section_2_2">使用饱和度来调整可见性</h3>

调整饱和度关乎很多技术和技巧，但是，我一直来回关注的是关于可见性的调整。

如果有一种颜色压倒了你用户界面中的所有东西，那么一个快速修复它的方法就是减少饱和度。

比如，看看 Google Logo 上的这种变化。我把蓝色的饱和度调整到了 90%，你会发现它变得非常引入注目。

<!-- <p class="post-image"><img src="/resources/figures/2019-07-06-google-saturated.png" alt="google-saturated" width="50%"></p> -->

![](/images/2019-07-06-google-saturated.png)

留意一下蓝色有多突出。如果你看不到它，试着放松你的眼睛，然后盯着 Logo 几秒钟。几乎立刻，你就会看到 “G” 和 “g” 从其他颜色中弹出。

<!-- <p class="post-image"><img src="/resources/figures/2019-07-06-google-normal.png" alt="google-normal" width="50%"></p> -->

![](/images/2019-07-06-google-normal.png)

在正常的 Google Logo 中，不同颜色之间有着更好的平衡。

你会使用饱和度来处理各种各样的事情，包括修复冲突颜色和丰富你的暗色。这里，我只是想给出一个快速的例子。现在，让我们继续讨论 HSB 的一个更有趣的事实 —— 以及它的含义。

<h2 id="section_3">白色的对立面不是黑色</h2>

在 HSB 中，我们使用如下方法构造出黑色和白色：

<ul>
<li>黑色：将亮度设为 0%。色调和饱和度可以为任意值。</li>
<li>白色：将亮度设为 100%，并且饱和度设为 0%。色调仍然可以为任意值。</li>
</ul>

有趣的是，这意味着（在 HSB 系统中）黑色不是白色的反义词。

另一种向你自己证明这一点的方法是思考在一种颜色中添加黑色或白色意味着什么。

要添加白色，必须在颜色选择器上将颜色移到白色。白色在左上角，可以肯定的是，增加白色包括降低饱和度（向左移动）和增加亮度（向上移动）。

<!-- <p class="post-image"><img src="/resources/figures/2019-07-06-adding-white.png" alt="adding-white" width="30%"></p> -->

![](/images/2019-07-06-adding-white.png)

<p class="post-image-title">Going from one red to a whiter red.</p>

增加白色看起来像下面这样：

<!-- <p class="post-image"><img src="/resources/figures/2019-07-06-adding-white-swatches.png" alt="adding-white-swatches" width="80%"></p> -->

![](/images/2019-07-06-adding-white-swatches.png)

但是添加黑色？好吧，因为黑色是颜色选择器矩形的整个底部，添加黑色只需要降低亮度。饱和度的值与此无关。

<!-- <p class="post-image"><img src="/resources/figures/2019-07-06-adding-black.png" alt="adding-black" width="30%"></p> -->

![](/images/2019-07-06-adding-black.png)

<p class="post-image-title">Going from one red to a blackr red.</p>

这两种情况的箭头不能互相抵消！在 HSB 中，黑白不是对立的。

从实用的角度来看，与较浅的版本相比，通过添加黑色得到的暗色非常乏味：

<!-- <p class="post-image"><img src="/resources/figures/2019-07-06-adding-black-swatches.png" alt="adding-black-swatches" width="80%"></p> -->

![](/images/2019-07-06-adding-black-swatches.png)

需要特别说明的是：我希望你去掉白色，而不是增加黑色。换句话说，同时：

<ul>
<li>增加饱和度</li>
<li>降低亮度</li>
</ul>

或者，如果您更喜欢图表的话：

<!-- <p class="post-image"><img src="/resources/figures/2019-07-06-removing-white.png" alt="removing-white" width="30%"></p> -->

![](/images/2019-07-06-removing-white.png)

<p class="post-image-title">Going from one red to a less white red.</p>

这将给你更丰富的暗色：

<!-- <p class="post-image"><img src="/resources/figures/2019-07-06-removing-white-swatches.png" alt="removing-white-swatches" width="80%"></p> -->

![](/images/2019-07-06-removing-white-swatches.png)

去除白色 —— 也就是说，让你的暗色调更丰富 —— 是产生 95% 以上颜色的暗变化的“正确”方法。

<h2 id="section_4">额外说明：HSL 和 HSB 有什么不同？</h2>

你们中间的前端开发者可能知道 CSS 使用了一个颜色系统 HSL，色调（hue）、饱和度（saturation）、亮度（lightness）。这听起来有点耳熟。HSB 和 HSL 是一样的吗？

简短的回答：不一样，但它们是相似的。

既然你已经是 HSB 的专家，我可以很简单地解释：HSL 和 HSB 完全一样，除了 HSL 的黑白是对立的这一点。

所以，在 HSL 中：

<ul>
<li>获得黑色：将亮度设为 0%（色调和饱和度无关）</li>
<li>获得白色：将亮度设为 100%（色调和饱和度无关）</li>
</ul>

现在这很好，但是一旦你试图直观地描述，如何在两个系统之间转换，事情就会变得混乱。

<ul>
<li>添加亮度（lightness）超过 50% 与添加白色相同（意味着，对应在 HSB 系统下，饱和度降低、亮度升高）。</li>
<li>减去亮度（lightness）低于 50% 与添加黑色相同（对应在 HSB 系统下，饱和度没有影响，但亮度降低）。</li>
</ul>

所以 HSL 的亮度属性是 HSB 的饱和度和亮度的奇怪混合，这取决于它的亮度值！

尽管如此，黑白相对的系统可能实际上是一个更加合理的系统。但现代的 UI 设计应用程序（Sketch、Figma 和 Adobe XD）都使用的是 HSB，而不是 HSL。坦率地说，你的 UI 设计应用程序只是你挑选和调整颜色的第一步。所以，让我们保持简单：如果你想将颜色值从设计转换为代码，只使用十六进制值。（虽然它远比任何一个系统都不易理解！）

（但是，至少你能够进行复制和粘贴。）

<!-- <p class="post-image"><img src="/resources/figures/2019-07-06-hsb-cone-and-hsl-dicone.png" alt="hsb-cone-and-hsl-dicone" width="80%"></p> -->

![](/images/2019-07-06-hsb-cone-and-hsl-dicone.png)

<p class="post-image-title">Image courtsey of Wikipedia's <a href="https://commons.wikimedia.org/wiki/File:Color_solid_comparison_hsl_hsv_rgb_cone_sphere_cube_cylinder.png" target="_blank">SharkD</a></p>

如果你对了解更多颜色系统知识感兴趣，这张图包含了启发你的种子。它应该明确了 HSB 和 HSL 之间细微但关键的区别。但是，像这样划分颜色空间让我们离开了实践，而进入了理论，所以我还是交给其他人吧。

<h3>参考文献：</h3>

<a href="https://learnui.design/blog/the-hsb-color-system-practicioners-primer.html" target="_blank">The HSB Color System: A Practitioner's Primer</a>
