---
title: 监听文件变化
tags:
- JavaScript
- webpack
---

# {{ page.title }}

## 背景

之前做了一个工具 CubeTrans，可以将 “Vue” 代码转译成了 React 代码，具体参考这篇文章 {% post_link vue-to-react-cubetrans %}。为了让 CubeTrans 有用，又做了 CubeTransDev 工具，核心功能是实时监听文件变化。当监听到代码或 mock data 变化时，能够自动编译并实时预览。

<!-- more -->

## 原理

![](/images/2022-07-18-cubetransdev-file-watch.png)

使用 nodejs 原生提供的 fs.watch API 来监听 Cube 工程代码，示例代码如下。当监听到文件发生变化时，则使用 CubeTrans 将 Cube 代码转译为 React 代码。

另外，示例代码中使用了 debounce 处理防抖，避免 fs.watch 回调过于频繁的问题；检查文件路径，忽略了无关文件的改动。

{% codeblock lang:js %}
import fs from 'fs';
import path from 'path';
import { debounce } from 'lodash';

const nodeModulesDir = path.resolve(process.cwd(), 'node_modules');
const gitDir = path.resolve(process.cwd(), '.git');

fs.watch(curPath, { recursive: true }, debounce((event, filename) => {
  const watchedFile = path.resolve(process.cwd(), filename);
  if (
    watchedFile.startsWith(nodeModulesDir) ||
    watchedFile.startsWith(gitDir) ||
    // ... 其它需要忽略的路径
  ) {
    // 忽略的路径
    // node_modules 目录 || .git 目录
    return;
  }

  /* 使用 CubeTrans 转译源代码 */
}, 300));
{% endcodeblock %}

转译后的 React 代码使用 webpack-dev-server 实现实时预览，示例代码如下。

{% codeblock lang:js %}
// 使用 webpack-dev-server 来 serve 转译后的 react 组件
const Webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const webpackConfig = require('./webpack.config.js');

const compiler = Webpack(webpackConfig);
const server = new WebpackDevServer(webpackConfig.devServer, compiler);

const runServer = async () => {
  await server.start();
};

module.exports = runServer;
{% endcodeblock %}

{% codeblock webpack.config.js lang:js %}
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// CubeTrans 构建产物 (即转译后的 React 代码) 的文件夹名称
const BUILD_PATH_NAME = 'build';

// webpack 入口文件名
const ENTRY_JS_FILE_NAME = 'entry.js';

// 预览的 html 内容
const HTML_TEMPLATE_CONTENT = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title></title>
  </head>
  <body>
    <div id="the_root_of_your_reactJS_component"></div>
  </body>
</html>`;

const appDirectory = path.resolve(process.cwd(), BUILD_PATH_NAME); // App directory

// Gets absolute path of file within app directory
function resolveAppPath(relativePath) {
  return path.resolve(appDirectory, relativePath || '');
}

// Host
const host = process.env.HOST || 'localhost';

process.env.NODE_ENV = 'development';

module.exports = {
  entry: resolveAppPath(ENTRY_JS_FILE_NAME), // 入口文件路径
  output: {
    path: resolveAppPath('dist'),
    filename: 'static/js/bundle.js',
  },
  mode: 'development',
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  devServer: {
    compress: true,
    hot: true,
    host,
    open: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        include: appDirectory,
        loader: 'babel-loader',
        options: {
          presets: [require.resolve('babel-preset-react-app')],
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      templateContent: HTML_TEMPLATE_CONTENT,
    }),
  ],
};
{% endcodeblock %}

CubeTrans 转译后的产物只是一个 React 组件，若需要运行起来，还需要一个入口文件，即上文原理图中的 entry.js 文件。

下面示例代码是是一个入口文件内容，其中 {MOCK_DATA} 是 mock data，需要替换为实际的值。

{% codeblock entry.js lang:js %}
import React from 'react';
import ReactDOM from 'react-dom';
import App from './index.jsx';

ReactDOM.render(<App
  { ...{MOCK_DATA} }
/>, document.getElementById('the_root_of_your_reactJS_component'));
{% endcodeblock%}

## 总结

本文主要介绍两种实时监听文件变化的方案。

1. nodejs 原生提供的 fs.watch API；

2. webpack-dev-server；

另外，提供了一种在实际场景下的应用这两种方案的案例。
