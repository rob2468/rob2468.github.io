---
layout: post
title: 统计特定时间段的代码提交记录
tags:
  - Git
  - Shell
---

# {{ page.title }}

## 背景

如果老板问你最近加班的情况是否严重，你如何回答？

可以执行下面一段 Shell 脚本，自动统计特定时间段的代码提交记录。

<!-- more -->

## 脚本代码

{% codeblock lang:sh %}
#!/usr/bin/env bash

echo '代码路径：' $1
echo '提交人：' $2
echo

# 切换到代码库
cd $1

# 按特定格式输出 git 日志，以 ¥ 字符分隔关键字段，字段说明见文末 git 官方文档
# 按行读取日志
git log --pretty=format:"%cn¥%ci¥%s¥%H" | while read line
do
  # 遍历每一行日志
  # 以 ¥ 字符为分隔，拆分日志
  IFS='¥'
  read -ra strArr <<< "$line"
  unset IFS

  # echo ${strArr[0]} # 提交人
  # echo ${strArr[1]} # 提交时间

  # 提交人判断
  if [ ${strArr[0]} != $2 ]; then
    continue
  fi

  # 提交时间判断
  IFS=' '
  read -ra timeArr <<< "${strArr[1]}"
  unset IFS

  if [ ${timeArr[1]} \> "08:00:00" ] && [ ${timeArr[1]} \< "23:00:00" ]; then
    continue
  fi

  # 打印非指定时间区间的提交记录
  echo $line
done
{% endcodeblock %}

## 说明

下图是执行的示意图。`cmd.sh` 就是上面的脚本。

![](/images/2023-09-01-示例.png)

## 相关文档

https://git-scm.com/docs/pretty-formats
