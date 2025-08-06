import { useEffect, useState } from 'react';

const SlideModal = ({
  isOpen,
  onClose,
  children,
  className = '',
  currentIndex = 0,
  onIndexChange,
  totalCards = 1
}) => {
  const [translateX, setTranslateX] = useState(0);

  // 监听ESC键关闭弹窗
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // 防止背景滚动
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // 根据当前索引更新translateX
  useEffect(() => {
    // 计算正确的滑动距离：每个卡片占用滑动容器的 (100/totalCards)%
    // 所以移动到第n个卡片需要移动 n * (100/totalCards)%
    setTranslateX(-currentIndex * (100 / totalCards));
  }, [currentIndex, totalCards]);

  // 滑动到指定卡片
  const slideTo = (index) => {
    if (index >= 0 && index < totalCards && onIndexChange) {
      onIndexChange(index);
    }
  };

  // 滑动到下一张
  const slideNext = () => {
    if (currentIndex < totalCards - 1) {
      slideTo(currentIndex + 1);
    }
  };

  // 滑动到上一张
  const slidePrev = () => {
    if (currentIndex > 0) {
      slideTo(currentIndex - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* 遮罩层 */}
      <div 
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)' }}
        onClick={onClose}
      />
      
      {/* 弹窗卡片容器 */}
      <div
        className={`relative bg-[#1f1f1f] rounded-[12px] w-[330px] max-h-[90vh] overflow-hidden box-border ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 滑动容器 */}
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(${translateX}%)`,
            width: `${totalCards * 100}%`
          }}
        >
          {Array.isArray(children) ? children.map((child, index) => (
            <div
              key={index}
              className="flex-shrink-0"
              style={{ width: `${100 / totalCards}%` }}
            >
              {child}
            </div>
          )) : (
            <div
              className="flex-shrink-0"
              style={{ width: `${100 / totalCards}%` }}
            >
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SlideModal;
