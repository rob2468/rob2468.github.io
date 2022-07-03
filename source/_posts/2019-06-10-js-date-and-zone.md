---
layout: post
title: JavaScript Date 和时区
page_id: id-2019-06-10
tag:
- JavaScript
- 工程实践
---

<h1 class="title">{{ page.title }}</h1>

<h2 id='section_1'>概述</h2>

JS 中使用 <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date" target="_blank">Date</a> 类型记录时间。Date 类型是对时间的抽象封装，它提供了许多操作时间的便利方法。本文整理了如何使用 Date 来处理时间，以及解决时区转换带来的问题。

<!-- more -->

<h2 id='section_2'>Date 实例</h2>

一个 Date 实例封装了一个时间，其中，时间的底层表示方式是1970年1月1日至今的毫秒数。并且，这里毫秒数的计算与时区无关，均以 UTC±0 计算。在同一时刻生成的 Date 实例，无论是在北京，还是在西雅图，其中封装的时间都是相同的。

<h2 id='section_3'>时间的传输与显示</h2>

在实际环境中，时间信息经常需要在不同的系统之间传输。最简单的方法便是采用时间的毫秒数表达方式。这种方式不需要考虑时区问题，能够准确传递时间信息，并且，由于使用的是整数数据类型，适用于所有的系统。JS Date 实例的 getTime()、valueOf() 接口可以返回1970年1月1日至今的毫秒数。

时间的毫秒数表达方式对机器友好，但是不易理解。当时间从毫秒数转换为人类可以理解的时间表达方式时，需要考虑时区的影响。

JS 中 Date 实例提供的接口包含本地化（时区有关）接口和时区无关接口。比如，Date 实例的 toString() 接口返回的是本地化的时间，getUTCHours() 接口返回的是时区无关的信息。

<h2 id='section_4'>案例分析</h2>

存在一个 BS（Browser-Server）结构的系统，用户在浏览器上执行了某项操作，这个操作的时间会发送至服务端存储。浏览器与服务端均可能处于任意时区。如果使用1970年1月1日至今的毫秒数来表示和传递时间，不需要考虑时区问题。

对于希望以北京时间（UTC+8）、人类可理解的方式来表示时间时，有如下两种处理方式。

1、如果当前执行环境所在的时区为 UTC+8，那么直接使用 Date 实例的本地化接口就能获得北京时间的表达。Date 实例的 getTimezoneOffset() 接口可以判断当前所处的时区，其返回值表示本地时区与 UTC±0 时区分钟差。

{% codeblock lang:js %}
/* 本地化接口 */
getDate()
getDay()
getMonth()
getFullYear()
getHours()
getMinutes()
getSeconds()
...
{% endcodeblock %}

2、如果不想考虑当前执行环境所在时区带来的影响，Date 也提供了一系列时区无关的接口。如下代码所示，核心思想是将原始时间和转换后的时间都当成 UTC±0 的时间来处理。

{% codeblock lang:js %}
function getFormattedBeijingDateString(timestamp) {
  const utcDate = new Date(timestamp + 8 * 60 * 60 * 1000); // 时区时间差
  const year = `${utcDate.getUTCFullYear()}`;
  let month;
  if (utcDate.getUTCMonth() + 1 < 10) {
    month = `0${utcDate.getUTCMonth() + 1}`;
  } else {
    month = `${utcDate.getUTCMonth() + 1}`;
  }
  let day;
  if (utcDate.getUTCDate() < 10) {
    day = `0${utcDate.getUTCDate()}`;
  } else {
    day = `${utcDate.getUTCDate()}`;
  }
  return `${year}-${month}-${day}`;
}
{% endcodeblock %}

<h2 id='section_5'><a href="https://momentjs.com" target="_blank">moment.js</a></h2>

`moment().utcOffset(8).format('YYYY-MM-DD');`

使用这种方法可以显示北京时间。

moment.js 的 utcOffset() 接口的核心逻辑如下语句所示，其原理和上一小节时区无关的处理方式类似。

`mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);`
