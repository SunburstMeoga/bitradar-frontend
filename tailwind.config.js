/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // 保留默认响应式断点，但优化为移动优先
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
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
      },
      minWidth: {
        'screen-vw': '100vw',
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
  safelist: [
    // 保护动态生成的vw类名（支持负值）
    {
      pattern: /^w-\[\d+(\.\d+)?vw\]$/,
      variants: ['sm', 'md', 'lg', 'xl', '2xl'],
    },
    {
      pattern: /^h-\[\d+(\.\d+)?vw\]$/,
      variants: ['sm', 'md', 'lg', 'xl', '2xl'],
    },
    {
      pattern: /^text-size-\[\d+(\.\d+)?vw\]$/,
      variants: ['sm', 'md', 'lg', 'xl', '2xl'],
    },
    {
      pattern: /^font-size-\[\d+(\.\d+)?vw\]$/,
      variants: ['sm', 'md', 'lg', 'xl', '2xl'],
    },
    {
      pattern: /^p[trblxy]?-\[\d+(\.\d+)?vw\]$/,
      variants: ['sm', 'md', 'lg', 'xl', '2xl'],
    },
    {
      pattern: /^m[trblxy]?-\[\d+(\.\d+)?vw\]$/,
      variants: ['sm', 'md', 'lg', 'xl', '2xl'],
    },
    {
      pattern: /^-m[trblxy]?-\[\d+(\.\d+)?vw\]$/,
      variants: ['sm', 'md', 'lg', 'xl', '2xl'],
    },
    {
      pattern: /^gap-\[\d+(\.\d+)?vw\]$/,
      variants: ['sm', 'md', 'lg', 'xl', '2xl'],
    },
    {
      pattern: /^rounded-\[\d+(\.\d+)?vw\]$/,
      variants: ['sm', 'md', 'lg', 'xl', '2xl'],
    },
    {
      pattern: /^border-\[\d+(\.\d+)?vw\]$/,
      variants: ['sm', 'md', 'lg', 'xl', '2xl'],
    },
  ],
}
