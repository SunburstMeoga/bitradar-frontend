import { useEffect, useState, useRef } from 'react';

const SlideModal = ({
  isOpen,
  onClose,
  children,
  className = '',
  currentIndex = 0,
  onIndexChange,
  totalCards = 1,
  cardRefs
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [containerHeight, setContainerHeight] = useState('auto');
  const internalCardRefs = useRef([]);
  const activeCardRefs = cardRefs || internalCardRefs;

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

  // 根据当前索引更新translateX和高度
  useEffect(() => {
    setTranslateX(-currentIndex * 100);

    // 更新容器高度以适应当前卡片
    if (activeCardRefs.current[currentIndex]) {
      const currentCardHeight = activeCardRefs.current[currentIndex].scrollHeight;
      setContainerHeight(currentCardHeight);
    }
  }, [currentIndex, activeCardRefs]);

  // 初始化时设置第一个卡片的高度
  useEffect(() => {
    if (isOpen && activeCardRefs.current[0]) {
      const firstCardHeight = activeCardRefs.current[0].scrollHeight;
      setContainerHeight(firstCardHeight);
    }
  }, [isOpen, activeCardRefs]);

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
        className={`relative bg-[#1f1f1f] rounded-[12px] w-[330px] overflow-hidden box-border transition-all duration-300 ease-in-out ${className}`}
        style={{ height: containerHeight }}
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
          {children}
        </div>
      </div>
    </div>
  );
};

export default SlideModal;
