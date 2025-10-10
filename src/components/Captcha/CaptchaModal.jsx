import { useState } from 'react';
import Modal from '../Modal';
import Captcha from './index.jsx';
import { useTranslation } from 'react-i18next';

/**
 * CaptchaModal: 基于项目 Modal 的全局弹窗验证码组件
 * Props 同 Captcha，另加：
 * - isOpen: 是否打开弹窗
 * - onClose: 关闭弹窗回调
 * - title: 可选标题
 * - description: 可选描述
 */
export default function CaptchaModal({
  isOpen,
  onClose,
  title,
  description,
  // Captcha 相关
  captchaType = 'text',
  onSuccess,
  onFail,
  onLoad,
  bgColor,
  charLength,
  placeholder,
  reloadText,
  reloadIcon,
  className,
  inputClassName,
  reloadClassName,
  backgroundColor,
  fontColor,
  charset,
  noReload,
  reloadColor,
  noReloadOnFail,
}) {
  const { t } = useTranslation();
  const [verified, setVerified] = useState(false);

  const handleSuccess = () => {
    setVerified(true);
    onSuccess && onSuccess();
    // 验证通过后自动关闭弹窗
    setTimeout(() => {
      onClose && onClose();
      setVerified(false);
    }, 300);
  };

  const handleFail = () => {
    setVerified(false);
    onFail && onFail();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* 顶部绿色强调条与更丰富的卡片风格 */}
      <div className="rounded-[12px] overflow-hidden">
        <div style={{ height: 4, background: '#c5ff33' }} />
        <div className="p-4 border border-[#2a2a2a] bg-[#141414]">
          <div className="mb-2">
            <div className="text-white text-base font-semibold">{title || t('captcha.title')}</div>
            {(description || t('captcha.description')) && (
              <div className="text-gray-400 text-sm mt-1">{description || t('captcha.description')}</div>
            )}
          </div>

          <Captcha
            captchaType={captchaType}
            onSuccess={handleSuccess}
            onFail={handleFail}
            onLoad={onLoad}
            bgColor={bgColor}
            charLength={charLength}
            placeholder={placeholder}
            reloadText={reloadText}
            reloadIcon={reloadIcon}
            className={className}
            inputClassName={inputClassName}
            reloadClassName={reloadClassName}
            backgroundColor={backgroundColor}
            fontColor={fontColor}
            charset={charset}
            noReload={noReload}
            reloadColor={reloadColor}
            noReloadOnFail={noReloadOnFail}
          />

          <div className="mt-3">
            {verified ? (
              <div className="text-[#c5ff33] text-sm">{t('captcha.success')}</div>
            ) : (
              <div className="text-gray-400 text-sm">{t('captcha.description')}</div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}