import React, { useEffect, useRef, useState } from 'react';
import GlobalConfirmDialog from './GlobalConfirmDialog';
import { useTranslation } from 'react-i18next';
import lusdService from '../services/lusdService';
import { useAuthStore, useUserStore } from '../store';
import toast from 'react-hot-toast';

/**
 * LuckyUSD 自动领取提示：
 * - DApp加载后仅检查一次领取资格（登录状态下）
 * - 若可领取，弹出一次弹窗；用户点击领取则发起领取接口，取消则关闭直到下次加载
 */
const LusdAutoClaimPrompt = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const { fetchUserBalance } = useUserStore();
  const fetchedRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    (async () => {
      try {
        const res = await lusdService.getClaimStatus();
        if (res && res.data && res.data.can_claim) {
          setOpen(true);
        }
      } catch (err) {
        // 静默失败，不影响正常使用
        console.warn('[LusdAutoClaimPrompt] 获取领取资格失败:', err);
      }
    })();
  }, [isAuthenticated]);

  const handleClaim = async () => {
    setConfirmLoading(true);
    try {
      await lusdService.claimLusd();
      toast.success('成功领取LuckyUSD！');
      try { fetchUserBalance && fetchUserBalance(); } catch (_) {}
      setOpen(false);
    } catch (err) {
      console.warn('[LusdAutoClaimPrompt] 领取LuckyUSD失败:', err);
      toast.error('领取LuckyUSD失败，请稍后重试');
      setOpen(false); // 按“失败后关闭，下次加载再提示”的策略
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <GlobalConfirmDialog
      isOpen={open}
      onClose={() => setOpen(false)}
      title={'LuckyUSD 领取'}
      content={'当前可领取LuckyUSD，是否立即领取 LuckyUSD？'}
      confirmText={'领取'}
      cancelText={'取消'}
      handleConfirm={handleClaim}
      handleCancel={handleCancel}
      closeOnOverlayClick={false}
      confirmLoading={confirmLoading}
    />
  );
};

export default LusdAutoClaimPrompt;