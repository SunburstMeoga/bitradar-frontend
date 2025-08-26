import React from 'react';
import useViewportHeight from '../../hooks/useViewportHeight';
import DebugInfo from '../../components/DebugInfo';

/**
 * 测试布局页面
 * 用于验证响应式布局和高度计算是否正确
 */
const TestLayout = () => {
  const { mainAreaHeight, isMobile } = useViewportHeight();

  // 模拟Trade页面的高度计算
  const calculateTestHeight = () => {
    if (mainAreaHeight === 0) {
      return isMobile ? '200px' : '250px';
    }

    let fixedElementsHeight = 0;
    
    if (isMobile) {
      const windowWidth = window.innerWidth;
      // 价格信息栏 + 交易卡片的估算高度
      const priceBarHeight = (64 / 375) * windowWidth;
      const priceBarMargins = (20 / 375) * windowWidth;
      const tradingCardHeight = (250 / 375) * windowWidth;
      fixedElementsHeight = priceBarHeight + priceBarMargins + tradingCardHeight;
    } else {
      fixedElementsHeight = 64 + 24 + 250; // 约338px
    }

    const chartHeight = Math.max(mainAreaHeight - fixedElementsHeight, isMobile ? 200 : 250);
    return `${chartHeight}px`;
  };

  const testChartHeight = calculateTestHeight();

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: '#121212' }}>
      {/* 模拟价格信息栏 */}
      <div
        className="w-full h-[64vw] md:h-16 px-[16vw] md:px-4 flex items-center justify-center border-t border-b mt-[10vw] md:mt-3"
        style={{ borderColor: '#292929', backgroundColor: '#1f1f1f' }}
      >
        <span className="text-white text-size-[15vw] md:text-base">价格信息栏 (固定高度)</span>
      </div>

      {/* 模拟图表区域 */}
      <div 
        className='w-full mb-[10vw] md:mb-3 flex items-center justify-center'
        style={{ 
          height: testChartHeight,
          backgroundColor: '#2a2a2a',
          border: '2px solid #c5ff33'
        }}
      >
        <div className="text-center text-white">
          <div className="text-size-[16vw] md:text-lg mb-2">图表区域 (动态高度)</div>
          <div className="text-size-[12vw] md:text-sm">高度: {testChartHeight}</div>
          <div className="text-size-[12vw] md:text-sm">主区域: {mainAreaHeight}px</div>
          <div className="text-size-[12vw] md:text-sm">设备: {isMobile ? '移动端' : 'PC端'}</div>
        </div>
      </div>

      {/* 模拟交易卡片 */}
      <div className="w-[375vw] md:w-full flex-shrink-0 flex flex-col items-center justify-center px-[16vw] md:px-4">
        <div
          className="w-[343vw] md:w-full h-[116vw] md:h-auto pt-[16vw] md:pt-4 pr-[16vw] md:pr-4 pb-[14vw] md:pb-4 pl-[16vw] md:pl-4 rounded-[12vw] md:rounded-lg flex items-center justify-center"
          style={{ backgroundColor: '#1f1f1f' }}
        >
          <span className="text-white text-size-[13vw] md:text-sm">交易卡片 (固定高度)</span>
        </div>
      </div>

      {/* 调试信息 */}
      <DebugInfo />
    </div>
  );
};

export default TestLayout;
