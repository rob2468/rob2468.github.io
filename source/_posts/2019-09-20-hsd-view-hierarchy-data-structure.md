---
layout: post
title: HttpServerDebug 视图层级之数据结构设计
page_id: id-2019-09-20
---

<h1 class="title">{{ page.title }}</h1>

<h2 id="section_1">前言</h2>

<a href="https://github.com/rob2468/HttpServerDebug" target="_blank">HSD（HttpServerDebug）</a> 实现了类似 Xcode 中的视图调试功能，如下图所示。在 HSD 中，该功能的核心是视图数据，视图数据包括视图的层次、属性等。本文描述视图数据的组织方式。

<!-- more -->

<!-- <p class="post-image">
    <img src="/resources/figures/2019-09-20-view-hierarchy-demo.png" alt="HttpServerDebug view debug demo" width="100%">
</p> -->

![](/images/2019-09-20-view-hierarchy-demo.png)

<p class="post-image-title">图1 HttpServerDebug 视图调试</p>

在进行视图调试时，需要以不同的方式访问这些视图，如图1所示。区域1和区域2需要以顺序的方式访问视图，依次显示。区域3需要以树状访问，描述目标视图在视图层级中的位置。

<h2 id="section_2">数据结构</h2>

按前文分析，数据结构的设计需要同时利于顺序和树状访问。下图是一个示例。

<!-- <p class="post-image">
    <img src="/resources/figures/2019-09-20-data-structure.png" alt="" width="100%">
</p> -->

![](/images/2019-09-20-data-structure.png)

<p class="post-image-title">图2 视图数据与对应的视图</p>

视图数据以数组方式存储，支持 O(1) 复杂度的访问。

以深度优先搜索方法遍历视图层级，每个访问到的视图依次成为数组中的元素。每个元素对象除了包含视图自身基本信息，如位置、背景色等，还需要包含其在整个视图层级中的位置的信息，这个信息通过 parent 和 children 字段实现。

parent 指向对应视图的父视图，值为父视图在视图数据数组中的下标。除了根节点，每个视图有1个父视图。

children 保存对应视图的子视图，只记录直接关联的子视图。每个视图有0个或多个子视图，children 使用数组存储，元素值为子视图在视图数据数组中的下标。

<h2 id="section_3">代码实现</h2>

构造数据：

<pre><code>// 入口函数，获取所有视图数据
+ (NSArray *)fetchAllViewsDataInHierarchy {
    NSMutableArray *allViewsData = [[NSMutableArray alloc] init];
    NSArray *windows = [self fetchAllWindows]; // 获取所有根视图
    for (UIWindow *window in windows) {
        if (![window isHidden]) {
            // 根视图数据
            NSMutableDictionary *viewData = [[self fetchViewData:window] mutableCopy];
            [viewData setObject:@(-1) forKey:@"parent"];
            [viewData setObject:[@[] mutableCopy] forKey:@"children"];
            [allViewsData addObject:viewData];

            // 遍历子视图
            NSInteger viewIndex = [allViewsData count] - 1;
            NSArray *subviewsData = [self allRecursiveSubviewsInView:window viewData:viewData viewIndex:viewIndex];
            [allViewsData addObjectsFromArray:subviewsData];
        }
    }
    return allViewsData;
}

// 递归获取所有子视图数据
+ (NSArray *)allRecursiveSubviewsInView:(UIView *)superView viewData:(NSMutableDictionary *)superViewData viewIndex:(NSInteger)superViewIndex {
    NSMutableArray *viewsData = [[NSMutableArray alloc] init];
    for (UIView *view in superView.subviews) {
        if (![view isHidden]) {
            // 视图数据
            NSMutableDictionary *viewData = [[self fetchViewData:view] mutableCopy];
            [viewData setObject:@(superViewIndex) forKey:@"parent"];
            [viewData setObject:[@[] mutableCopy] forKey:@"children"];
            [viewsData addObject:viewData];

            // 遍历子视图
            NSInteger currentIndex = superViewIndex + [viewsData count];
            NSArray *subviewsData = [self allRecursiveSubviewsInView:view viewData:viewData viewIndex:currentIndex];
            [viewsData addObjectsFromArray:subviewsData];

            // 更新父视图的 children 字段
            NSMutableArray *children = [superViewData objectForKey:@"children"];
            [children addObject:@(currentIndex)];
            [superViewData setObject:children forKey:@"children"];
        }
    }
    return viewsData;
}

// 获取根视图
+ (NSArray *)fetchAllWindows {}

// 获取视图数据 e.g. 位置、背景色
+ (NSDictionary *)fetchViewData:(UIView *)view {}
</code></pre>
