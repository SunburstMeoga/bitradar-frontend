import { useEffect } from 'react';

const Modal = ({ isOpen, onClose, children, className = '' }) => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)' }}
        onClick={onClose}
      />
      
      {/* 弹窗卡片内容 */}
      <div
        className={`relative bg-[#1f1f1f] rounded-[12px] w-[330px] max-h-[90vh] overflow-y-auto box-border ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;
