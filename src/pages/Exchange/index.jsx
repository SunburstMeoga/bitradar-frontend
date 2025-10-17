import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import usePageTitle from '../../hooks/usePageTitle';
import toast from 'react-hot-toast';
import { useAuthStore, useUserStore, useWeb3Store } from '../../store';
import { useNavigate } from 'react-router-dom';
import { depositUSDT, getWalletUSDTBalance } from '../../services/vaultService';
import { withdrawalService } from '../../services';

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
      <span className={`text-size-[${smallerFontSize}] md:text-base lg:text-lg align-baseline`}>
        .{decimalPart}
      </span>
    </span>
  );
};

// 兑换卡片组件
const ExchangeCard = ({
  title,
  rows,
  onOpenRecords
}) => {
  const { t } = useTranslation();
  return (
    <div
      className="w-[360vw] md:w-96 p-[20vw] md:p-5 rounded-[34vw] md:rounded-[34px] mb-[24vw] md:mb-6"
      style={{ backgroundColor: '#121313', border: '1px solid #1F1F1F' }}
    >
      <div className="text-[#9D9D9D] text-size-[16vw] md:text-base lg:text-lg font-medium mb-[16vw] md:mb-4 lg:mb-5 text-center">
        {title}
      </div>

      {/* 两行布局 */}
      <div className="space-y-[10vw] md:space-y-3">
        {rows.map((row, idx) => (
          <div key={idx} className="border border-[#1B1C1C] rounded-[12vw] md:rounded-lg lg:rounded-xl p-[12vw] md:p-3 lg:p-4" style={{ backgroundColor: '#171818' }}>
            {/* 行标题：优先显示自定义标题，否则显示左右箭头 */}
            {row.title ? (
              <div className="flex items-center justify-start mb-[10vw] md:mb-2">
                <span className="text-white text-size-[16vw] md:text-base lg:text-lg">{row.title}</span>
              </div>
            ) : (
              <div className="flex items-center justify-start gap-[8vw] md:gap-2 lg:gap-3 mb-[10vw] md:mb-2">
                <span className="text-white text-size-[16vw] md:text-base lg:text-lg">{row.leftLabel}</span>
                <span className="text-[#8f8f8f]">→</span>
                <span className="text-white text-size-[16vw] md:text-base lg:text-lg">{row.rightLabel}</span>
              </div>
            )}

            {/* 输入与按钮 */}
            <div className="flex items-center gap-[10vw] md:gap-3">
              <input
                type="text"
                inputMode="decimal"
                pattern="^[0-9]*[.,]?[0-9]*$"
                value={row.value}
                onChange={(e) => row.onChange(e.target.value)}
                placeholder={row.placeholder}
                className="flex-1 min-w-0 bg-transparent text-white text-size-[16vw] md:text-base lg:text-lg outline-none border border-[#1B1C1C] rounded-[10vw] md:rounded-md lg:rounded-lg p-[10vw] md:p-2 lg:p-3"
              />
              <button
                onClick={row.onAction}
                disabled={!row.value || row.disabled}
                className={`px-[12vw] md:px-4 lg:px-5 h-[40vw] md:h-10 lg:h-11 rounded-[10vw] md:rounded-md lg:rounded-lg text-size-[14vw] md:text-sm lg:text-base font-medium ${(!row.value || row.disabled) ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'}`}
                style={{ backgroundColor: '#1D202F', color: '#5671FB', border: '1px solid #282B39' }}
              >
                {row.actionLabel}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 兑换记录入口（保留下划线样式） */}
      <div className="flex justify-center mt-[12vw] md:mt-3 lg:mt-4">
        <button onClick={onOpenRecords} className="text-[#5671FB] text-size-[14vw] md:text-sm lg:text-sm font-medium hover:opacity-80 transition-opacity underline">
          {t('exchange.records')}
        </button>
      </div>
    </div>
  );
};



const Exchange = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const { balance, fetchBalance } = useUserStore();
  const { account, isConnected } = useWeb3Store();
  const navigate = useNavigate();

  // 设置页面标题
  usePageTitle('exchange');

  // 顶部 USDT 余额：从已集成的余额接口中获取
  const getUSDTBalance = () => {
    if (!balance) return 0;
    if (balance.balanceMap && balance.balanceMap['USDT']) {
      const b = balance.balanceMap['USDT'];
      return parseFloat(b.total || b.available || 0);
    }
    if (balance.usdt_balance !== undefined) {
      return parseFloat(balance.usdt_balance || 0);
    }
    return 0;
  };

  const usdtTopBalance = getUSDTBalance();

  useEffect(() => {
    if (isAuthenticated) {
      fetchBalance().catch(err => console.error('获取余额失败:', err));
    }
  }, [isAuthenticated, fetchBalance]);

  // 验证余额是否足够的辅助函数
  const validateBalance = (fromToken, requiredAmount, balances, showToast = true) => {
    const availableBalance = balances[fromToken] || 0;
    const isValid = requiredAmount <= availableBalance;

    if (!isValid && showToast && requiredAmount > 0) {
      toast.error(t('exchange.insufficient_balance') + ` (${fromToken}: ${availableBalance.toLocaleString()})`);
    }

    return isValid;
  };

  // 卡片1：链上USDT ↔ 平台USDT（两行输入）
  const [card1DepositAmount, setCard1DepositAmount] = useState(''); // 链上USDT -> 平台USDT
  const [card1WithdrawAmount, setCard1WithdrawAmount] = useState(''); // 平台USDT -> 链上USDT
  const [card1Submitting, setCard1Submitting] = useState(false);
  const [walletUsdtBalance, setWalletUsdtBalance] = useState(0);
  const [withdrawalSettings, setWithdrawalSettings] = useState(null);

  // 钱包USDT余额读取与监听
  useEffect(() => {
    let mounted = true;
    const loadBalance = async () => {
      try {
        if (!window.ethereum) return;
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const addr = accounts && accounts[0];
        if (!addr) {
          if (mounted) setWalletUsdtBalance(0);
          return;
        }
        const bal = await getWalletUSDTBalance(addr);
        if (mounted) setWalletUsdtBalance(Number(bal || 0));
      } catch (err) {
        console.warn('读取链上USDT余额失败:', err);
      }
    };
    loadBalance();

    const handleAccountsChanged = async (accounts) => {
      if (!mounted) return;
      if (accounts && accounts[0]) {
        try {
          const bal = await getWalletUSDTBalance(accounts[0]);
          setWalletUsdtBalance(Number(bal || 0));
        } catch (err) {
          console.warn('账户变化后读取余额失败:', err);
        }
      } else {
        setWalletUsdtBalance(0);
      }
    };
    const handleChainChanged = async () => {
      // 等待网络切换稳定
      setTimeout(loadBalance, 500);
    };
    window.ethereum?.on('accountsChanged', handleAccountsChanged);
    window.ethereum?.on('chainChanged', handleChainChanged);
    return () => {
      mounted = false;
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  // 获取提现设置（登录后）
  useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;
    withdrawalService.getSettings()
      .then(res => {
        if (!mounted) return;
        if (res?.success) setWithdrawalSettings(res.data || []);
      })
      .catch(err => console.error('获取提现设置失败:', err));
    return () => { mounted = false; };
  }, [isAuthenticated]);

  // 卡片2：法币 ↔ 平台USDT
  const [card2Top, setCard2Top] = useState('FIAT'); // FIAT | PLATFORM_USDT
  const [card2FromAmount, setCard2FromAmount] = useState('');
  const [card2ToAmount, setCard2ToAmount] = useState('');

  // 模拟余额数据（卡片内部使用的展示值，顶部 USDT 使用真实接口值）
  const balances = {
    USDR: 0,
    USDT: usdtTopBalance,
    Fiat: 10000.00 // 法币余额（示例）
  };

  // 兑换比例（示例）
  const exchangeRates = {
    'FIAT_to_PLATFORM_USDT': 0.1,
    'PLATFORM_USDT_to_FIAT': 10.0
  };

  // 卡片1交互：分别处理两行
  const handleCard1DepositChange = (value) => {
    const numValue = parseFloat(value) || 0;
    if (value && !validateBalance(t('exchange.onchain_usdt'), numValue, { [t('exchange.onchain_usdt')]: walletUsdtBalance })) {
      return;
    }
    setCard1DepositAmount(value);
  };

  const handleCard1WithdrawChange = (value) => {
    const numValue = parseFloat(value) || 0;
    if (value && !validateBalance(t('exchange.platform_usdt'), numValue, { [t('exchange.platform_usdt')]: balances.USDT })) {
      return;
    }
    setCard1WithdrawAmount(value);
  };

  // 移除双向绑定计算，改为独立输入

  const handleCard1Deposit = async () => {
    if (!card1DepositAmount) return;
    try {
      setCard1Submitting(true);
      await depositUSDT(parseFloat(card1DepositAmount));
      toast.success(t('exchange.deposit_success'));
      setCard1DepositAmount('');
    } catch (err) {
      console.error(err);
      toast.error(err?.message || t('exchange.tx_failed'));
    } finally {
      setCard1Submitting(false);
    }
  };

  const handleCard1Withdraw = async () => {
    if (!card1WithdrawAmount) return;
    if (!isAuthenticated) {
      toast.error('请先登录');
      return;
    }
    if (!account) {
      toast.error('请先连接钱包');
      return;
    }

    // 校验最小金额（如果配置存在）
    const usdtSetting = (withdrawalSettings || []).find(s => s.token_symbol === 'USDT');
    const minAmt = usdtSetting ? parseFloat(usdtSetting.min_withdrawal_amount || '0') : 0;
    const numAmt = parseFloat(card1WithdrawAmount);
    if (usdtSetting && Number.isFinite(numAmt) && numAmt < minAmt) {
      toast.error(`提现金额必须大于等于 ${minAmt} USDT`);
      return;
    }

    try {
      setCard1Submitting(true);
      const res = await withdrawalService.createWithdrawal({
        token_symbol: 'USDT',
        amount: String(card1WithdrawAmount),
        to_address: account,
      });
      if (res?.success) {
        toast.success(t('exchange.withdraw_tx_submitted'));
        setCard1WithdrawAmount('');
        // 刷新余额
        fetchBalance().catch(() => {});
      } else {
        const msg = res?.message || t('exchange.tx_failed');
        toast.error(msg);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || t('exchange.tx_failed');
      toast.error(msg);
    } finally {
      setCard1Submitting(false);
    }
  };

  // 卡片2交互：两行输入

  const [card2DepositAmount, setCard2DepositAmount] = useState(''); // 法币 -> 平台USDT
  const [card2WithdrawAmount, setCard2WithdrawAmount] = useState(''); // 平台USDT -> 法币

  const handleCard2DepositChange = (value) => {
    const numValue = parseFloat(value) || 0;
    if (value && !validateBalance(t('exchange.fiat'), numValue, { [t('exchange.fiat')]: balances.Fiat })) {
      return;
    }
    setCard2DepositAmount(value);
  };

  const handleCard2WithdrawChange = (value) => {
    const numValue = parseFloat(value) || 0;
    if (value && !validateBalance(t('exchange.platform_usdt'), numValue, { [t('exchange.platform_usdt')]: balances.USDT })) {
      return;
    }
    setCard2WithdrawAmount(value);
  };

  const handleCard2Deposit = () => {
    if (!card2DepositAmount) return;
    // TODO: 接入法币兑换API
    toast.success(t('exchange.fiat_exchange_request_submitted'));
    setCard2DepositAmount('');
  };

  const handleCard2Withdraw = () => {
    if (!card2WithdrawAmount) return;
    // TODO: 接入法币提现API
    toast.success(t('exchange.fiat_withdraw_request_submitted'));
    setCard2WithdrawAmount('');
  };

  // 处理提现USDR
  const handleWithdrawUSDR = () => {
    console.log('Withdraw USDR');
    // 这里可以添加提现逻辑或导航到提现页面
  };

  // 行标签
  const card1Rows = [
    {
      title: t('exchange.usdt_deposit', { defaultValue: 'USDT充值' }),
      value: card1DepositAmount,
      onChange: handleCard1DepositChange,
      placeholder: t('exchange.enter_exchange_amount'),
      actionLabel: t('exchange.exchange'),
      onAction: handleCard1Deposit,
      disabled: card1Submitting
    },
    {
      title: t('exchange.usdt_withdraw', { defaultValue: 'USDT提现' }),
      value: card1WithdrawAmount,
      onChange: handleCard1WithdrawChange,
      placeholder: t('exchange.enter_withdraw_amount'),
      actionLabel: t('exchange.withdraw'),
      onAction: handleCard1Withdraw,
      disabled: card1Submitting
    }
  ];

  const card2Rows = [
    {
      title: t('exchange.fiat_deposit', { defaultValue: '充值' }),
      value: card2DepositAmount,
      onChange: handleCard2DepositChange,
      placeholder: t('exchange.enter_exchange_amount'),
      actionLabel: t('exchange.exchange'),
      onAction: handleCard2Deposit
    },
    {
      title: t('exchange.fiat_withdraw', { defaultValue: '提现' }),
      value: card2WithdrawAmount,
      onChange: handleCard2WithdrawChange,
      placeholder: t('exchange.enter_withdraw_amount'),
      actionLabel: t('exchange.withdraw'),
      onAction: handleCard2Withdraw
    }
  ];

  return (
    <div className="px-[16vw] md:px-6 lg:px-8 pt-[20vw] md:pt-6 lg:pt-8 pb-[24vw] md:pb-8 lg:pb-10 flex flex-col items-center max-w-4xl mx-auto">
      {/* 顶部余额显示 - 两种 USDT 同行展示，淡色竖杠分隔 */}
      <div className="flex items-center justify-center pb-[32vw] md:pb-8 lg:pb-10 w-[320vw] md:w-[28rem]">
        <div className="flex flex-col items-center gap-[8vw] md:gap-2">
          <span className="text-[#8f8f8f] text-size-[16vw] md:text-lg lg:text-xl">USDT</span>
          <div className="flex items-center justify-center gap-[12vw] md:gap-6">
            {/* 平台USDT */}
            <div className="flex items-baseline gap-[6vw] md:gap-2">
              <span className="text-[#9D9D9D] text-size-[14vw] md:text-sm">{t('exchange.platform')}</span>
              <AnimatedAmount
                amount={usdtTopBalance}
                fontSize="28vw"
                mdFontSize="md:text-3xl lg:text-4xl"
                className="text-white"
              />
            </div>
            {/* 竖杠分隔，颜色与卡片边框保持一致 */}
            <div className="w-[1vw] md:w-px lg:w-px" style={{ backgroundColor: '#1F1F1F' }}>
              <span className="sr-only">divider</span>
            </div>
            {/* 链上USDT */}
            <div className="flex items-baseline gap-[6vw] md:gap-2">
              <span className="text-[#9D9D9D] text-size-[14vw] md:text-sm">{t('exchange.onchain')}</span>
              <AnimatedAmount
                amount={walletUsdtBalance}
                fontSize="24vw"
                mdFontSize="md:text-2xl lg:text-3xl"
                className="text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 卡片1：链上USDT ↔ 平台USDT */}
      <ExchangeCard
        title={t('exchange.chain_platform_title')}
        rows={card1Rows}
        onOpenRecords={() => navigate('/token-history')}
      />

      {/* 卡片2：法币 ↔ 平台USDT */}
      <ExchangeCard
        title={t('exchange.fiat_platform_title')}
        rows={card2Rows}
        onOpenRecords={() => navigate('/token-history')}
      />

      {/* 提现USDR入口已不需要，改为每个卡片下的“兑换记录”入口 */}
    </div>
  );
};

export default Exchange;
