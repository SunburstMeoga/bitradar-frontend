import React, { useEffect } from 'react';

const Toast = ({ message, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="fixed top-[20px] left-1/2 transform -translate-x-1/2 bg-[#2a2a2a] text-white px-[16px] py-[8px] rounded-[8px] text-[14px] font-medium shadow-lg"
      style={{ zIndex: 999999 }}
    >
      {message}
    </div>
  );
};

export default Toast;
