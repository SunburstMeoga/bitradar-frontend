# 钱包弹窗响应式适配修复

## 问题描述

用户在已经链接了钱包的状态下，点击顶部栏的钱包地址会出现弹窗，但是在PC端和平板端没有做适配。

## 解决方案

为钱包弹窗相关组件添加了完整的响应式适配，使其在PC端（≥768px）和平板端能够正确显示。

## 修改的文件

### 1. SlideModal 组件 (`src/components/SlideModal/index.jsx`)

**主要修改：**
- 弹窗容器宽度：`w-[330px] md:w-[380px]`
- 底部内边距：`pb-[20vw] md:pb-5`
- 标题栏高度：`h-[64px] md:h-16`
- 标题栏内边距：`px-[20px] md:px-5`
- 按钮尺寸：`w-[16px] h-[16px] md:w-4 md:h-4`
- 标题字体：`text-[16px] md:text-lg`
- 内容区域内边距：`px-[20vw] md:px-5`

### 2. WalletCard 组件 (`src/components/WalletCard/index.jsx`)

**主要修改：**
- 用户头像：`w-[64px] h-[64px] md:w-16 md:h-16`，字体：`text-[24px] md:text-2xl`
- 钱包地址：字体：`text-[20px] md:text-xl`，间距：`gap-[8px] md:gap-2`
- 认证状态：指示器：`w-[8px] h-[8px] md:w-2 md:h-2`，字体：`text-[14px] md:text-sm`
- BNB余额：字体：`text-[16px] md:text-base`
- 菜单项：
  - 容器：`w-[290px] md:w-80 h-[54px] md:h-14`
  - 图标：`w-[32px] h-[32px] md:w-8 md:h-8`
  - 文字：`text-[16px] md:text-base`
  - 间距：`gap-[12px] md:gap-3`
- 语言展开内容：`w-[290px] md:w-80`，高度：`h-[44px] md:h-11`

### 3. SendCard 组件 (`src/components/SendCard/index.jsx`)

**主要修改：**
- 金额输入卡片：`w-[290px] md:w-80 h-[102px] md:h-24`
- 金额输入框：`h-[36px] md:h-9 text-[32px] md:text-3xl`
- Select token按钮：`w-[140px] md:w-36 h-[36px] md:h-9 text-[13px] md:text-sm`
- 向下箭头：`w-[50px] h-[50px] md:w-12 md:h-12`
- 地址输入卡片：`w-[290px] md:w-80 h-[102px] md:h-24`
- 粘贴按钮：`w-[80px] md:w-20 h-[36px] md:h-9`
- Textarea：`h-[46px] md:h-12 text-[14px] md:text-sm`
- 底部按钮：`w-[290px] md:w-80 h-[48px] md:h-12 text-[14px] md:text-sm`

### 4. ActivityCard 组件 (`src/components/ActivityCard/index.jsx`)

**主要修改：**
- 内容区域：`h-[300px] md:h-80 text-[14px] md:text-sm`

### 5. SelectTokenCard 组件 (`src/components/SelectTokenCard/index.jsx`)

**主要修改：**
- 移除了重复的顶部导航栏（现在由SlideModal统一管理）
- 内容区域：`h-[300px] md:h-80 text-[14px] md:text-sm`

### 6. AddReferrerCard 组件 (`src/components/AddReferrerCard/index.jsx`)

**主要修改：**
- 描述文字：`text-[12px] md:text-xs`，间距：`mb-[20px] md:mb-5`
- 地址标签：`text-[14px] md:text-sm`，间距：`mb-[8px] md:mb-2`
- 地址输入卡片：`w-[290px] md:w-80 h-[102px] md:h-24`
- 粘贴按钮：`w-[80px] md:w-20 h-[36px] md:h-9`
- Textarea：`h-[46px] md:h-12 text-[14px] md:text-sm`
- 奖励说明：字体和间距适配
- 按钮区域：`h-[48px] md:h-12 text-[16px] md:text-base gap-[12px] md:gap-3`

## 适配规则

### 断点设置
- 移动端：< 768px（使用vw单位）
- 平板端和PC端：≥ 768px（使用固定px单位）

### 尺寸映射规则
- 宽度：290px → 320px (80)
- 高度：按比例调整
- 字体：保持可读性，适当增大
- 间距：保持视觉平衡

### 设计原则
1. **保持视觉一致性**：PC端和移动端保持相同的视觉风格
2. **提升可用性**：PC端适当增大点击区域和字体大小
3. **响应式布局**：使用Tailwind CSS的`md:`前缀实现响应式
4. **代码复用**：最大化复用现有组件，只添加响应式样式

## 测试建议

1. **移动端测试**（< 768px）：
   - 确保原有功能正常
   - 检查vw适配是否正确

2. **平板端测试**（768px - 1024px）：
   - 检查弹窗尺寸是否合适
   - 验证交互元素大小

3. **PC端测试**（> 1024px）：
   - 确保弹窗居中显示
   - 验证所有功能正常工作

## 兼容性

- ✅ 移动端：保持原有vw适配
- ✅ 平板端：新增md:响应式样式
- ✅ PC端：新增md:响应式样式
- ✅ 向后兼容：不影响现有功能
