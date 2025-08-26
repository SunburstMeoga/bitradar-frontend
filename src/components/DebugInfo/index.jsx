import React from 'react';
import useViewportHeight from '../../hooks/useViewportHeight';

/**
 * 调试信息组件
 * 显示视口高度计算的相关信息
 */
const DebugInfo = () => {
  const dimensions = useViewportHeight();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div 
      className="fixed top-4 right-4 bg-black bg-opacity-80 text-white p-2 rounded text-xs z-[9999]"
      style={{ fontSize: '10px', lineHeight: '1.2' }}
    >
      <div>窗口: {dimensions.windowHeight}px</div>
      <div>主区域: {dimensions.mainAreaHeight}px</div>
      <div>Header: {dimensions.headerHeight}px</div>
      <div>Footer: {dimensions.footerHeight}px</div>
      <div>设备: {dimensions.isMobile ? '移动端' : 'PC端'}</div>
    </div>
  );
};

export default DebugInfo;
