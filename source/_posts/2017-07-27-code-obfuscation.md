---
layout: post
title: 代码混淆
page_id: id-2017-07-28
tags:
- iOS
---

<h1 class="title">{{ page.title }}</h1>

class-dump 可以方便的导出 app 的类名和方法名，即使编译好的程序也能被第三方清晰看到编码信息。为了隐藏这些信息，可以对代码进行混淆，使得用如 class-dump 工具导出的类名和方法名变成毫无意义的乱码。

<!-- more -->

<h2 id="section_1">一、基本原理</h2>

利用宏，将敏感类名、方法名替换成其它字符串。

可以在预编译头文件中(.pch)将希望替换的字符串定义为其它值，如 `#define SensitiveMethod AMMAzmGDxKvDXlxI`。在程序预编译环节，所有希望被替换的字符串会被替换，对生成的包进行 class-dump 只能看到替换后的毫无意义的内容。

这种方法非常简单，人工操作也能完成。当需要替换的方法比较多，并且经常需要维护时，一些实用脚本就很重要。

<h2 id="section_2">二、实用工具</h2>

下面的脚本片段从参考文献[1]中拷贝而来，并作了部分调整，增加了随机字符串去重的功能。

{% codeblock lang:sh %}
#!/usr/bin/env bash
TABLENAME="symbols"
SYMBOL_DB_FILE="symbols"
STRING_SYMBOL_FILE="obfuscation.list"
HEAD_FILE="CodeObfuscation.h"
export LC_CTYPE=C
createTable() {
    echo "create table $TABLENAME (src text, des text);" | sqlite3 $SYMBOL_DB_FILE
}
insertValue() {
    echo "insert into $TABLENAME values('$1' ,'$2');" | sqlite3 $SYMBOL_DB_FILE
}
isUnique() {
    echo "select count(*) from $TABLENAME where des='$1';" | sqlite3 $SYMBOL_DB_FILE
}
randomString() {
    random=`openssl rand -base64 64 | tr -cd 'a-zA-Z' |head -c 16`
    count=`isUnique $random`
    if [[ $count -eq 0 ]]; then
        echo $random
    else
        randomString
    fi
}

rm -f $SYMBOL_DB_FILE
rm -f $HEAD_FILE
touch $HEAD_FILE
createTable
echo '#ifndef CodeObfuscation_h
#define CodeObfuscation_h' >> $HEAD_FILE
echo "// obfuscate string at `date`" >> $HEAD_FILE
cat "$STRING_SYMBOL_FILE" | while read -ra line; do
    if [[ -n "$line" ]]; then
        random=`randomString`
        insertValue $line $ramdom
        res="#define $line $random"
        echo $res
        echo "$res" >> $HEAD_FILE
    fi
done
echo "#endif" >> $HEAD_FILE
rm -f $SYMBOL_DB_FILE
{% endcodeblock %}

STRING_SYMBOL_FILE 为文件名，文件内容为希望替换的字符串列表。HEAD_FILE 为文件名，文件内容为脚本生成的包含宏定义的头文件。randomString 函数用于生成一段随机字符串。脚本主体功能是不断读取 STRING_SYMBOL_FILE 中的行，每行一个原始字符串，然后生成一个随机字符串，将原始字符串和随机字符串组成一行 #define 语句。

脚本文件、资源文件和生成的文件都在同一个文件夹内，将生成的头文件加入 Xcode 工程运行即可。

<h2 id="section_3">三、对 JSPatch 进行代码混淆</h2>

出于某些原因希望对 JSPatch 进行代码混淆，下面是一个供参考的需要进行宏替换的字符串列表。

<pre><code>/* obfuscation.list 文件 */
startEngine
evaluateScriptWithPath
handleException
handleMemoryWarning
defineStruct
addExtensions
formatOCToJS
formatJSToOC
formatPointerOCToJS
formatRetainedCFTypeOCToJS
formatPointerJSToOC
includedScriptPaths
getStructDataWidthDict
boxAssignObj
boxWeakObj
boxClass
boxPointer
boxObj
sizeOfStructTypes
getDictOfStruct
structDefine
registeredStruct
overideMethods
unboxPointer
unboxClass
jp_methodSignatureForSelector
jp_fixMethodSignature
JPBoxing
JPBlock
JPBlockWrapper
JPCFunction
JPMemory
JPStructPointer
JPCGBitmapContext
JPCGColor
JPCGContext
JPCGGeometry
JPCGImage
JPCGPath
JPCGTransform
JPCoreGraphics
JPUIGeometry
JPUIGraphics
JPUIImage
JPUIKit
JPCleaner
JPDispatch
JPMethodSignature
JPLocker
JPNumber
JPKeyCommands
SGDirWatchdog
JPProtocol
JPSpecialInit
JPEngine
JPLoader
JPLoaderInclude
JPLoaderTestInclude
JPExtension
JPPlayground
JPDevErrorView
JPDevMenu
JPDevMenuItem
JPDevTipView
JPDevMenuDelegate
</code></pre>

将上述文件和脚本文件置于同一目录下，运行脚本，下面是某次脚本运行生成的文件。

<pre><code>/* CodeObfuscation.h 文件 */
#ifndef CodeObfuscation_h
#define CodeObfuscation_h
// obfuscate string at Fri Jul 28 12:45:21 CST 2017
#define startEngine rdJNwMkstxAdgTFL
#define evaluateScriptWithPath yAvecLQuTiEMeNsT
#define handleException WAkEkJAxYsLykKyv
#define handleMemoryWarning oaXLPKCxCtfKGJeW
#define defineStruct GjiZQiIMtEwyWWVS
#define addExtensions GEmkGoxUmbPzRdmt
#define formatOCToJS YpiwrHcArsBpJXTS
#define formatJSToOC climBocqWpttGVau
#define formatPointerOCToJS utvGIZGVpNptzCWk
#define formatRetainedCFTypeOCToJS gkRDszHNVSlMLXwV
#define formatPointerJSToOC KeXMzRZhXokwBLTD
#define includedScriptPaths iyykkqiuXTyyfIkx
#define getStructDataWidthDict iWZcEmoDMsCwByFA
#define boxAssignObj nKwYjPgxqvoaHDPA
#define boxWeakObj LWBChawEsBPFeklf
#define boxClass dOyxzqPxWYRyaDmA
#define boxPointer wbgOZodlBvuTfkLV
#define boxObj ZgZiiUrfdcWfrFkf
#define sizeOfStructTypes ygfGusyduZNVRhoW
#define getDictOfStruct qjpYzeGFXvfMMiNx
#define structDefine OFiaPHkJGWtfcMqf
#define registeredStruct NMITSMUVqKSKuZfz
#define overideMethods fSWuuGIvDeqvqiAg
#define unboxPointer eWpIDRkJqcoHnlrJ
#define unboxClass ySOroUGrmstYxbmM
#define jp_methodSignatureForSelector kuSFemPscuSWfJbh
#define jp_fixMethodSignature GIznNCivsWkDKewL
#define JPBoxing TXTqOtxDcUfdeDSe
#define JPBlock yCTmqKUAuJjUyuRJ
#define JPBlockWrapper UtCZyrKfUUnHIejz
#define JPCFunction hOWwPgWCLfytAZvs
#define JPMemory cYaMhKFCQBAHNBok
#define JPStructPointer yJfJQULYadRquRyu
#define JPCGBitmapContext goeAMuEjGJCbOEQk
#define JPCGColor flwdaxODQRxQaPvb
#define JPCGContext TOQTnOZzwTSUtRou
#define JPCGGeometry mGsrezEWgSmzjeFI
#define JPCGImage QviOtnBSzUNMpveN
#define JPCGPath KLmUdVIAakeyUezz
#define JPCGTransform GUDelQLyPwrrZJgW
#define JPCoreGraphics zKgCkjSJyVSOPMcG
#define JPUIGeometry lrqHnPjIoieSpLqV
#define JPUIGraphics gSvvRPOPcAtPzhFj
#define JPUIImage aIttbDdtBoLRtzeE
#define JPUIKit ysqZAerLSNZmXHQH
#define JPCleaner njxcYnrkovoAnHiJ
#define JPDispatch ahheTIqQJQdkZfuJ
#define JPMethodSignature BglmbmbWOAxnsxPt
#define JPLocker hTrTdNjiDteJlyRF
#define JPNumber BBqHFoyRMmIoZsoy
#define JPKeyCommands DtonkkviiFOmUWGF
#define SGDirWatchdog GeZXQoLkXjtthFqi
#define JPProtocol hjCmzMnZkipIoAdb
#define JPSpecialInit YVfTaIikxNoVsRnn
#define JPEngine gQRfVmvoSaJQLWgr
#define JPLoader fPokckGFbrsbvFWz
#define JPLoaderInclude IqxChVAKgXBAmLDi
#define JPLoaderTestInclude dzcNcynhBPuHmpkK
#define JPExtension MNlpCgwoLMNckrxC
#define JPPlayground NGWTxKtFPeZehpwD
#define JPDevErrorView DbRtEPhGORiWeMEP
#define JPDevMenu WHSuUQPiGUDfsSjG
#define JPDevMenuItem wJUoJRgOlKUIQlfE
#define JPDevTipView ZOEYPkhWyVaoiRqE
#define JPDevMenuDelegate DHhfMzdeghLzvggm
#endif
</code></pre>

JSPatch 中的核心 JS 脚本 JSPatch.js 直接打入包中，拆开包便能看到。可以使用另一种思路进行代码混淆，修改文件名、将文件内容进行编码（如base64编码），再加入到 bundle 中。需要运行 JSPatch.js 时，先读取文件内容再解码，便能获得原始的 JS 脚本内容。

<h3>参考文献：</h3>

1. <a href="http://blog.csdn.net/yiyaaixuexi/article/details/29201699" target="_blank">iOS安全攻防（二十三）：Objective-C代码混淆</a>

2. <a href="https://cnbin.github.io/blog/2015/05/21/objective-c-class-dump-an-zhuang-he-shi-yong-fang-fa/" target="_blank">Objective-C Class-dump 安装和使用方法</a>

3. <a href="https://github.com/bang590/JSPatch" target="_blank">JSPatch</a>
