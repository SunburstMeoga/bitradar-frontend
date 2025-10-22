import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import usePageTitle from '../../hooks/usePageTitle';
import toast from 'react-hot-toast';
import { useAuthStore, useUserStore, useWeb3Store } from '../../store';
import { useNavigate } from 'react-router-dom';
import erc20Abi from '../../contracts/ERC20.abi.json';
import GlobalConfirmDialog from '../../components/GlobalConfirmDialog';
import Web3 from 'web3';
import { withdrawalService, userService } from '../../services';

// 动画金额展示（复用Withdraw页的风格）
const AnimatedAmount = ({ amount, fontSize = '28vw', mdFontSize = 'md:text-3xl lg:text-4xl', mdDecimalFontSize = 'md:text-xl lg:text-2xl', className = 'text-white', isRefreshing = false }) => {
  const [currentValue, setCurrentValue] = useState(0);
  const smallerFontSize = `${parseInt(fontSize) / 2}vw`;

  useEffect(() => {
    const duration = 1200; // 1.2秒
    const steps = 48;
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

  const [integerPart, decimalPart] = Number(currentValue || 0).toFixed(2).split('.');

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

// 读取链上Rocket余额
const getWalletRocketBalance = async (address) => {
  try {
    if (!window.ethereum || !address) return 0;
    const web3 = new Web3(window.ethereum);
    const rocketAddress = import.meta.env.VITE_ROCKET_CONTRACT_ADDRESS;
    if (!rocketAddress) return 0;
    const token = new web3.eth.Contract(erc20Abi, rocketAddress);
    const decimalsRaw = await token.methods.decimals().call();
    const decimals = Number(decimalsRaw) || 18;
    const raw = await token.methods.balanceOf(address).call();
    if (decimals === 18) {
      return Number(web3.utils.fromWei(raw, 'ether'));
    }
    const ten = BigInt(10);
    const scale = ten ** BigInt(decimals);
    const bn = BigInt(raw);
    return Number(bn) / Number(scale);
  } catch (err) {
    console.warn('读取链上Rocket余额失败:', err);
    return 0;
  }
};

// Rocket提现卡片
const RocketWithdrawCard = ({ title, withdrawAmount, onWithdrawAmountChange, onConfirm, isConfirmDisabled, balances, minAmountText, maxAmountText, feeRatePercent, isLoading, t }) => {
  return (
    <div
      className="w-[360vw] md:w-96 p-[20vw] md:p-5 rounded-[34vw] md:rounded-[34px] mb-[24vw] md:mb-6"
      style={{ backgroundColor: '#121313', border: '1px solid #1F1F1F' }}
    >
      <div className="text-[#9D9D9D] text-size-[16vw] md:text-base lg:text-lg font-medium mb-[16vw] md:mb-4 lg:mb-5 text-center">
        {title}
      </div>

      {/* 最小提现金额（独立一行） */}
      <div className="mb-[12vw] md:mb-3">
        <div className="flex items-center justify-between p-[16vw] md:p-4 lg:p-5 rounded-[12vw] md:rounded-lg lg:rounded-xl" style={{ backgroundColor: '#171818', border: '1px solid #1B1C1C' }}>
          <div className="flex items-center gap-[12vw] md:gap-3">
            <span className="text-[#8f8f8f] text-size-[14vw] md:text-sm">最小提现金额:</span>
            <span className="text-white text-size-[16vw] md:text-base font-medium">{minAmountText}</span>
          </div>
        </div>
      </div>

      {/* 最大提现金额（独立一行） */}
      <div className="mb-[12vw] md:mb-3">
        <div className="flex items-center justify-between p-[16vw] md:p-4 lg:p-5 rounded-[12vw] md:rounded-lg lg:rounded-xl" style={{ backgroundColor: '#171818', border: '1px solid #1B1C1C' }}>
          <div className="flex items-center gap-[12vw] md:gap-3">
            <span className="text-[#8f8f8f] text-size-[14vw] md:text-sm">最大提现金额:</span>
            <span className="text-white text-size-[16vw] md:text-base font-medium">{maxAmountText}</span>
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

const RocketWithdraw = () => {
  const { t } = useTranslation();
  usePageTitle('rocket_withdraw');

  const { isAuthenticated } = useAuthStore();
  const { balance, fetchBalance } = useUserStore();
  const { account } = useWeb3Store();
  const navigate = useNavigate();

  // 封禁检查
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
      return true;
    }
  };

  const handleContactSupport = () => {
    const supportUrl = banInfo?.support_url || '/';
    try { window.open(supportUrl, '_blank', 'noopener'); } catch (_) {}
  };

  // 平台Rocket余额
  const getPlatformRocketBalance = () => {
    if (!balance) return 0;
    if (balance.balanceMap && balance.balanceMap['ROCKET']) {
      const b = balance.balanceMap['ROCKET'];
      return parseFloat(b.total || b.available || 0);
    }
    if (balance.rocket_balance !== undefined) {
      return parseFloat(balance.rocket_balance || 0);
    }
    return 0;
  };

  const [platformRocket, setPlatformRocket] = useState(getPlatformRocketBalance());
  const [walletRocket, setWalletRocket] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBalance().catch(err => console.error('获取余额失败:', err));
    }
  }, [isAuthenticated, fetchBalance]);

  useEffect(() => {
    setPlatformRocket(getPlatformRocketBalance());
  }, [balance]);

  // 读取链上Rocket余额与监听
  useEffect(() => {
    let mounted = true;
    const loadBalance = async () => {
      try {
        if (!window.ethereum) return;
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const addr = accounts && accounts[0];
        const bal = addr ? await getWalletRocketBalance(addr) : 0;
        if (mounted) setWalletRocket(Number(bal || 0));
      } catch (err) {
        console.warn('读取链上Rocket余额失败:', err);
      }
    };
    loadBalance();
    const handleAccountsChanged = async (accounts) => {
      if (!mounted) return;
      const addr = accounts && accounts[0];
      const bal = addr ? await getWalletRocketBalance(addr) : 0;
      setWalletRocket(Number(bal || 0));
    };
    const handleChainChanged = async () => { setTimeout(loadBalance, 500); };
    window.ethereum?.on('accountsChanged', handleAccountsChanged);
    window.ethereum?.on('chainChanged', handleChainChanged);
    return () => {
      mounted = false;
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  // 提现输入与校验
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState(null);
  const rocketSetting = (settings || []).find(s => s.token_symbol === 'ROCKET');
  const minWithdrawAmount = rocketSetting ? parseFloat(rocketSetting.min_withdrawal_amount || '0') : 0; // 默认0
  const maxWithdrawAmount = rocketSetting ? parseFloat(rocketSetting.max_withdrawal_amount || '0') : 0;
  const feeRatePercent = rocketSetting ? `${(parseFloat(rocketSetting.withdrawal_fee_rate || '0') * 100).toFixed(2)}%` : '0%';
  const isSettingsLoaded = settings !== null;
  const minAmountText = isSettingsLoaded ? Number(minWithdrawAmount).toFixed(2) : '0.00';
  const maxAmountText = isSettingsLoaded ? (maxWithdrawAmount > 0 ? Number(maxWithdrawAmount).toFixed(2) : '无限制') : '0.00';

  useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;
    withdrawalService.getSettings()
      .then(res => { if (mounted && res?.success) setSettings(res.data || []); })
      .catch(err => console.error('获取提现设置失败:', err));
    return () => { mounted = false; };
  }, [isAuthenticated]);

  const handleWithdrawAmountChange = (value) => {
    const num = parseFloat(value) || 0;
    // if (value && num < minWithdrawAmount) {
    //   toast.error(`${t('exchange.min_withdraw_amount')}: ${minWithdrawAmount}`);
    //   return;
    // }
    // if (value && maxWithdrawAmount > 0 && num > maxWithdrawAmount) {
    //   toast.error(`提现金额不得超过 ${maxWithdrawAmount}`);
    //   return;
    // }
    // if (value && num > platformRocket) {
    //   toast.error(t('exchange.insufficient_balance'));
    //   return;
    // }
    setWithdrawAmount(value);
  };

  const refreshBalances = async () => {
    try {
      await fetchBalance().catch(() => {});
      setPlatformRocket(getPlatformRocketBalance());
    } catch (err) {
      console.warn('刷新余额失败:', err);
    }
  };

  const handleWithdrawAmountBlur = () => {
    if (!withdrawAmount) return;
    const num = parseFloat(withdrawAmount) || 0;
    if (num < minWithdrawAmount) {
      toast.error(`最小输入金额：${minWithdrawAmount}`);
      return;
    }
    if (maxWithdrawAmount > 0 && num > maxWithdrawAmount) {
      toast.error(`最大输入金额：${maxWithdrawAmount}`);
      return;
    }
    if (num > platformRocket) {
      toast.error(t('exchange.insufficient_balance'));
      return;
    }
  };

  const handleWithdrawConfirm = async () => {
    if (!withdrawAmount) return;
    const canProceed = await checkBanStatusBeforeAction();
    if (!canProceed) return;
    if (!isAuthenticated) { toast.error('请先登录'); return; }
    if (!account) { toast.error('请先连接钱包'); return; }

    const numAmt = parseFloat(withdrawAmount);
    if (!Number.isFinite(numAmt) || numAmt < minWithdrawAmount) {
      toast.error(`最小输入金额：${minWithdrawAmount}`);
      return;
    }
    if (maxWithdrawAmount > 0 && numAmt > maxWithdrawAmount) {
      toast.error(`最大输入金额：${maxWithdrawAmount}`);
      return;
    }
    if (numAmt > platformRocket) {
      toast.error(t('exchange.insufficient_balance'));
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await withdrawalService.createWithdrawal({
        token_symbol: 'ROCKET',
        amount: String(withdrawAmount),
        to_address: account,
      });
      if (res?.success) {
        toast.success(t('exchange.withdraw_tx_submitted'));
        setWithdrawAmount('');
        setTimeout(() => { refreshBalances(); }, 2000);
      } else {
        const msg = res?.message || t('exchange.tx_failed');
        toast.error(msg);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || t('exchange.tx_failed');
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-[16vw] md:px-6 lg:px-8 pt-[20vw] md:pt-6 lg:pt-8 pb-[24vw] md:pb-8 lg:pb-10 flex flex-col items-center max-w-4xl mx-auto">
      {/* 顶部余额显示 - Rocket 平台与链上 */}
      <div className="flex items-center justify-center pb-[32vw] md:pb-8 lg:pb-10 w-[320vw] md:w-[28rem]">
        <div className="flex flex-col items-center gap-[8vw] md:gap-2">
          <span className="text-[#8f8f8f] text-size-[16vw] md:text-lg lg:text-xl">ROCKET</span>
          <div className="flex items-center justify-center gap-[12vw] md:gap-6">
            <div className="flex items-baseline gap-[6vw] md:gap-2">
              <span className="text-[#9D9D9D] text-size-[14vw] md:text-sm">{t('exchange.platform')}</span>
              <AnimatedAmount amount={platformRocket} className="text-white" />
            </div>
            <div className="w-[1vw] md:w-px lg:w-px" style={{ backgroundColor: '#1F1F1F' }}>
              <span className="sr-only">divider</span>
            </div>
            <div className="flex items-baseline gap-[6vw] md:gap-2">
              <span className="text-[#9D9D9D] text-size-[14vw] md:text-sm">{t('exchange.onchain')}</span>
              <AnimatedAmount amount={walletRocket} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Rocket 提现卡片（无USDT/法币充值项）*/}
      <RocketWithdrawCard
        title={t('exchange.withdraw_to_wallet', { defaultValue: '提至钱包' })}
        withdrawAmount={withdrawAmount}
        onWithdrawAmountChange={handleWithdrawAmountChange}
        onConfirm={handleWithdrawConfirm}
        isConfirmDisabled={isSubmitting || !withdrawAmount}
        isLoading={isSubmitting}
        balances={{ Rocket: platformRocket }}
        minAmountText={minAmountText}
        maxAmountText={maxAmountText}
        feeRatePercent={feeRatePercent}
        t={t}
      />

      {/* 提现记录入口：跳转到Rocket的提现记录 */}
      <div className="flex justify-center mt-[12vw] md:mt-3 lg:mt-4">
        <button onClick={() => navigate('/token-history?token_symbol=ROCKET&transaction_type=WITHDRAW')} className="text-[#5671FB] text-size-[14vw] md:text-sm lg:text-sm font-medium hover:opacity-80 transition-opacity underline">
 提现记录
        </button>
      </div>

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

export default RocketWithdraw;