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



const AddReferrerCard = ({ onBack, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const { account } = useWeb3Store();
  const [inviteCode, setInviteCode] = useState('');
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
      console.log('🔍 验证邀请码结果:', result);

      if (result.success && (result.data.is_valid || result.data.valid)) {
        setValidationResult({
          isValid: true,
          inviter: result.data.inviter || result.data.referrer
        });
      } else {
        setValidationResult({
          isValid: false,
          message: result.data.message || t('wallet.invalid_referral_code')
        });
      }
    } catch (error) {
      console.error('邀请码验证失败:', error);
      setValidationResult({
        isValid: false,
        message: error.message || t('wallet.validation_failed')
      });
    } finally {
      setIsValidating(false);
    }
  };





  // 处理邀请码输入变化
  const handleCodeChange = async (e) => {
    const code = e.target.value;
    setInviteCode(code);

    // 延迟验证，避免频繁请求
    if (code.trim()) {
      // 使用 useRef 来存储最新的输入值，避免闭包问题
      const currentCode = code;
      setTimeout(() => {
        // 检查当前输入框的值是否与延迟执行时的值一致
        if (textareaRef.current && textareaRef.current.value === currentCode) {
          validateInviteCode(currentCode);
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
          {/* Textarea */}
          <div className="w-full h-full flex flex-col">
            <textarea
              ref={textareaRef}
              value={inviteCode}
              onChange={handleCodeChange}
              className="w-full h-[46px] md:h-12 bg-transparent text-white text-[14px] md:text-sm resize-none outline-none border-none"
              style={{ caretColor: '#5671FB' }}
              placeholder="请输入验证码"
            />
            {/* 验证状态显示 */}
            {inviteCode.trim() && (
              <div className="flex items-center gap-1 mt-1">
                {isValidating ? (
                  <span className="text-[10px] text-[#949E9E]">{t('wallet.validating')}</span>
                ) : validationResult ? (
                  validationResult.isValid ? (
                    <span className="text-[10px] text-green-400">✓ {t('wallet.valid_referral_code')}</span>
                  ) : (
                    <span className="text-[10px] text-red-400">✗ {validationResult.message}</span>
                  )
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* 获得奖励说明 */}
        <div className="mb-[20px] md:mb-5">
          <div className="text-[14px] md:text-sm text-[#e4e7e7] font-medium mb-[8px] md:mb-2">
            {t('wallet.rewards_title')}
          </div>
          <div className="text-[12px] md:text-xs text-[#949E9E] leading-[16px] md:leading-relaxed space-y-[4px] md:space-y-1 pl-[8px] md:pl-2">
            <div>• {t('wallet.staking_rewards')}</div>
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
