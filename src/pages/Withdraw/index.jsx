import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import usePageTitle from '../../hooks/usePageTitle';
import toast from 'react-hot-toast';
import { useAuthStore, useUserStore, useWeb3Store } from '../../store';
import { useNavigate } from 'react-router-dom';
import { depositUSDT, getWalletUSDTBalance } from '../../services/vaultService';
import { withdrawalService, userService, paymentService } from '../../services';
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
const ExchangeCard = ({ title, rows, onOpenRecords,buttonText = t('exchange.records')  }) => {
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
            {row.extraTop && (
              <div className="mb-[10vw] md:mb-2">{row.extraTop}</div>
            )}
            <div className="flex items-center gap-[10vw] md:gap-3">
              <input
                type="number"
                min={0}
                step={1}
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
            {row.extraBottom && (
              <div className="mt-[10vw] md:mt-2">{row.extraBottom}</div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-[12vw] md:mt-3 lg:mt-4">
        <button onClick={onOpenRecords} className="text-[#5671FB] text-size-[14vw] md:text-sm lg:text-sm font-medium hover:opacity-80 transition-opacity underline">
          {buttonText}
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
            <span className="text-[#8f8f8f] text-size-[14vw] md:text-sm">{t('exchange.max_withdraw_amount')}:</span>
            <span className="text-white text-size-[16vw] md:text-base font-medium">{maxAmount > 0 ? maxAmount : t('common.unlimited')}</span>
          </div>
        </div>
      </div>

      {/* 手续费显示 */}
      <div className="mb-[12vw] md:mb-3">
        <div className="flex items-center justify-between p-[16vw] md:p-4 lg:p-5 rounded-[12vw] md:rounded-lg lg:rounded-xl" style={{ backgroundColor: '#171818', border: '1px solid #1B1C1C' }}>
          <div className="flex items-center gap-[12vw] md:gap-3">
            <span className="text-[#8f8f8f] text-size-[14vw] md:text-sm">{t('exchange.withdraw_fee_label')}:</span>
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
            {t('common.submitting')}
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
  const [fiatChannels, setFiatChannels] = useState([]);
  const [selectedFiatChannelCode, setSelectedFiatChannelCode] = useState('');
  const [fiatRate, setFiatRate] = useState(null);
  const [isFiatChannelOpen, setIsFiatChannelOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentUrlForDialog, setPaymentUrlForDialog] = useState('');
  const [paymentOrderId, setPaymentOrderId] = useState('');
  const [paymentOrderStatus, setPaymentOrderStatus] = useState(''); // PENDING/SUCCESS/FAILED/CANCELLED/EXPIRED
  const pollTimerRef = useRef(null);
  const pollCountRef = useRef(0);

  const isTerminalStatus = (status) => ['SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED'].includes(status);
  const getStatusText = (status) => {
    if (status === 'SUCCESS') return '支付成功';
    if (status === 'FAILED') return '支付失败';
    if (status === 'PENDING') return '待支付';
    if (status === 'CANCELLED' || status === 'EXPIRED') return '支付失败';
    return '待支付';
  };

  const refreshPaymentOrderStatus = async () => {
    if (!paymentOrderId) return;
    try {
      const res = await paymentService.getOrder(paymentOrderId);
      if (res?.success && res.data) {
        const nextStatus = res.data.status;
        setPaymentOrderStatus(nextStatus || 'PENDING');
        if (isTerminalStatus(nextStatus)) {
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
        }
      }
    } catch (err) {
      console.error('刷新订单状态失败:', err);
    }
  };

  useEffect(() => {
    if (isPaymentDialogOpen && paymentOrderId && !isTerminalStatus(paymentOrderStatus)) {
      pollCountRef.current = 0;
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      pollTimerRef.current = setInterval(async () => {
        try {
          pollCountRef.current += 1;
          const res = await paymentService.getOrder(paymentOrderId);
          if (res?.success && res.data) {
            const nextStatus = res.data.status;
            setPaymentOrderStatus(nextStatus || 'PENDING');
            if (isTerminalStatus(nextStatus)) {
              clearInterval(pollTimerRef.current);
              pollTimerRef.current = null;
            }
          }
        } catch (e) {
          console.error('轮询订单状态失败:', e);
        } finally {
          if (pollCountRef.current >= 72) {
            if (pollTimerRef.current) {
              clearInterval(pollTimerRef.current);
              pollTimerRef.current = null;
            }
          }
        }
      }, 5000);
    }
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [isPaymentDialogOpen, paymentOrderId, paymentOrderStatus]);

  // 加载法币支付渠道（登录后）
  useEffect(() => {
    let mounted = true;
    const loadChannels = async () => {
      try {
        const chRes = await paymentService.getChannels();
        const list = (chRes?.data || []).filter(ch => ch?.is_enabled);
        if (!list.length) return;
        const preferredOrder = ['ALIPAY_H5', 'WECHAT_H5'];
        const defaultCh = list.find(ch => preferredOrder.includes(ch.channel_code)) || list[0];
        if (mounted) {
          setFiatChannels(list);
          setSelectedFiatChannelCode(defaultCh.channel_code);
          // 新接口在顶层返回 exchange_rate，表示 1 CNY = rate USDT
          const rateCandidate = chRes?.exchange_rate;
          setFiatRate(rateCandidate ? parseFloat(rateCandidate) : null);
        }
      } catch (err) {
        console.warn('获取支付渠道失败:', err);
      }
    };
    if (isAuthenticated) { loadChannels(); }
    return () => { mounted = false; };
  }, [isAuthenticated]);

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
      toast.error(t('common.login_required'))
      return;
    }
    if (!account) {
      toast.error(t('common.wallet_connect_required'))
      return;
    }

    const usdtSetting = (withdrawalSettings || []).find(s => s.token_symbol === 'USDT');
    const minAmt = usdtSetting ? parseFloat(usdtSetting.min_withdrawal_amount || '0') : 0;
    const numAmt = parseFloat(card1WithdrawAmount);
    if (usdtSetting && Number.isFinite(numAmt) && numAmt < minAmt) {
      toast.error(`${t('exchange.min_withdraw_amount')}: ${minAmt} USDT`);
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
        setTimeout(() => { fetchBalance().catch(() => {}); }, 2000);
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
    // 仅保留数字，禁止负数与非数字字符（不允许小数点）
    let sanitized = String(value).replace(/\D+/g, '');

    // 根据当前选择的渠道最高限额，限制位数
    const channel = fiatChannels.find(ch => ch.channel_code === selectedFiatChannelCode);
    const maxAmt = channel ? parseFloat(channel.max_amount || '0') : 0;
    if (Number.isFinite(maxAmt) && maxAmt > 0) {
      const maxInt = Math.floor(Math.abs(maxAmt));
      const digitsLimit = String(maxInt).length; // 例如5000 -> 4位；50000 -> 5位
      if (sanitized.length > digitsLimit) {
        sanitized = sanitized.slice(0, digitsLimit);
      }
    }
    setCard2DepositAmount(sanitized);
  };

  const handleCard2WithdrawChange = (value) => {
    const numValue = parseFloat(value) || 0;
    if (value && !validateBalance(t('exchange.platform_usdt'), numValue, { [t('exchange.platform_usdt')]: balances.USDT })) {
      return;
    }
    setCard2WithdrawAmount(value);
  };

  const handleCard2Deposit = async () => {
    if (!card2DepositAmount) return;
    if (!isAuthenticated) {
      toast.error(t('common.login_required'));
      return;
    }

    setCard2Submitting(true);
    try {
      // 使用已加载的渠道与当前选择
      let selectedChannel = fiatChannels.find(ch => ch.channel_code === selectedFiatChannelCode);
      if (!selectedChannel) {
        const preferredOrder = ['ALIPAY_H5', 'WECHAT_H5'];
        selectedChannel = fiatChannels.find(ch => preferredOrder.includes(ch.channel_code)) || fiatChannels[0];
      }
      if (!selectedChannel) {
        toast.error(t('common.error'));
        return;
      }

      // 2) 校验金额范围（CNY）
      const cnyStr = String(card2DepositAmount);
      const cnyNum = parseFloat(cnyStr);
      const minAmt = parseFloat(selectedChannel.min_amount || '0');
      const maxAmt = parseFloat(selectedChannel.max_amount || '0');
      if (!Number.isFinite(cnyNum) || cnyNum <= 0) {
        toast.error(t('exchange.enter_exchange_amount'));
        return;
      }
      if (cnyNum < minAmt) {
        toast.error(`${t('exchange.min_deposit_amount')}: ${minAmt} CNY`);
        return;
      }
      if (maxAmt > 0 && cnyNum > maxAmt) {
        toast.error(`${t('exchange.max_deposit_amount')}: ${maxAmt} CNY`);
        return;
      }

      // 3) 创建订单
      const orderRes = await paymentService.createOrder({
        channel_code: selectedChannel.channel_code,
        cny_amount: cnyStr,
      });

      if (orderRes?.success) {
        const data = orderRes.data;
        const url = data?.payment_url || data?.pay_url;
        const merOrderTid = data?.mer_order_tid || data?.order_id || '';
        if (url) {
          // 弹出确认对话框，点击确认再打开链接
          setPaymentUrlForDialog(url);
          setIsPaymentDialogOpen(true);
        }
        if (merOrderTid) {
          setPaymentOrderId(merOrderTid);
          setPaymentOrderStatus(data?.status || 'PENDING');
        }
        
        // 展示汇率与预期获得USDT
        if (data?.exchange_rate && data?.usdt_amount) {
          toast.success(`¥${cnyStr} → ${data.usdt_amount} USDT @ ${data.exchange_rate}`);
          setFiatRate(parseFloat(data.exchange_rate));
        } else {
          toast.success(orderRes?.message || t('exchange.deposit_success'));
        }

        // 清空输入并刷新余额
        setCard2DepositAmount('');
        setTimeout(() => { fetchBalance().catch(() => {}); }, 1500);
      } else {
        const msg = orderRes?.message || t('common.error');
        toast.error(msg);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || t('common.error');
      toast.error(msg);
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
      title: t('exchange.usdt_deposit'),
      value: card1DepositAmount,
      onChange: handleCard1DepositChange,
      placeholder: t('exchange.enter_exchange_amount'),
      actionLabel: t('exchange.exchange'),
      onAction: handleCard1Deposit,
      disabled: card1Submitting,
      isLoading: card1Submitting
    },
    {
      title: t('exchange.usdt_withdraw'),
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
      title: t('exchange.fiat_deposit'),
      value: card2DepositAmount,
      onChange: handleCard2DepositChange,
      placeholder: t('exchange.enter_exchange_amount'),
      actionLabel: t('exchange.exchange'),
      onAction: handleCard2Deposit,
      disabled: card2Submitting,
      isLoading: card2Submitting,
      extraTop: (
        <div className="flex flex-col gap-[10vw] md:gap-3">
          {/* 渠道选择（美化下拉）与限额同一行显示 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFiatChannelOpen(v => !v)}
              className="w-full flex items-center justify-between px-[12vw] md:px-3 py-[8vw] md:py-2 rounded-[12vw] md:rounded-lg border border-[#282B39]"
              style={{ backgroundColor: '#1B1C1C' }}
            >
              <span className="inline-flex items-center gap-[6vw] md:gap-2">
                <span className="w-[10vw] h-[10vw] md:w-3 md:h-3 rounded-full" style={{ backgroundColor: (selectedFiatChannelCode || '').includes('ALIPAY') ? '#00A3EE' : '#22C55E' }}></span>
                <span className="text-white text-size-[12vw] md:text-xs">
                  {(() => {
                    const ch = fiatChannels.find(c => c.channel_code === selectedFiatChannelCode);
                    return ch?.name || (selectedFiatChannelCode || '').replace('_H5','');
                  })()}
                </span>
              </span>
              <span className="text-[#9D9D9D]">▾</span>
            </button>
            {isFiatChannelOpen && (
              <div className="absolute left-0 right-0 mt-[6vw] md:mt-2 rounded-[12vw] md:rounded-lg border border-[#313445] shadow-lg" style={{ backgroundColor: '#1B1C1C', zIndex: 10 }}>
                <div className="max-h-[200px] overflow-auto">
                  {fiatChannels.map(ch => (
                    <div
                      key={ch.channel_code}
                    onClick={() => {
                      setSelectedFiatChannelCode(ch.channel_code);
                      setIsFiatChannelOpen(false);
                    }}
                    className="px-[12vw] md:px-3 py-[8vw] md:py-2 hover:bg-[#2A2B2C] cursor-pointer flex items-center justify-between"
                  >
                      <div className="flex items-center gap-[6vw] md:gap-2">
                        <span className="w-[10vw] h-[10vw] md:w-3 md:h-3 rounded-full" style={{ backgroundColor: (ch.channel_code || '').includes('ALIPAY') ? '#00A3EE' : '#22C55E' }}></span>
                        <span className="text-white text-size-[12vw] md:text-xs">{ch.name || ch.channel_code.replace('_H5','')}</span>
                      </div>
                      {selectedFiatChannelCode === ch.channel_code && (
                        <span className="text-[#5671FB] text-size-[12vw] md:text-xs">✓</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* 限额同一行显示：限额：￥min - ￥max */}
          {(() => {
            const ch = fiatChannels.find(c => c.channel_code === selectedFiatChannelCode);
            const minAmt = ch ? parseFloat(ch.min_amount || '0') : 0;
            const maxAmt = ch ? parseFloat(ch.max_amount || '0') : 0;
            const maxText = maxAmt > 0 ? `${maxAmt}` : '无限制';
            return (
              <div className="text-[#8f8f8f] text-size-[12vw] md:text-xs">限额：￥{minAmt} - ￥{maxText}</div>
            );
          })()}
        </div>
      ),
      extraBottom: (
        <div className="flex items-center justify-between">
          <div className="text-[#8f8f8f] text-size-[12vw] md:text-xs">
            <span>{t('exchange.cny_to_usdt_prefix')} </span>
            <span className="text-white">{fiatRate ? `${fiatRate}` : '—'}</span>
            <span> {t('exchange.usdt_suffix')}</span>
          </div>
          <div className="text-[#8f8f8f] text-size-[12vw] md:text-xs">
            {(() => {
              const cnyNum = parseFloat(card2DepositAmount || '0');
              const rateNum = parseFloat(fiatRate || '0');
              // 新汇率含义：1 CNY = rate USDT，因此预计USDT = CNY * rate
              const usd = rateNum > 0 && cnyNum > 0 ? (cnyNum * rateNum) : null;
              return (
                <span>
                  {t('exchange.estimated_received')}: <span className="text-white">{usd ? usd.toFixed(2) : '—'}</span>
                </span>
              );
            })()}
          </div>
        </div>
      )
    },
    // {
    //   title: t('exchange.fiat_withdraw'),
    //   value: card2WithdrawAmount,
    //   onChange: handleCard2WithdrawChange,
    //   placeholder: t('exchange.enter_withdraw_amount'),
    //   actionLabel: t('exchange.withdraw'),
    //   onAction: handleCard2Withdraw,
    //   disabled: card2Submitting,
    //   isLoading: card2Submitting
    // }
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
      toast.error(t('exchange.withdraw_failed_retry'));
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
      <ExchangeCard title={t('exchange.fiat_platform_title')} rows={card2Rows} buttonText={'充值记录'} onOpenRecords={() => navigate('/token-history?token_symbol=USDT&transaction_type=all')} />

      <GlobalConfirmDialog
        isOpen={banDialogOpen}
        onClose={() => setBanDialogOpen(false)}
        title={t('ban_modal.title')}
        content={t('ban_modal.description')}
        confirmText={t('ban_modal.contact_support')}
        cancelText={t('ban_modal.dismiss')}
        handleConfirm={handleContactSupport}
        handleCancel={() => {}}
      />
      <GlobalConfirmDialog
        isOpen={isPaymentDialogOpen}
        onClose={() => setIsPaymentDialogOpen(false)}
        title={'支付订单创建成功'}
        showCloseIcon={true}
        content={(
          <div className="space-y-2">
            <div className="break-all">
              支付链接：{paymentUrlForDialog ? (
                <a href={paymentUrlForDialog} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                  {paymentUrlForDialog}
                </a>
              ) : '创建成功'}
            </div>
            {paymentOrderId ? (
              <div className="flex items-center gap-2">
                <span>充值状态：{getStatusText(paymentOrderStatus)}</span>
                {!isTerminalStatus(paymentOrderStatus) && (
                  <div
                    onClick={refreshPaymentOrderStatus}
                    className="px-2 py-1 rounded bg-[#2a2a2a] text-[#e5e7eb] text-[12px] cursor-pointer hover:bg-[#343434]"
                  >
                    刷新
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
        confirmText={'打开链接支付'}
        hideCancel={true}
        handleConfirm={() => {
          if (paymentUrlForDialog) {
            window.open(paymentUrlForDialog, '_blank');
          }
          setIsPaymentDialogOpen(false);
        }}
      />
    </div>
  );
};

export default Withdraw;
