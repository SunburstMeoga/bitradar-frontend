import React from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';

/**
 * 全局确认弹窗（可复用）
 * 动态属性：title、content、confirmText、cancelText、handleConfirm、handleCancel
 * 具备遮罩层，弹窗打开时页面不可滚动与点击（由基础Modal实现）
 */
const GlobalConfirmDialog = ({
  isOpen,
  onClose,
  title,
  content,
  confirmText,
  cancelText,
  handleConfirm,
  handleCancel,
  closeOnOverlayClick = false,
  confirmLoading = false,
  hideCancel = false,
  showCloseIcon = false,
}) => {
  const { t } = useTranslation();

  const onCancel = () => {
    try {
      if (typeof handleCancel === 'function') {
        handleCancel();
      }
    } finally {
      onClose?.();
    }
  };

  const onConfirm = async () => {
    try {
      if (typeof handleConfirm === 'function') {
        await handleConfirm();
      }
    } finally {
      onClose?.();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={closeOnOverlayClick ? onClose : () => {}} className="p-0">
      <div className="flex flex-col w-full">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-[#2a2a2a] relative">
          <div className="text-white text-[16px] font-semibold">
            {title || t('common.error')}
          </div>
          {showCloseIcon && (
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="absolute right-4 top-4 text-[#9d9d9d] hover:text-white"
            >
              ×
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-5 py-4 text-[#d1d5db] text-[14px] leading-6 break-all whitespace-normal overflow-x-hidden">
          {typeof content === 'string' ? (
            <p className="break-all whitespace-normal">{content}</p>
          ) : (
            content
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 pt-2 flex gap-3">
          {hideCancel ? null : (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 h-[38px] rounded-[10px] bg-[#2a2a2a] text-[#e5e7eb] text-[14px] font-medium hover:bg-[#343434] transition-colors"
            >
              {cancelText || t('common.cancel')}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmLoading}
            className={`${hideCancel ? 'w-full' : 'flex-1'} h-[38px] rounded-[10px] text-[14px] font-semibold transition-colors flex items-center justify-center gap-2 ${confirmLoading ? 'bg-[#3b82f6]/80 cursor-not-allowed' : 'bg-[#3b82f6] hover:bg-[#2563eb] text-white'}`}
          >
            {confirmLoading && (
              <span className="inline-block w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
            )}
            <span>{confirmText || t('common.confirm')}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default GlobalConfirmDialog;