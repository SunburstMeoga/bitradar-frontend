import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import CountUp from 'react-countup';

// 向下箭头SVG组件
const ArrowDownIcon = ({ isExpanded }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
  >
    <path
      d="M4 6L8 10L12 6"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 自定义动画金额组件
const AnimatedAmount = ({ amount, fontSize = '14vw', className = 'text-white' }) => {
  const [currentValue, setCurrentValue] = useState(0);
  const smallerFontSize = `${parseInt(fontSize) / 2}vw`;

  useEffect(() => {
    const duration = 2000; // 2秒
    const steps = 60; // 60帧
    const increment = amount / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(current + increment, amount);
      setCurrentValue(current);

      if (step >= steps || current >= amount) {
        setCurrentValue(amount);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [amount]);

  const [integerPart, decimalPart] = currentValue.toFixed(2).split('.');

  return (
    <span className={`${className} text-size-[${fontSize}] font-medium`}>
      {integerPart}
      <span className={`text-size-[${smallerFontSize}] align-baseline`}>
        .{decimalPart}
      </span>
    </span>
  );
};

const NetworkDetails = () => {
  const { t } = useTranslation();
  const [expandedLevel, setExpandedLevel] = useState(null);

  // 模拟数据
  const overviewData = {
    teamMembers: 24,
    totalDeposit: 15680.50,
    totalWithdrawal: 8420.30
  };

  const levelData = [
    { level: 1, count: 6, expanded: false },
    { level: 2, count: 6, expanded: false },
    { level: 3, count: 6, expanded: false },
    { level: 4, count: 6, expanded: false }
  ];

  // 模拟用户数据
  const mockUsers = [
    {
      address: '0x515613aq34ad51q51wqe331ad1',
      tradingAmount: 1250.00,
      feeAmount: 850.00,
      withdrawalAmount: 420.00
    },
    {
      address: '0x515613aq34ad51q51wqe331ad1',
      tradingAmount: 980.50,
      feeAmount: 650.25,
      withdrawalAmount: 320.75
    },
    {
      address: '0x515613aq34ad51q51wqe331ad1',
      tradingAmount: 1580.75,
      feeAmount: 1200.00,
      withdrawalAmount: 680.50
    },
    {
      address: '0x515613aq34ad51q51wqe331ad1',
      tradingAmount: 750.25,
      feeAmount: 480.00,
      withdrawalAmount: 250.00
    }
  ];

  // 处理层级展开/收起
  const handleLevelToggle = (level) => {
    setExpandedLevel(expandedLevel === level ? null : level);
  };

  // 显示完整地址（不使用省略号）
  const formatAddress = (address) => {
    if (!address) return '';
    return address;
  };

  // 格式化金额显示，小数点后字体小一半，带跳动效果
  const formatAmount = (amount, fontSize = '14vw', className = 'text-white') => {
    return <AnimatedAmount amount={amount} fontSize={fontSize} className={className} />;
  };

  // 格式化数字显示，带跳动效果（整数）
  const formatNumber = (number, fontSize = '16vw') => {
    return (
      <span className={`text-[#c5ff33] text-size-[${fontSize}] font-medium`}>
        <CountUp
          start={0}
          end={number}
          duration={2}
          separator=""
        />
      </span>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#121212' }}>
      <div className="px-[16vw] pt-[20vw] pb-[20vw]">
        {/* 推荐总览 */}
        <div className="mb-[24vw]">
          <h2 className="text-[#c5ff33] text-size-[18vw] font-semibold mb-[16vw]" style={{ fontWeight: 600 }}>
            {t('network_details.referral_overview')}
          </h2>

          {/* 团队总人数 */}
          <div
            className="w-full h-[50vw] flex items-center px-[16vw] mb-[12vw] rounded-[8vw] border border-[#c5ff33]"
            style={{ backgroundColor: 'rgba(197, 255, 51, 0.1)' }}
          >
            <span className="text-white text-size-[16vw]">{t('network_details.team_members')}</span>
            <div className="ml-auto">{formatNumber(overviewData.teamMembers, '16vw')}</div>
          </div>

          {/* 总质押金额和总提现金额 */}
          <div className="flex gap-[12vw]">
            <div
              className="flex-1 flex items-center px-[16vw] py-[16vw] rounded-[8vw]"
              style={{ backgroundColor: 'rgb(41, 41, 41)' }}
            >
              <div className="flex flex-col">
                <span className="text-white text-size-[16vw]">{t('network_details.total_deposit')}</span>
                <div className="mt-[4vw]">{formatAmount(overviewData.totalDeposit, '14vw', 'text-white')}</div>
              </div>
            </div>
            <div
              className="flex-1 flex items-center px-[16vw] py-[16vw] rounded-[8vw]"
              style={{ backgroundColor: 'rgb(41, 41, 41)' }}
            >
              <div className="flex flex-col">
                <span className="text-white text-size-[16vw]">{t('network_details.total_withdrawal')}</span>
                <div className="mt-[4vw]">{formatAmount(overviewData.totalWithdrawal, '14vw', 'text-white')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 推荐关系 */}
        <div>
          <h2 className="text-[#c5ff33] text-size-[18vw] font-semibold mb-[16vw]" style={{ fontWeight: 600 }}>
            {t('network_details.referral_system')}
          </h2>

          <div className="space-y-[2vw]">
            {levelData.map((level) => (
              <div key={level.level}>
                {/* 层级标题 */}
                <button
                  onClick={() => handleLevelToggle(level.level)}
                  className="w-full h-[50vw] flex items-center justify-between px-[16vw] rounded-[8vw] hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: 'rgb(41, 41, 41)' }}
                >
                  <span className="text-white text-size-[16vw]">
                    {t(`network_details.level_${level.level}`)}
                  </span>
                  <ArrowDownIcon isExpanded={expandedLevel === level.level} />
                </button>

                {/* 展开的用户列表 */}
                {expandedLevel === level.level && (
                  <div className="mt-[2vw] space-y-[1vw]">
                    {mockUsers.map((user, index) => (
                      <div
                        key={index}
                        className="px-[16vw] py-[12vw] rounded-[8vw]"
                        style={{ backgroundColor: 'rgb(31, 31, 31)' }}
                      >
                        {/* 用户地址 */}
                        <div className="text-white text-size-[14vw] font-medium mb-[8vw]">
                          {formatAddress(user.address)}
                        </div>

                        {/* 用户数据 */}
                        <div className="flex justify-between text-size-[12vw]">
                          <div className="flex flex-col items-center">
                            <span className="text-[#8f8f8f] mb-[4vw]">{t('network_details.trading_amount')}</span>
                            {formatAmount(user.tradingAmount, '12vw', 'text-white')}
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-[#8f8f8f] mb-[4vw]">{t('network_details.fee_amount')}</span>
                            {formatAmount(user.feeAmount, '12vw', 'text-white')}
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-[#8f8f8f] mb-[4vw]">{t('network_details.withdrawal_amount')}</span>
                            {formatAmount(user.withdrawalAmount, '12vw', 'text-white')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkDetails;
