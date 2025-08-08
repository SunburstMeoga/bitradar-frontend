import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import usePageTitle from '../../hooks/usePageTitle';
import { useWeb3Store } from '../../store';
import { formatAddress } from '../../utils/web3';
import btcIcon from '../../assets/images/account-btc.png';

const Account = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { account, isConnected } = useWeb3Store();

  // 设置页面标题
  usePageTitle('account');
  const [activeTab, setActiveTab] = useState('USDT');
  const [countdown, setCountdown] = useState(86400); // 24小时倒计时（秒）

  // 模拟余额数据
  const balances = {
    USDT: 843.75,
    LuckyUSD: 1256.32
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

  // 处理交易记录点击
  const handleTransactionHistoryClick = () => {
    navigate('/transaction-history');
  };



  // 格式化余额显示
  const formatBalance = (balance) => {
    const balanceStr = balance.toString();
    const parts = balanceStr.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1] || '00';
    
    return { integerPart, decimalPart };
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
        <div className="flex gap-[12vw] md:gap-3">
          {['USDT', 'LuckyUSD'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-[8vw] md:gap-2 px-[20vw] md:px-5 py-[16vw] md:py-4 rounded-[34vw] md:rounded-full text-size-[16vw] md:text-lg transition-all ${
                activeTab === tab
                  ? 'text-black'
                  : 'text-white'
              }`}
              style={{
                backgroundColor: activeTab === tab ? 'rgb(41, 41, 41)' : 'rgb(41, 41, 41)',
                backgroundImage: activeTab === tab ? 'linear-gradient(rgb(143, 143, 143), rgb(217, 217, 217))' : 'none',
              }}
            >
              <img src={btcIcon} alt={tab} className="w-[24vw] md:w-6 h-[24vw] md:h-6" />
              <span>{tab}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 第三部分：余额显示和兑换按钮 */}
      <div className="px-[16vw] md:px-4 pb-[24vw] md:pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline">
            <span className="text-white text-size-[44vw] md:text-4xl font-semibold" style={{ fontWeight: 600 }}>
              {integerPart}
            </span>
            <span className="text-[rgb(87,87,87)] text-size-[28vw] md:text-2xl font-semibold" style={{ fontWeight: 600 }}>
              .{decimalPart} {activeTab}
            </span>
          </div>
          {/* 只在选中USDT时显示兑换按钮 */}
          {activeTab === 'USDT' && (
            <div
              onClick={handleExchangeClick}
              className="px-[24vw] md:px-6 py-[12vw] md:py-3 rounded-[34vw] md:rounded-full cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundColor: '#c5ff33' }}
            >
              <span className="text-black text-size-[16vw] md:text-base font-medium">
                {t('account.exchange')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 第四部分：倒计时（只在选中LuckyUSD时显示） */}
      {activeTab === 'LuckyUSD' && (
        <div className="px-[16vw] md:px-4 pb-[24vw] md:pb-6">
          <div
            className="w-[343vw] md:w-full h-[50vw] md:h-12 flex items-center justify-center rounded-[8vw] md:rounded-lg"
            style={{ backgroundColor: '#c5ff33' }}
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
    </div>
  );
};

export default Account;
