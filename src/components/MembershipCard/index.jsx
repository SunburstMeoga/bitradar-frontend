import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '../../store';
import toast from 'react-hot-toast';

// 会员等级常量
const MEMBERSHIP_LEVELS = {
  NONE: 'none',
  SILVER: 'silver',
  GOLD: 'gold'
};

// 会员等级颜色配置
const MEMBERSHIP_COLORS = {
  [MEMBERSHIP_LEVELS.GOLD]: '#FDE047',
  [MEMBERSHIP_LEVELS.SILVER]: '#CBD5E1',
  [MEMBERSHIP_LEVELS.NONE]: '#64748B'
};

// 会员卡片组件
const MembershipLevelCard = ({ level, price, benefits, onBuy, isCurrentLevel = false, isDisabled = false }) => {
  const { t } = useTranslation();

  const levelConfig = {
    [MEMBERSHIP_LEVELS.SILVER]: {
      title: t('wallet.membership_silver_title'),
      color: MEMBERSHIP_COLORS[MEMBERSHIP_LEVELS.SILVER]
    },
    [MEMBERSHIP_LEVELS.GOLD]: {
      title: t('wallet.membership_gold_title'),
      color: MEMBERSHIP_COLORS[MEMBERSHIP_LEVELS.GOLD]
    }
  };

  const config = levelConfig[level];
  if (!config) return null;

  return (
    <div className="w-full bg-[#2a2a2a] rounded-[12px] p-[16px] md:p-4 mb-[12px] md:mb-3">
      {/* 会员等级标题 */}
      <div className="flex items-center justify-between mb-[12px] md:mb-3">
        <div className="flex items-center gap-[8px] md:gap-2">
          <div 
            className="w-[12px] h-[12px] md:w-3 md:h-3 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <span className="text-[16px] md:text-base font-medium text-white">
            {config.title}
          </span>
        </div>
        <span className="text-[16px] md:text-base font-bold text-white">
          {price}
        </span>
      </div>

      {/* 权益列表 */}
      <div className="mb-[16px] md:mb-4">
        <div className="text-[14px] md:text-sm text-[#949E9E] mb-[8px] md:mb-2">
          {t('wallet.membership_benefits_title')}
        </div>
        <div className="space-y-[4px] md:space-y-1">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-[12px] md:text-xs text-[#e4e7e7] flex items-center">
              <span className="mr-[8px] md:mr-2">•</span>
              {benefit}
            </div>
          ))}
        </div>
      </div>

      {/* 购买按钮 */}
      <button
        onClick={() => {
          if (!isCurrentLevel && !isDisabled) {
            onBuy(level);
          }
        }}
        disabled={isCurrentLevel || isDisabled}
        className={`w-full h-[40px] md:h-10 rounded-[8px] md:rounded-lg text-[14px] md:text-sm font-medium transition-colors ${
          isCurrentLevel
            ? 'bg-[#3d3d3d] text-[#8f8f8f] cursor-not-allowed'
            : isDisabled
            ? 'bg-[#3d3d3d] text-[#8f8f8f] cursor-not-allowed'
            : 'bg-[#5671FB] text-white hover:bg-[#4A63E8]'
        }`}
      >
        {isCurrentLevel
          ? t('wallet.membership_current_level')
          : (isDisabled && level === MEMBERSHIP_LEVELS.SILVER)
          ? t('wallet.membership_silver_quota_full')
          : t('wallet.membership_buy_button')
        }
      </button>
    </div>
  );
};

const MembershipCard = ({ onBack, onClose, onBuyMembership }) => {
  const { t } = useTranslation();
  const {
    membershipInfo,
    membershipConfig,
    fetchMembershipInfo,
    fetchMembershipConfig,
    isLoading
  } = useUserStore();

  const [currentMembershipLevel, setCurrentMembershipLevel] = useState(MEMBERSHIP_LEVELS.NONE);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // 获取会员数据
  useEffect(() => {
    const loadMembershipData = async () => {
      setIsDataLoading(true);
      try {
        // 并行获取会员配置和会员信息
        const promises = [fetchMembershipConfig()];

        // 只有在用户已认证时才获取会员信息
        try {
          promises.push(fetchMembershipInfo());
        } catch (error) {
          console.log('用户未认证，跳过获取会员信息');
        }

        await Promise.allSettled(promises);
      } catch (error) {
        console.error('获取会员数据失败:', error);
        toast.error(t('toast.get_member_info_failed'));
      } finally {
        setIsDataLoading(false);
      }
    };

    loadMembershipData();
  }, [fetchMembershipConfig, fetchMembershipInfo]);

  // 更新当前会员等级
  useEffect(() => {
    if (membershipInfo) {
      const level = membershipInfo.membership_type || MEMBERSHIP_LEVELS.NONE;
      setCurrentMembershipLevel(level);
    }
  }, [membershipInfo]);

  // 获取当前状态的标题和提示文案
  const getStatusInfo = () => {
    switch (currentMembershipLevel) {
      case MEMBERSHIP_LEVELS.NONE:
        return {
          title: t('wallet.membership_title_none'),
          tips: t('wallet.membership_tips_none')
        };
      case MEMBERSHIP_LEVELS.SILVER:
        return {
          title: t('wallet.membership_title_silver'),
          tips: t('wallet.membership_tips_silver')
        };
      case MEMBERSHIP_LEVELS.GOLD:
        return {
          title: t('wallet.membership_title_gold'),
          tips: t('wallet.membership_tips_gold')
        };
      default:
        return {
          title: t('wallet.membership_title_none'),
          tips: t('wallet.membership_tips_none')
        };
    }
  };

  // 处理购买会员
  const handleBuyMembership = (level) => {
    // 禁止购买银牌会员，不显示toast，直接无操作
    if (level === MEMBERSHIP_LEVELS.SILVER) {
      return;
    }
    if (onBuyMembership) {
      onBuyMembership(level);
    }
  };

  // 获取价格信息
  const getPriceInfo = (level) => {
    if (!membershipConfig) return '-- USDT';

    const prices = membershipConfig.membership_prices || {};
    const price = prices[level];
    return price ? `${parseFloat(price).toFixed(2)} USDT` : '-- USDT';
  };

  // 获取权益信息
  const getBenefitsInfo = (level) => {
    // 优先使用API配置中的权益信息
    if (membershipConfig && membershipConfig.benefits) {
      const benefits = membershipConfig.benefits[level];
      if (benefits && benefits.length > 0) {
        return benefits;
      }
    }

    // 如果API没有权益信息，使用硬编码的权益
    const hardcodedBenefits = {
      [MEMBERSHIP_LEVELS.SILVER]: [
        t('wallet.membership_silver_benefit_1'),
        t('wallet.membership_silver_benefit_2'),
        t('wallet.membership_silver_benefit_3')
      ],
      [MEMBERSHIP_LEVELS.GOLD]: [
        t('wallet.membership_gold_benefit_1'),
        t('wallet.membership_gold_benefit_2'),
        t('wallet.membership_gold_benefit_3'),
        t('wallet.membership_gold_benefit_4'),
        t('wallet.membership_gold_benefit_5'),
        t('wallet.membership_gold_benefit_6')
      ]
    };

    return hardcodedBenefits[level] || [];
  };

  // 检查是否可以升级到指定等级
  const canUpgradeToLevel = (targetLevel) => {
    if (currentMembershipLevel === MEMBERSHIP_LEVELS.GOLD) {
      return false; // 金牌会员无法再升级
    }

    if (currentMembershipLevel === MEMBERSHIP_LEVELS.SILVER && targetLevel === MEMBERSHIP_LEVELS.SILVER) {
      return false; // 已经是银牌会员
    }

    if (currentMembershipLevel === MEMBERSHIP_LEVELS.NONE && targetLevel === MEMBERSHIP_LEVELS.GOLD) {
      // 检查是否允许直接升级到金牌
      return membershipConfig?.allow_direct_gold_upgrade !== false;
    }

    return true;
  };

  const statusInfo = getStatusInfo();

  // 显示加载状态
  if (isDataLoading || isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-[40px] md:py-10">
        <div className="w-[32px] h-[32px] md:w-8 md:h-8 border-2 border-[#5671FB] border-t-transparent rounded-full animate-spin mb-[16px] md:mb-4" />
        <p className="text-[14px] md:text-sm text-[#e4e7e7]">
          {t('wallet.membership_loading')}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      {/* 状态标题 */}
      <div className="text-center mb-[16px] md:mb-4">
        <h3 className="text-[18px] md:text-lg font-medium text-white mb-[8px] md:mb-2">
          {statusInfo.title}
        </h3>
        <p className="text-[12px] md:text-xs text-[#949E9E] leading-[18px] md:leading-relaxed">
          {statusInfo.tips}
        </p>
      </div>

      {/* 会员卡片列表 */}
      <div className="flex-1">
        {currentMembershipLevel === MEMBERSHIP_LEVELS.GOLD ? (
          // 金牌会员：显示恭喜信息
          <div className="w-full bg-[#2a2a2a] rounded-[12px] p-[20px] md:p-5 text-center">
            <div 
              className="w-[16px] h-[16px] md:w-4 md:h-4 rounded-full mx-auto mb-[12px] md:mb-3"
              style={{ backgroundColor: MEMBERSHIP_COLORS[MEMBERSHIP_LEVELS.GOLD] }}
            />
            <p className="text-[16px] md:text-base text-white font-medium">
              {t('wallet.membership_tips_gold')}
            </p>
          </div>
        ) : (
          // 无会员或银牌会员：显示可购买的会员卡片（金牌在上，银牌在下）
          <>
            <MembershipLevelCard
              level={MEMBERSHIP_LEVELS.GOLD}
              price={getPriceInfo(MEMBERSHIP_LEVELS.GOLD)}
              benefits={getBenefitsInfo(MEMBERSHIP_LEVELS.GOLD)}
              onBuy={handleBuyMembership}
              isCurrentLevel={currentMembershipLevel === MEMBERSHIP_LEVELS.GOLD}
              isDisabled={!canUpgradeToLevel(MEMBERSHIP_LEVELS.GOLD)}
            />
            {currentMembershipLevel === MEMBERSHIP_LEVELS.NONE && (
              <MembershipLevelCard
                level={MEMBERSHIP_LEVELS.SILVER}
                price={getPriceInfo(MEMBERSHIP_LEVELS.SILVER)}
                benefits={getBenefitsInfo(MEMBERSHIP_LEVELS.SILVER)}
                onBuy={handleBuyMembership}
                isCurrentLevel={currentMembershipLevel === MEMBERSHIP_LEVELS.SILVER}
                // 银牌按钮置灰且不可点击，文案显示名额已满
                isDisabled={true}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MembershipCard;
export { MEMBERSHIP_LEVELS, MEMBERSHIP_COLORS };
