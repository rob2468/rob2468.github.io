---
layout: post
title: 为 GCDWebServer 引入 WebSocket 支持
page_id: id-2019-06-15
---

<h1 class="title">{{ page.title }}</h1>

<h2 id="section_1">前言</h2>

借助一些工具库，iOS 设备可以配置成为服务器，在此之上可以做许多有意思的事情。例如，<a href="https://github.com/rob2468/HttpServerDebug" target="_blank">HttpServerDebug</a> 基于这种能力，提供了现场调试 iOS App 的能力。

<a href="https://github.com/robbiehanson/CocoaHTTPServer" target="_blank">CocoaHTTPServer</a> 是比较早期的提供服务器能力的库，(基础 Socket 通信能力由 <a href="https://github.com/robbiehanson/CocoaAsyncSocket" target="_blank">CocoaAsyncSocket</a> 提供，)现在已不再维护。

<a href="https://github.com/swisspol/GCDWebServer" target="_blank">GCDWebServer</a> 也是一个提供服务器能力的工具，基于 GCD 实现，当前仍在维护中。

HSD（HttpServerDebug） 基于 GCDWebServer。HSD 希望能够主动的把信息发送到前端，这依赖于 WebSocket 协议，但是 GCDWebServer 不支持。

HSD 对 GCDWebServer 进行二次开发，增加 WebSocket 能力，并且不再同步原始 GCDWebServer 库。这是支持 WebSocket 协议的一次实践，并没有完备的支持 WebSocket 的所有方面，如新版本的 WebSochet 协议、加密数据传输等。

<h2 id="section_2">Socket 实现</h2>

Http 和 WebSocket 都是应用层的协议，其底层都依赖 Socket 进行通信。

GCDWebServer 中，Socket 的建立使用 POSIX C 函数实现。生成的核心数据对象是一对 Socket 文件描述符，分别代表服务端和客户端。对 Socket 文件描述符的监听、读取、写入均使用 GCD 函数进行了封装。

<h2 id="section_3">WebSocket 协议</h2>

WebSocket 协议是借用 HTTP 101 switch protocol 来完成协议转换，从 HTTP 协议切换成 WebSocket 通信协议。一个典型的建立连接请求和响应头如下，具体含义见参考文献链接。

<div class="code"><pre><code>Request Headers
GET ws://localhost:5555/ HTTP/1.1
Host: localhost:5555
Connection: Upgrade
Pragma: no-cache
Cache-Control: no-cache
Upgrade: websocket
Origin: http://localhost:5555
Sec-WebSocket-Version: 13
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36
Accept-Encoding: gzip, deflate, br
Accept-Language: zh-CN,zh;q=0.9,en;q=0.8
Cookie: locale=zh-cn
Sec-WebSocket-Key: qtAGynUVRNU3JdTH1dsQiA==
Sec-WebSocket-Extensions: permessage-deflate; client_max_window_bits

Response Headers
HTTP/1.1 101 Web Socket Protocol Handshake
WebSocket-Location: ws://localhost:5555/
Sec-WebSocket-Accept: We1qmJgFvf8w3cDqTuUO5B6lrNA=
Upgrade: WebSocket
Connection: Upgrade
WebSocket-Origin: http://localhost:5555
</code></pre></div>

WebSocket 协议传输的数据以 Frame 为单位，每个 Frame 都有严格的数据结构，如下表所示。其中每个位以字节流形式考察，具体含义见参考文献链接。

<div class="code"><pre><code>  0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7
 +-+-+-+-+-------+-+-------------+-------------------------------+
 |F|R|R|R| opcode|M| Payload len |    Extended payload length    |
 |I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
 |N|V|V|V|       |S|             |   (if payload len==126/127)   |
 | |1|2|3|       |K|             |                               |
 +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
 |     Extended payload length continued, if payload len == 127  |
 + - - - - - - - - - - - - - - - +-------------------------------+
 |                               |Masking-key, if MASK set to 1  |
 +-------------------------------+-------------------------------+
 | Masking-key (continued)       |          Payload Data         |
 +-------------------------------- - - - - - - - - - - - - - - - +
 :                     Payload Data continued ...                :
 + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
 |                     Payload Data continued ...                |
 +---------------------------------------------------------------+
</code></pre></div>

<h2 id="section_4">持有关系</h2>

<!-- <p class="post-image">
  <img src="/resources/figures/2019-06-15-websocket-retain.png" alt="Retain Relationship" width="60%">
</p> -->

![](/images/2019-06-15-websocket-retain.png)

如上图所示，增加 WebSocket 协议支持后，对象实例的持有关系有一些变化。GCDWebServer 表示服务器实例，GCDWebServerConnection 表示一次通信连接实例。

GCDWebServer 实例和 GCDWebServerConnection 实例的对应关系是 1 : n，这在修改前后都是一样的。修改前，GCDWebServerConnection 实例没有显式的声明被某个对象持有，其内部实现中，dispatch_read 和 dispatch_write 的 block 持有其自身，并在 block 执行结束后释放。

修改后，明确了 GCDWebServerConnection 实例的持有关系。GCDWebServer 实例接收到请求并实例出 GCDWebServerConnection 对象后，显示持有该对象。

HSDGWebSocket 是新增的负责处理 WebSocket 协议的类。GCDWebServerConnection 检测到当前请求为 WebSocket 请求时，实例出 HSDGWebSocket 对象，并显示持有。他们的对应关系是 1 : 1。

<h2 id="section_5">建立连接</h2>

<div class="code"><pre><code>+ (BOOL)isWebSocketRequest:(NSDictionary *)requestHeaders {
    NSString *connectionHeaderValue = [requestHeaders objectForKey:@"Connection"];
    NSString *upgradeHeaderValue = [requestHeaders objectForKey:@"Upgrade"];

    BOOL isWebSocket = YES;
    if (!upgradeHeaderValue || !connectionHeaderValue) {
        isWebSocket = NO;
    } else if ([upgradeHeaderValue caseInsensitiveCompare:@"WebSocket"] != NSOrderedSame) {
        isWebSocket = NO;
    } else if ([connectionHeaderValue rangeOfString:@"Upgrade" options:NSCaseInsensitiveSearch].location == NSNotFound) {
        isWebSocket = NO;
    }
    return isWebSocket;
}
</code></pre></div>

如上代码所示，接收到请求后，根据请求头判断是否是 WebSocket 请求。如果是 WekSocket 请求，则发送对应的响应头，如下代码所示。请求和响应的格式和值见 WebSocket 协议的定义。

<div class="code"><pre><code>- (void)sendResponseHeaders {
    // request info
    NSDictionary *requestHeaders = CFBridgingRelease(CFHTTPMessageCopyAllHeaderFields(self.requestMessage));
    NSString *origin = [requestHeaders objectForKey:@"Origin"];
    NSString *host = [requestHeaders objectForKey:@"Host"];
    NSString *secWebSocketKey = [requestHeaders objectForKey:@"Sec-WebSocket-Key"];

    NSURL *requestURL = CFBridgingRelease(CFHTTPMessageCopyRequestURL(self.requestMessage));
    NSString *relativeString = [requestURL relativeString];

    // response
    CFHTTPMessageRef responseMessage = CFHTTPMessageCreateResponse(kCFAllocatorDefault, 101, CFSTR("Web Socket Protocol Handshake"), kCFHTTPVersion1_1);
    CFHTTPMessageSetHeaderFieldValue(responseMessage, CFSTR("Connection"), CFSTR("Upgrade"));
    CFHTTPMessageSetHeaderFieldValue(responseMessage, CFSTR("Upgrade"), CFSTR("WebSocket"));

    CFHTTPMessageSetHeaderFieldValue(responseMessage, CFSTR("WebSocket-Origin"), (__bridge CFStringRef)origin);
    NSString *locationValue = [NSString stringWithFormat:@"ws://%@%@", host, relativeString];
    CFHTTPMessageSetHeaderFieldValue(responseMessage, CFSTR("WebSocket-Location"), (__bridge CFStringRef)locationValue);

    // Sec-WebSocket-Accept
    NSString *guid = @"258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
    NSString *acceptValue = [[secWebSocketKey stringByAppendingString:guid] dataUsingEncoding: NSUTF8StringEncoding].sha1Digest.base64Encoded;
    if (acceptValue.length > 0) {
        CFHTTPMessageSetHeaderFieldValue(responseMessage, CFSTR("Sec-WebSocket-Accept"), (__bridge CFStringRef)acceptValue);
    }

    CFDataRef data = CFHTTPMessageCopySerializedMessage(responseMessage);
    [self writeData:(__bridge NSData*)data withCompletionBlock:^(BOOL sucess) {}];
    CFRelease(data);
}</code></pre></div>

<h2 id="section_6">发送和接收信息</h2>

下面两段代码分别是，从服务端发送信息到前端和服务端接收前端发来的信息。其中关于字节流的处理见 WebSocket 协议 Frame 的定义。

<div class="code"><pre><code>- (void)sendMessage:(NSString *)msg {
    NSData *msgData = [msg dataUsingEncoding:NSUTF8StringEncoding];
    NSMutableData *data = nil;

    NSUInteger length = msgData.length;
    if (length <= 125) {
        data = [NSMutableData dataWithCapacity:(length + 2)];
        [data appendBytes:"\x81" length:1];
        UInt8 len = (UInt8)length;
        [data appendBytes:&len length:1];
        [data appendData:msgData];
    } else if (length <= 0xFFFF) {
        data = [NSMutableData dataWithCapacity:(length + 4)];
        [data appendBytes:"\x81\x7E" length:2];
        UInt16 len = (UInt16)length;
        [data appendBytes:(UInt8[]){len >> 8, len & 0xFF} length:2];
        [data appendData:msgData];
    } else {
        data = [NSMutableData dataWithCapacity:(length + 10)];
        [data appendBytes:"\x81\x7F" length:2];
        [data appendBytes:(UInt8[]){0, 0, 0, 0, (UInt8)(length >> 24), (UInt8)(length >> 16), (UInt8)(length >> 8), length & 0xFF} length:8];
        [data appendData:msgData];
    }

    [self writeData:data withCompletionBlock:^(BOOL success) {}];
}</code></pre></div>

<div class="code"><pre><code>- (void)handleReceivedData:(NSData *)data {
    NSUInteger curPointPos = 0;     // pointer postion cursor
    NSUInteger msgLength;           // payload length
    NSUInteger opCode;
    BOOL frameMasked;
    NSData *maskingKey;

    NSData *tmp = [[NSData alloc] initWithBytes:(UInt8 *)[data bytes] length:1];// first byte
    curPointPos++;

    UInt8 frame = *(UInt8 *)[tmp bytes];
    if ([self isValidWebSocketFrame:frame]) {
        opCode = frame & 0x0F;
    } else {
        [self closeWebSocket];
        return;
    }

    tmp = [[NSData alloc] initWithBytes:((UInt8 *)[data bytes] + curPointPos) length:1];
    curPointPos++;

    frame = *(UInt8 *)[tmp bytes];
    frameMasked = WS_PAYLOAD_IS_MASKED(frame);
    NSUInteger length = WS_PAYLOAD_LENGTH(frame);

    if (length <= 125) {
        if (frameMasked) {
            maskingKey = [[NSData alloc] initWithBytes:((UInt8 *)[data bytes] + curPointPos) length:4];
            curPointPos += 4;
        }
        msgLength = length;
    } else if (length == 126) {
        tmp = [[NSData alloc] initWithBytes:((UInt8 *)[data bytes] + curPointPos) length:2];
        curPointPos += 2;

        UInt8 *pFrame = (UInt8 *)[tmp bytes];
        NSUInteger length = ((NSUInteger)pFrame[0] << 8) | (NSUInteger)pFrame[1];
        if (frameMasked) {
            maskingKey = [[NSData alloc] initWithBytes:((UInt8 *)[data bytes] + curPointPos) length:4];
            curPointPos += 4;
        }
        msgLength = length;
    } else {
        tmp = [[NSData alloc] initWithBytes:((UInt8 *)[data bytes] + curPointPos) length:8];
        curPointPos += 8;
        // FIXME: 64bit data size in memory?
        [self closeWebSocket];
        return;
    }

    NSData *remainingData = [[NSData alloc] initWithBytes:((UInt8 *)[data bytes] + curPointPos) length:msgLength];
    if (frameMasked && maskingKey) {
        NSMutableData *masked = [remainingData mutableCopy];
        UInt8 *pData = (UInt8 *)masked.mutableBytes;
        UInt8 *pMask = (UInt8 *)maskingKey.bytes;
        for (NSUInteger i = 0; i < msgLength; i++) {
            pData[i] = pData[i] ^ pMask[i % 4];
        }
        remainingData = masked;
    }
    if (opCode == WS_OP_TEXT_FRAME) {
        NSString *msg = [[NSString alloc] initWithBytes:[remainingData bytes] length:msgLength encoding:NSUTF8StringEncoding];
        [self didReceiveMessage:msg];

        if (self.isReadSourceSuspended) {
            // current reading finished, prepare for the next read event
            dispatch_resume(self.readSource);
            self.socketFDBytesAvailable = 0;
        }
    } else {
        [self closeWebSocket];
    }
}
</code></pre></div>

<h2 id="section_7">遇到的问题</h2>

<h3>HSDGWebSocket 实例无法释放问题</h3>

HSDGWebSocket 使用 dispatch_source 监听客户端 Socket 文件描述符。如果有数据可以读取，则 event_handler 会读取并解析数据。

最初的实现中设置了 dispatch_source_set_cancel_handler，如果接收到 WebSocket 关闭的信息，调用 dispatch_source_cancel，cancel_handler 会负责执行清理的工作，比如关闭 Socket 文件描述符。但是，测试下来发现，调用 dispatch_source_cancel 并没有触发 cancel_handler 的执行，并且，event_handler 的 block 实例不会释放，而且一直持有着 HSDGWebSocket 实例。

使用另外一种方法解决了这个问题。不再设置 dispatch_source_set_cancel_handler，如果接收到 WebSocket 关闭的信息，主动去执行清理的工作。并且 dispatch_source_set_event_handler 的 block 弱引用 HSDGWebSocket，解决 HSDGWebSocket 无法释放的问题。

dispatch_source_cancel 没有触发 cancel_handler 的原因还不知道。当前的做法可能仍然存在 dispatch_source_set_event_handler 的 block 实例一直未释放的问题。

<h3>参考文献：</h3>

<a href="https://github.com/abbshr/abbshr.github.io/issues/22" target="_blank">学习WebSocket协议—从顶层到底层的实现原理（修订版）</a>
