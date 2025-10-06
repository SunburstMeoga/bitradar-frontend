import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { referralService } from '../../services';
import toast from 'react-hot-toast';
import { copyToClipboard } from '../../utils/clipboard';

// 复制图标SVG组件
const CopyIcon = ({ color = "#949E9E" }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path 
      d="M13.333 6h-6c-.736 0-1.333.597-1.333 1.333v6c0 .736.597 1.333 1.333 1.333h6c.736 0 1.333-.597 1.333-1.333v-6c0-.736-.597-1.333-1.333-1.333z" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M3.333 10h-.666c-.737 0-1.334-.597-1.334-1.333v-6c0-.736.597-1.333 1.334-1.333h6c.736 0 1.333.597 1.333 1.333v.666" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// 用户图标SVG组件
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="7" r="3" stroke="#5671FB" strokeWidth="1.5" fill="none"/>
    <path d="M4 18c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="#5671FB" strokeWidth="1.5" fill="none"/>
  </svg>
);

// 奖励图标SVG组件
const RewardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 2L12.09 6.26L17 7L13.5 10.74L14.18 15.74L10 13.77L5.82 15.74L6.5 10.74L3 7L7.91 6.26L10 2Z" 
          stroke="#FFD700" strokeWidth="1.5" fill="none"/>
  </svg>
);

const ReferralStatsCard = ({ onBack, onClose, onViewTree }) => {
  const { t } = useTranslation();
  const [statsData, setStatsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 获取推荐统计数据
  const fetchReferralStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await referralService.getMyInviteCode();
      if (result.success) {
        setStatsData(result.data);
      }
    } catch (error) {
      console.error('获取推荐统计失败:', error);
      setError(error.message || '获取数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralStats();
  }, []);

  // 复制邀请码
  const handleCopyInviteCode = async () => {
    if (!statsData?.invite_code) return;

    try {
      // 使用新的剪贴板工具函数
      const success = await copyToClipboard(statsData.invite_code);
      if (success) {
        toast.success(t('wallet.invite_code_copied'));
      } else {
        toast.error(t('wallet.copy_failed'));
      }
    } catch (err) {
      console.error('复制失败:', err);
      toast.error(t('wallet.copy_failed'));
    }
  };

  // 生成并复制推荐链接
  const handleGenerateReferralLink = async () => {
    if (!statsData?.invite_code) return;

    try {
      const currentUrl = window.location.origin + window.location.pathname;
      const referralLink = `${currentUrl}?ref=${statsData.invite_code}`;
      // 使用新的剪贴板工具函数
      const success = await copyToClipboard(referralLink);
      if (success) {
        toast.success(t('wallet.referral_link_copied'));
      } else {
        toast.error(t('wallet.copy_failed'));
      }
    } catch (err) {
      console.error('复制失败:', err);
      toast.error(t('wallet.copy_failed'));
    }
  };

  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-10">
        <div className="text-[#e4e7e7] text-[14px] md:text-sm">
          {t('common.loading')}...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-10">
        <div className="text-red-400 text-[14px] md:text-sm mb-4">
          {error}
        </div>
        <button
          onClick={fetchReferralStats}
          className="px-4 py-2 bg-[#5671FB] text-white rounded-lg text-[12px] md:text-sm"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      {/* 我的邀请码卡片 */}
      <div className="bg-[#1B1C1C] border border-[#171818] rounded-[20px] md:rounded-2xl p-[16px] md:p-4 mb-[16px] md:mb-4">
        <div className="flex items-center justify-between mb-[12px] md:mb-3">
          <span className="text-[14px] md:text-sm text-[#e4e7e7] font-medium">
            {t('wallet.my_invite_code')}
          </span>
          <button
            onClick={handleCopyInviteCode}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[rgba(228,231,231,0.1)] transition-colors"
          >
            <CopyIcon />
            <span className="text-[12px] md:text-xs text-[#949E9E]">
              {t('common.copy')}
            </span>
          </button>
        </div>
        <div className="text-[18px] md:text-xl font-bold text-white mb-[8px] md:mb-2">
          {statsData?.invite_code || '--'}
        </div>
        <button
          onClick={handleGenerateReferralLink}
          className="w-full h-[36px] md:h-9 bg-[#5671FB] rounded-[18px] md:rounded-lg text-white text-[12px] md:text-sm font-medium hover:bg-[#4A63E8] transition-colors"
        >
          {t('wallet.generate_referral_link')}
        </button>
      </div>

      {/* 统计数据 */}
      <div className="grid grid-cols-2 gap-[12px] md:gap-3 mb-[16px] md:mb-4">
        {/* 总推荐人数 */}
        <div className="bg-[#1B1C1C] border border-[#171818] rounded-[16px] md:rounded-xl p-[12px] md:p-3">
          <div className="flex items-center gap-2 mb-[8px] md:mb-2">
            <UserIcon />
            <span className="text-[12px] md:text-xs text-[#949E9E]">
              {t('wallet.total_referrals')}
            </span>
          </div>
          <div className="text-[20px] md:text-2xl font-bold text-white">
            {statsData?.total_referrals || 0}
          </div>
        </div>

        {/* 活跃推荐人数 */}
        <div className="bg-[#1B1C1C] border border-[#171818] rounded-[16px] md:rounded-xl p-[12px] md:p-3">
          <div className="flex items-center gap-2 mb-[8px] md:mb-2">
            <UserIcon />
            <span className="text-[12px] md:text-xs text-[#949E9E]">
              {t('wallet.active_referrals')}
            </span>
          </div>
          <div className="text-[20px] md:text-2xl font-bold text-white">
            {statsData?.active_referrals || 0}
          </div>
        </div>
      </div>

      {/* 总奖励 */}
      <div className="bg-[#1B1C1C] border border-[#171818] rounded-[20px] md:rounded-2xl p-[16px] md:p-4 mb-[20px] md:mb-5">
        <div className="flex items-center gap-2 mb-[8px] md:mb-2">
          <RewardIcon />
          <span className="text-[14px] md:text-sm text-[#e4e7e7] font-medium">
            {t('wallet.total_rewards')}
          </span>
        </div>
        <div className="text-[24px] md:text-3xl font-bold text-[#FFD700]">
          ${statsData?.total_rewards || '0.00'}
        </div>
      </div>

      {/* 查看推荐树按钮 */}
      <button
        onClick={onViewTree}
        className="w-full h-[48px] md:h-12 bg-[#5671FB] rounded-[24px] md:rounded-2xl text-white text-[16px] md:text-base font-medium hover:bg-[#4A63E8] transition-colors"
      >
        {t('wallet.view_referral_tree')}
      </button>
    </div>
  );
};

export default ReferralStatsCard;
