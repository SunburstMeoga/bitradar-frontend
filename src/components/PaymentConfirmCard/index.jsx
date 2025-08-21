import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { MEMBERSHIP_LEVELS, MEMBERSHIP_COLORS } from '../MembershipCard';

const PaymentConfirmCard = ({ membershipLevel, onBack, onClose, onPaymentSuccess }) => {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);

  // 获取会员等级配置
  const getMembershipConfig = () => {
    const configs = {
      [MEMBERSHIP_LEVELS.SILVER]: {
        title: t('wallet.membership_payment_title_silver'),
        price: t('wallet.membership_silver_price'),
        benefits: [t('wallet.membership_benefit_level')],
        color: MEMBERSHIP_COLORS[MEMBERSHIP_LEVELS.SILVER]
      },
      [MEMBERSHIP_LEVELS.GOLD]: {
        title: t('wallet.membership_payment_title_gold'),
        price: t('wallet.membership_gold_price'),
        benefits: [
          t('wallet.membership_benefit_level'),
          t('wallet.membership_benefit_network')
        ],
        color: MEMBERSHIP_COLORS[MEMBERSHIP_LEVELS.GOLD]
      }
    };

    return configs[membershipLevel] || configs[MEMBERSHIP_LEVELS.SILVER];
  };

  // 处理确认支付
  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    
    try {
      // 模拟支付流程（延迟1-2秒）
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 显示支付成功提示
      toast.success(t('wallet.membership_payment_success'));
      
      // 调用支付成功回调
      if (onPaymentSuccess) {
        onPaymentSuccess(membershipLevel);
      }
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('支付失败，请重试');
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
