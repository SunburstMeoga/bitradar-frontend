import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import usePageTitle from '../../hooks/usePageTitle';
import toast from 'react-hot-toast';

// 自定义动画金额组件（借鉴网体详情页面）
const AnimatedAmount = ({ amount, fontSize = '20vw', mdFontSize = 'text-xl', className = 'text-white' }) => {
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
    <span className={`${className} text-size-[${fontSize}] ${mdFontSize} font-semibold`}>
      {integerPart}
      <span className={`text-size-[${smallerFontSize}] text-xs align-baseline`}>
        .{decimalPart}
      </span>
    </span>
  );
};

// 兑换卡片组件
const ExchangeCard = ({
  title,
  activeTab,
  onTabChange,
  tabs,
  fromToken,
  toToken,
  fromAmount,
  onFromAmountChange,
  toAmount,
  onToAmountChange,
  onConfirm,
  isConfirmDisabled,
  balances,
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

      {/* Tab切换 */}
      <div className="relative mb-[20vw] md:mb-5 lg:mb-6">
        <div className="flex gap-[2vw] md:gap-1 lg:gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex-1 py-[12vw] md:py-3 lg:py-4 text-size-[14vw] md:text-sm lg:text-base font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-[#5773FF]'
                  : 'text-[#8f8f8f]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* 滑动横线 */}
        <div
          className="absolute bottom-0 h-[2vw] md:h-0.5 lg:h-1 bg-[#5773FF] transition-all duration-300 ease-in-out"
          style={{
            width: 'calc(50% - 1vw)',
            left: activeTab === tabs[0].key
              ? '0'
              : 'calc(50% + 2vw)'
          }}
        />
      </div>

      {/* 输入区域 */}
      <div className="relative rounded-[12vw] md:rounded-xl lg:rounded-2xl p-[16vw] md:p-4 lg:p-5" >
        {/* From输入框 */}
        <div
          className="flex items-center justify-between p-[16vw] md:p-4 lg:p-5 rounded-[12vw] md:rounded-lg lg:rounded-xl mb-[8vw] md:mb-2 lg:mb-3"
          style={{ backgroundColor: '#171818', border: '1px solid #1B1C1C' }}
        >
          <div className="flex items-center gap-[12vw] md:gap-3 lg:gap-4">
            <span className="text-white text-size-[16vw] md:text-base lg:text-lg">{fromToken}</span>
            {/* 显示余额 */}
            <span className="text-[#8f8f8f] text-size-[12vw] md:text-xs">
              {t('exchange.balance')}: {balances[fromToken]?.toLocaleString() || '0.00'}
            </span>
          </div>
          <input
            type="number"
            value={fromAmount}
            onChange={(e) => onFromAmountChange(e.target.value)}
            placeholder="0.00"
            className="bg-transparent text-white text-size-[16vw] md:text-base lg:text-lg text-right outline-none w-[120vw] md:w-32 lg:w-40"
          />
        </div>

        {/* 中间箭头 */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <div
            className="w-[34vw] md:w-9 lg:w-10 h-[34vw] md:h-9 lg:h-10 rounded-[10vw] md:rounded-lg lg:rounded-xl flex items-center justify-center border-[1vw] md:border lg:border-2"
            style={{
              backgroundColor: '#222525',
              borderColor: '#171818'
            }}
          >
            <svg className="w-[16vw] md:w-4 lg:w-5 h-[16vw] md:h-4 lg:h-5 text-[#8f8f8f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>

        {/* To输入框 */}
        <div
          className="flex items-center justify-between p-[16vw] md:p-4 lg:p-5 rounded-[12vw] md:rounded-lg lg:rounded-xl"
          style={{ backgroundColor: '#171818', border: '1px solid #1B1C1C' }}
        >
          <div className="flex items-center gap-[12vw] md:gap-3 lg:gap-4">
            <span className="text-white text-size-[16vw] md:text-base lg:text-lg">{toToken}</span>
            {/* 显示余额 */}
            <span className="text-[#8f8f8f] text-size-[12vw] md:text-xs">
              {t('exchange.balance')}: {balances[toToken]?.toLocaleString() || '0.00'}
            </span>
          </div>
          <input
            type="number"
            value={toAmount}
            onChange={(e) => onToAmountChange(e.target.value)}
            placeholder="0.00"
            className="bg-transparent text-white text-size-[16vw] md:text-base lg:text-lg text-right outline-none w-[120vw] md:w-32 lg:w-40"
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
        {t('exchange.confirm_swap')}
      </button>
    </div>
  );
};



const Exchange = () => {
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

  // USDR兑换状态
  const [usdrActiveTab, setUsdrActiveTab] = useState('usdt_to_usdr');
  const [usdrFromAmount, setUsdrFromAmount] = useState('');
  const [usdrToAmount, setUsdrToAmount] = useState('');

  // USDT兑换状态
  const [usdtActiveTab, setUsdtActiveTab] = useState('usdr_to_usdt');
  const [usdtFromAmount, setUsdtFromAmount] = useState('');
  const [usdtToAmount, setUsdtToAmount] = useState('');

  // 模拟余额数据
  const balances = {
    USDR: 1235.00,
    USDT: 235.00,
    Fiat: 10000.00 // 法币余额
  };

  // 模拟兑换比例（实际应该从API获取）
  const exchangeRates = {
    'USDT_to_USDR': 1.0,
    'USDR_to_USDT': 1.0,
    'Fiat_to_USDR': 0.1,
    'USDR_to_Fiat': 10.0,
    'Fiat_to_USDT': 0.1,
    'USDT_to_Fiat': 10.0
  };

  // USDR兑换相关函数
  const handleUsdrTabChange = (tab) => {
    setUsdrActiveTab(tab);
    setUsdrFromAmount('');
    setUsdrToAmount('');
  };

  const handleUsdrFromAmountChange = (value) => {
    const numValue = parseFloat(value) || 0;
    const fromToken = usdrActiveTab === 'usdt_to_usdr' ? 'USDT' : 'Fiat';

    // 验证From货币余额是否足够
    if (value && !validateBalance(fromToken, numValue, balances)) {
      return; // 余额不足，不更新状态
    }

    setUsdrFromAmount(value);
    if (value) {
      const rateKey = `${fromToken}_to_USDR`;
      const rate = exchangeRates[rateKey] || 1;
      setUsdrToAmount((numValue * rate).toFixed(2));
    } else {
      setUsdrToAmount('');
    }
  };

  const handleUsdrToAmountChange = (value) => {
    const numValue = parseFloat(value) || 0;
    const fromToken = usdrActiveTab === 'usdt_to_usdr' ? 'USDT' : 'Fiat';
    const rateKey = `${fromToken}_to_USDR`;
    const rate = exchangeRates[rateKey] || 1;
    const requiredFromAmount = numValue / rate;

    // 验证实际需要的From货币余额是否足够
    if (value && !validateBalance(fromToken, requiredFromAmount, balances)) {
      return; // 余额不足，不更新状态
    }

    setUsdrToAmount(value);
    if (value) {
      setUsdrFromAmount(requiredFromAmount.toFixed(2));
    } else {
      setUsdrFromAmount('');
    }
  };

  const handleUsdrSwapConfirm = () => {
    if (!usdrFromAmount) {
      return;
    }

    const fromToken = usdrActiveTab === 'usdt_to_usdr' ? 'USDT' : 'Fiat';
    console.log('USDR Exchange:', {
      from: fromToken,
      to: 'USDR',
      amount: usdrFromAmount
    });

    alert(t('exchange.success_message'));
  };

  // USDT兑换相关函数
  const handleUsdtTabChange = (tab) => {
    setUsdtActiveTab(tab);
    setUsdtFromAmount('');
    setUsdtToAmount('');
  };

  const handleUsdtFromAmountChange = (value) => {
    const numValue = parseFloat(value) || 0;
    const fromToken = usdtActiveTab === 'usdr_to_usdt' ? 'USDR' : 'Fiat';

    // 验证From货币余额是否足够
    if (value && !validateBalance(fromToken, numValue, balances)) {
      return; // 余额不足，不更新状态
    }

    setUsdtFromAmount(value);
    if (value) {
      const rateKey = `${fromToken}_to_USDT`;
      const rate = exchangeRates[rateKey] || 1;
      setUsdtToAmount((numValue * rate).toFixed(2));
    } else {
      setUsdtToAmount('');
    }
  };

  const handleUsdtToAmountChange = (value) => {
    const numValue = parseFloat(value) || 0;
    const fromToken = usdtActiveTab === 'usdr_to_usdt' ? 'USDR' : 'Fiat';
    const rateKey = `${fromToken}_to_USDT`;
    const rate = exchangeRates[rateKey] || 1;
    const requiredFromAmount = numValue / rate;

    // 验证实际需要的From货币余额是否足够
    if (value && !validateBalance(fromToken, requiredFromAmount, balances)) {
      return; // 余额不足，不更新状态
    }

    setUsdtToAmount(value);
    if (value) {
      setUsdtFromAmount(requiredFromAmount.toFixed(2));
    } else {
      setUsdtFromAmount('');
    }
  };

  const handleUsdtSwapConfirm = () => {
    if (!usdtFromAmount) {
      return;
    }

    const fromToken = usdtActiveTab === 'usdr_to_usdt' ? 'USDR' : 'Fiat';
    console.log('USDT Exchange:', {
      from: fromToken,
      to: 'USDT',
      amount: usdtFromAmount
    });

    alert(t('exchange.success_message'));
  };

  // 处理提现USDR
  const handleWithdrawUSDR = () => {
    console.log('Withdraw USDR');
    // 这里可以添加提现逻辑或导航到提现页面
  };

  // 定义USDR兑换的tabs
  const usdrTabs = [
    { key: 'usdt_to_usdr', label: t('exchange.usdt_to_usdr') },
    { key: 'fiat_to_usdr', label: t('exchange.fiat_to_usdr') }
  ];

  // 定义USDT兑换的tabs
  const usdtTabs = [
    { key: 'usdr_to_usdt', label: t('exchange.usdr_to_usdt') },
    { key: 'fiat_to_usdt', label: t('exchange.fiat_to_usdt') }
  ];

  // 获取当前选中的token
  const getUsdrTokens = () => {
    if (usdrActiveTab === 'usdt_to_usdr') {
      return { from: 'USDT', to: 'USDR' };
    }
    return { from: 'Fiat', to: 'USDR' };
  };

  const getUsdtTokens = () => {
    if (usdtActiveTab === 'usdr_to_usdt') {
      return { from: 'USDR', to: 'USDT' };
    }
    return { from: 'Fiat', to: 'USDT' };
  };

  const usdrTokens = getUsdrTokens();
  const usdtTokens = getUsdtTokens();

  return (
    <div className="px-[16vw] md:px-6 lg:px-8 pt-[20vw] md:pt-6 lg:pt-8 pb-[24vw] md:pb-8 lg:pb-10 flex flex-col items-center max-w-4xl mx-auto">
      {/* 顶部余额显示 - 更紧凑的设计，添加跳动动画 */}
      <div className="flex items-center gap-[20vw] md:gap-8 lg:gap-10 pb-[32vw] md:pb-8 lg:pb-10 w-[280vw] md:w-80 lg:w-96">
        <div className="flex flex-col items-center flex-1">
          <span className="text-[#8f8f8f] text-size-[14vw] md:text-sm lg:text-base">USDR</span>
          <AnimatedAmount
            amount={balances.USDR}
            fontSize="20vw"
            mdFontSize="md:text-xl lg:text-2xl"
            className="text-white"
          />
        </div>
        <div className="text-[#8f8f8f] text-size-[16vw] md:text-lg lg:text-xl">|</div>
        <div className="flex flex-col items-center flex-1">
          <span className="text-[#8f8f8f] text-size-[14vw] md:text-sm lg:text-base">USDT</span>
          <AnimatedAmount
            amount={balances.USDT}
            fontSize="20vw"
            mdFontSize="md:text-xl lg:text-2xl"
            className="text-white"
          />
        </div>
      </div>

      {/* USDR兑换卡片 */}
      <ExchangeCard
        title={t('exchange.exchange_usdr_title')}
        activeTab={usdrActiveTab}
        onTabChange={handleUsdrTabChange}
        tabs={usdrTabs}
        fromToken={usdrTokens.from}
        toToken={usdrTokens.to}
        fromAmount={usdrFromAmount}
        onFromAmountChange={handleUsdrFromAmountChange}
        toAmount={usdrToAmount}
        onToAmountChange={handleUsdrToAmountChange}
        onConfirm={handleUsdrSwapConfirm}
        isConfirmDisabled={!usdrFromAmount}
        balances={balances}
        t={t}
      />

      {/* USDT兑换卡片 */}
      <ExchangeCard
        title={t('exchange.exchange_usdt_title')}
        activeTab={usdtActiveTab}
        onTabChange={handleUsdtTabChange}
        tabs={usdtTabs}
        fromToken={usdtTokens.from}
        toToken={usdtTokens.to}
        fromAmount={usdtFromAmount}
        onFromAmountChange={handleUsdtFromAmountChange}
        toAmount={usdtToAmount}
        onToAmountChange={handleUsdtToAmountChange}
        onConfirm={handleUsdtSwapConfirm}
        isConfirmDisabled={!usdtFromAmount}
        balances={balances}
        t={t}
      />

      {/* 提现USDR链接 */}
      <div className="flex justify-center mt-[20vw] md:mt-6 lg:mt-8">
        <button
          onClick={handleWithdrawUSDR}
          className="text-[#5671FB] text-size-[16vw] md:text-base lg:text-lg font-medium hover:opacity-80 transition-opacity"
        >
          {t('exchange.withdraw_usdr')}
        </button>
      </div>
    </div>
  );
};

export default Exchange;
