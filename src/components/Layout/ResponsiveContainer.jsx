import React from 'react';

/**
 * 响应式容器组件
 *
 * 功能：
 * - 移动端（< 768px）：保持原有的全宽度显示（基于375px设计稿的vw适配）
 * - 平板端和PC端（>= 768px）：限制内容最大宽度为428px，居中显示，两边用#121212背景填充
 *
 * 使用场景：
 * - 包裹所有页面内容，实现统一的响应式布局
 * - 在Layout和SecondaryLayout中使用
 */
const ResponsiveContainer = ({ children, className = '' }) => {
  return (
    <>
      {/* 移动端：全宽度显示，保持flex布局 */}
      <div className={`w-full flex flex-col flex-1 md:hidden ${className}`}>
        {children}
      </div>

      {/* 平板端和PC端：限制宽度并居中，外层填充背景 */}
      <div className={`hidden md:flex md:justify-center md:w-full md:flex-1 ${className}`} style={{ backgroundColor: '#121212' }}>
        <div
          className="w-full flex flex-col flex-1"
          style={{
            maxWidth: '428px',
            backgroundColor: '#121212'
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
};

export default ResponsiveContainer;
