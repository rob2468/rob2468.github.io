---
layout: post
title: iOS 图像解码和最佳实践
page_id: id-2018-08-22
---

<h1 class="title">{{ page.title }}</h1>

<h2>前言</h2>

最近组内同事做了 iOS 图像解码的分享。针对不太清楚的问题，又做了些调研，梳理如下。

<h2 id="section_1">1. 三种 Buffer 和解码</h2>

Buffer 表示一片连续的内存空间。通常，我们说的 Buffer 是指一系列内部结构相同、大小相同的元素组成的内存区域。

有三种 Buffer：Data Buffer、Image Buffer、Frame Buffer。

Data Buffer 是存储在内存中的原始数据，图像可以使用不同的格式保存，如 jpg、png。Data Buffer 的信息不能用来描述图像的像素信息。

Image Buffer 是图像在内存中的存在方式，其中每个元素描述了一个像素点。Image Buffer 的大小和图像的大小成正比。

Frame Buffer 和 Image Buffer 内容相同，不过其存储在 vRAM（video RAM）中，而 Image Buffer 存储在 RAM 中。

解码就是从 Data Buffer 生成 Image Buffer 的过程。Image Buffer 会上传到 GPU 成为 Frame Buffer，GPU 以每秒60次的速度使用 Frame Buffer 更新屏幕。

下图描述了图像从文件到渲染到屏幕上的流程。

<p class="post-image">
    <img src="/resources/figures/2018-08-22-image-rendering-pipeline.png" alt="图像渲染流程" width="90%">
</p>

<p class="post-image-title">图像渲染流程</p>

<h2 id="section_2">2. UIImage 和 UIImageView</h2>

UIImage 和 UIImageView 的角色类似于 MVC 架构模式中的数据和视图，如下图所示。

<p class="post-image">
    <img src="/resources/figures/2018-08-22-uiimage-uiimageview.png" alt="UIImage 和 UIImageView" width="90%">
</p>

<p class="post-image-title">UIImage 和 UIImageView 的角色</p>

UIImage 是 iOS 中处理图像的高级类。创建一个 UIImage 实例只会加载 Data Buffer，将图像显示到屏幕上才会触发解码，也就是 Data Buffer 解码为 Image Buffer。Image Buffer 也关联在 UIImage 上。

UIImage 关联的图像是否已解码对外部是透明的（如本文最后的 Instruments 截图，调用栈中都是系统函数），没有办法判断。

<h2 id="section_3">3. 图像解码</h2>

上面说到，UIImage 关联的图像是否已解码对外部是透明的，但是有许多操作会触发图像的解码，下面是一些例子。

<h3>隐式解码</h3>

将图像显示到屏幕上会触发隐式解码。（必须同时满足图像被设置到 UIImageView 中、UIImageView 添加到视图，才会触发图像解码。)

<div class="code"><pre><code>UIImageView *imageView = [[UIImageView alloc] init];
[self.view addSubview:imageView];
[imageView setImage:image];
</code></pre></div>

<p></p>

<h3>Core Graphics</h3>

手动绘制图像能完成图像解码，下面代码中的 newImage 实例的图像已完成解码。

<div class="code"><pre><code>UIGraphicsBeginImageContextWithOptions(image.size, YES, [UIScreen mainScreen].scale);
[image drawAtPoint:CGPointZero];
UIImage *newImage = UIGraphicsGetImageFromCurrentImageContext();
UIGraphicsEndImageContext();
</code></pre></div>

下面的代码片段截取自 <a href="https://github.com/ibireme/YYKit.git" target="_blank">YYKit</a>，其中 newImage 实例的图像已完成解码。在测试工程中，该代码比上面直接绘制代码快约7倍。

<div class="code"><pre><code>size_t width = CGImageGetWidth(imageRef);
size_t height = CGImageGetHeight(imageRef);
CGColorSpaceRef space = CGImageGetColorSpace(imageRef);
size_t bitsPerComponent = CGImageGetBitsPerComponent(imageRef);
size_t bitsPerPixel = CGImageGetBitsPerPixel(imageRef);
size_t bytesPerRow = CGImageGetBytesPerRow(imageRef);
CGBitmapInfo bitmapInfo = CGImageGetBitmapInfo(imageRef);

CGDataProviderRef dataProvider = CGImageGetDataProvider(imageRef);
CFDataRef data = CGDataProviderCopyData(dataProvider);      // 主要耗时操作（解码）

CGDataProviderRef newProvider = CGDataProviderCreateWithCFData(data);
CFRelease(data);

CGImageRef newImageRef = CGImageCreate(width, height, bitsPerComponent, bitsPerPixel, bytesPerRow, space, bitmapInfo, newProvider, NULL, false, kCGRenderingIntentDefault);
UIImage *newImage = [[UIImage alloc] initWithCGImage:newImageRef];
CGImageRelease(newImageRef);
CFRelease(newProvider);
</code></pre></div>

<h3>Image I/O</h3>

Image I/O 提供了多种处理图像的接口，但是我并没有找到一个可以直观的触发图像解码的实现方案。（简单的使用 CGImageSourceCreateWith... / CGImageSourceCreateImageAtIndex 这对函数并不会触发解码。）（下文中引用的 WWDC 提供的代码段算是一种解码的方案。）

<h2 id="section_4">4. 最佳实践</h2>

内存和 CPU 是 App 运行最宝贵的资源，我们处理和使用图像从减少内存占用和优化 CPU 使用入手。下面提供一些优化方案。

<h3>减少内存占用</h3>

大的图像会占用较多的内存资源，解码和传输到 GPU 也会耗费较多时间。实际需要显示的图像尺寸可能并不是很大，如果能将大图缩小，便能达到优化的目的。

下面的代码片段来自 WWDC 2018，功能是缩小图像并解码。原始代码为 Swift，这里转成了 Objective-C。

<div class="code"><pre><code>// 大图缩小为显示尺寸的图
- (UIImage *)downsampleImageAt:(NSURL *)imageURL to:(CGSize)pointSize scale:(CGFloat)scale {
    // 利用图像文件地址创建 image source
    NSDictionary *imageSourceOptions =
  @{
    (__bridge NSString *)kCGImageSourceShouldCache: @NO // 原始图像不要解码
    };
    CGImageSourceRef imageSource =
    CGImageSourceCreateWithURL((__bridge CFURLRef)imageURL, (__bridge CFDictionaryRef)imageSourceOptions);

    // 下采样
    CGFloat maxDimensionInPixels = MAX(pointSize.width, pointSize.height) * scale;
    NSDictionary *downsampleOptions =
    @{
      (__bridge NSString *)kCGImageSourceCreateThumbnailFromImageAlways: @YES,
      (__bridge NSString *)kCGImageSourceShouldCacheImmediately: @YES,  // 缩小图像的同时进行解码
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

CPU 使用的优化我们考虑的是，利用设备的多核芯片（多线程）和采用预处理策略。

值得关注的 CPU 计算工作是，Data Buffer 转 Image Buffer 这一过程，也就是解码过程。在一个测试工程中，大量的设置了图像的 UIImageView 被显示到屏幕上，图像解码是性能瓶颈。如下图所示。

<p class="post-image">
    <img src="/resources/figures/2018-08-22-time-profiler-applejpeg-decode-image-all.png" alt="" width="100%">
</p>

预处理本身并没有减少 CPU 的工作量，但是在 CPU 空闲时提前完成图像解码，能间接达到优化用户体验的效果。

<h3>参考文献：</h3>

WWDC2018. <a href="https://developer.apple.com/videos/play/wwdc2018/219/" target="_blank">Image and Graphics Best Practices</a>

Luke Parham. <a href="http://www.lukeparham.com/blog/2018/3/14/decoding-jpegs-with-the-best" target="_blank">JPEG Decoding with the Best</a>