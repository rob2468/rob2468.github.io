---
layout: post
title: 可循环滚动的 ScrollView
page_id: id-2016-05-26
---

# {{ page.title }}

代码：[CycleScrollView](https://github.com/rob2468/CycleScrollView)

上述代码实现可循环滚动的 ScrollView。具体需求有如下2点：

1、支持分页滚动；

2、支持循环滚动。

实现参考了网上搜到的一些方案，经过几次优化，形成最终的版本。许多实现存在一些缺陷，比如，快速滑动时会卡住，等 ScrollView 停止滑动后再滑动就可以了。最初的版本也存在这个问题，因为布局调整是在 scrollViewDidEndDecelerating 中实现的，快速滑动时不会调用到该方法中。

<!-- more -->

下面讲述实现原理。

使用的 ScrollView 为 UICollectionView，每个分页为一个 cell，这样能够利用到 UICollectionView 的 cell 重用特性，降低内存消耗。

使用 UIScrollView 原生的分页功能，即，将 pagingEnalbed 属性设为 YES。

在 ScrollView 的头尾分别增加一页。搜索到许多这种实现方案，即复制最后一页的内容添加为第一页，复制原始第一页的内容添加为最后一页。这样，比如当滑到原始最后一页时，下一页的内容为原始的第一页，此时再作一些布局调整，便能模拟循环滚动的效果。

下面说的就是如何进行布局调整。开头说过，由于最初的实现是在 scrollViewDidEndDecelerating 中调整布局，因此 ScrollView 快速滑动时会卡住，因为没有触发到该方法。为了修复该问题，将布局调整改为在 scrollViewDidScroll 中实现，下面是核心代码。

<p></p>

<pre><code>if (currentOffsetX < pageWidth && currentOffsetX < lastContentOffsetX) // 右划
{
    // 修改布局
    lastContentOffsetX = currentOffsetX + offset;
    bounds.origin.x = lastContentOffsetX;
    scrollView.bounds = bounds;
}
else if (currentOffsetX > offset && currentOffsetX > lastContentOffsetX) // 左划
{
    // 修改布局
    lastContentOffsetX = currentOffsetX - offset;
    bounds.origin.x = lastContentOffsetX;
    scrollView.bounds = bounds;
}
else
{
    lastContentOffsetX = currentOffsetX;
}
</code></pre>

以第一个 if 判断分支为例，ScrollView 展示的是原始第一页并开始滑入复制在开头的原始最后一页。此时需要调整布局，调整后的状态是 ScrollView 展示复制在最后的原始第一页并开始滑入原始最后一页。

还有一个需要注意的是修改 ScrollView 的 contentOffset 的方式`scrollView.bounds = bounds`，这种方式不会触发 ScrollView 的 delegate 方法。最初的实现是`[scrollView setContentOffset: animated:NO]`，在 scrollViewDidScroll 中这样修改 contentOffset 又会触发到 scrollViewDidScroll，引起连锁反映。如果慢慢的滑动 ScrollView，会出现分页错误，ScrollView 停留在一页的中间。

下面是 demo 截图，ScrollView 展示3页视图，左滑和右滑能够无限循环。

<p></p>

<!-- <p class="post-image"><img src="/resources/figures/2016-05-26-Cycle-Scroll-View.png" alt="demo" width="50%" height="50%"></p> -->

![](/images/2016-05-26-Cycle-Scroll-View.png)

<p class="post-image-title">demo截图</p>
