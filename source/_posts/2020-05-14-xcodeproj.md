---
layout: post
title: 使用 xcodeproj 构建脚本
page_id: id-2019-12-29
tag:
- iOS
- xcodeproj
- 工程实践
---

<h1 class="">{{ page.title }}</h1>

<a href="https://github.com/CocoaPods/Xcodeproj" target="_blank">xcodeproj</a> 是 CocoaPods 的一个子项目，能够创建和修改 Xcode 工程。基于 xcodeproj 的能力编写脚本，可以完成许多 Xcode 工程配置的自动化工作。

<!-- more -->

xcodeproj 虽然功能丰富，但是文档很差。本文提供一个脚本样例，提供一些实践相关的参考。该脚本样例实现的功能是为目标工程文件创建单测 target 并完成相关配置，最后会创建一个可以执行的 scheme。

{% codeblock lang:ruby %}
#!/usr/bin/env ruby
require 'xcodeproj'
require 'pathname'

target_for_testing_name = 'App'
target_for_testing = ''

test_target_name = 'AFrameWorkTests'
test_target = ''

# AFrameWork 的 SRCROOT
aframework_srcroot = Pathname(__dir__).dirname.to_s

# 打开工程文件
project_path = File.join(aframework_srcroot, 'path/to/App.xcodeproj')
project = Xcodeproj::Project.open(project_path)

# 删除已有 test_target
project.targets.each do |target|
  if target.name == test_target_name
    test_target = target
  end
end
if test_target != ''
  test_target.remove_from_project
end
# 删除已有测试用例引用
test_case_group = project.main_group.find_subpath(test_target_name, false)
unless test_case_group.nil?
  test_case_group.remove_from_project
end

# 读取 xcconfig
configuration = Xcodeproj::Config.new(File.join(aframework_srcroot, 'path/to/Pods-App.debug.xcconfig'))
framework_search_paths = configuration.attributes['FRAMEWORK_SEARCH_PATHS']
header_search_paths = configuration.attributes['HEADER_SEARCH_PATHS']
header_search_paths = "#{header_search_paths} $(SRCROOT)/src/**"
pods_root = configuration.attributes['PODS_ROOT']

# 找到待测试的 target
project.targets.each do |target|
  if target.name == target_for_testing_name
    target_for_testing = target
  end
end

# 创建单测 target
test_target = project.new_target(:unit_test_bundle, test_target_name, :ios, "11.0")

# 设置一些基础配置
test_target.build_configuration_list.set_setting('PODS_ROOT', pods_root)
test_target.build_configuration_list.set_setting('PRODUCT_NAME', '$(TARGET_NAME)')
# 设置 host app
test_target.build_configuration_list.set_setting('BUNDLE_LOADER', "$(BUILT_PRODUCTS_DIR)/#{target_for_testing_product_name}.app/#{target_for_testing_product_name}")
test_target.build_configuration_list.set_setting('TEST_HOST', '$(BUNDLE_LOADER)')
# 设置 xctest 可执行文件路径名
test_target.build_configuration_list.set_setting('CONTENTS_FOLDER_PATH', "#{test_target_name}.xctest")
# 设置预编译头文件
test_target.build_configuration_list.set_setting('GCC_PRECOMPILE_PREFIX_HEADER', 'YES')
test_target.build_configuration_list.set_setting('GCC_PREFIX_HEADER', 'path/to/AFrameWork-Prefix.pch')
# 设置 search path
test_target.build_configuration_list.set_setting('FRAMEWORK_SEARCH_PATHS', framework_search_paths)
test_target.build_configuration_list.set_setting('HEADER_SEARCH_PATHS', header_search_paths)
# 设置 target 依赖
test_target.add_dependency(target_for_testing)
# 设置 Compile Sources （添加测试用例文件）
def addFiles(direc, current_group, main_target)
  Dir.glob(direc) do |item|
    next if item == '.' or item == '.DS_Store'
    if File.directory?(item)
      new_folder = File.basename(item)
      created_group = current_group.new_group(new_folder)
      addFiles("#{item}/*", created_group, main_target)
    else
      if item.include? ".m"
        i = current_group.new_reference(item)
        main_target.add_file_references([i])
      end
    end
  end
end
test_case_group = project.main_group.find_subpath(test_target_name, true)
test_case_group.set_source_tree('SOURCE_ROOT')
addFiles(File.join(aframework_srcroot, "#{test_target_name}/*"), test_case_group, test_target)

# 设置 Link Binary With Libraries
test_target.frameworks_build_phase.add_file_reference(project.frameworks_group.new_reference('/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS.sdk/System/Library/Frameworks/Foundation.framework'))
test_target.frameworks_build_phase.add_file_reference(project.frameworks_group.new_reference('/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS.sdk/System/Library/Frameworks/UIKit.framework'))

# 创建 scheme
test_target_scheme = Xcodeproj::XCScheme.new()
test_target_scheme.test_action.xml_element.attributes['disableMainThreadChecker'] = 'YES'
test_target_scheme.test_action.xml_element.attributes['codeCoverageEnabled'] = 'YES'
test_target_scheme.add_test_target(test_target)
test_target_scheme.save_as(project_path, test_target_name)

project.save(project_path)
{% endcodeblock %}

<h2>参考文档</h2>

<a href="https://www.rubydoc.info/gems/xcodeproj/" target="_blank">https://www.rubydoc.info/gems/xcodeproj/</a>
