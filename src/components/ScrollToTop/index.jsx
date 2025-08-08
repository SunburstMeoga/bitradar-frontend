import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // 在路由变化时滚动到页面顶部
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // 使用 'instant' 避免动画，'smooth' 会有滚动动画
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
