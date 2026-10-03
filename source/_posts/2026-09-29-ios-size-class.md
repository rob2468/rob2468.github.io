---
layout: post
title: iOS Size Class
date: 2026-09-29
tags:
  - iOS
---

# {{ page.title }}

### Size Class 设计目标

+ 苹果从 iOS 8 引入 Size Class 设计。

+ Size Class 是对尺寸的抽象。随着设备尺寸越来越多，苹果想通过 Size Class 的设计，减轻开发者的适配成本。

<!-- more -->

### Size Class 核心概念

+ Size Class 的适用场景：系统会通知你当前状态，不需要通过计算屏幕长宽来判断设备状态。

+ Size Class 主要有2个维度的状态：方向、紧凑程度
    - 方向：水平方向、垂直方向
    - 紧凑程度：Compact、Regular
+ 比如，下面的截图是在 iPhone Duo 中的跑的 Demo。

当水平方向空间有限时，系统会返回水平方向 Compact；

当水平方向空间足够时，系统会返回水平方向 Regular；

当垂直方向空间有限时，系统会返回垂直方向 Compact；

当垂直方向空间足够时，系统会返回垂直方向 Regular；

![水平 Compact、垂直 Regular](/images/2026-09-29-size-class-compact-regular.png?width=25%)

![水平 Compact、垂直 Compact](/images/2026-09-29-size-class-compact-compact.png?width=27%)

![水平 Regular、垂直 Regular](/images/2026-09-29-size-class-regular-regular.jpg?width=46%)

+ 系统如何判断当前是 Compact、Regular，这个对开发者黑盒。

### Size Class 核心 API

+ 在 ViewController 中，获取水平方向紧凑程度

`UIUserInterfaceSizeClass horizontal = self.traitCollection.horizontalSizeClass;`

+ 在 ViewController 中，获取垂直方向紧凑程度

`UIUserInterfaceSizeClass vertical = self.traitCollection.verticalSizeClass;`


+ 判断紧凑类型

```objectivec
// 水平方向判断
self.traitCollection.horizontalSizeClass == UIUserInterfaceSizeClassRegular;
self.traitCollection.horizontalSizeClass == UIUserInterfaceSizeClassCompact;

// 垂直方向判断
self.traitCollection.verticalSizeClass == UIUserInterfaceSizeClassRegular;
self.traitCollection.verticalSizeClass == UIUserInterfaceSizeClassCompact;
```

### Demo
```objectivec
@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];

    // registerForTraitChanges 从 iOS 17 开始支持
    [self registerForTraitChanges:@[UITraitHorizontalSizeClass.class, UITraitVerticalSizeClass.class] withAction:@selector(sizeClassesDidChange)];
}

- (void)sizeClassesDidChange {
    // 旋转设备或调整 iPad 窗口尺寸时，系统会回调这里。
    if (self.traitCollection.horizontalSizeClass == UIUserInterfaceSizeClassRegular) {
        self.layoutBadgeLabel.text = @"宽布局";
    }
}
```

Trait（特征）是 UIKit 用来描述“当前界面环境”的一组信息。可以把它类比成 H5 里的媒体查询环境。Size Class 是 Trait 中的一种。其他的还有比如，浅色 / 深色模式、iPhone / iPad 等界面类型。

### 是否实用

+ 在实际项目里，产品和设计通常需要精确控制布局。比如，超过 xx 宽度，xx 布局；折叠屏展开时，xx 布局。在这种情况下 Size Class 派不上用场。

+ Size Class 的控制粒度比较粗，可以混合的方式来使用。

比如

```objectivec
BOOL systemIsCompact =
    self.traitCollection.horizontalSizeClass ==
    UIUserInterfaceSizeClassCompact;

CGFloat width = CGRectGetWidth(self.view.bounds);

if (systemIsCompact || width < 600) {
    // 单列布局
} else if (width < 900) {
    // 双列布局
} else {
    // 侧边栏布局
}
```

### 其他

+ demo 工程：[https://github.com/rob2468/ios-size-class-demo](https://github.com/rob2468/ios-size-class-demo)
