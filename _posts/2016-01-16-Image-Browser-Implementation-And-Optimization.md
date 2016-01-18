---
layout: post
title: 图片查看器中单张图片浏览的实现与优化（类似微信中的实现效果）
---

# {{ page.title }}

## 一、背景

百度浏览器3.1版本引入了图片查看器。我在3.2版本接手该模块，并修改与优化。百度浏览器中的图片查看器效果和微信中查看本人已发布照片调起的图片查看器功能类似。百度浏览器中许多模块能够调起图片查看器，如下载页面、趣星球、网页，以提供用户一致的图片浏览体验。

图片查看器的整体设计不必多说。在图片查看器中浏览单张图片时，为了实现最优的浏览体验，自己花了不少时间调试。本文对该部分功能中的知识和经验做记录。

## 二、开发与调试记录

图片尺寸千差万别，设备屏幕有限，并且可以横竖屏旋转。和PM、UX讨论，制定了一些策略，使图片刚打开时显示的比较美观，比如，短图片竖屏时要左右贴边、竖直方向居中显示，长图片竖屏时要左右贴边、竖直方向头部贴边显示。

图片静态展示时的显示策略通过分情况处理，能够达到最优效果。图片查看器还支持用户浏览单张图片时与其交互，支持双击图片实现缩小和放大，支持双指捏合图片实现缩小和放大。

经过初期调研，确定了一些基本原则。

1. 图片置于UIScrollView中，并且缩小和放大的实现由UIScrollView的zoom功能支持。
2. UIScrollView的内容视图尺寸需占满UIScrollView的视图尺寸范围，否则UIScrollView无法正确的响应用户的手势，如拖动、缩放。

在开发过程中经历了三套设计方案。

<div align="center"><img src="http://7xilqo.com1.z0.glb.clouddn.com/2015-01-16-%E4%B8%8D%E5%90%8C%E8%AE%BE%E8%AE%A1%E6%96%B9%E6%A1%88%E7%9A%84%E8%A7%86%E5%9B%BE%E5%B1%82%E7%BA%A7.png" alt="" width="80%" /></div>

<div align="center">图1. 各设计方案的视图层级</div>

方案一：如图1所示，将所要展示的Image View添加到Content View中，再将Content View添加到Scroll View中。保持Content View的尺寸始终占满Scroll View的视图尺寸范围，并且设置Content View响应缩放操作。此方案通过添加额外的视图解决问题，但是需要在不同的坐标系下计算视图位置。计算Image View的位置和尺寸需要在Content View的坐标系下，计算Content View的位置和尺寸需要在Scroll View的坐标系下，同时Image View的位置和尺寸还必须相对于屏幕以最优的方式展现。这种方案使计算变得复杂，没有采纳。

方案二：如图1所示，首先添加了Background View，Background View作为其它视图的容器，不会发生位置和尺寸的变化。在Backgroud View上添加了Scroll View，在Scroll View上添加了Image View。不同于方案一，在本方案中Scroll View的位置和尺寸会根据Image View的变化而改变。为了能在全屏幕而不是Scroll View的视图范围内显示Image View，需设置Scroll View的clipsToBounds属性为NO。为了能在全屏幕响应对Scroll View的操作，需继承UIScrollView，并设置pointInside:withEvent:方法始终返回YES。

在scrollViewDidEndZooming:withView:atScale:方法中，也就是Scroll View缩放结束后，计算Scroll View的最佳位置和尺寸，使用动画给Scroll View重新布局。但是，最终效果还是不太符合自己的意图。比如，将放大的图片捏合成缩小的图片，松手后，图片向屏幕上部反弹放大，然后再动画下移到屏幕中间。在后期的调试中总结出来，对于布局的计算要在Scroll View缩放之前完成，当设置好Scroll View的布局并调整Image View的布局后，再由Scroll View本身完成缩放。

考虑到方案二也使用了额外的层级，并且对UIScrollView的属性和方法做了投机取巧的修改，在优化出方案三后，也废弃了方案二。

方案三：如图1所示，该方案将视图层级简化，只使用到Scroll View和Image View。Scroll View的位置和尺寸不用发生变化，Image View响应缩放操作。通过为Scroll View设置contentInset，使内容占满Scroll View视图范围。下文针对方案三进行详细介绍。

## 三、UIScrollView的zoom特性

UIScrollView通过代理获取和发送缩放发生时的信息，相关的代理方法有4个。

1. viewForZoomingInScrollView:：返回值一个UIView对象，该视图对象响应缩放操作。
2. scrollViewWillBeginZooming:withView:：当UIScrollView中的视图即将发生缩放时，该方法被调用。
3. scrollViewDidZoom:：当UIScrollView中的视图的缩放比例发生变化时，该方法被调用。通过手指捏合的方式缩放视图时，该方法会被持续不断的调用。当通过代码的方式缩放视图时，该方法只被调用一次。比如，通过setZoomScale:animated:方法或zoomToRect:animated:方法缩放视图时，该方法只会在缩放刚开始时被调用一次。虽然视图的缩放动画仍在进行，该方法也不会再被调用。
4. scrollViewDidEndZooming:：当视图的缩放结束后，该方法被调用。当手指捏合缩放视图超过缩放比例极限时，手指离开后，视图缩放会有反弹动画。在这种情况下，在最终反弹动画结束后，该方法才会被调用。

UIScrollView中有如下3个属性，通过设置这些属性，能够实现内容视图的布局。

1. contentInset：该属性的数据类型为UIEdgeInsets，表明UIScrollView的内容视图离UIScrollView上、左、下、右边沿的距离。该值不会随着视图的缩放发生变化。
2. contentSize：该属性的数据类型为GGSize。当contentSize的值加上contentInset的值超过UIScrollView的尺寸时，UIScrollView的内容视图可以滚动。该值随着视图的缩放而发生变化。
3. contentOffset：该属性的数据类型为CGPoint。该值表示contentSize相对于UIScrollView的位置，不包含contentInset。该值反应了UIScrollView中内容视图的位置。

## 四、经验分享

图片查看器支持两种方式缩放图片，双击和手指捏合。在scrollViewWillBeginZooming:withView:方法中通过语句`scrollView.pinchGestureRecognizer.state == UIGestureRecognizerStateBegan`判断缩放操作是由代码执行的，还是由用户捏合执行的。

图2是双击缩放图片时的处理流程图。

<div align="center"><img src="http://7xilqo.com1.z0.glb.clouddn.com/2015-01-16-%E5%8F%8C%E5%87%BB%E7%BC%A9%E6%94%BE%E5%9B%BE%E7%89%87%E5%A4%84%E7%90%86%E6%B5%81%E7%A8%8B.png" alt="" width="80%" /></div>

<div align="center">图2. 双击缩放图片处理流程</div>

图片刚加载时，根据需求计算并设置Scroll View contentInset、contentSize和Image View frame。onDoubleTappedGestureRecognizer:是自定义的响应双击手势的方法，其中执行的操作如图2所示。

通过此种方式缩放图片，在图片缩放的过程中不会有其它事件的干预，因此在缩放操作刚开始时便已知道缩放结束后的最终状态。如图2所示，在用户双击图片后计算出图片缩放最终状态下的Scroll View的contentInset，并修改Scroll View的contentInset。因为修改Scroll View的contentInset会导致contentOffset发生改变，所以需要先存储contentOffset，设置好contentInset后再恢复contentOffset。将Scroll View的属性修改为其最终状态的值后，通过setZoomScale:animated:方法或者zoomToRect:animated:方法缩放图片。

图3是手指捏合缩放图片时的处理流程。

<div align="center"><img src="http://7xilqo.com1.z0.glb.clouddn.com/2015-01-16-%E6%8D%8F%E5%90%88%E7%BC%A9%E6%94%BE%E5%9B%BE%E7%89%87%E5%A4%84%E7%90%86%E6%B5%81%E7%A8%8B.png" alt="" width="80%" /></div>

<div align="center">图3. 手指捏合缩放图片处理流程</div>

图3图片刚加载时的处理流程和图2相同。

如上文“三、UIScrollView的zoom特性”中介绍，scrollViewDidZoom:方法在用户捏合缩放图片的过程中会被持续不断的调用，对应图3中的第1部分。第1部分的处理是确保图片在缩放时，边缘的空白能够始终被contentInset填充。否则用户捏合图片结束后，获取出的contentOffset值有时会不正确。

图3中的第2部分和第3部分执行相同的处理代码。用户捏合图片松手后，图片所处的位置可能不是最佳位置，该部分代码负责最后的布局操作。首先计算出最佳的Scroll View contentInset和contentOffset，然后在动画block中设置contentInset和contentOffset。

图3第2部分处理分支对应的情况是，用户捏合图片松手，并且此时图片的缩放程度超过了图片缩放极限。图3第3部分对应的情况是，用户捏合图片松手，并且此时图片的缩放程度没有超过图片的缩放极限。

## 五、总结

最后是自己的两点总结。

1. 一句有名的话是“不要重复造轮子”。在初接触图片查看器的需求时，觉得非常复杂，但是实际上UIScrollView的zoom特性已经能帮助我们实现大部分的功能。

2. 花点时间研究将要使用的控件能少走许多弯路。一些奇技淫巧可能也能解决问题，但是实现方案会变的复杂。

{{ page.date | date_to_string }}
