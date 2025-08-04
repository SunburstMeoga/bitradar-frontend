// 项目颜色常量
export const COLORS = {
  // 主色调
  PRIMARY: '#c5ff33',
  
  // 背景色
  BG_PRIMARY: '#121212',
  BG_SECONDARY: '#1f1f1f',
  
  // 文字颜色
  TEXT_PRIMARY: '#ffffff',
  TEXT_SECONDARY: '#8f8f8f',
  TEXT_BLACK: '#000000',
  
  // 边框颜色
  BORDER_PRIMARY: '#121212',
  
  // 其他颜色
  WHITE: '#ffffff',
  TRANSPARENT: 'transparent',
};

// CSS变量形式（用于SCSS）
export const CSS_COLORS = {
  '--color-primary': COLORS.PRIMARY,
  '--color-bg-primary': COLORS.BG_PRIMARY,
  '--color-bg-secondary': COLORS.BG_SECONDARY,
  '--color-text-primary': COLORS.TEXT_PRIMARY,
  '--color-text-secondary': COLORS.TEXT_SECONDARY,
  '--color-text-black': COLORS.TEXT_BLACK,
  '--color-border-primary': COLORS.BORDER_PRIMARY,
  '--color-white': COLORS.WHITE,
};
