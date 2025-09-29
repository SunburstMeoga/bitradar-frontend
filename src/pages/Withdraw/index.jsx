import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import usePageTitle from '../../hooks/usePageTitle';
import toast from 'react-hot-toast';

// 自定义动画金额组件（借鉴网体详情页面）
const AnimatedAmount = ({ amount, fontSize = '20vw', mdFontSize = 'text-xl', className = 'text-white', isRefreshing = false }) => {
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
    <span className={`${className} text-size-[${fontSize}] ${mdFontSize} font-semibold transition-all duration-300 ${isRefreshing ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
      {integerPart}
      <span className={`text-size-[${smallerFontSize}] text-xs align-baseline`}>
        .{decimalPart}
      </span>
      {isRefreshing && (
        <span className="ml-2 inline-block animate-spin">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </span>
      )}
    </span>
  );
};

// 提现卡片组件
const WithdrawCard = ({
  title,
  withdrawAmount,
  onWithdrawAmountChange,
  onConfirm,
  isConfirmDisabled,
  balances,
  minAmount,
  t
}) => {
  return (
    <div
      className="w-[360vw] md:w-96 p-[20vw] md:p-5 rounded-[34vw] md:rounded-[34px] mb-[24vw] md:mb-6"
      style={{
        backgroundColor: '#121313',
        border: '1px solid #1F1F1F'
      }}
    >
      {/* 卡片标题 */}
      <div className="text-[#9D9D9D] text-size-[16vw] md:text-base lg:text-lg font-medium mb-[16vw] md:mb-4 lg:mb-5 text-center">
        {title}
      </div>

      {/* 余额信息显示 */}
      <div className="mb-[16vw] md:mb-4 lg:mb-5">
        <div className="flex items-center justify-between p-[16vw] md:p-4 lg:p-5 rounded-[12vw] md:rounded-lg lg:rounded-xl" style={{ backgroundColor: '#171818', border: '1px solid #1B1C1C' }}>
          <div className="flex items-center gap-[12vw] md:gap-3">
            <span className="text-[#8f8f8f] text-size-[14vw] md:text-sm">
              {t('exchange.platform_balance')}:
            </span>
            <span className="text-white text-size-[16vw] md:text-base font-medium">
              {balances.Rocket?.toLocaleString() || '0.00'}
            </span>
          </div>
          <div className="flex items-center gap-[12vw] md:gap-3">
            <span className="text-[#8f8f8f] text-size-[14vw] md:text-sm">
              {t('exchange.min_withdraw_amount')}:
            </span>
            <span className="text-white text-size-[16vw] md:text-base font-medium">
              {minAmount}
            </span>
          </div>
        </div>
      </div>

      {/* 输入区域 */}
      <div className="mb-[16vw] md:mb-4 lg:mb-5">
        {/* 提现金额输入框 */}
        <div
          className="flex items-center justify-between p-[16vw] md:p-4 lg:p-5 rounded-[12vw] md:rounded-lg lg:rounded-xl"
          style={{ backgroundColor: '#171818', border: '1px solid #1B1C1C' }}
        >
          <span className="text-white text-size-[16vw] md:text-base lg:text-lg">{t('exchange.withdraw_amount')}</span>
          <input
            type="number"
            value={withdrawAmount}
            onChange={(e) => onWithdrawAmountChange(e.target.value)}
            placeholder="0.00"
            min={minAmount}
            className="bg-transparent text-white text-size-[16vw] md:text-base lg:text-lg text-right outline-none w-[80vw] md:w-32 lg:w-40"
          />
        </div>
      </div>

      {/* 确认按钮 */}
      <button
        onClick={onConfirm}
        disabled={isConfirmDisabled}
        className={`w-full h-[50vw] md:h-12 lg:h-14 mt-[20vw] md:mt-5 lg:mt-6 rounded-[12vw] md:rounded-lg lg:rounded-xl text-size-[16vw] md:text-base lg:text-lg font-medium transition-all ${
          isConfirmDisabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:opacity-80 cursor-pointer'
        }`}
        style={{
          backgroundColor: isConfirmDisabled ? '#3d3d3d' : '#1D202F',
          borderColor: isConfirmDisabled ? 'transparent' : '#282B39',
          borderWidth: '1px',
          color: isConfirmDisabled ? '#8f8f8f' : '#5671FB'
        }}
      >
        {t('exchange.confirm_withdraw')}
      </button>
    </div>
  );
};

const Withdraw = () => {
  const { t } = useTranslation();

  // 设置页面标题
  usePageTitle('exchange');

  // 验证余额是否足够的辅助函数
  const validateBalance = (fromToken, requiredAmount, balances, showToast = true) => {
    const availableBalance = balances[fromToken] || 0;
    const isValid = requiredAmount <= availableBalance;

    if (!isValid && showToast && requiredAmount > 0) {
      toast.error(t('exchange.insufficient_balance') + ` (${fromToken}: ${availableBalance.toLocaleString()})`);
    }

    return isValid;
  };

  // 模拟余额刷新函数
  const refreshBalances = async () => {
    setIsRefreshing(true);

    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 模拟获取新的余额数据
      const newBalances = {
        ...balances,
        Rocket: Math.max(0, balances.Rocket - (parseFloat(withdrawAmount) || 0)), // 减少平台余额
        RocketWallet: balances.RocketWallet + (parseFloat(withdrawAmount) || 0) // 增加钱包余额
      };

      setBalances(newBalances);
    } catch (error) {
      console.error('刷新余额失败:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 提现状态
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const minWithdrawAmount = 1;

  // 余额状态管理
  const [balances, setBalances] = useState({
    USDR: 1235.00,
    USDT: 235.00,
    Fiat: 10000.00, // 法币余额
    Rocket: 1500.00, // Rocket平台余额
    RocketWallet: 850.00 // Rocket Web3钱包余额
  });

  // 余额刷新状态
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 处理提现金额变化
  const handleWithdrawAmountChange = (value) => {
    const numValue = parseFloat(value) || 0;

    // 验证最小金额
    if (value && numValue < minWithdrawAmount) {
      toast.error(`${t('exchange.min_withdraw_amount')}: ${minWithdrawAmount}`);
      return;
    }

    // 验证余额是否足够
    if (value && !validateBalance('Rocket', numValue, balances)) {
      return;
    }

    setWithdrawAmount(value);
  };

  // 处理提现确认
  const handleWithdrawConfirm = async () => {
    if (!withdrawAmount) {
      return;
    }

    const numValue = parseFloat(withdrawAmount);

    // 再次验证
    if (numValue < minWithdrawAmount) {
      toast.error(`${t('exchange.min_withdraw_amount')}: ${minWithdrawAmount}`);
      return;
    }

    if (!validateBalance('Rocket', numValue, balances)) {
      return;
    }

    try {
      // 模拟钱包交互
      console.log('模拟钱包提现:', {
        amount: withdrawAmount,
        from: 'Rocket',
        to: 'USDT'
      });

      // 模拟提现成功
      toast.success(t('exchange.withdraw_success'));

      // 触发余额刷新
      await refreshBalances();

      // 清空输入
      setWithdrawAmount('');

    } catch (error) {
      console.error('提现失败:', error);
      toast.error('提现失败，请重试');
    }
  };

  return (
    <div className="px-[16vw] md:px-6 lg:px-8 pt-[20vw] md:pt-6 lg:pt-8 pb-[24vw] md:pb-8 lg:pb-10 flex flex-col items-center max-w-4xl mx-auto">
      {/* 顶部余额显示 - 更紧凑的设计，添加跳动动画 */}
      <div className="flex items-center gap-[20vw] md:gap-8 lg:gap-10 pb-[32vw] md:pb-8 lg:pb-10 w-[320vw] md:w-96 lg:w-[28rem]">
        <div className="flex flex-col items-center flex-1">
          <span className="text-[#8f8f8f] text-size-[12vw] md:text-xs lg:text-sm">{t('exchange.rocket_platform_balance')}</span>
          <AnimatedAmount
            amount={balances.Rocket}
            fontSize="18vw"
            mdFontSize="md:text-lg lg:text-xl"
            className="text-white"
            isRefreshing={isRefreshing}
          />
        </div>
        <div className="text-[#8f8f8f] text-size-[16vw] md:text-lg lg:text-xl">|</div>
        <div className="flex flex-col items-center flex-1">
          <span className="text-[#8f8f8f] text-size-[12vw] md:text-xs lg:text-sm">{t('exchange.web3_wallet_balance')}</span>
          <AnimatedAmount
            amount={balances.RocketWallet}
            fontSize="18vw"
            mdFontSize="md:text-lg lg:text-xl"
            className="text-white"
            isRefreshing={isRefreshing}
          />
        </div>
      </div>

      {/* 提现卡片 */}
      <WithdrawCard
        title={t('exchange.withdraw_title')}
        withdrawAmount={withdrawAmount}
        onWithdrawAmountChange={handleWithdrawAmountChange}
        onConfirm={handleWithdrawConfirm}
        isConfirmDisabled={!withdrawAmount || parseFloat(withdrawAmount) < minWithdrawAmount}
        balances={balances}
        minAmount={minWithdrawAmount}
        t={t}
      />
    </div>
  );
};

export default Withdraw;
