import { useState, useEffect } from 'react';

/**
 * 计算可用的视口高度Hook
 *
 * 功能：
 * - 计算去除Header、Footer等固定元素后的可用高度
 * - 响应窗口大小变化
 * - 区分移动端和PC端的不同计算方式
 * - 为Trade页面提供main区域的可用高度
 *
 * @returns {Object} 包含各种高度信息的对象
 */
const useViewportHeight = () => {
  const [dimensions, setDimensions] = useState({
    windowHeight: 0,
    availableHeight: 0,
    mainAreaHeight: 0, // main区域的高度（去除Header和Footer）
    headerHeight: 0,
    footerHeight: 0,
    isMobile: false,
  });

  useEffect(() => {
    const calculateDimensions = () => {
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;
      const isMobile = windowWidth < 768; // md断点

      // 计算Header高度
      // 移动端：py-[11vw] = 11vw * 2 + 内容高度约36vw（最高的按钮）
      // PC端：py-3 = 12px * 2 + 内容高度约36px
      let headerHeight;
      if (isMobile) {
        // 移动端Header：py-[11vw] * 2 + 内容高度约36vw（按钮高度）
        const paddingVw = (11 / 375) * windowWidth * 2; // 11vw * 2
        const contentHeight = (36 / 375) * windowWidth; // 36vw的内容高度（按钮高度）
        headerHeight = paddingVw + contentHeight;
      } else {
        // PC端Header：py-3 * 2 + 内容高度约36px
        headerHeight = 12 * 2 + 36; // 60px
      }

      // 计算Footer高度
      // 移动端：py-[12vw] * 2 + 内容高度42vw
      // PC端：py-3 * 2 + 内容高度40px
      let footerHeight;
      if (isMobile) {
        const paddingVw = (12 / 375) * windowWidth * 2; // 12vw * 2
        const contentHeight = (42 / 375) * windowWidth; // 42vw的内容高度
        footerHeight = paddingVw + contentHeight;
      } else {
        footerHeight = 12 * 2 + 40; // 64px
      }

      // 计算可用高度
      const availableHeight = windowHeight - headerHeight - footerHeight;
      const mainAreaHeight = windowHeight - headerHeight - footerHeight;

      setDimensions({
        windowHeight,
        availableHeight: Math.max(availableHeight, 200), // 最小200px
        mainAreaHeight: Math.max(mainAreaHeight, 200), // main区域高度
        headerHeight,
        footerHeight,
        isMobile,
      });
    };

    // 初始计算
    calculateDimensions();

    // 监听窗口大小变化
    const handleResize = () => {
      calculateDimensions();
    };

    window.addEventListener('resize', handleResize);
    
    // 监听方向变化（移动端）
    window.addEventListener('orientationchange', () => {
      // 延迟执行，等待方向变化完成
      setTimeout(calculateDimensions, 100);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', calculateDimensions);
    };
  }, []);

  return dimensions;
};

export default useViewportHeight;
