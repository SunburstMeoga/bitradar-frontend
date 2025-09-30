import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { referralService } from '../../services';
import { useWeb3Store } from '../../store';
import toast from 'react-hot-toast';

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
  const { account } = useWeb3Store();
  const [inviteCode, setInviteCode] = useState('');
  const [isCodeFocused, setIsCodeFocused] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const textareaRef = useRef(null);

  // 验证邀请码
  const validateInviteCode = async (code) => {
    if (!code.trim()) {
      setValidationResult(null);
      return;
    }

    setIsValidating(true);
    try {
      const result = await referralService.validateInviteCode(code.trim());
      if (result.success && result.data.is_valid) {
        setValidationResult({
          isValid: true,
          inviter: result.data.inviter
        });
      } else {
        setValidationResult({
          isValid: false,
          message: t('wallet.invalid_referral_code')
        });
      }
    } catch (error) {
      setValidationResult({
        isValid: false,
        message: error.message || t('wallet.validation_failed')
      });
    } finally {
      setIsValidating(false);
    }
  };

  // 处理粘贴功能
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInviteCode(text);
      setIsCodeFocused(true);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
      // 自动验证粘贴的邀请码
      await validateInviteCode(text);
    } catch (err) {
      console.error('粘贴失败:', err);
    }
  };

  // 处理邀请码输入区域点击
  const handleCodeAreaClick = () => {
    setIsCodeFocused(true);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // 处理textarea失焦
  const handleTextareaBlur = () => {
    if (!inviteCode.trim()) {
      setIsCodeFocused(false);
    }
  };

  // 处理邀请码输入变化
  const handleCodeChange = async (e) => {
    const code = e.target.value;
    setInviteCode(code);

    // 延迟验证，避免频繁请求
    if (code.trim()) {
      setTimeout(() => {
        if (code === inviteCode) { // 确保是最新的输入
          validateInviteCode(code);
        }
      }, 500);
    } else {
      setValidationResult(null);
    }
  };

  // 处理确认按钮点击
  const handleConfirm = async () => {
    if (!inviteCode.trim() || !validationResult?.isValid) {
      toast.error(t('wallet.please_enter_valid_referral_code'));
      return;
    }

    if (!account) {
      toast.error(t('wallet.please_connect_wallet_first'));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await referralService.useInviteCode(inviteCode.trim(), account);
      if (result.success) {
        toast.success(t('wallet.referral_bind_success'));
        onSuccess && onSuccess();
      }
    } catch (error) {
      toast.error(error.message || t('wallet.referral_bind_failed'));
    } finally {
      setIsSubmitting(false);
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
            {t('wallet.invite_code_description')}
          </p>
        </div>

        {/* 邀请码标签 */}
        <div className="mb-[8px] md:mb-2">
          <span className="text-[14px] md:text-sm text-[#e4e7e7] font-medium">
            {t('wallet.invite_code')}
          </span>
        </div>

        {/* 邀请码输入卡片 */}
        <div
          className="w-[290px] md:w-full h-[102px] md:h-24 bg-[#1B1C1C] border border-[#171818] rounded-[20px] md:rounded-2xl relative mb-[20px] md:mb-5"
          style={{ padding: '11px 18px 11px 12px', boxSizing: 'border-box' }}
        >
          {!isCodeFocused && !inviteCode.trim() ? (
            /* 提示文案层 */
            <div
              className="absolute inset-0 flex items-center justify-center cursor-text"
              onClick={handleCodeAreaClick}
              style={{ padding: '11px 18px 11px 12px', boxSizing: 'border-box' }}
            >
              <div className="flex items-center gap-2 text-[#e4e7e7] text-[14px] md:text-sm">
                <span>{t('wallet.type_or')}</span>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePaste();
                  }}
                  className="w-[80px] md:w-20 h-[36px] md:h-9 rounded-full border border-[rgb(228,231,231)] flex items-center justify-center gap-1 cursor-pointer hover:bg-[rgba(228,231,231,0.1)]"
                >
                  <PasteIcon />
                  <span>{t('wallet.paste')}</span>
                </div>
                <span>{t('wallet.referral_code_text')}</span>
              </div>
            </div>
          ) : (
            /* Textarea */
            <div className="w-full h-full flex flex-col">
              <textarea
                ref={textareaRef}
                value={inviteCode}
                onChange={handleCodeChange}
                onFocus={() => setIsCodeFocused(true)}
                onBlur={handleTextareaBlur}
                className="w-full h-[46px] md:h-12 bg-transparent text-white text-[14px] md:text-sm resize-none outline-none border-none"
                style={{ caretColor: '#5671FB' }}
                placeholder=""
              />
              {/* 验证状态显示 */}
              {inviteCode.trim() && (
                <div className="flex items-center gap-1 mt-1">
                  {isValidating ? (
                    <span className="text-[10px] text-[#949E9E]">{t('wallet.validating')}</span>
                  ) : validationResult ? (
                    validationResult.isValid ? (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-green-400">✓ {t('wallet.valid_referral_code')}</span>
                        {validationResult.inviter && (
                          <span className="text-[10px] text-[#949E9E]">
                            (VIP{validationResult.inviter.vip_level})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-red-400">✗ {validationResult.message}</span>
                    )
                  ) : null}
                </div>
              )}
            </div>
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
            disabled={!inviteCode.trim() || !validationResult?.isValid || isSubmitting}
            className="flex-1 h-[48px] md:h-12 bg-[#5671FB] rounded-[24px] md:rounded-2xl text-white text-[16px] md:text-base font-medium hover:bg-[#4A63E8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? t('wallet.submitting') : t('wallet.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddReferrerCard;
