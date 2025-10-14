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
import { lusdService } from '../../services';

const Account = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { account, isConnected } = useWeb3Store();
  const { isAuthenticated } = useAuthStore();
  const { balance, fetchBalance, isLoading } = useUserStore();
  // 通过本地token判断是否登录（与后端保持一致：localStorage中的authToken）
  const hasAuthToken = (() => {
    try {
      const token = localStorage.getItem('jwttoken') || localStorage.getItem('authToken');
      return !!token;
    } catch (_) {
      return false;
    }
  })();

  // 设置页面标题
  usePageTitle('account');
  const [activeTab, setActiveTab] = useState('USDT');
  const [countdown, setCountdown] = useState(86400); // 24小时倒计时（秒）
  const [showReferralBindModal, setShowReferralBindModal] = useState(false);
  const balanceFetchedRef = useRef(false);

  // LUSD领取相关状态
  const [lusdClaimStatus, setLusdClaimStatus] = useState(null);
  const [isLoadingClaimStatus, setIsLoadingClaimStatus] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [lusdCountdown, setLusdCountdown] = useState(0); // LUSD领取倒计时（秒）

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

  // 余额数据（根据实际API响应结构获取）
  const balances = {
    USDT: safeParseFloat(balance?.usdt_balance, 0),
    USDR: safeParseFloat(balance?.usdr_balance, 0),
    LuckyUSD: safeParseFloat(balance?.lusd_balance, 0),
    Rocket: safeParseFloat(balance?.rocket_balance, 0)
  };

  // Rocket 折算 USDT 比率（参考文案：0.1U/个）
  const ROCKET_USDT_RATE = 0.1;

  // 调试余额数据
  useEffect(() => {
    if (balance) {
      console.log('=== Account页面余额调试 ===');
      console.log('原始balance数据:', balance);
      console.log('USDT余额:', balance?.usdt_balance);
      console.log('USDR余额:', balance?.usdr_balance);
      console.log('LuckyUSD余额:', balance?.lusd_balance);
      console.log('Rocket余额:', balance?.rocket_balance);
      console.log('计算后的balances:', balances);
      console.log('当前选中标签:', activeTab);
      console.log('当前标签余额:', balances[activeTab]);
      console.log('========================');
    }
  }, [balance, activeTab]);



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

  // LUSD领取倒计时效果
  useEffect(() => {
    if (lusdCountdown <= 0) return;

    const timer = setInterval(() => {
      setLusdCountdown(prev => {
        if (prev <= 1) {
          // 倒计时结束，重新查询状态
          fetchLusdClaimStatus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000); // 每秒更新一次

    return () => clearInterval(timer);
  }, [lusdCountdown]);

  // 当切换到LuckyUSD标签时查询领取状态
  useEffect(() => {
    if (activeTab === 'LuckyUSD' && isAuthenticated) {
      fetchLusdClaimStatus();
    }
  }, [activeTab, isAuthenticated]);



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
    // 功能未开通，提示而不跳转
    toast(t('common.not_available'));
  };

  // 处理提现按钮点击
  const handleWithdrawClick = () => {
    // 功能未开通，提示而不跳转
    toast(t('common.not_available'));
  };

  // 处理代币记录点击
  const handleTokenHistoryClick = () => {
    navigate('/token-history');
  };

  // 处理推荐码绑定点击
  const handleReferralBindClick = () => {
    if (!isConnected) {
      toast.error('请先连接钱包');
      return;
    }
    setShowReferralBindModal(true);
  };

  // 查询LuckyUSD领取状态
  const fetchLusdClaimStatus = async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoadingClaimStatus(true);
      const result = await lusdService.getClaimStatus();

      if (result.success) {
        setLusdClaimStatus(result.data);
        // 改为使用接口返回的 remaining_minutes 字段进行倒计时
        const remainingMinutes = parseInt(result.data.remaining_minutes || 0, 10);
        setLusdCountdown(Number.isFinite(remainingMinutes) && remainingMinutes > 0 ? remainingMinutes * 60 : 0);
      }
    } catch (error) {
      console.error('查询LuckyUSD领取状态失败:', error);
      // 不显示错误toast，避免干扰用户体验
    } finally {
      setIsLoadingClaimStatus(false);
    }
  };

  // 领取LuckyUSD或显示不可领取原因
  const handleClaimLusd = async () => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      return;
    }

    if (!isConnected) {
      toast.error('请先连接钱包');
      return;
    }

    // 如果没有领取状态数据，先查询状态
    if (!lusdClaimStatus) {
      toast.error('正在查询领取状态，请稍后再试');
      fetchLusdClaimStatus();
      return;
    }

    // 按新的接口逻辑进行领取前检查
    const hasPendingOrders = lusdClaimStatus.has_pending_orders === true;
    const currentBalanceNum = parseFloat(lusdClaimStatus.current_balance || '0');
    const remainingMinutes = lusdClaimStatus.remaining_minutes || 0;

    if (hasPendingOrders) {
      toast.error('当前不可领取（存在挂单）');
      return;
    }

    if (Number.isFinite(currentBalanceNum) && currentBalanceNum >= 1) {
      toast.error('不可领取：当前 LuckyUSD 余额 ≥ 1');
      return;
    }

    if (remainingMinutes > 0) {
      const remainingTime = lusdService.formatRemainingTime(remainingMinutes);
      toast.error(`请在 ${remainingTime} 后再次领取`);
      return;
    }

    // 可以领取，执行领取操作
    try {
      setIsClaiming(true);
      const result = await lusdService.claimLusd();

      if (result.success) {
        toast.success(result.message || '成功领取LuckyUSD！');

        // 刷新余额和领取状态
        await Promise.all([
          safeFetchBalance(),
          fetchLusdClaimStatus()
        ]);
      }
    } catch (error) {
      console.error('领取LuckyUSD失败:', error);

      if (error.isTimeError) {
        toast.error(`请在 ${lusdService.formatRemainingTime(error.remaining_minutes)} 后再次领取`);
      } else if (error.isBalanceError) {
        toast.error(error.message || '余额不符合领取条件');
      } else {
        toast.error(error.message || '领取失败，请稍后重试');
      }
    } finally {
      setIsClaiming(false);
    }
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
          <div className="flex flex-col items-start">
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-pulse bg-gray-600 h-[44vw] md:h-10 w-[80vw] md:w-32 rounded"></div>
                <span className="text-[rgb(87,87,87)] text-size-[28vw] md:text-2xl font-semibold ml-2" style={{ fontWeight: 600 }}>
                  {activeTab}
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-baseline">
                  <span className="text-white text-size-[44vw] md:text-4xl font-semibold" style={{ fontWeight: 600 }}>
                    {integerPart}
                  </span>
                  <span className="text-[rgb(87,87,87)] text-size-[28vw] md:text-2xl font-semibold" style={{ fontWeight: 600 }}>
                    .{decimalPart} {activeTab}
                  </span>
                </div>
                {activeTab === 'Rocket' && (
                  <span className="text-[rgb(87,87,87)] text-size-[28vw] md:text-2xl font-semibold mt-[2vw] md:mt-1" style={{ fontWeight: 600 }}>
                    {`≈${(balances.Rocket * ROCKET_USDT_RATE).toFixed(2)}USDT`}
                  </span>
                )}
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

      {/* 删除原先的 Rocket 价格栏 */}

      {/* 第四部分：LuckyUSD领取状态/倒计时（只在选中LuckyUSD时显示） */}
      {activeTab === 'LuckyUSD' && hasAuthToken && (
        <div className="px-[16vw] md:px-4 pb-[24vw] md:pb-6">
          <div
            onClick={handleClaimLusd}
            className="w-[343vw] md:w-full h-[50vw] md:h-12 flex items-center justify-center rounded-[8vw] md:rounded-lg border border-gray-400 cursor-pointer hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'rgb(64, 64, 64)' }}
          >
            {isLoadingClaimStatus ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="text-white text-size-[16vw] md:text-base">查询领取状态中...</span>
              </div>
            ) : lusdClaimStatus ? (
              <span className="text-white text-size-[18vw] md:text-lg font-medium">
                {(() => {
                  const hasPending = lusdClaimStatus.has_pending_orders === true;
                  const currentBalanceNum = parseFloat(lusdClaimStatus.current_balance || '0');
                  const remainingMinutes = lusdClaimStatus.remaining_minutes || 0;

                  if (hasPending || (Number.isFinite(currentBalanceNum) && currentBalanceNum >= 1)) {
                    return '不可领取';
                  }
                  if (remainingMinutes > 0) {
                    return `下次领取: ${formatCountdown(lusdCountdown)}`;
                  }
                  return isClaiming ? '领取中...' : '领取LuckyUSD';
                })()}
              </span>
            ) : (
              <span className="text-white text-size-[18vw] md:text-lg font-medium">
                {t('account.next_distribution')}: {formatCountdown(countdown)}
              </span>
            )}
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

      {/* 推荐码绑定入口 - 已隐藏 */}
      {false && (
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
      )}

      {/* 第六部分：代币记录入口 */}
      <div className="px-[16vw] md:px-4">
        <div
          onClick={handleTokenHistoryClick}
          className="w-[343vw] md:w-full h-[50vw] md:h-12 flex items-center justify-between px-[16vw] md:px-4 rounded-[8vw] md:rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
          style={{ backgroundColor: 'rgb(41, 41, 41)' }}
        >
          <span className="text-white text-size-[16vw] md:text-lg">{t('account.token_history')}</span>
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
