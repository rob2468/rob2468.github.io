---
layout: post
title: iOS 图像解码和最佳实践
page_id: id-2018-08-22
---

<h1>{{ page.title }}</h1>

最近组内同事做了 iOS 图像解码的分享。针对不太清楚的问题，又做了些调研，梳理如下。

<h2>1. 三种 Buffer 和解码</h2>

Buffer 表示一片连续的内存空间。通常，我们说的 Buffer 是指一系列内部结构相同、大小相同的元素组成的内存区域。

有三种 Buffer：Data Buffer、Image Buffer、Frame Buffer。

Data Buffer 是存储在内存中的原始数据，图片可以使用不同的格式保存，如 jpg、png。Data Buffer 的信息不能用来描述图片的像素信息。

Image Buffer 是图片在内存中的存在方式，其中每个元素描述了一个像素点。Image Buffer 的大小和图片的大小成正比。

Frame Buffer 和 Image Buffer 内容相同，不过其存储在 vRAM（video RAM）中，而 Image Buffer 存储在 RAM 中。

解码就是从 Data Buffer 生成 Image Buffer 的过程。Image Buffer 会上传到 GPU 成为 Frame Buffer，GPU 以每秒60次的速度使用 Frame Buffer 更新屏幕。

下图描述了图片从文件到渲染到屏幕上的流程。

<p class="post-image">
    <img src="/resources/figures/2018-08-22-image-rendering-pipeline.png" alt="图片渲染流程" width="90%">
</p>

<p class="post-image-title">图片渲染流程</p>

<h2>2. UIImage 和 UIImageView</h2>

UIImage 和 UIImageView 的角色类似于 MVC 架构模式中的数据和视图，如下图所示。

<p class="post-image">
    <img src="/resources/figures/2018-08-22-uiimage-uiimageview.png" alt="UIImage 和 UIImageView" width="90%">
</p>

<p class="post-image-title">UIImage 和 UIImageView 的角色</p>

UIImage 是 iOS 中处理图片的高级类。创建一个 UIImage 实例只会加载 Data Buffer，将图片显示到屏幕上才会触发解码，也就是 Data Buffer 解码为 Image Buffer，Image Buffer 也关联在 UIImage 上。

UIImage 关联的图片是否已解码对外部是透明的，没有办法判断（有判断方法的大牛求教告知）。

<h2>3. 最佳实践</h2>

内存和 CPU 是 App 运行最宝贵的资源，我们处理和使用图片从减少内存占用和优化 CPU 使用入手。下面提供一些优化方案。

<h3>减少内存占用</h3>

大的图片会占用较多的内存资源，解码和传输到 GPU 也会耗费较多时间。实际需要显示的图片尺寸可能并不是很大，如果能将大图缩小，便能达到优化的目的。

下面的代码片段来自 WWDC 2018，功能是缩小图片并解码。原始代码为 Swift，这里转成了 Objective-C。

<div class="code"><pre><code>// 大图缩小为显示尺寸的图
- (UIImage *)downsampleImageAt:(NSURL *)imageURL to:(CGSize)pointSize scale:(CGFloat)scale {
    // 利用图片文件地址创建 image source
    NSDictionary *imageSourceOptions =
  @{
    (__bridge NSString *)kCGImageSourceShouldCache: @NO // 原始图片不要解码
    };
    CGImageSourceRef imageSource =
    CGImageSourceCreateWithURL((__bridge CFURLRef)imageURL, (__bridge CFDictionaryRef)imageSourceOptions);

    // 下采样
    CGFloat maxDimensionInPixels = MAX(pointSize.width, pointSize.height) * scale;
    NSDictionary *downsampleOptions =
    @{
      (__bridge NSString *)kCGImageSourceCreateThumbnailFromImageAlways: @YES,
      (__bridge NSString *)kCGImageSourceShouldCacheImmediately: @YES,  // 缩小图片的同时进行解码
      (__bridge NSString *)kCGImageSourceCreateThumbnailWithTransform: @YES,
      (__bridge NSString *)kCGImageSourceThumbnailMaxPixelSize: @(maxDimensionInPixels)
       };
    CGImageRef downsampledImage =
    CGImageSourceCreateThumbnailAtIndex(imageSource, 0, (__bridge CFDictionaryRef)downsampleOptions);
    UIImage *image = [[UIImage alloc] initWithCGImage:downsampledImage];
    CGImageRelease(downsampledImage);
    CFRelease(imageSource);

    return image;
}
</code></pre></div>

<h3>优化 CPU 使用</h3>

CPU 使用的优化我们考虑利用设备的多核芯片和预处理。CPU 的计算环节，我们考虑优化 Data Buffer 转 Image Buffer 这一过程，也就是解码过程。

利用设备多核芯片使用多线程方案便可以实现。预处理本身并没有减少 CPU 的工作量，但是在 CPU 空闲时提前完成图片解码，能间接达到优化用户体验的效果。

多线程和预处理，再结合上面的 Downsample 接口，便能形成一套优化方案。

<h2>4. 解码</h2>

前面说到，UIImage 关联的图片是否已解码对外部是透明的，但是有许多操作会触发图片的解码，下面是一些例子。

<h3>[imageView setImage:] 隐式解码</h3>

将图片显示到屏幕上会触发隐式解码。

<div class="code"><pre><code>UIImageView *imageView = [[UIImageView alloc] init];
[self.view addSubview:imageView];
[imageView setImage:image];
</code></pre></div>

<p></p>

<h3>Core Graphics 绘制</h3>

手动绘制图片能完成图片解码，下面代码中的 newImage 实例的图片已完成解码。

<div class="code"><pre><code>UIGraphicsBeginImageContextWithOptions(image.size, YES, [UIScreen mainScreen].scale);
[image drawAtPoint:CGPointZero];
UIImage *newImage = UIGraphicsGetImageFromCurrentImageContext();
UIGraphicsEndImageContext();
</code></pre></div>

<h3>显示读取</h3>


<h3>参考文献：</h3>

WWDC2018. <a href="https://developer.apple.com/videos/play/wwdc2018/219/" target="_blank">Image and Graphics Best Practices</a>
