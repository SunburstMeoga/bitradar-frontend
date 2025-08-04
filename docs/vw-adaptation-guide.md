# vw 适配方案使用指南

## 概述

本项目采用基于 vw 单位的移动端适配方案，以 375px 设计稿为基准，通过多种方式实现精确的跨设备适配。

## 核心配置

### 1. PostCSS 配置 (`postcss.config.js`)

```javascript
export default {
  plugins: {
    "postcss-px-to-viewport": {
      unitToConvert: "px", // 需要转换的单位
      viewportWidth: 375, // 设计稿宽度（以iPhone6/7/8为基准）
      unitPrecision: 5, // 转换精度
      propList: ["*"], // 需要转换的属性（*表示全部）
      viewportUnit: "vw", // 转换单位
      fontViewportUnit: "vw", // 字体单位
      selectorBlackList: [/^\.html$/, /^html$/, /^body$/], // 忽略HTML根元素
      minPixelValue: 1, // 最小转换值
      mediaQuery: false, // 禁止媒体查询转换
      replace: true, // 直接替换值
      exclude: /node_modules/, // 排除文件
    },
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### 2. Tailwind CSS 配置 (`tailwind.config.js`)

- 保留响应式断点，支持移动优先设计
- 扩展 vw 单位的 spacing 和 fontSize
- 配置 safelist 保护动态生成的 vw 类名

## 使用方法

### 方法 1: Tailwind 原生 vw 单位

使用方括号语法直接写 vw 值：

```jsx
<div className="w-[80vw] h-[20vw] text-[4vw]">直接使用 vw 单位</div>
```

**计算公式：** `vw = (px / 375) * 100`

- 200px → `w-[53.33vw]`
- 16px → `text-[4.27vw]`
- 24px → `p-[6.4vw]`

### 方法 2: Tailwind 预设 vw 类名

使用预定义的 vw 类名：

```jsx
<div className="w-80vw h-20vw text-xl-vw">使用预设的 vw 类名</div>
```

**可用的预设类名：**

- **间距：** `1vw`, `2vw`, `4vw`, `5vw`, `10vw`, `20vw`, `50vw`, `80vw`, `90vw`, `100vw`
- **字体：** `xs-vw`, `sm-vw`, `base-vw`, `lg-vw`, `xl-vw`, `2xl-vw`

### 方法 3: 响应式混合宏

在 SCSS 文件中使用响应式混合宏：

```scss
.custom-element {
  // 响应式属性
  @include responsive("font-size", 16px, 18px, 20px);
  @include responsive("padding", 16px, 20px, 24px);

  // 普通属性（PostCSS 会自动转换）
  margin-bottom: 16px;
  border-radius: 8px;
}
```

**可用的混合宏：**

- `@include vw($property, $px-value)` - 单个值转换
- `@include vw-multi($property, $px-values...)` - 多个值转换
- `@include responsive-vw($property, $mobile-px, $tablet-px, $desktop-px)` - 响应式转换

### 方法 4: PostCSS 自动转换

在 SCSS/CSS 文件中直接写 px，PostCSS 会自动转换：

```scss
.auto-convert {
  width: 200px; // 自动转换为 53.33vw
  height: 100px; // 自动转换为 26.67vw
  font-size: 16px; // 自动转换为 4.27vw
  padding: 12px 16px; // 自动转换为 3.2vw 4.27vw
}
```

## 响应式设计

### 移动优先 + 响应式断点

```jsx
<div className="w-[90vw] md:w-[60vw] lg:w-[40vw]">
  移动端90vw，平板60vw，桌面40vw
</div>
```

### 响应式字体

```jsx
<span className="text-[4vw] md:text-lg lg:text-xl">响应式字体大小</span>
```

## 组件样式示例

### 卡片组件

```scss
.card-vw {
  @include vw-multi("padding", 16px 20px);
  @include vw("border-radius", 8px);
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &__title {
    @include vw("font-size", 18px);
    @include vw("margin-bottom", 12px);
    font-weight: 600;
  }
}
```

### 按钮组件

```scss
.btn-vw {
  @include vw-multi("padding", 12px 24px);
  @include vw("border-radius", 6px);
  @include vw("font-size", 16px);

  &--primary {
    background: #c5ff33;
    color: #000;
  }
}
```

## 工具类

### 间距工具类

```scss
.space-vw-1 {
  @include vw("margin", 4px);
}
.space-vw-2 {
  @include vw("margin", 8px);
}
.space-vw-3 {
  @include vw("margin", 12px);
}
```

### 字体工具类

```scss
.text-vw-xs {
  @include vw("font-size", 12px);
}
.text-vw-sm {
  @include vw("font-size", 14px);
}
.text-vw-base {
  @include vw("font-size", 16px);
}
```

### 响应式显示/隐藏

```scss
.mobile-only {
  @media (min-width: 768px) {
    display: none !important;
  }
}

.tablet-up {
  @media (max-width: 767px) {
    display: none !important;
  }
}
```

## 最佳实践

### 1. 选择合适的方法

- **简单布局：** 使用 Tailwind 原生 vw 单位
- **复杂组件：** 使用 SCSS 混合宏
- **现有样式迁移：** 使用 PostCSS 自动转换

### 2. 性能优化

- 使用 safelist 保护动态生成的类名
- 避免过度使用方括号语法
- 合理使用响应式断点

### 3. 兼容性考虑

- 为老旧设备提供 fallback
- 测试不同屏幕尺寸的显示效果
- 注意极端尺寸下的显示问题

## 常用转换对照表

| 设计稿 px | vw 值   | Tailwind 类名 |
| --------- | ------- | ------------- |
| 4px       | 1.07vw  | `w-[1.07vw]`  |
| 8px       | 2.13vw  | `w-[2.13vw]`  |
| 12px      | 3.2vw   | `w-[3.2vw]`   |
| 16px      | 4.27vw  | `w-[4.27vw]`  |
| 20px      | 5.33vw  | `w-[5.33vw]`  |
| 24px      | 6.4vw   | `w-[6.4vw]`   |
| 32px      | 8.53vw  | `w-[8.53vw]`  |
| 48px      | 12.8vw  | `w-[12.8vw]`  |
| 64px      | 17.07vw | `w-[17.07vw]` |
| 100px     | 26.67vw | `w-[26.67vw]` |
| 200px     | 53.33vw | `w-[53.33vw]` |
| 300px     | 80vw    | `w-[80vw]`    |

## 调试技巧

1. 使用浏览器开发者工具查看实际计算值
2. 在不同设备上测试显示效果
3. 使用 CSS 自定义属性方便调试
4. 添加边框或背景色辅助调试布局
