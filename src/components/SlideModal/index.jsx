import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// 返回按钮SVG组件
const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M10 12L6 8L10 4"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 关闭按钮SVG组件
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M12 4L4 12M4 4L12 12"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SlideModal = ({
  isOpen,
  onClose,
  children,
  className = '',
  currentIndex = 0,
  onIndexChange,
  totalCards = 1,
  titles = [],
  showBackButton = [],
  onBack
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [modalHeight, setModalHeight] = useState(() => {
    // 根据当前卡片索引预估初始高度，避免闪烁
    const estimatedHeights = {
      0: '500px', // 钱包卡片 - 较高
      1: '400px', // AddReferrer卡片 - 中等
      2: '450px', // Send卡片 - 中等偏高
      3: '600px', // Activity卡片 - 很高
      4: '350px'  // SelectToken卡片 - 较低
    };
    return estimatedHeights[currentIndex] || '70vh';
  });
  const { t } = useTranslation();

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

  // 根据当前索引更新translateX和预估高度
  useEffect(() => {
    // 计算正确的滑动距离：每个卡片占用滑动容器的 (100/totalCards)%
    // 所以移动到第n个卡片需要移动 n * (100/totalCards)%
    setTranslateX(-currentIndex * (100 / totalCards));

    // 当切换卡片时，先设置预估高度，减少闪烁
    const estimatedHeights = {
      0: '500px', // 钱包卡片 - 较高
      1: '400px', // AddReferrer卡片 - 中等
      2: '450px', // Send卡片 - 中等偏高
      3: '600px', // Activity卡片 - 很高
      4: '350px'  // SelectToken卡片 - 较低
    };
    const estimatedHeight = estimatedHeights[currentIndex] || '70vh';
    setModalHeight(estimatedHeight);
  }, [currentIndex, totalCards]);

  // 计算弹窗高度
  useEffect(() => {
    if (!isOpen) {
      // 弹窗关闭时重置高度为默认值，为下次打开做准备
      setModalHeight('70vh');
      return;
    }

    // 延迟计算，确保DOM已渲染，减少延迟时间
    const timer = setTimeout(() => {
      const contentElement = document.querySelector(`[data-card-index="${currentIndex}"] .modal-content`);
      if (contentElement) {
        // 临时移除最大高度限制来获取真实内容高度
        const originalMaxHeight = contentElement.style.maxHeight;
        contentElement.style.maxHeight = 'none';

        const contentHeight = contentElement.scrollHeight;
        const titleHeight = 64; // 标题栏高度
        // 计算20vw对应的px值（基于375px设计稿）
        const bottomPaddingVw = (20 / 375) * window.innerWidth; // 20vw转px
        const totalModalHeight = titleHeight + contentHeight + bottomPaddingVw;
        const maxViewportHeight = window.innerHeight * 0.7; // 70vh

        // 恢复原始样式
        contentElement.style.maxHeight = originalMaxHeight;

        if (totalModalHeight <= maxViewportHeight) {
          // 弹窗总高度 ≤ 70vh：按内容撑开
          setModalHeight(`${totalModalHeight}px`);
        } else {
          // 弹窗总高度 > 70vh：使用70vh，内容区域滚动
          setModalHeight('70vh');
        }
      }
    }, 50); // 减少延迟时间从100ms到50ms

    return () => clearTimeout(timer);
  }, [isOpen, currentIndex, children]);

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
    <div className="fixed inset-0 z-[100] flex justify-center" style={{ paddingTop: '15vh' }}>
      {/* 遮罩层 */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)' }}
        onClick={onClose}
      />

      {/* 弹窗卡片容器 */}
      <div
        className={`relative bg-[#1f1f1f] rounded-[12px] w-[330px] md:w-[380px] box-border pb-[20vw] md:pb-5  ${className}`}
        style={{
          height: modalHeight,
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 固定顶部标题栏 */}
        <div className="h-[64px] md:h-16 flex items-center justify-between px-[20px] md:px-8 flex-shrink-0">
          {/* 左侧返回按钮 */}
          {showBackButton[currentIndex] ? (
            <button
              onClick={onBack}
              className="w-[16px] h-[16px] md:w-4 md:h-4 flex items-center justify-center"
            >
              <BackIcon />
            </button>
          ) : (
            <div className="w-[16px] h-[16px] md:w-4 md:h-4"></div>
          )}

          {/* 中间标题 */}
          <span className="text-white text-[16px] md:text-lg font-medium">
            {titles[currentIndex] || ''}
          </span>

          {/* 右侧关闭按钮 */}
          <button
            onClick={onClose}
            className="w-[16px] h-[16px] md:w-4 md:h-4 flex items-center justify-center"
          >
            <CloseIcon />
          </button>
        </div>

        {/* 内容滑动容器 */}
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(${translateX}%)`,
            width: `${totalCards * 100}%`,
            overflowX: 'hidden',
            overflowY: 'visible'
          }}
        >
          {Array.isArray(children) ? children.map((child, index) => (
            <div
              key={index}
              data-card-index={index}
              className="flex-shrink-0"
              style={{
                width: `${100 / totalCards}%`
              }}
            >
              <div
                className="modal-content overflow-y-auto scrollbar-hide px-[20vw] md:px-8"
                style={{
                  scrollbarWidth: 'none', /* Firefox */
                  msOverflowStyle: 'none' /* IE and Edge */
                }}
              >
                {child}
              </div>
            </div>
          )) : (
            <div
              data-card-index={0}
              className="flex-shrink-0"
              style={{
                width: `${100 / totalCards}%`
              }}
            >
              <div
                className="modal-content overflow-y-auto scrollbar-hide px-[20vw] md:px-8"
                style={{
                  scrollbarWidth: 'none', /* Firefox */
                  msOverflowStyle: 'none' /* IE and Edge */
                }}
              >
                {children}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SlideModal;
