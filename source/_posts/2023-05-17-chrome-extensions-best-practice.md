---
title: Chrome Extensions 开发最佳实践
tags:
  - React
  - webpack
---

# {{ page.title }}

阅读本文需要的基础知识：Chrome Extensions、webpack、React。

## 背景

Chrome Extensions 是什么？见下面截图。

![](/images/2023-05-17-chrome-extensions-entry.png)

![Chrome Extensions](/images/2023-05-17-chrome-extensions.png)

如何开发 Chrome Extensions 可参考 [Google 开发者文档](https://developer.chrome.com/docs/extensions/)。

Extensions 使用 [vanilla-js](https://www.carrentalgateway.com/glossary/vanilla-javascript/) 开发，开发复杂项目有点痛苦。本文讲述如何为 Extensions 项目配置 [webpack](https://v4.webpack.js.org/concepts/)/React/Typescript，完整代码可跳到 [文章最后](#代码) 获取。

有许多文章讲过这个话题，比如 [Creating a Chrome extension with React and TypeScript](https://blog.logrocket.com/creating-chrome-extension-react-typescript/)。最近自己做了一个 Extension 工具，于是从自己的视角总结出这篇文章。

## 项目结构

项目顶层结构与 [create-react-app](https://create-react-app.dev/) 创建的应用类似。`src/` 存放主要的业务代码；`public/` 存放需要输出的文件如模版文件、图片、配置等；[项目构建](https://github.com/rob2468/chrome-extension-best-practice/blob/master/package.json#L7)后的产物放在 `build/` 文件夹中，该文件夹可以直接加载成 Chrome Extension 执行。

`src/` 下的文件按 Chrome Extensions 的概念进行了组织，看文件名就能看懂。

![](/images/2023-05-17-project-structure.png)

## 支持多文件打包

webpack 相关的配置在 [craco.config.js](https://github.com/rob2468/chrome-extension-best-practice/blob/master/craco.config.js) 文件中。([craco 官网](https://craco.js.org/))

下面的配置按 MPA(Multi-Page Application) 的思想对项目进行了打包。如，Extension 每个页面的脚本打包成了 main.js/setting.js/log.js、Content Scripts 打包成了 content.js、Service Workers 打包成了 background.js。

{% codeblock lang:js %}
{
  entry: {
    // 页面
    main: './src/pages/popup/index.tsx',
    setting: './src/pages/setting/index.tsx',
    log: './src/pages/log/index.tsx',
    // content scripts
    content: './src/content-scripts/index.ts',
    // service worker
    background: './src/service-worker/index.ts',
  },
  output: {
    ...webpackConfig.output,
    filename: 'static/js/[name].js',
  },
}
{% endcodeblock %}

## 支持多页面打包

{% codeblock lang:js %}
const htmlWebpackPlugin = require('html-webpack-plugin');
{
  plugins: [
    ...webpackConfig.plugins,
    new htmlWebpackPlugin({
      title: 'popup',
      filename: 'popup.html',
      template: 'public/index.html',
      chunks: ['main'],
    }),
    new htmlWebpackPlugin({
      title: 'setting',
      filename: 'setting.html',
      template: 'public/index.html',
      chunks: ['setting'],
    }),
    new htmlWebpackPlugin({
      title: 'log',
      filename: 'log.html',
      template: 'public/index.html',
      chunks: ['log'],
    }),
  ],
}
{% endcodeblock %}

## FAQ

### webpackJsonpchecker 错误

Extension 加载报错 Uncaught TypeError: Cannot read properties of undefined (reading 'webpackJsonpchecker')

![undefined reading webpackJsonpchecker](/images/2023-05-17-webpackJsonpchecker-error.jpg)

webpack 打包会根据一定的策略将代码拆成多个 chunk，参考 [官方文档](https://v4.webpack.js.org/plugins/split-chunks-plugin/)；webpack 构建产物的运行环境默认为 web，参考 [官方文档](https://v4.webpack.js.org/concepts/targets/)，但是 Chrome Extensions Service Workers 的运行环境既不是 web，也不是 node。webpack 使用 webpackJsonp 在 web 环境中加载其它 chunk。如果 Service Workers 的代码被打包到了多个 chunk 中，那 Extension 加载时只会加载 manifest 中显式声明了的那个[文件](https://github.com/rob2468/chrome-extension-best-practice/blob/master/public/manifest.json#L10)，而其它的 chunk 无法加载 (因为 Chrome Extensions Service Workers 不是 web 环境)，便会出现这个错误。

最简单的解法是让 webpack 打包时不要拆包。

webpack 配置中 `optimization.splitChunks.minSize` 字段的含义是，若构建后的文件大小超过该值，则需要拆包。该值默认为 30000，即 30kb。将该值改成一个极大值，比如 [150000](https://github.com/rob2468/chrome-extension-best-practice/blob/master/craco.config.js#L32) (150kb)，可以解决该问题。

### 运行环境

不同的运行环境提供的 API 不同，开发时不加注意可能会出现一些不合预期的效果。

比如在 Service Workers 中调用 web 的 API 会报错，如 DOMParser。

比如在 web 页面中调用 [chrome.notifications.create](https://developer.chrome.com/docs/extensions/reference/notifications/#method-create) 创建推送，会发现推送的内容无法显示。

### [notification](https://developer.chrome.com/docs/extensions/reference/notifications/) 与 [alarms](https://developer.chrome.com/docs/extensions/reference/alarms/)

创建 notification 有个 eventTime 参数，但是该参数并不能实现定时推送。若要实现定时推送功能，需要再结合 alarms 接口。

[代码示例-创建 alarms](https://github.com/rob2468/chrome-extension-best-practice/blob/master/src/pages/popup/util.ts#L120-L122)

[代码示例-创建 notification](https://github.com/rob2468/chrome-extension-best-practice/blob/master/src/service-worker/index.ts#L86-L111)

## 代码

[chrome-extension-best-practice](https://github.com/rob2468/chrome-extension-best-practice)

## 参考文档

[Chrome Extensions](https://developer.chrome.com/docs/extensions/)

[Extension service worker basics](https://developer.chrome.com/docs/extensions/mv3/service_workers/basics/)

[Creating a Chrome extension with React and TypeScript](https://blog.logrocket.com/creating-chrome-extension-react-typescript/)
