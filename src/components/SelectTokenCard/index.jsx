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

const SelectTokenCard = ({ onBack, onClose }) => {
  const { t } = useTranslation();

  return (
    <div className="w-full flex flex-col">
      {/* 内容区域 - 移除顶部导航栏，因为现在由SlideModal统一管理 */}
      <div className="flex-1">
        {/* 这里将来添加Select Token功能的具体内容 */}
        <div className="h-[300px] md:h-80 flex items-center justify-center text-white text-[14px] md:text-sm">
          Select Token功能内容区域
        </div>
      </div>
    </div>
  );
};

export default SelectTokenCard;
