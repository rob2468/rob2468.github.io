---
layout: post
title: callMethodWithCompletionBlock 中 Block 的内存管理
page_id: id-2018-02-08
tags:
- iOS
---

# {{ page.title }}

开发中不时会遇到 `[obj callMethodWithCompletionBlock:^{ [obj doSomething] }]` 这种写法。调用一个 OC 实例对象的带有 block 回调的方法，并且 block 实现又引用了该实例变量。写到这里经常会犹豫，要不要弱引用该实例变量，会不会造成循环引用。本文通过 Demo 演示了相关的几种情况，并对内存管理加以分析。

<!-- more -->

本文的讨论都是基于 ARC，并且一般性的 block 内存管理说明可以参考<a href="/2018/09/30/block.html">这篇文章</a>。

<h2>Demo 1</h2>

{% codeblock lang:objc %}
@interface CustomUIView : UIView
@end
@implementation CustomUIView
- (void)doSomeThing:(void(^)(void))block {
    block();
}
- (void)emptyMethod {}
- (void)dealloc {
    NSLog(@"CustomUIView dealloc");
}
@end

@interface ViewController ()
@end
@implementation ViewController
- (void)viewDidLoad {
    [super viewDidLoad];
    CustomUIView *customView = [[CustomUIView alloc] init];
    [customView doSomeThing:^{
        [customView emptyMethod];
    }];
}
@end
{% endcodeblock %}

运行结果：

<pre><code>2018-02-08 15:56:53.638344+0800 Test[41287:2545568] CustomUIView dealloc
</code></pre>

Demo 1 演示的即是本文开头说的情况，运行结果显示没有产生循环引用，customView 正常释放。

结论：block 引用了 customView，但是 customView 没有引用 block。见 Demo 2。

<h2>Demo 2</h2>

{% codeblock lang:objc %}
@interface CustomUIView0 : UIView
@end
@implementation CustomUIView0
- (void)emptyMethod {}
- (void)dealloc {
    NSLog(@"CustomUIView0 dealloc");
}
@end

@interface CustomUIView : UIView
@end
@implementation CustomUIView
- (void)doSomeThing:(void(^)(void))block {
    block();
}
- (void)emptyMethod {}
- (void)dealloc {
    NSLog(@"CustomUIView dealloc");
}
@end

@interface ViewController ()
@property (strong, nonatomic) CustomUIView *customView;
@end
@implementation ViewController
- (void)viewDidLoad {
    [super viewDidLoad];
    CustomUIView0 *view0 = [[CustomUIView0 alloc] init];
    self.customView = [[CustomUIView alloc] init];
    [self.customView doSomeThing:^{
        [view0 emptyMethod];
    }];
}
@end
{% endcodeblock %}

运行结果：

<pre><code>2018-02-08 15:58:54.662221+0800 Test[41318:2553382] CustomUIView0 dealloc
</code></pre>

该示例中 customView 被强引用，不会释放。因为 block 引用了 view0，如果 customView 引用 block，那么 view0 便不会被释放。但是实际上 view0 正常释放，说明 Demo 1 的结论是正确的。

<h2>Demo 3</h2>

{% codeblock lang:objc %}
@interface CustomUIView0 : UIView
@end
@implementation CustomUIView0
- (void)emptyMethod {}
- (void)dealloc {
    NSLog(@"CustomUIView0 dealloc");
}
@end

@interface CustomUIView : UIView
@property (strong, nonatomic) void(^strongBlock)(void);
@end
@implementation CustomUIView
- (void)doSomeThing:(void(^)(void))block {
    self.strongBlock = block;
    block();
}
- (void)emptyMethod {}
- (void)dealloc {
    NSLog(@"CustomUIView dealloc");
}
@end

@interface ViewController ()
@property (strong, nonatomic) CustomUIView *customView;
@end
@implementation ViewController
- (void)viewDidLoad {
    [super viewDidLoad];
    CustomUIView0 *view0 = [[CustomUIView0 alloc] init];
    self.customView = [[CustomUIView alloc] init];
    [self.customView doSomeThing:^{
        [view0 emptyMethod];
    }];
}
@end
{% endcodeblock %}

Demo 3 与 Demo 2 的区别是 CustomUIView 中强引用了 block，此时 view0 不会释放，存在 self -> customView -> block -> view0 这样的强引用关系。

这样的强引用关系是单向的，只要打破其中一个环节便能释放，比如作如下修改：

{% codeblock lang:objc %}
CustomUIView0 *view0 = [[CustomUIView0 alloc] init];
CustomUIView *customView = [[CustomUIView alloc] init];
[customView doSomeThing:^{
    [view0 emptyMethod];
}];
{% endcodeblock %}

运行结果：

<pre><code>2018-02-08 16:48:27.802266+0800 Test[41900:2865267] CustomUIView dealloc
2018-02-08 16:48:27.802428+0800 Test[41900:2865267] CustomUIView0 dealloc
</code></pre>

此时 customView 成为局部变量，上下文结束便释放。被引用的 block 和 view0 也会依次释放。

<h2>Demo 4</h2>

{% codeblock lang:objc %}
@interface CustomUIView : UIView
@property (strong, nonatomic) void(^strongBlock)(void);
@end
@implementation CustomUIView
- (void)doSomeThing:(void(^)(void))block {
    self.strongBlock = block;
    block();
}
- (void)emptyMethod {}
- (void)dealloc {
    NSLog(@"CustomUIView dealloc");
}
@end

@interface ViewController ()
@property (strong, nonatomic) CustomUIView *customView;
@end
@implementation ViewController
- (void)viewDidLoad {
    [super viewDidLoad];
    CustomUIView *customView = [[CustomUIView alloc] init];
    [customView doSomeThing:^{
        [customView emptyMethod];
    }];
}
@end
{% endcodeblock %}

最后，我们来看一个会产生循环引用的例子。Demo 4 和 Demo 1 的区别是 CustomUIView 中强引用了 block。此时存在 customView -> block -> customView 这样的循环引用，除非显式打破这个环状引用（比如 customView 中有逻辑能解除对 block 的引用），否则便产生了内存泄漏。

![](/images/2018-02-08-Memory-Leak.png)

<h2>总结</h2>

`[obj callMethodWithCompletionBlock:^{ [obj doSomething] }]` 这种写法，ARC 会自动负责 block 的内存管理，在上下文开始和结束的地方持有和释放。

block 为开发带来了便利，ARC 又为 block 的内存管理带来了便利，但如果未遵守内存管理的基本原则，仍然会引入内存泄漏的问题。
