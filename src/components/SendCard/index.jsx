import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { readFromClipboard } from '../../utils/clipboard';

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

// 向下箭头SVG组件
const ArrowDownIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M7 10L12 15L17 10"
      stroke="#788080"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 粘贴图标SVG组件
const PasteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M13.333 6h-6c-.736 0-1.333.597-1.333 1.333v6c0 .736.597 1.333 1.333 1.333h6c.736 0 1.333-.597 1.333-1.333v-6c0-.736-.597-1.333-1.333-1.333z"
      stroke="#e4e7e7"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.333 10h-.666c-.737 0-1.334-.597-1.334-1.333v-6c0-.736.597-1.333 1.334-1.333h6c.736 0 1.333.597 1.333 1.333v.666"
      stroke="#e4e7e7"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SendCard = ({ onBack, onClose, onSelectToken }) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('0');
  const [address, setAddress] = useState('');
  const [isAddressFocused, setIsAddressFocused] = useState(false);
  const textareaRef = useRef(null);

  // 处理粘贴功能
  const handlePaste = async () => {
    try {
      const text = await readFromClipboard();
      setAddress(text || '');
      setIsAddressFocused(true);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } catch (err) {
      console.error('粘贴失败原因:', err);
      toast.error('粘贴功能不可用，请手动输入地址');
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
    if (!address.trim()) {
      setIsAddressFocused(false);
    }
  };

  return (
    <div className="w-full flex flex-col">
      {/* 内容区域 - 移除顶部导航栏，因为现在由SlideModal统一管理 */}
      <div className="flex-1">
        {/* 第一部分：金额输入卡片 */}
        <div
          className="w-[290px] md:w-full h-[102px] md:h-24 bg-[#1B1C1C] border border-[#171818] rounded-[20px] md:rounded-2xl flex items-center justify-between"
          style={{ padding: '11px 18px 11px 12px', boxSizing: 'border-box' }}
        >
          {/* 左侧：金额输入框 */}
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            pattern="[0-9,.]*"
            inputMode="decimal"
            className="flex-1 bg-transparent h-[36px] md:h-9 text-[32px] md:text-3xl font-normal outline-none border-none"
            style={{
              color: amount === '0' ? 'rgb(228, 231, 231)' : '#5671FB',
              caretColor: '#5671FB'
            }}
          />

          {/* 右侧：Select token按钮 */}
          <div
            onClick={onSelectToken}
            className="w-[140px] md:w-36 h-[36px] md:h-9 rounded-full flex items-center justify-center text-[13px] md:text-sm cursor-pointer border"
            style={{
              color: '#5671FB',
              backgroundColor: 'rgba(86, 113, 251, 0.1)',
              borderColor: '#5671FB'
            }}
          >
            Select token
          </div>
        </div>

        {/* 向下箭头 - 使用绝对定位实现重叠效果 */}
        <div className="relative flex justify-center" style={{ marginTop: '10px', marginBottom: '10px' }}>
          <div className="w-[50px] h-[50px] md:w-12 md:h-12 bg-[#222525] rounded-[16px] md:rounded-xl flex items-center justify-center relative z-10">
            <ArrowDownIcon />
          </div>
        </div>

        {/* 第二部分：地址输入卡片 */}
        <div
          className="w-[290px] md:w-full h-[102px] md:h-24 bg-[#1B1C1C] border border-[#171818] rounded-[20px] md:rounded-2xl relative"
          style={{ padding: '11px 18px 11px 12px', boxSizing: 'border-box' }}
        >
          {!isAddressFocused && !address.trim() ? (
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
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onFocus={() => setIsAddressFocused(true)}
              onBlur={handleTextareaBlur}
              className="w-full h-[46px] md:h-12 bg-transparent text-white text-[14px] md:text-sm resize-none outline-none border-none"
              style={{ caretColor: '#5671FB' }}
              placeholder=""
            />
          )}
        </div>

        {/* 第三部分：Select Token按钮 */}
        <div className="pt-[20px] md:pt-5">
          <button
            onClick={onSelectToken}
            className="w-[290px] md:w-full h-[48px] md:h-12 rounded-[8px] md:rounded-lg text-[14px] md:text-sm cursor-pointer"
            style={{
              color: 'rgba(255, 255, 255, 0.2)',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: 'none'
            }}
          >
            Select Token
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendCard;
