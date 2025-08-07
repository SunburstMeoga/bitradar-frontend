import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWeb3Store } from '../../store';
import { formatAddress } from '../../utils/web3';
import btcIcon from '../../assets/images/account-btc.png';
import transactionIcon from '../../assets/images/account-transation.png';

const Account = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { account, isConnected } = useWeb3Store();
  const [activeTab, setActiveTab] = useState('USDT');
  const [countdown, setCountdown] = useState(86400); // 24小时倒计时（秒）
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef(null);

  // 模拟余额数据
  const balances = {
    USDT: 843.75,
    LuckyUSD: 1256.32
  };

  // 模拟交易数据
  const mockTransactions = [
    {
      id: 1,
      type: 'Check-in',
      amount: '+100',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1小时前
    },
    {
      id: 2,
      type: 'Reward',
      amount: '+50',
      timestamp: new Date(Date.now() - 7200000).toISOString(), // 2小时前
    },
    {
      id: 3,
      type: 'Transfer',
      amount: '-200',
      timestamp: new Date(Date.now() - 10800000).toISOString(), // 3小时前
    },
    {
      id: 4,
      type: 'Mining',
      amount: '+75',
      timestamp: new Date(Date.now() - 14400000).toISOString(), // 4小时前
    },
    {
      id: 5,
      type: 'Bonus',
      amount: '+25',
      timestamp: new Date(Date.now() - 18000000).toISOString(), // 5小时前
    },
  ];

  // 处理触底加载更多
  const handleLoadMore = useCallback(() => {
    if (loading || !hasMore) return;

    setLoading(true);
    // 模拟加载延迟
    setTimeout(() => {
      const newTransactions = mockTransactions.map((item, index) => ({
        ...item,
        id: `${Date.now()}_${page}_${index}_${Math.random().toString(36).substring(2, 11)}`, // 使用时间戳+随机字符串确保唯一性
        timestamp: new Date(Date.now() - (18000000 + index * 3600000 + page * 86400000)).toISOString(),
      }));
      setTransactions(prev => [...prev, ...newTransactions]);
      setPage(prev => prev + 1);

      // 模拟数据加载完毕（加载3页后停止）
      if (page >= 3) {
        setHasMore(false);
      }

      setLoading(false);
    }, 1000);
  }, [loading, hasMore, page, mockTransactions]);

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

  // 初始化交易数据
  useEffect(() => {
    setTransactions(mockTransactions.slice(0, 5));
  }, []);

  // 触底加载监听
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [handleLoadMore, hasMore, loading]);

  // 格式化倒计时显示
  const formatCountdown = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 格式化时间显示
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} ${t('account.time_ago.seconds')}`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} ${t('account.time_ago.minutes')}`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)} ${t('account.time_ago.hours')}`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)} ${t('account.time_ago.days')}`;
    }
  };

  // 处理网体详情点击
  const handleNetworkDetailsClick = () => {
    navigate('/network-details');
  };

  // 获取交易类型的翻译
  const getTransactionTypeText = (type) => {
    const typeMap = {
      'Check-in': t('account.transaction_types.check_in'),
      'Reward': t('account.transaction_types.reward'),
      'Transfer': t('account.transaction_types.transfer'),
      'Mining': t('account.transaction_types.mining'),
      'Bonus': t('account.transaction_types.bonus')
    };
    return typeMap[type] || type;
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

      {/* 第三部分：网体详情入口 */}
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

      {/* 第四部分：余额显示 */}
      <div className="px-[16vw] md:px-4 pb-[24vw] md:pb-6">
        <div className="flex items-baseline">
          <span className="text-white text-size-[44vw] md:text-4xl font-semibold" style={{ fontWeight: 600 }}>
            {integerPart}
          </span>
          <span className="text-[rgb(87,87,87)] text-size-[28vw] md:text-2xl font-semibold" style={{ fontWeight: 600 }}>
            .{decimalPart} {activeTab}
          </span>
        </div>
      </div>

      {/* 第五部分：倒计时 */}
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

      {/* 分割线 */}
      <div className="px-[16vw] md:px-4 pb-[24vw] md:pb-6">
        <div className="w-full h-[1vw] md:h-px" style={{ backgroundColor: 'rgb(41, 41, 41)' }}></div>
      </div>

      {/* 第六部分：Transactions列表 */}
      <div className="px-[16vw] md:px-4">
        {/* 标题 */}
        <div className="pb-[16vw] md:pb-4">
          <h2 className="text-[#8f8f8f] text-size-[15vw] md:text-base font-semibold" style={{ fontWeight: 600 }}>
            {t('account.transactions')}
          </h2>
        </div>

        {/* 交易列表 */}
        <div className="space-y-[2vw] md:space-y-1">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-[16vw] md:p-4 rounded-[8vw] md:rounded-lg"
              style={{ backgroundColor: 'rgb(31, 31, 31)' }}
            >
              {/* 左侧内容 */}
              <div className="flex items-center gap-[12vw] md:gap-3">
                {/* 交易图标 */}
                <img src={transactionIcon} alt="Transaction" className="w-[48vw] md:w-12 h-[48vw] md:h-12" />

                {/* 交易信息 */}
                <div className="flex flex-col gap-[4vw] md:gap-1">
                  <span className="text-white text-size-[17vw] md:text-lg">
                    {getTransactionTypeText(transaction.type)}
                  </span>
                  <span className="text-[#8f8f8f] text-size-[13vw] md:text-sm">
                    {formatTime(transaction.timestamp)}
                  </span>
                </div>
              </div>

              {/* 右侧金额 */}
              <div className="text-white text-size-[17vw] md:text-lg font-semibold" style={{ fontWeight: 600 }}>
                {transaction.amount}
              </div>
            </div>
          ))}
        </div>

        {/* 加载更多指示器 */}
        <div ref={loadMoreRef} className="pt-[24vw] md:pt-6 pb-[24vw] md:pb-6 flex justify-center">
          {loading && (
            <div className="text-[#8f8f8f] text-size-[14vw] md:text-sm">
              {t('account.loading')}
            </div>
          )}
          {!hasMore && !loading && (
            <div className="text-[#8f8f8f] text-size-[14vw] md:text-sm">
              {t('account.no_more_data')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Account;
