export default {
  plugins: {
    'postcss-px-to-viewport': {
      unitToConvert: 'px',     // 需要转换的单位
      viewportWidth: 375,      // 设计稿宽度（以iPhone6/7/8为基准）
      unitPrecision: 5,        // 转换精度
      propList: ['*'],         // 需要转换的属性（*表示全部）
      viewportUnit: 'vw',      // 转换单位
      fontViewportUnit: 'vw',  // 字体单位
      selectorBlackList: [/^\.html$/, /^html$/, /^body$/], // 忽略HTML根元素
      minPixelValue: 1,        // 最小转换值
      mediaQuery: false,       // 禁止媒体查询转换
      replace: true,           // 直接替换值
      exclude: /node_modules/  // 排除文件
    },
    tailwindcss: {},
    autoprefixer: {}
  }
}
