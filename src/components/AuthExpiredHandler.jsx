import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GlobalConfirmDialog from './GlobalConfirmDialog';
import { useWeb3Store, useAuthStore } from '../store';
import toast from 'react-hot-toast';

/**
 * 全局监听401/403事件并弹出登录过期提示
 */
const AuthExpiredHandler = () => {
  const { t } = useTranslation();
  const { account, isConnected } = useWeb3Store();
  const { login } = useAuthStore();

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmText, setConfirmText] = useState(t('common.confirm'));

  // 防重复弹窗：已打开时忽略重复事件
  useEffect(() => {
    const handler = () => {
      if (!open) {
        setOpen(true);
      }
    };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, [open]);

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (!isConnected || !account) {
        toast.error(t('wallet.please_connect_wallet_first'));
        return;
      }
      await login(account);
      toast.success(t('common.success'));
      // 登录成功后刷新页面
      window.location.reload();
    } catch (err) {
      console.error('重新登录失败:', err);
      toast.error(t('common.login_failed'));
      // 登录失败后按钮文案改为“重新登录”
      setConfirmText(t('auth.relogin'));
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = () => {
    // 用户取消，仅关闭弹窗
  };

  return (
    <GlobalConfirmDialog
      isOpen={open}
      onClose={() => setOpen(false)}
      title={t('auth.session_expired_title')}
      content={t('auth.session_expired_message')}
      confirmText={confirmText}
      cancelText={t('common.cancel')}
      handleConfirm={handleConfirm}
      handleCancel={handleCancel}
      closeOnOverlayClick={false}
      confirmLoading={busy}
    />
  );
};

export default AuthExpiredHandler;