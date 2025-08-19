import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import usePageTitle from '../../hooks/usePageTitle';
import transactionIcon from '../../assets/images/account-transation.png';

const TransactionHistory = () => {
  const { t } = useTranslation();

  // 设置页面标题
  usePageTitle('transaction_history');
  const [activeTab, setActiveTab] = useState('USDR');
  const [activeFilter, setActiveFilter] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef(null);

  // 模拟交易数据
  const mockTransactions = {
    USDR: [
      {
        id: 1,
        type: 'Deposit',
        category: 'deposit',
        amount: '+500',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1小时前
      },
      {
        id: 2,
        type: 'Withdraw',
        category: 'withdraw',
        amount: '-200',
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2小时前
      },
      {
        id: 3,
        type: 'Exchange',
        category: 'trade',
        amount: '-100',
        timestamp: new Date(Date.now() - 10800000).toISOString(), // 3小时前
      },
      {
        id: 4,
        type: 'Transfer',
        category: 'trade',
        amount: '-50',
        timestamp: new Date(Date.now() - 14400000).toISOString(), // 4小时前
      },
      {
        id: 5,
        type: 'Deposit',
        category: 'deposit',
        amount: '+300',
        timestamp: new Date(Date.now() - 18000000).toISOString(), // 5小时前
      },
      {
        id: 6,
        type: 'Withdraw',
        category: 'withdraw',
        amount: '-150',
        timestamp: new Date(Date.now() - 21600000).toISOString(), // 6小时前
      },
      {
        id: 7,
        type: 'Exchange',
        category: 'trade',
        amount: '-75',
        timestamp: new Date(Date.now() - 25200000).toISOString(), // 7小时前
      },
    ],
    LuckyUSD: [
      {
        id: 1,
        type: 'Check-in',
        category: 'reward',
        amount: '+100',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1小时前
      },
      {
        id: 2,
        type: 'Reward',
        category: 'reward',
        amount: '+50',
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2小时前
      },
      {
        id: 3,
        type: 'Exchange',
        category: 'trade',
        amount: '-75',
        timestamp: new Date(Date.now() - 10800000).toISOString(), // 3小时前
      },
      {
        id: 4,
        type: 'Bonus',
        category: 'reward',
        amount: '+25',
        timestamp: new Date(Date.now() - 14400000).toISOString(), // 4小时前
      },
      {
        id: 5,
        type: 'Transfer',
        category: 'trade',
        amount: '-30',
        timestamp: new Date(Date.now() - 18000000).toISOString(), // 5小时前
      },
      {
        id: 6,
        type: 'Distribution',
        category: 'reward',
        amount: '+150',
        timestamp: new Date(Date.now() - 21600000).toISOString(), // 6小时前
      },
      {
        id: 7,
        type: 'Mining',
        category: 'reward',
        amount: '+80',
        timestamp: new Date(Date.now() - 25200000).toISOString(), // 7小时前
      },
    ],
    Rocket: [
      {
        id: 1,
        type: 'Rocket Reward',
        category: 'reward',
        amount: '+250',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1小时前
      },
      {
        id: 2,
        type: 'Rocket Withdraw',
        category: 'withdraw',
        amount: '-100',
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2小时前
      },
      {
        id: 3,
        type: 'Rocket Bonus',
        category: 'reward',
        amount: '+75',
        timestamp: new Date(Date.now() - 10800000).toISOString(), // 3小时前
      },
      {
        id: 4,
        type: 'Rocket Withdraw',
        category: 'withdraw',
        amount: '-50',
        timestamp: new Date(Date.now() - 14400000).toISOString(), // 4小时前
      },
      {
        id: 5,
        type: 'Rocket Reward',
        category: 'reward',
        amount: '+300',
        timestamp: new Date(Date.now() - 18000000).toISOString(), // 5小时前
      },
      {
        id: 6,
        type: 'Rocket Withdraw',
        category: 'withdraw',
        amount: '-200',
        timestamp: new Date(Date.now() - 21600000).toISOString(), // 6小时前
      },
      {
        id: 7,
        type: 'Rocket Bonus',
        category: 'reward',
        amount: '+120',
        timestamp: new Date(Date.now() - 25200000).toISOString(), // 7小时前
      },
    ]
  };

  // 筛选选项配置
  const filterOptions = {
    USDR: ['all', 'deposit', 'withdraw', 'trade'],
    LuckyUSD: ['all', 'reward', 'trade'],
    Rocket: ['all', 'reward', 'withdraw']
  };

  // 筛选交易数据
  const getFilteredTransactions = (transactions, filter) => {
    if (filter === 'all') {
      return transactions;
    }
    return transactions.filter(transaction => transaction.category === filter);
  };

  // 处理触底加载更多
  const handleLoadMore = useCallback(() => {
    if (loading || !hasMore) return;

    setLoading(true);
    // 模拟加载延迟
    setTimeout(() => {
      const currentMockData = mockTransactions[activeTab];
      const filteredMockData = getFilteredTransactions(currentMockData, activeFilter);
      const newTransactions = filteredMockData.map((item, index) => ({
        ...item,
        id: `${Date.now()}_${page}_${index}_${Math.random().toString(36).substring(2, 11)}`,
        timestamp: new Date(Date.now() - (25200000 + index * 3600000 + page * 86400000)).toISOString(),
      }));
      setTransactions(prev => [...prev, ...newTransactions]);
      setPage(prev => prev + 1);

      // 模拟数据加载完毕（加载3页后停止）
      if (page >= 3) {
        setHasMore(false);
      }

      setLoading(false);
    }, 1000);
  }, [loading, hasMore, page, activeTab, activeFilter, mockTransactions, getFilteredTransactions]);

  // 切换tab时重置数据和筛选
  useEffect(() => {
    setActiveFilter('all'); // 重置筛选为全部
    const currentMockData = mockTransactions[activeTab];
    const filteredData = getFilteredTransactions(currentMockData, 'all');
    setTransactions(filteredData.slice(0, 5));
    setPage(1);
    setHasMore(true);
  }, [activeTab]);

  // 切换筛选时重置数据
  useEffect(() => {
    const currentMockData = mockTransactions[activeTab];
    const filteredData = getFilteredTransactions(currentMockData, activeFilter);
    setTransactions(filteredData.slice(0, 5));
    setPage(1);
    setHasMore(true);
  }, [activeFilter, activeTab]);

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

  // 获取交易类型的翻译
  const getTransactionTypeText = (type) => {
    const typeMap = {
      'Check-in': t('transaction_history.transaction_types.check_in'),
      'Reward': t('transaction_history.transaction_types.reward'),
      'Transfer': t('transaction_history.transaction_types.transfer'),
      'Mining': t('transaction_history.transaction_types.mining'),
      'Bonus': t('transaction_history.transaction_types.bonus'),
      'Exchange': t('transaction_history.transaction_types.exchange'),
      'Deposit': t('transaction_history.transaction_types.deposit'),
      'Distribution': t('transaction_history.transaction_types.distribution'),
      'Rocket Reward': t('transaction_history.transaction_types.rocket_reward'),
      'Rocket Withdraw': t('transaction_history.transaction_types.rocket_withdraw'),
      'Rocket Bonus': t('transaction_history.transaction_types.rocket_bonus')
    };
    return typeMap[type] || type;
  };

  return (
    <div className="px-[16vw] md:px-4 pt-[20vw] md:pt-5 pb-[24vw] md:pb-6">
      {/* Tab选择器 */}
      <div className="pb-[16vw] md:pb-4">
        <div className="flex gap-[12vw] md:gap-3">
          {['USDR', 'LuckyUSD', 'Rocket'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-[20vw] md:px-5 py-[12vw] md:py-3 rounded-[34vw] md:rounded-full text-size-[16vw] md:text-base font-medium transition-all ${
                activeTab === tab
                  ? 'text-black'
                  : 'text-white'
              }`}
              style={{
                backgroundColor: activeTab === tab ? '#c5ff33' : 'rgb(41, 41, 41)',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 筛选选项 */}
      <div className="pb-[24vw] md:pb-6">
        <div className="flex gap-[8vw] md:gap-2 flex-wrap">
          {filterOptions[activeTab].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-[16vw] md:px-4 py-[8vw] md:py-2 rounded-[20vw] md:rounded-full text-size-[14vw] md:text-sm font-medium transition-all ${
                activeFilter === filter
                  ? 'text-black'
                  : 'text-[#8f8f8f]'
              }`}
              style={{
                backgroundColor: activeFilter === filter ? '#c5ff33' : 'rgb(31, 31, 31)',
              }}
            >
              {t(`transaction_history.filters.${filter}`)}
            </button>
          ))}
        </div>
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
            {t('transaction_history.loading')}
          </div>
        )}
        {!hasMore && !loading && (
          <div className="text-[#8f8f8f] text-size-[14vw] md:text-sm">
            {t('transaction_history.no_more_data')}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
