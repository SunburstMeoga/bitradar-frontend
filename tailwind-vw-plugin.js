import plugin from 'tailwindcss/plugin'

// 设计稿基准宽度
const baseWidth = 375

// vw函数 - 将px转换为vw单位
function vw(px) {
  return `${(px / baseWidth) * 100}vw`
}

// 创建通用的值处理函数
function createValueHandler(cssProperty) {
  return (value) => {
    if (typeof value !== 'string') {
      return { [cssProperty]: value }
    }
    const match = value.match(/^(\d+(?:\.\d+)?)vw$/)
    if (match) {
      const pxValue = parseFloat(match[1])
      return {
        [cssProperty]: vw(pxValue)
      }
    }
    return {
      [cssProperty]: value
    }
  }
}

// 自定义 vw 插件
const vwPlugin = plugin(function({ matchUtilities, theme }) {
  // 处理宽度 w-[数字vw]
  matchUtilities(
    {
      'w': createValueHandler('width'),
    },
    {
      values: theme('width'),
      type: ['length', 'percentage']
    }
  )

  // 处理高度 h-[数字vw]
  matchUtilities(
    {
      'h': createValueHandler('height'),
    },
    {
      values: theme('height'),
      type: ['length', 'percentage']
    }
  )

  // 处理字体大小 text-size-[数字vw] 或 font-[数字vw]
  matchUtilities(
    {
      'text-size': createValueHandler('font-size'),
      'font-size': createValueHandler('font-size'),
    },
    {
      values: theme('fontSize'),
      type: ['length', 'percentage']
    }
  )

  // 处理内边距相关
  matchUtilities(
    {
      'p': createValueHandler('padding'),
      'px': (value) => {
        const handler = createValueHandler('padding-left')
        const result1 = handler(value)
        const handler2 = createValueHandler('padding-right')
        const result2 = handler2(value)
        return { ...result1, ...result2 }
      },
      'py': (value) => {
        const handler = createValueHandler('padding-top')
        const result1 = handler(value)
        const handler2 = createValueHandler('padding-bottom')
        const result2 = handler2(value)
        return { ...result1, ...result2 }
      },
      'pt': createValueHandler('padding-top'),
      'pr': createValueHandler('padding-right'),
      'pb': createValueHandler('padding-bottom'),
      'pl': createValueHandler('padding-left'),
    },
    {
      values: theme('padding'),
      type: ['length', 'percentage']
    }
  )

  // 处理外边距相关
  matchUtilities(
    {
      'm': createValueHandler('margin'),
      'mx': (value) => {
        const handler = createValueHandler('margin-left')
        const result1 = handler(value)
        const handler2 = createValueHandler('margin-right')
        const result2 = handler2(value)
        return { ...result1, ...result2 }
      },
      'my': (value) => {
        const handler = createValueHandler('margin-top')
        const result1 = handler(value)
        const handler2 = createValueHandler('margin-bottom')
        const result2 = handler2(value)
        return { ...result1, ...result2 }
      },
      'mt': createValueHandler('margin-top'),
      'mr': createValueHandler('margin-right'),
      'mb': createValueHandler('margin-bottom'),
      'ml': createValueHandler('margin-left'),
    },
    {
      values: theme('margin'),
      type: ['length', 'percentage']
    }
  )

  // 处理其他常用属性
  matchUtilities(
    {
      'gap': createValueHandler('gap'),
      'rounded': createValueHandler('border-radius'),
      'border': createValueHandler('border-width'),
    },
    {
      values: theme('spacing'),
      type: ['length', 'percentage']
    }
  )
})

export default vwPlugin
