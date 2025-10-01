import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { MEMBERSHIP_LEVELS, MEMBERSHIP_COLORS } from '../MembershipCard';
import { useUserStore } from '../../store';

const PaymentConfirmCard = ({ membershipLevel, onBack, onClose, onPaymentSuccess }) => {
  const { t } = useTranslation();
  const {
    membershipInfo,
    membershipConfig,
    balance,
    upgradeMembership,
    fetchBalance
  } = useUserStore();
  const [isProcessing, setIsProcessing] = useState(false);

  // 获取会员等级配置
  const getMembershipConfig = () => {
    if (!membershipConfig) {
      // 如果没有配置数据，返回默认配置
      const configs = {
        [MEMBERSHIP_LEVELS.SILVER]: {
          title: t('wallet.membership_payment_title_silver'),
          price: '18 USDT',
          benefits: [t('wallet.membership_benefit_level')],
          color: MEMBERSHIP_COLORS[MEMBERSHIP_LEVELS.SILVER]
        },
        [MEMBERSHIP_LEVELS.GOLD]: {
          title: t('wallet.membership_payment_title_gold'),
          price: '58 USDT',
          benefits: [
            t('wallet.membership_benefit_level'),
            t('wallet.membership_benefit_network')
          ],
          color: MEMBERSHIP_COLORS[MEMBERSHIP_LEVELS.GOLD]
        }
      };
      return configs[membershipLevel] || configs[MEMBERSHIP_LEVELS.SILVER];
    }

    // 使用真实配置数据
    const prices = membershipConfig.membership_prices || {};
    const benefits = membershipConfig.benefits || {};

    // 获取权益信息，优先使用API配置，否则使用硬编码
    const getSilverBenefits = () => {
      if (benefits[MEMBERSHIP_LEVELS.SILVER] && benefits[MEMBERSHIP_LEVELS.SILVER].length > 0) {
        return benefits[MEMBERSHIP_LEVELS.SILVER];
      }
      return [
        t('wallet.membership_silver_benefit_1'),
        t('wallet.membership_silver_benefit_2'),
        t('wallet.membership_silver_benefit_3')
      ];
    };

    const getGoldBenefits = () => {
      if (benefits[MEMBERSHIP_LEVELS.GOLD] && benefits[MEMBERSHIP_LEVELS.GOLD].length > 0) {
        return benefits[MEMBERSHIP_LEVELS.GOLD];
      }
      return [
        t('wallet.membership_gold_benefit_1'),
        t('wallet.membership_gold_benefit_2'),
        t('wallet.membership_gold_benefit_3'),
        t('wallet.membership_gold_benefit_4')
      ];
    };

    const configs = {
      [MEMBERSHIP_LEVELS.SILVER]: {
        title: t('wallet.membership_payment_title_silver'),
        price: `${parseFloat(prices[MEMBERSHIP_LEVELS.SILVER] || 18).toFixed(2)} USDT`,
        benefits: getSilverBenefits(),
        color: MEMBERSHIP_COLORS[MEMBERSHIP_LEVELS.SILVER]
      },
      [MEMBERSHIP_LEVELS.GOLD]: {
        title: t('wallet.membership_payment_title_gold'),
        price: `${parseFloat(prices[MEMBERSHIP_LEVELS.GOLD] || 58).toFixed(2)} USDT`,
        benefits: getGoldBenefits(),
        color: MEMBERSHIP_COLORS[MEMBERSHIP_LEVELS.GOLD]
      }
    };
    return configs[membershipLevel] || configs[MEMBERSHIP_LEVELS.SILVER];
  };

  // 获取升级价格（数值）
  const getUpgradePrice = () => {
    if (!membershipConfig) {
      return membershipLevel === MEMBERSHIP_LEVELS.SILVER ? 18 : 58;
    }

    const prices = membershipConfig.membership_prices || {};
    const price = prices[membershipLevel];
    return price ? parseFloat(price) : (membershipLevel === MEMBERSHIP_LEVELS.SILVER ? 18 : 58);
  };

  // 获取用户USDT余额
  const getUSDTBalance = () => {
    if (!balance) {
      return 0;
    }

    // 优先使用 balanceMap 格式（如果存在）
    if (balance.balanceMap && balance.balanceMap['USDT']) {
      const usdtBalance = balance.balanceMap['USDT'];
      return parseFloat(usdtBalance.available || 0);
    }

    // 使用直接字段格式
    if (balance.usdt_balance) {
      return parseFloat(balance.usdt_balance || 0);
    }

    return 0;
  };

  // 升级前验证
  const validateBeforeUpgrade = async (targetType) => {
    // 检查 1: 当前等级是否可以升级
    const currentLevel = membershipInfo?.membership_type || MEMBERSHIP_LEVELS.NONE;

    if (currentLevel === MEMBERSHIP_LEVELS.GOLD) {
      toast.error('您已经是最高等级会员');
      return false;
    }

    // 检查 2: 目标等级是否有效
    if (!['silver', 'gold'].includes(targetType)) {
      toast.error('无效的升级目标');
      return false;
    }

    // 检查 3: 升级路径是否有效
    if (currentLevel === MEMBERSHIP_LEVELS.SILVER && targetType === 'silver') {
      toast.error('您已经是银牌会员');
      return false;
    }

    // 检查 4: 获取最新余额并检查是否足够
    await fetchBalance();

    const requiredPrice = getUpgradePrice();
    const currentBalance = getUSDTBalance();

    console.log('💰 余额检查详情:', {
      balance: balance,
      requiredPrice,
      currentBalance,
      hasBalanceMap: !!balance?.balanceMap,
      hasDirectBalance: !!balance?.usdt_balance
    });

    if (currentBalance < requiredPrice) {
      toast.error(`余额不足，需要 ${requiredPrice.toFixed(2)} USDT`);
      return false;
    }

    return true;
  };

  // 处理确认支付
  const handleConfirmPayment = async () => {
    setIsProcessing(true);

    try {
      // 升级前验证
      const isValid = await validateBeforeUpgrade(membershipLevel);
      if (!isValid) {
        return;
      }

      // 执行会员升级
      const result = await upgradeMembership(membershipLevel);

      if (result.success) {
        // 显示升级成功提示
        toast.success(t('wallet.membership_payment_success'));

        // 调用支付成功回调
        if (onPaymentSuccess) {
          onPaymentSuccess(membershipLevel);
        }
      } else {
        throw new Error(result.message || '升级失败');
      }
    } catch (error) {
      console.error('Membership upgrade failed:', error);
      // 错误信息已经在 upgradeMembership 中处理了，这里不需要再显示
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理取消支付
  const handleCancel = () => {
    if (onBack) {
      onBack();
    }
  };

  const config = getMembershipConfig();

  return (
    <div className="w-full flex flex-col">
      {/* 会员等级标题 */}
      <div className="text-center mb-[20px] md:mb-5">
        <div className="flex items-center justify-center gap-[8px] md:gap-2 mb-[12px] md:mb-3">
          <div 
            className="w-[16px] h-[16px] md:w-4 md:h-4 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <h3 className="text-[18px] md:text-lg font-medium text-white">
            {config.title}
          </h3>
        </div>
      </div>

      {/* 支付说明 */}
      <div className="mb-[20px] md:mb-5">
        <p className="text-[14px] md:text-sm text-[#e4e7e7] text-center leading-[20px] md:leading-relaxed">
          {t('wallet.membership_payment_description', { price: config.price })}
        </p>
      </div>

      {/* 权益列表 */}
      <div className="mb-[24px] md:mb-6">
        <div className="bg-[#2a2a2a] rounded-[12px] p-[16px] md:p-4">
          <div className="space-y-[8px] md:space-y-2">
            {config.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center text-[14px] md:text-sm text-[#e4e7e7]">
                <div 
                  className="w-[6px] h-[6px] md:w-1.5 md:h-1.5 rounded-full mr-[12px] md:mr-3"
                  style={{ backgroundColor: config.color }}
                />
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 按钮区域 */}
      <div className="flex gap-[12px] md:gap-3 mt-auto">
        {/* 取消按钮 */}
        <button
          onClick={handleCancel}
          disabled={isProcessing}
          className="flex-1 h-[48px] md:h-12 bg-transparent border border-[#3D3D3D] rounded-[24px] md:rounded-2xl text-[#e4e7e7] text-[16px] md:text-base font-medium hover:bg-[rgba(61,61,61,0.1)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t('wallet.membership_payment_cancel')}
        </button>

        {/* 确认支付按钮 */}
        <button
          onClick={handleConfirmPayment}
          disabled={isProcessing}
          className="flex-1 h-[48px] md:h-12 bg-[#5671FB] rounded-[24px] md:rounded-2xl text-white text-[16px] md:text-base font-medium hover:bg-[#4A63E8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {isProcessing ? (
            <div className="flex items-center gap-[8px] md:gap-2">
              <div className="w-[16px] h-[16px] md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>处理中...</span>
            </div>
          ) : (
            t('wallet.membership_payment_confirm')
          )}
        </button>
      </div>
    </div>
  );
};

export default PaymentConfirmCard;
