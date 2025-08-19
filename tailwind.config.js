/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // 响应式断点配置 - 针对BitRocket项目优化
    screens: {
      'sm': '640px',   // 小屏设备
      'md': '768px',   // 平板端开始 - 这是我们切换到428px容器的断点
      'lg': '1024px',  // 大屏平板和小屏PC
      'xl': '1280px',  // 标准PC屏幕
      '2xl': '1536px', // 大屏PC
    },
    extend: {
      colors: {
        primary: '#C5FF33',
      },
      spacing: {
        // 基础 vw 单位（基于375px设计稿）
        '1vw': '1vw',
        '2vw': '2vw',
        '3vw': '3vw',
        '4vw': '4vw',
        '5vw': '5vw',
        '6vw': '6vw',
        '8vw': '8vw',
        '10vw': '10vw',
        '12vw': '12vw',
        '15vw': '15vw',
        '16vw': '16vw',
        '18vw': '18vw',
        '20vw': '20vw',
        '24vw': '24vw',
        '25vw': '25vw',
        '30vw': '30vw',
        '32vw': '32vw',
        '36vw': '36vw',
        '40vw': '40vw',
        '45vw': '45vw',
        '48vw': '48vw',
        '50vw': '50vw',
        '60vw': '60vw',
        '64vw': '64vw',
        '70vw': '70vw',
        '75vw': '75vw',
        '80vw': '80vw',
        '85vw': '85vw',
        '90vw': '90vw',
        '95vw': '95vw',
        '100vw': '100vw',
      },
      fontSize: {
        // vw 字体大小（基于375px设计稿）
        'xs-vw': '3.2vw',    // ~12px
        'sm-vw': '3.73vw',   // ~14px
        'base-vw': '4.27vw', // ~16px
        'lg-vw': '4.8vw',    // ~18px
        'xl-vw': '5.33vw',   // ~20px
        '2xl-vw': '6.4vw',   // ~24px
        '3xl-vw': '8vw',     // ~30px
        '4xl-vw': '9.6vw',   // ~36px
        '5xl-vw': '12.8vw',  // ~48px
        '6xl-vw': '16vw',    // ~60px
      },
      maxWidth: {
        'screen-vw': '100vw',
        'container-mobile': '375px',  // 移动端容器最大宽度
        'container-desktop': '428px', // 平板和PC端容器最大宽度
      },
      minWidth: {
        'screen-vw': '100vw',
        'container-mobile': '320px',  // 移动端容器最小宽度
        'container-desktop': '428px', // 平板和PC端容器最小宽度
      },
      height: {
        'screen-vw': '100vh',
      },
      minHeight: {
        'screen-vw': '100vh',
      },
      letterSpacing: {
        '0.15': '0.15px',
      },
      lineHeight: {
        '20': '20px',
      },
    },
  },
  plugins: [
    require('./tailwind-vw-plugin.js')
  ],
  // safelist 已移除，因为 tailwind-vw-plugin.js 通过 matchUtilities 已经正确处理了动态 vw 类名
}
