import { useState, useRef } from 'react';
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

// 粘贴按钮SVG组件
const PasteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path 
      d="M13.333 6h-6c-.736 0-1.333.597-1.333 1.333v6c0 .736.597 1.333 1.333 1.333h6c.736 0 1.333-.597 1.333-1.333v-6c0-.736-.597-1.333-1.333-1.333z" 
      stroke="rgb(228,231,231)" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M3.333 10h-.666c-.737 0-1.334-.597-1.334-1.333v-6c0-.736.597-1.333 1.334-1.333h6c.736 0 1.333.597 1.333 1.333v.666" 
      stroke="rgb(228,231,231)" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

const AddReferrerCard = ({ onBack, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [referrerAddress, setReferrerAddress] = useState('');
  const [isAddressFocused, setIsAddressFocused] = useState(false);
  const textareaRef = useRef(null);

  // 处理粘贴功能
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setReferrerAddress(text);
      setIsAddressFocused(true);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } catch (err) {
      console.error('粘贴失败:', err);
    }
  };

  // 处理地址输入区域点击
  const handleAddressAreaClick = () => {
    setIsAddressFocused(true);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // 处理textarea失焦
  const handleTextareaBlur = () => {
    if (!referrerAddress.trim()) {
      setIsAddressFocused(false);
    }
  };

  // 处理确认按钮点击
  const handleConfirm = () => {
    if (referrerAddress.trim()) {
      // 这里可以添加地址验证逻辑
      // 暂时跳转到推荐人地址，实际项目中应该保存到本地存储或发送到后端
      const currentUrl = window.location.origin + window.location.pathname;
      const newUrl = `${currentUrl}?ref=${referrerAddress.trim()}`;
      window.location.href = newUrl;
    }
  };

  // 处理暂时跳过
  const handleSkip = () => {
    onBack();
  };

  return (
    <div className="w-full flex flex-col ">
      {/* 内容区域 - 移除顶部导航栏，因为现在由SlideModal统一管理 */}
      <div className="flex-1">
        {/* 描述文字 */}
        <div className="mb-[20px] md:mb-5">
          <p className="text-[12px] md:text-xs text-[#e4e7e7] leading-[18px] md:leading-relaxed">
            {t('wallet.referrer_description')}
          </p>
        </div>

        {/* 推荐地址标签 */}
        <div className="mb-[8px] md:mb-2">
          <span className="text-[14px] md:text-sm text-[#e4e7e7] font-medium">
            {t('wallet.referrer_address')}
          </span>
        </div>

        {/* 地址输入卡片 */}
        <div
          className="w-[290px] md:w-full h-[102px] md:h-24 bg-[#1B1C1C] border border-[#171818] rounded-[20px] md:rounded-2xl relative mb-[20px] md:mb-5"
          style={{ padding: '11px 18px 11px 12px', boxSizing: 'border-box' }}
        >
          {!isAddressFocused && !referrerAddress.trim() ? (
            /* 提示文案层 */
            <div
              className="absolute inset-0 flex items-center justify-center cursor-text"
              onClick={handleAddressAreaClick}
              style={{ padding: '11px 18px 11px 12px', boxSizing: 'border-box' }}
            >
              <div className="flex items-center gap-2 text-[#e4e7e7] text-[14px] md:text-sm">
                <span>Type or</span>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePaste();
                  }}
                  className="w-[80px] md:w-20 h-[36px] md:h-9 rounded-full border border-[rgb(228,231,231)] flex items-center justify-center gap-1 cursor-pointer hover:bg-[rgba(228,231,231,0.1)]"
                >
                  <PasteIcon />
                  <span>Paste</span>
                </div>
                <span>address</span>
              </div>
            </div>
          ) : (
            /* Textarea */
            <textarea
              ref={textareaRef}
              value={referrerAddress}
              onChange={(e) => setReferrerAddress(e.target.value)}
              onFocus={() => setIsAddressFocused(true)}
              onBlur={handleTextareaBlur}
              className="w-full h-[46px] md:h-12 bg-transparent text-white text-[14px] md:text-sm resize-none outline-none border-none"
              style={{ caretColor: '#5671FB' }}
              placeholder=""
            />
          )}
        </div>

        {/* 获得奖励说明 */}
        <div className="mb-[20px] md:mb-5">
          <div className="text-[14px] md:text-sm text-[#e4e7e7] font-medium mb-[8px] md:mb-2">
            {t('wallet.rewards_title')}
          </div>
          <div className="text-[12px] md:text-xs text-[#949E9E] leading-[16px] md:leading-relaxed space-y-[4px] md:space-y-1 pl-[8px] md:pl-2">
            <div>• {t('wallet.staking_rewards')}</div>
            <div>• {t('wallet.fee_rewards')}</div>
          </div>
        </div>

        {/* 按钮区域 */}
        <div className="flex gap-[12px] md:gap-3">
          {/* 暂时跳过按钮 */}
          <button
            onClick={handleSkip}
            className="flex-1 h-[48px] md:h-12 bg-transparent border border-[#3D3D3D] rounded-[24px] md:rounded-2xl text-[#e4e7e7] text-[16px] md:text-base font-medium hover:bg-[rgba(61,61,61,0.1)] transition-colors"
          >
            {t('wallet.skip_for_now')}
          </button>

          {/* 确认按钮 */}
          <button
            onClick={handleConfirm}
            disabled={!referrerAddress.trim()}
            className="flex-1 h-[48px] md:h-12 bg-[#5671FB] rounded-[24px] md:rounded-2xl text-white text-[16px] md:text-base font-medium hover:bg-[#4A63E8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('wallet.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddReferrerCard;
