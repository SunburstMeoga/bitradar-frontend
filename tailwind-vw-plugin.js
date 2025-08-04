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

  // 处理字体大小 text-[数字vw]
  matchUtilities(
    {
      'text': createValueHandler('font-size'),
    },
    {
      values: theme('fontSize'),
      type: ['length', 'percentage']
    }
  )

  // 处理内边距 p-[数字vw]
  matchUtilities(
    {
      'p': createValueHandler('padding'),
    },
    {
      values: theme('padding'),
      type: ['length', 'percentage']
    }
  )

  // 处理外边距 m-[数字vw]
  matchUtilities(
    {
      'm': createValueHandler('margin'),
    },
    {
      values: theme('margin'),
      type: ['length', 'percentage']
    }
  )
})

export default vwPlugin
