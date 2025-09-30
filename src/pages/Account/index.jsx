import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import usePageTitle from '../../hooks/usePageTitle';
import { useApiCall } from '../../hooks/useApiCall';
import { useWeb3Store, useAuthStore, useUserStore } from '../../store';
import { formatAddress } from '../../utils/web3';
import { safeParseFloat, formatBalance } from '../../utils/format';
import btcIcon from '../../assets/images/account-btc.png';
import toast from 'react-hot-toast';
import ReferralBindModal from '../../components/ReferralBindModal';

const Account = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { account, isConnected } = useWeb3Store();
  const { isAuthenticated } = useAuthStore();
  const { balance, fetchBalance, isLoading } = useUserStore();

  // 设置页面标题
  usePageTitle('account');
  const [activeTab, setActiveTab] = useState('USDT');
  const [countdown, setCountdown] = useState(86400); // 24小时倒计时（秒）
  const [showReferralBindModal, setShowReferralBindModal] = useState(false);
  const balanceFetchedRef = useRef(false);

  // 使用防重复调用的API hook
  const safeFetchBalance = useApiCall(fetchBalance, []);

  // 获取用户余额数据
  useEffect(() => {
    if (isAuthenticated && !balanceFetchedRef.current) {
      balanceFetchedRef.current = true;
      safeFetchBalance().catch(error => {
        console.error('获取余额失败:', error);
        toast.error('获取余额失败');
        balanceFetchedRef.current = false; // 失败时重置，允许重试
      });
    }
  }, [isAuthenticated]); // 移除 safeFetchBalance 依赖，避免循环依赖

  // 余额数据（优先使用API数据，否则使用默认值）
  const balances = {
    USDT: safeParseFloat(balance?.balanceMap?.USDT?.total || balance?.usdtBalance, 0),
    USDR: safeParseFloat(balance?.balanceMap?.USDR?.total, 0),
    LuckyUSD: safeParseFloat(balance?.balanceMap?.LuckyUSD?.total, 0),
    Rocket: safeParseFloat(balance?.balanceMap?.Rocket?.total, 1500.00) // 默认值
  };



  // 倒计时效果
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return 86400; // 重置为24小时
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);



  // 格式化倒计时显示
  const formatCountdown = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };



  // 处理网体详情点击
  const handleNetworkDetailsClick = () => {
    navigate('/network-details');
  };

  // 处理兑换按钮点击
  const handleExchangeClick = () => {
    navigate('/exchange');
  };

  // 处理提现按钮点击
  const handleWithdrawClick = () => {
    navigate('/withdraw');
  };

  // 处理交易记录点击
  const handleTransactionHistoryClick = () => {
    navigate('/transaction-history');
  };

  // 处理推荐码绑定点击
  const handleReferralBindClick = () => {
    if (!isConnected) {
      toast.error('请先连接钱包');
      return;
    }
    setShowReferralBindModal(true);
  };



  const currentBalance = balances[activeTab];
  const { integerPart, decimalPart } = formatBalance(currentBalance);

  return (
    <div className="min-h-screen pb-[86vw] md:pb-20" style={{ backgroundColor: '#121212' }}>
      {/* 第一部分：钱包地址 */}
      <div className="px-[16vw] md:px-4 pt-[20vw] md:pt-5 pb-[24vw] md:pb-6">
        <div className="text-white text-size-[28vw] md:text-2xl font-semibold" style={{ fontWeight: 600 }}>
          {isConnected && account ? formatAddress(account, 4, 4) : t('account.wallet_not_connected')}
        </div>
      </div>

      {/* 第二部分：Tabs */}
      <div className="px-[16vw] md:px-4 pb-[24vw] md:pb-6">
        <div className="flex gap-[8vw] md:gap-2">
          {['USDT', 'USDR', 'LuckyUSD', 'Rocket'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-[6vw] md:gap-1.5 px-[8vw] md:px-2.5 py-[8vw] md:py-3 rounded-[34vw] md:rounded-full text-size-[14vw] md:text-base transition-all flex-1 justify-center ${
                activeTab === tab
                  ? 'text-black'
                  : 'text-white'
              }`}
              style={{
                backgroundColor: activeTab === tab ? 'rgb(41, 41, 41)' : 'rgb(41, 41, 41)',
                backgroundImage: activeTab === tab ? 'linear-gradient(rgb(143, 143, 143), rgb(217, 217, 217))' : 'none',
              }}
            >
              <img src={btcIcon} alt={tab} className="w-[12vw] md:w-4 h-[12vw] md:h-4" />
              <span className="text-size-[14vw] md:text-sm">{tab}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 第三部分：余额显示和兑换按钮 */}
      <div className="px-[16vw] md:px-4 pb-[24vw] md:pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline">
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-pulse bg-gray-600 h-[44vw] md:h-10 w-[80vw] md:w-32 rounded"></div>
                <span className="text-[rgb(87,87,87)] text-size-[28vw] md:text-2xl font-semibold ml-2" style={{ fontWeight: 600 }}>
                  {activeTab}
                </span>
              </div>
            ) : (
              <>
                <span className="text-white text-size-[44vw] md:text-4xl font-semibold" style={{ fontWeight: 600 }}>
                  {integerPart}
                </span>
                <span className="text-[rgb(87,87,87)] text-size-[28vw] md:text-2xl font-semibold" style={{ fontWeight: 600 }}>
                  .{decimalPart} {activeTab}
                </span>
              </>
            )}
          </div>

          {/* 在选中USDT时显示兑换按钮 */}
          {activeTab === 'USDT' && (
            <div
              onClick={handleExchangeClick}
              className="px-[24vw] md:px-6 py-[12vw] md:py-3 rounded-[34vw] md:rounded-full cursor-pointer hover:opacity-80 transition-opacity border border-white"
              style={{ backgroundColor: 'transparent' }}
            >
              <span className="text-white text-size-[16vw] md:text-base font-medium">
                {t('account.exchange')}
              </span>
            </div>
          )}

          {/* 在选中Rocket或USDR时显示提现按钮 */}
          {(activeTab === 'Rocket' || activeTab === 'USDR') && (
            <div
              onClick={handleWithdrawClick}
              className="px-[24vw] md:px-6 py-[12vw] md:py-3 rounded-[34vw] md:rounded-full cursor-pointer hover:opacity-80 transition-opacity border border-white"
              style={{ backgroundColor: 'transparent' }}
            >
              <span className="text-white text-size-[16vw] md:text-base font-medium">
                提现
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 第四部分：倒计时（只在选中LuckyUSD时显示） */}
      {activeTab === 'LuckyUSD' && (
        <div className="px-[16vw] md:px-4 pb-[24vw] md:pb-6">
          <div
            className="w-[343vw] md:w-full h-[50vw] md:h-12 flex items-center justify-center rounded-[8vw] md:rounded-lg border border-gray-400"
            style={{ backgroundColor: 'rgb(64, 64, 64)' }}
          >
            <span className="text-white text-size-[18vw] md:text-lg font-medium">
              {t('account.next_distribution')}: {formatCountdown(countdown)}
            </span>
          </div>
        </div>
      )}

      {/* 第五部分：网体详情入口 */}
      <div className="px-[16vw] md:px-4 pb-[24vw] md:pb-6">
        <div
          onClick={handleNetworkDetailsClick}
          className="w-[343vw] md:w-full h-[50vw] md:h-12 flex items-center justify-between px-[16vw] md:px-4 rounded-[8vw] md:rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
          style={{ backgroundColor: 'rgb(41, 41, 41)' }}
        >
          <span className="text-white text-size-[16vw] md:text-lg">{t('account.network_details')}</span>
          <svg className="w-[16vw] md:w-4 h-[16vw] md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* 推荐码绑定入口 */}
      <div className="px-[16vw] md:px-4 pb-[24vw] md:pb-6">
        <div
          onClick={handleReferralBindClick}
          className="w-[343vw] md:w-full h-[50vw] md:h-12 flex items-center justify-between px-[16vw] md:px-4 rounded-[8vw] md:rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
          style={{ backgroundColor: 'rgb(41, 41, 41)' }}
        >
          <span className="text-white text-size-[16vw] md:text-lg">{t('network_details.referral_bind.title')}</span>
          <svg className="w-[16vw] md:w-4 h-[16vw] md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
      </div>

      {/* 第六部分：交易记录入口 */}
      <div className="px-[16vw] md:px-4">
        <div
          onClick={handleTransactionHistoryClick}
          className="w-[343vw] md:w-full h-[50vw] md:h-12 flex items-center justify-between px-[16vw] md:px-4 rounded-[8vw] md:rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
          style={{ backgroundColor: 'rgb(41, 41, 41)' }}
        >
          <span className="text-white text-size-[16vw] md:text-lg">{t('account.transactions')}</span>
          <svg className="w-[16vw] md:w-4 h-[16vw] md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* 推荐码绑定模态框 */}
      <ReferralBindModal
        isOpen={showReferralBindModal}
        onClose={() => setShowReferralBindModal(false)}
        walletAddress={account}
      />
    </div>
  );
};

export default Account;
