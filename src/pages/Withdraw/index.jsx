import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import usePageTitle from '../../hooks/usePageTitle';
import toast from 'react-hot-toast';
import { useAuthStore, useUserStore, useWeb3Store } from '../../store';
import { useNavigate } from 'react-router-dom';
import { depositUSDT, getWalletUSDTBalance } from '../../services/vaultService';
import { withdrawalService, userService } from '../../services';
import GlobalConfirmDialog from '../../components/GlobalConfirmDialog';

// 自定义动画金额组件（借鉴网体详情页面）
const AnimatedAmount = ({ amount, fontSize = '20vw', mdFontSize = 'text-xl', mdDecimalFontSize = 'md:text-base lg:text-lg', className = 'text-white', isRefreshing = false }) => {
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
      <span className={`text-size-[${smallerFontSize}] ${mdDecimalFontSize} align-baseline`}>
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

// 兑换卡片组件（复用兑换页UI）
const ExchangeCard = ({ title, rows, onOpenRecords }) => {
  const { t } = useTranslation();
  return (
    <div
      className="w-[360vw] md:w-96 p-[20vw] md:p-5 rounded-[34vw] md:rounded-[34px] mb-[24vw] md:mb-6"
      style={{ backgroundColor: '#121313', border: '1px solid #1F1F1F' }}
    >
      <div className="text-[#9D9D9D] text-size-[16vw] md:text-base lg:text-lg font-medium mb-[16vw] md:mb-4 lg:mb-5 text-center">
        {title}
      </div>

      <div className="space-y-[10vw] md:space-y-3">
        {rows.map((row, idx) => (
          <div key={idx} className="border border-[#1B1C1C] rounded-[12vw] md:rounded-lg lg:rounded-xl p-[12vw] md:p-3 lg:p-4" style={{ backgroundColor: '#171818' }}>
            <div className="flex items-center justify-start mb-[10vw] md:mb-2">
              <span className="text-white text-size-[16vw] md:text-base lg:text-lg">{row.title}</span>
            </div>
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
                disabled={!row.value || row.disabled || row.isLoading}
                className={`px-[12vw] md:px-4 lg:px-5 h-[40vw] md:h-10 lg:h-11 rounded-[10vw] md:rounded-md lg:rounded-lg text-size-[14vw] md:text-sm lg:text-base font-medium ${(!row.value || row.disabled || row.isLoading) ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'}`}
                style={{ backgroundColor: '#1D202F', color: '#5671FB', border: '1px solid #282B39' }}
              >
                {row.isLoading ? (
                  <span className="inline-flex items-center gap-[6vw] md:gap-2">
                    <svg className="w-[14vw] h-[14vw] md:w-4 md:h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>{row.actionLabel}</span>
                  </span>
                ) : (
                  row.actionLabel
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-[12vw] md:mt-3 lg:mt-4">
        <button onClick={onOpenRecords} className="text-[#5671FB] text-size-[14vw] md:text-sm lg:text-sm font-medium hover:opacity-80 transition-opacity underline">
          {t('exchange.records')}
        </button>
      </div>
    </div>
  );
};

// USDT提现卡片，补充显示最小/最大与手续费
const WithdrawCard = ({ title, withdrawAmount, onWithdrawAmountChange, onConfirm, isConfirmDisabled, balances, minAmount, maxAmount, feeRatePercent, isLoading, t }) => {
  return (
    <div
      className="w-[360vw] md:w-96 p-[20vw] md:p-5 rounded-[34vw] md:rounded-[34px] mb-[24vw] md:mb-6"
      style={{ backgroundColor: '#121313', border: '1px solid #1F1F1F' }}
    >
      <div className="text-[#9D9D9D] text-size-[16vw] md:text-base lg:text-lg font-medium mb-[16vw] md:mb-4 lg:mb-5 text-center">
        {title}
      </div>

      {/* 余额 */}
      <div className="mb-[16vw] md:mb-4 lg:mb-5">
        <div className="flex items-center justify-between p-[16vw] md:p-4 lg:p-5 rounded-[12vw] md:rounded-lg lg:rounded-xl" style={{ backgroundColor: '#171818', border: '1px solid #1B1C1C' }}>
          <div className="flex items-center gap-[12vw] md:gap-3">
            <span className="text-[#8f8f8f] text-size-[14vw] md:text-sm">{t('exchange.platform_balance')}:</span>
            <span className="text-white text-size-[16vw] md:text-base font-medium">{(balances.USDT || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 提现上下限（同一行最小/最大，与余额分开显示） */}
      <div className="mb-[12vw] md:mb-3">
        <div className="flex items-center justify-between p-[16vw] md:p-4 lg:p-5 rounded-[12vw] md:rounded-lg lg:rounded-xl" style={{ backgroundColor: '#171818', border: '1px solid #1B1C1C' }}>
          <div className="flex items-center gap-[12vw] md:gap-3">
            <span className="text-[#8f8f8f] text-size-[14vw] md:text-sm">{t('exchange.min_withdraw_amount')}:</span>
            <span className="text-white text-size-[16vw] md:text-base font-medium">{minAmount}</span>
          </div>
          <div className="flex items-center gap-[12vw] md:gap-3">
            <span className="text-[#8f8f8f] text-size-[14vw] md:text-sm">最大提现金额:</span>
            <span className="text-white text-size-[16vw] md:text-base font-medium">{maxAmount > 0 ? maxAmount : '无限制'}</span>
          </div>
        </div>
      </div>

      {/* 手续费显示 */}
      <div className="mb-[12vw] md:mb-3">
        <div className="flex items-center justify-between p-[16vw] md:p-4 lg:p-5 rounded-[12vw] md:rounded-lg lg:rounded-xl" style={{ backgroundColor: '#171818', border: '1px solid #1B1C1C' }}>
          <div className="flex items-center gap-[12vw] md:gap-3">
            <span className="text-[#8f8f8f] text-size-[14vw] md:text-sm">提现手续费:</span>
            <span className="text-white text-size-[16vw] md:text-base font-medium">{feeRatePercent}</span>
          </div>
        </div>
      </div>

      {/* 提现金额输入 */}
      <div className="mb-[16vw] md:mb-4 lg:mb-5">
        <div className="flex items-center justify-between p-[16vw] md:p-4 lg:p-5 rounded-[12vw] md:rounded-lg lg:rounded-xl" style={{ backgroundColor: '#171818', border: '1px solid #1B1C1C' }}>
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

      <button
        onClick={onConfirm}
        disabled={isConfirmDisabled}
        className={`w-full h-[50vw] md:h-12 lg:h-14 mt-[20vw] md:mt-5 lg:mt-6 rounded-[12vw] md:rounded-lg lg:rounded-xl text-size-[16vw] md:text-base lg:text-lg font-medium transition-all ${isConfirmDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'}`}
        style={{ backgroundColor: isConfirmDisabled ? '#3d3d3d' : '#1D202F', borderColor: isConfirmDisabled ? 'transparent' : '#282B39', borderWidth: '1px', color: isConfirmDisabled ? '#8f8f8f' : '#5671FB' }}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            提交中...
          </span>
        ) : (
          t('exchange.confirm_withdraw')
        )}
      </button>
    </div>
  );
};

const Withdraw = () => {
  const { t } = useTranslation();

  // 设置页面标题
  usePageTitle('withdraw');

  // 引入必要的全局状态与路由
  const { isAuthenticated } = useAuthStore();
  const { balance, fetchBalance } = useUserStore();
  const { account } = useWeb3Store();
  const navigate = useNavigate();

  // 封禁弹窗控制
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banInfo, setBanInfo] = useState(null);

  const checkBanStatusBeforeAction = async () => {
    try {
      const res = await userService.getBanStatus();
      const data = res?.data ?? res;
      const isBanned = data?.is_banned === true || data?.status === 'banned';
      if (isBanned) {
        setBanInfo(data);
        setBanDialogOpen(true);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('检查封禁状态失败:', e);
      // 出错时不阻断操作，但建议后续观察日志
      return true;
    }
  };

  const handleContactSupport = async () => {
    const supportUrl = banInfo?.support_url || process.env.REACT_APP_SUPPORT_URL || '/';
    try {
      window.open(supportUrl, '_blank', 'noopener');
    } catch (e) {
      console.warn('打开客服页面失败:', e);
      toast.error(t('common.error'));
    }
  };

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

  // 卡片1：链上USDT ↔ 平台USDT
  const [card1DepositAmount, setCard1DepositAmount] = useState('');
  const [card1WithdrawAmount, setCard1WithdrawAmount] = useState('');
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
  const [card2DepositAmount, setCard2DepositAmount] = useState('');
  const [card2WithdrawAmount, setCard2WithdrawAmount] = useState('');
  const [card2Submitting, setCard2Submitting] = useState(false);

  // 余额展示/校验统一使用状态 balances（在下方 useState 中定义）

  // 卡片1交互
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

  const handleCard1Deposit = async () => {
    if (!card1DepositAmount) return;
    try {
      setCard1Submitting(true);
      await depositUSDT(parseFloat(card1DepositAmount));
      toast.success(t('exchange.deposit_success'));
      setCard1DepositAmount('');
      fetchBalance().catch(() => {});
    } catch (err) {
      console.error(err);
      toast.error(err?.message || t('exchange.tx_failed'));
    } finally {
      setCard1Submitting(false);
    }
  };

  const handleCard1Withdraw = async () => {
    if (!card1WithdrawAmount) return;
    const canProceed = await checkBanStatusBeforeAction();
    if (!canProceed) return;
    if (!isAuthenticated) {
      toast.error('请先登录');
      return;
    }
    if (!account) {
      toast.error('请先连接钱包');
      return;
    }

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

  // 卡片2交互
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
    setCard2Submitting(true);
    try {
      toast.success(t('exchange.fiat_exchange_request_submitted'));
      setCard2DepositAmount('');
    } finally {
      setCard2Submitting(false);
    }
  };

  const handleCard2Withdraw = async () => {
    if (!card2WithdrawAmount) return;
    const canProceed = await checkBanStatusBeforeAction();
    if (!canProceed) return;
    setCard2Submitting(true);
    try {
      toast.success(t('exchange.fiat_withdraw_request_submitted'));
      setCard2WithdrawAmount('');
    } finally {
      setCard2Submitting(false);
    }
  };

  // 行标签配置
  const card1Rows = [
    {
      title: t('exchange.usdt_deposit', { defaultValue: 'USDT充值' }),
      value: card1DepositAmount,
      onChange: handleCard1DepositChange,
      placeholder: t('exchange.enter_exchange_amount'),
      actionLabel: t('exchange.exchange'),
      onAction: handleCard1Deposit,
      disabled: card1Submitting,
      isLoading: card1Submitting
    },
    {
      title: t('exchange.usdt_withdraw', { defaultValue: 'USDT提现' }),
      value: card1WithdrawAmount,
      onChange: handleCard1WithdrawChange,
      placeholder: t('exchange.enter_withdraw_amount'),
      actionLabel: t('exchange.withdraw'),
      onAction: handleCard1Withdraw,
      disabled: card1Submitting,
      isLoading: card1Submitting
    }
  ];

  const card2Rows = [
    {
      title: t('exchange.fiat_deposit', { defaultValue: '充值' }),
      value: card2DepositAmount,
      onChange: handleCard2DepositChange,
      placeholder: t('exchange.enter_exchange_amount'),
      actionLabel: t('exchange.exchange'),
      onAction: handleCard2Deposit,
      disabled: card2Submitting,
      isLoading: card2Submitting
    },
    {
      title: t('exchange.fiat_withdraw', { defaultValue: '提现' }),
      value: card2WithdrawAmount,
      onChange: handleCard2WithdrawChange,
      placeholder: t('exchange.enter_withdraw_amount'),
      actionLabel: t('exchange.withdraw'),
      onAction: handleCard2Withdraw,
      disabled: card2Submitting,
      isLoading: card2Submitting
    }
  ];

  // 提现状态
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const minWithdrawAmount = 1;

  // 余额状态管理
  const [balances, setBalances] = useState({
    USDR: 1235.00,
    USDT: usdtTopBalance,
    Fiat: 10000.00, // 法币余额
    Rocket: 1500.00, // Rocket平台余额
    RocketWallet: 850.00 // Rocket Web3钱包余额
  });

  // 同步顶部 USDT 余额到状态 balances
  useEffect(() => {
    setBalances(prev => ({ ...prev, USDT: usdtTopBalance }));
  }, [usdtTopBalance]);

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

  // 刷新余额（用于提现确认后刷新展示）
  const refreshBalances = async () => {
    setIsRefreshing(true);
    try {
      await fetchBalance().catch(() => {});
      const nextUsdt = getUSDTBalance();
      setBalances(prev => ({ ...prev, USDT: nextUsdt }));
    } catch (err) {
      console.warn('刷新余额失败:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 300);
    }
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
      {/* 顶部余额显示 - USDT 平台与链上 */}
      <div className="flex items-center justify-center pb-[32vw] md:pb-8 lg:pb-10 w-[320vw] md:w-[28rem]">
        <div className="flex flex-col items-center gap-[8vw] md:gap-2">
          <span className="text-[#8f8f8f] text-size-[16vw] md:text-lg lg:text-xl">USDT</span>
          <div className="flex items-center justify-center gap-[12vw] md:gap-6">
            <div className="flex items-baseline gap-[6vw] md:gap-2">
              <span className="text-[#9D9D9D] text-size-[14vw] md:text-sm">{t('exchange.platform')}</span>
              <AnimatedAmount amount={usdtTopBalance} fontSize="28vw" mdFontSize="md:text-3xl lg:text-4xl" mdDecimalFontSize="md:text-xl lg:text-2xl" className="text-white" />
            </div>
            <div className="w-[1vw] md:w-px lg:w-px" style={{ backgroundColor: '#1F1F1F' }}>
              <span className="sr-only">divider</span>
            </div>
            <div className="flex items-baseline gap-[6vw] md:gap-2">
              <span className="text-[#9D9D9D] text-size-[14vw] md:text-sm">{t('exchange.onchain')}</span>
              <AnimatedAmount amount={walletUsdtBalance} fontSize="24vw" mdFontSize="md:text-2xl lg:text-3xl" mdDecimalFontSize="md:text-lg lg:text-xl" className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* 卡片1：链上USDT ↔ 平台USDT */}
      <ExchangeCard title={t('exchange.chain_platform_title')} rows={card1Rows} onOpenRecords={() => navigate('/token-history?token_symbol=USDT&transaction_type=all')} />

      {/* 卡片2：法币 ↔ 平台USDT */}
      <ExchangeCard title={t('exchange.fiat_platform_title')} rows={card2Rows} onOpenRecords={() => navigate('/token-history')} />

      <GlobalConfirmDialog
        isOpen={banDialogOpen}
        onClose={() => setBanDialogOpen(false)}
        title={t('ban_modal.title', { defaultValue: '账户已限制' })}
        content={t('ban_modal.description', { defaultValue: '您的账户已被限制，请联系客服获取帮助。' })}
        confirmText={t('ban_modal.contact_support', { defaultValue: '联系客服' })}
        cancelText={t('ban_modal.dismiss', { defaultValue: '关闭' })}
        handleConfirm={handleContactSupport}
        handleCancel={() => {}}
      />
    </div>
  );
};

export default Withdraw;
