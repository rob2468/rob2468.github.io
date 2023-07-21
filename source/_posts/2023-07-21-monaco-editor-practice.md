---
layout: post
title: Monaco Editor
tags:
  - 工程实践
---

# {{ page.title }}

[Monaco](https://microsoft.github.io/monaco-editor/) 是一个代码编辑器，大名鼎鼎的 VS Code 便是基于 Monaco 实现。

## 背景

在公司里做了一个 PC 端应用，应用名 RPCUI，开发语言 Objective-C。可以在该应用中发起 RPC 调用，调试接口。

RPCUI 实现了一个 JSON 编辑器，用于呈现 RPC 的输入和输出数据。这个编辑器实现原理很简单：使用 WKWebView 加载 Monaco，然后再将 webView 贴到原生视图上。

本文介绍 Monaco 使用的一些实用功能。

<!-- more -->

## 引入

{% codeblock package.json lang:json %}
{
  "name": "rpcui-editor",
  "version": "0.0.1",
  "description": "RPCUI 子项目，基于 Monaco Editor",
  "main": "index.js",
  "scripts": {},
  "author": "",
  "license": "MIT",
  "dependencies": {
    "monaco-editor": "^0.19.3"
  }
}
{% endcodeblock %}

## 初始化

{% codeblock index.html lang:html %}
<!DOCTYPE html>
<html>
<head>
  <title>browser-amd-editor</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta http-equiv="Content-Type" content="text/html;charset=utf-8" >
  <link rel="stylesheet" href="./index.css">
</head>
<body>

<div id="container"></div>

<!-- OR ANY OTHER AMD LOADER HERE INSTEAD OF loader.js -->
<script src="../node_modules/monaco-editor/min/vs/loader.js"></script>
<script src="./index.js"></script>
</body>
</html>
{% endcodeblock %}

{% codeblock index.js lang:js %}
let editor;
(function (text) {
  require.config({
    paths: {
      'vs': '../node_modules/monaco-editor/min/vs'
    },
  });

  require(['vs/editor/editor.main'], function() {
    editor = monaco.editor.create(document.getElementById('container'), {
      value: text,
      language: option.language || 'json',
      readOnly: !!option.readOnly,
      lineNumbers: option.lineNumbers || 'on',
      automaticLayout: true,
      wordWrap: 'on',
      minimap: {
        enabled: false,
      },
      scrollBeyondLastLine: false,
    });
  });
})('');
{% endcodeblock %}

## 常用功能

下面代码块是一些 util 函数。

{% codeblock index.js lang:js %}
// 当前光标是否定位在最后一行
function isLastLine() {
  const { lineNumber } = editor.getPosition() || {};
  const isLastLine = lineNumber === editor.getModel().getLineCount();
  return isLastLine;
}

// 滚动到编辑器底部
function scrollToBottom() {
  const lineCount = editor.getModel().getLineCount();
  editor.revealLine(lineCount);
  editor.setPosition({ lineNumber: lineCount, column: 0 });
}
{% endcodeblock %}

### 更新

feature: 如果更新前编辑器定位在最后一行，那么内容更新后，编辑器仍然需要定位在最后一行。

{% codeblock index.js lang:js %}
// 更新编辑器内容
function updateText(text) {
  console.log(text);
  if (!editor) {
    console.log('editor not instantiated');
    return;
  }

  // 当前光标是否定位在最后一行
  const lastLine = isLastLine();

  // 更新内容
  editor.setValue(text);

  if (option.scrollToBottom && lastLine) {
    // 滚动到编辑器底部
    scrollToBottom();
  }
}
{% endcodeblock %}

### 追加

feature1: 如果追加内容前编辑器定位在最后一行，那么内容更新后，编辑器仍然需要定位在最后一行。

feature2: 即使编辑器是只读的，也能成功追加内容。

(RPCUI 中有一个打印日志的功能，追加接口主要给这个功能使用。)

{% codeblock index.js lang:js %}
// 追加文本
function appendText(text) {
  console.log(text);
  if (!editor) {
    console.log('editor not instantiated');
    return;
  }

  // 是否最后一行
  const lastLine = isLastLine();

  // 找到文档最后的位置
  const lineCount = editor.getModel().getLineCount();
  const lastLineLength = editor.getModel().getLineMaxColumn(lineCount);
  const range = new monaco.Range(
      lineCount,
      lastLineLength,
      lineCount,
      lastLineLength
  );

  // 追加文本
  !!option.readOnly && editor.updateOptions({ readOnly: false });
  const result = editor.executeEdits('', [
      { range, text, forceMoveMarkers: true }
  ])
  !!option.readOnly && editor.updateOptions({ readOnly: true });

  if (option.scrollToBottom && lastLine) {
    // 滚动到编辑器底部
    scrollToBottom();
  }

  return result;
}
{% endcodeblock %}

### 获取

{% codeblock index.js lang:js %}
// 获取编辑器内容
function getText() {
  if (editor) {
    return editor.getValue();
  }
  return '';
}
{% endcodeblock %}

## 原生调用

上文说到，Monaco 是先被加载到 WKWebView 中，再贴到原生视图上。本小节讲述，PC 原生应用如何与 Monaco 通信。

Monaco [初始化](#初始化)的时候需要配置一些参数，可以通过跳转链接传递。

{% codeblock 传递参数(OC代码) lang:objc %}
NSString *editorDir = [[NSBundle mainBundle] pathForResource:@"rpcui-editor" ofType:@""];
NSURL *editorDirURL = [NSURL fileURLWithPath:editorDir];

NSString *editorPath = [editorDir stringByAppendingPathComponent:@"src/index.html"];
editorPath = [editorPath stringByAddingPercentEncodingWithAllowedCharacters:[NSCharacterSet URLPathAllowedCharacterSet]];
NSString *query = [NSString stringWithFormat:
    @"?language=%@&lineNumbers=%@&readOnly=%@&scrollToBottom=%@",
    self.option.language,
    self.option.lineNumbers,
    self.option.readOnly ? @"1" : @"",
    self.option.scrollToBottom ? @"1" : @""];
NSString *editorUrlStr = [NSString stringWithFormat:@"file://%@%@", editorPath, query];
NSURL *url = [NSURL URLWithString:editorUrlStr];
[self.webView loadFileURL:url allowingReadAccessToURL:editorDirURL];
{% endcodeblock %}

{% codeblock 接收参数(js代码) lang:js %}
const urlParams = new URLSearchParams(window.location.search);
const option = {
  language: urlParams.get('language'),
  readOnly: urlParams.get('readOnly'),
  lineNumbers: urlParams.get('lineNumbers'),
  scrollToBottom: urlParams.get('scrollToBottom'),
};
{% endcodeblock %}

如上文所述，编辑器的接口已经直接暴露在了 H5 全局作用域中。原生应用调用编辑器的方式如下所示。

{% codeblock 发起调用(OC代码) lang:objc %}
- (void)_appendText:(NSString *)str {
    NSString *res = [str copy];
    res = [res stringByReplacingOccurrencesOfString:@"\"" withString:@"\\\""];
    res = [res stringByReplacingOccurrencesOfString:@"\n" withString:@"\\n"];
    res = [res stringByReplacingOccurrencesOfString:@"\r" withString:@""];
    res = [res stringByReplacingOccurrencesOfString:@"'" withString:@"\\'"];
    NSString *jsStr = [NSString stringWithFormat:@"appendText('%@');", res];
    [self.webView evaluateJavaScript:jsStr completionHandler:^(id _Nullable res, NSError * _Nullable error) {
    }];
}
{% endcodeblock %}
