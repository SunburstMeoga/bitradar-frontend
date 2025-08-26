# Trade页面响应式布局实现

## 📋 需求概述

实现Trade页面在手机、平板、PC中的垂直铺满屏幕布局，通过动态调整canvas（PriceChart）的高度来适应不同设备的屏幕尺寸。

## 🛠️ 实现方案

### 1. 创建视口高度计算Hook

**文件**: `src/hooks/useViewportHeight.js`

**功能**:
- 计算去除Header、Footer后的可用高度
- 响应窗口大小变化和设备方向变化
- 区分移动端和PC端的不同计算方式
- 提供mainAreaHeight用于Trade页面布局

**关键计算**:
```javascript
// 移动端Header高度: py-[11vw] * 2 + 内容高度36vw
const headerHeight = (11 / 375) * windowWidth * 2 + (36 / 375) * windowWidth;

// 移动端Footer高度: py-[12vw] * 2 + 内容高度42vw  
const footerHeight = (12 / 375) * windowWidth * 2 + (42 / 375) * windowWidth;

// PC端固定高度
const headerHeight = 12 * 2 + 36; // 60px
const footerHeight = 12 * 2 + 40; // 64px
```

### 2. 修改Trade页面布局逻辑

**文件**: `src/pages/Trade/index.jsx`

**主要改动**:
- 引入`useViewportHeight` Hook
- 实现动态PriceChart高度计算
- 修改页面容器为`h-full flex flex-col`
- 移除固定的底部padding

**动态高度计算**:
```javascript
const calculateChartHeight = () => {
  // 计算固定元素高度
  let fixedElementsHeight = 0;
  
  if (isMobile) {
    // 价格信息栏 + 边距 + 交易卡片
    const priceBarHeight = (64 / 375) * windowWidth;
    const priceBarMargins = (20 / 375) * windowWidth;
    const tradingCardHeight = (250 / 375) * windowWidth;
    fixedElementsHeight = priceBarHeight + priceBarMargins + tradingCardHeight;
  } else {
    // PC端固定高度
    fixedElementsHeight = 64 + 24 + 244; // 约332px
  }

  // 计算图表可用高度
  const chartHeight = Math.max(mainAreaHeight - fixedElementsHeight, isMobile ? 200 : 250);
  return `${chartHeight}px`;
};
```

### 3. 更新PriceChart组件

**文件**: `src/components/PriceChart/index.jsx`

**改动**:
- 移除固定高度设置`h-[346vw] md:h-80`
- 改为使用父容器传递的高度`h-full`
- 确保图表能够正确适应动态高度

### 4. 调试工具

**文件**: `src/components/DebugInfo/index.jsx`

**功能**:
- 开发环境下显示高度计算信息
- 实时显示窗口尺寸、主区域高度等调试数据
- 帮助验证响应式布局是否正确工作

## 📱 响应式断点

- **移动端**: < 768px (使用vw单位)
- **平板/PC端**: ≥ 768px (使用px单位)

## 🎯 实现效果

### 移动端
- 基于375px设计稿的vw适配
- 动态计算PriceChart高度以填充剩余空间
- 保持原有的视觉比例和间距

### PC端/平板
- 最大宽度428px，居中显示
- 使用固定px单位确保一致性
- 动态调整图表高度适应不同屏幕

## 🔧 测试页面

**访问地址**: `http://localhost:5174/test-layout`

**功能**:
- 模拟Trade页面的布局结构
- 显示动态高度计算结果
- 验证响应式布局效果

## 📊 关键特性

1. **垂直铺满**: 页面内容完全填充可用的垂直空间
2. **响应式**: 自动适应不同设备尺寸
3. **动态调整**: PriceChart高度根据屏幕大小动态计算
4. **性能优化**: 使用useEffect监听窗口变化，避免不必要的重计算
5. **调试友好**: 开发环境提供详细的调试信息

## 🚀 使用方法

1. 启动开发服务器: `npm run dev`
2. 访问Trade页面: `http://localhost:5174/`
3. 调整浏览器窗口大小测试响应式效果
4. 使用开发者工具模拟不同设备尺寸

## 📝 注意事项

- 确保Layout组件的`main`元素有`flex-1`类名
- PriceChart组件需要使用`h-full`而不是固定高度
- 调试信息仅在开发环境显示
- 最小高度限制确保图表在极小屏幕上仍可用
