---
layout: post
title: 视图裁剪
page_id: id-2018-10-12
---

<h1>{{ page.title }}</h1>

<h2>前言</h2>

<a href="https://github.com/rob2468/HttpServerDebug" target="_blank">HttpServerDebug</a> 实现了类似 Xcode Debug View Hierarchy 功能。客户端提供信息，前端绘制并提供交互能力，实现视图调试功能。

视图调试其中一项功能是 Show Clipped Content，虽然不知道 Xcode 的实现方式，但是通过计算我们也可以拿到同样的信息。本文说明 HttpServerDebug 中的实现方案。

<h2>效果图</h2>

<p class="post-image">
    <img src="/resources/figures/2018-10-12-hsd-clipped-content.png" alt="HttpServerDebug Show Clipped Content" width="90%">
</p>

<p class="post-image-title">HttpServerDebug 效果截图</p>

<p class="post-image">
    <img src="/resources/figures/2018-10-12-xcode-clipped-content.png" alt="Xcode Show Clipped Content" width="90%">
</p>

<p class="post-image-title">Xcode 效果截图</p>

上面一组截图是 HttpServerDebug 运行效果，下面一组截图是 Xcode 中的原生效果。

<h2>代码实现</h2>

下面代码的目的是计算目标视图的位置和尺寸。

需要注意的是，代码中获取的 CGRect 信息来自于视图的 bounds 属性而不是 frame。bounds 可以理解为目标视图的内容在自己的坐标系统中的位置和尺寸，frame 是目标视图在父视图坐标系统中的位置和尺寸。我们使用了一系列转换函数实现不同坐标系统中的位置和尺寸转换，所以不需要直接获取 frame 属性。

<div class="code"><pre><code>// view：UIView，目标视图
// window：UIWindow，view 属于该 window 视图层级
CGRect tryClippedRect = view.bounds;
UIView *tryView = view;
while (tryView.superview) {
    UIView *superview = tryView.superview;

    // 目标视图的位置和尺寸转换到父类的坐标系统中
    tryClippedRect = [tryView convertRect:tryClippedRect toView:superview];

    if (!CGSizeEqualToSize(tryClippedRect.size, CGSizeMake(0, 0)) &&
        superview.clipsToBounds) {
        // 需要裁剪
        CGRect baseRect = superview.bounds;
        tryClippedRect = CGRectIntersection(tryClippedRect, baseRect);
        tryClippedRect = CGRectIsNull(tryClippedRect) ? CGRectZero : tryClippedRect;
    }
    tryView = superview;
}
// 在 window 坐标系统中的位置和尺寸
CGRect clippedFrameRoot = tryClippedRect;
</code></pre></div>

上面代码只是计算出了位置和尺寸，调试界面显示还需要对目标视图进行截图，如下面代码所示。

（默认截图会包含目标视图的子视图，否则需要在截图前先移除或隐藏所有的子视图。）

<div class="code"><pre><code>// 目标视图坐标系统中的裁剪位置
CGPoint clippedOrigin = [view convertPoint:clippedFrameRoot.origin fromView:window];

// 截图
UIGraphicsBeginImageContextWithOptions(clippedFrameRoot.size, NO, 0.0);
CGContextRef context = UIGraphicsGetCurrentContext();
CGFloat tx = -clippedOrigin.x;
CGFloat ty = -clippedOrigin.y;
CGContextTranslateCTM(context, tx, ty);
[view.layer renderInContext:context];
UIImage *snapshot = UIGraphicsGetImageFromCurrentImageContext();
UIGraphicsEndImageContext();
</code></pre></div>
