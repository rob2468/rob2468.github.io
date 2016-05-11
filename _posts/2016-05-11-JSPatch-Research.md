---
layout: post
title: JSPatch调研
---

# {{ page.title }}

在项目中引入了[JSPatch](https://github.com/bang590/JSPatch)，利用其能力实现了不少针对app线上问题的热修复。在使用过程中发现一些问题，并做了调研。

### 1. 在OC中使用快速遍历访问NSArray中的元素，转换为JS后，快速遍历无法得到数组元素。

JSPatch对OC中的数组、字典、字符串进行了封装，在JS中被封装成JPBoxing对象，而不是原生的JS数组、字典、字符串。这种处理使得对应的数据对象在OC和JS之间传输时，仍能保持其在OC中的特性。具体原因见[JSPatch-实现原理详解-jpboxing](https://github.com/bang590/JSPatch/wiki/JSPatch-%E5%AE%9E%E7%8E%B0%E5%8E%9F%E7%90%86%E8%AF%A6%E8%A7%A3#4jpboxing)。因此，在JS中快速遍历时，访问的是相应的JPBoxing对象的可枚举属性。

JS中的数组JPBoxing对象可调用方法toJS()，获取相应的原生JS数组。但此时快速遍历的元素是JS数组的下标，不同于OC中的快速遍历，仍然需要额外的操作才能获得数组元素。

JS中快速遍历的顺序依赖于具体实现，不能保证永远按照索引顺序访问。因此最好使用for(;;)语法访问数组。


{{ page.date | date_to_string }}
