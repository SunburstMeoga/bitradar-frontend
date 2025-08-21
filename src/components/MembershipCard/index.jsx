import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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
const MembershipLevelCard = ({ level, price, benefits, onBuy, isCurrentLevel = false }) => {
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
      {!isCurrentLevel && (
        <button
          onClick={() => onBuy(level)}
          className="w-full h-[40px] md:h-10 bg-[#5671FB] rounded-[8px] md:rounded-lg text-white text-[14px] md:text-sm font-medium hover:bg-[#4A63E8] transition-colors"
        >
          {t('wallet.membership_buy_button')}
        </button>
      )}
    </div>
  );
};

const MembershipCard = ({ onBack, onClose, onBuyMembership }) => {
  const { t } = useTranslation();
  const [currentMembershipLevel, setCurrentMembershipLevel] = useState(MEMBERSHIP_LEVELS.NONE);

  // 随机生成用户会员等级（每次打开弹窗时重新生成）
  useEffect(() => {
    const levels = [MEMBERSHIP_LEVELS.NONE, MEMBERSHIP_LEVELS.SILVER, MEMBERSHIP_LEVELS.GOLD];
    const randomLevel = levels[Math.floor(Math.random() * levels.length)];
    setCurrentMembershipLevel(randomLevel);
  }, []);

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
    if (onBuyMembership) {
      onBuyMembership(level);
    }
  };

  const statusInfo = getStatusInfo();

  // 权益配置
  const benefitsConfig = {
    [MEMBERSHIP_LEVELS.SILVER]: [t('wallet.membership_benefit_level')],
    [MEMBERSHIP_LEVELS.GOLD]: [
      t('wallet.membership_benefit_level'),
      t('wallet.membership_benefit_network')
    ]
  };

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
          // 无会员或银牌会员：显示可购买的会员卡片
          <>
            {currentMembershipLevel === MEMBERSHIP_LEVELS.NONE && (
              <MembershipLevelCard
                level={MEMBERSHIP_LEVELS.SILVER}
                price={t('wallet.membership_silver_price')}
                benefits={benefitsConfig[MEMBERSHIP_LEVELS.SILVER]}
                onBuy={handleBuyMembership}
              />
            )}
            <MembershipLevelCard
              level={MEMBERSHIP_LEVELS.GOLD}
              price={t('wallet.membership_gold_price')}
              benefits={benefitsConfig[MEMBERSHIP_LEVELS.GOLD]}
              onBuy={handleBuyMembership}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default MembershipCard;
export { MEMBERSHIP_LEVELS, MEMBERSHIP_COLORS };
