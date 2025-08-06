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

const SendCard = ({ onBack, onClose }) => {
  const { t } = useTranslation();

  return (
    <div className="w-full h-full flex flex-col">
      {/* 顶部导航栏 */}
      <div className="h-[64px] flex items-center justify-between px-[20px] flex-shrink-0">
        {/* 左侧返回按钮 */}
        <button
          onClick={onBack}
          className="w-[16px] h-[16px] flex items-center justify-center"
        >
          <BackIcon />
        </button>
        
        {/* 中间标题 */}
        <span className="text-white text-[16px] font-medium">
          {t('wallet.send')}
        </span>
        
        {/* 右侧关闭按钮 */}
        <button
          onClick={onClose}
          className="w-[16px] h-[16px] flex items-center justify-center"
        >
          <CloseIcon />
        </button>
      </div>
      
      {/* 内容区域 - 暂时为空 */}
      <div className="flex-1 p-[20px]">
        {/* 这里将来添加Send功能的具体内容 */}
      </div>
    </div>
  );
};

export default SendCard;
