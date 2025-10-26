import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import usePageTitle from '../../hooks/usePageTitle';
import { useAuthStore } from '../../store';
import { transactionService } from '../../services';
import toast from 'react-hot-toast';
import transactionIcon from '../../assets/images/account-transation.png';
import { formatPreciseTime } from '../../utils/time';
import { useLocation } from 'react-router-dom';

const TransactionHistory = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  // 设置页面标题
  usePageTitle('token_history');
  const [activeTab, setActiveTab] = useState('LuckyUSD'); // 使用UI显示名称作为默认
  const [activeFilter, setActiveFilter] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const loadMoreRef = useRef(null);
  const pageSize = 20; // 每页加载20条记录

  // 代币符号映射（将UI显示的名称映射到API的token_symbol）
  const tokenSymbolMap = {
    'USDT': 'USDT',
    'USDR': 'USDR',
    'LuckyUSD': 'LUSD',
    'Rocket': 'ROCKET'
  };

  // 反向映射（将 API token_symbol 映射回 UI 标签名）
  const symbolToTabMap = {
    'USDT': 'USDT',
    'USDR': 'USDR',
    'LUSD': 'LuckyUSD',
    'ROCKET': 'Rocket'
  };

  // 筛选选项配置（基于交易类型分类）
  const filterOptions = {
    USDT: ['all', 'deposit', 'withdraw', 'trade'],
    USDR: ['all', 'reward', 'trade', 'withdraw'],
    LuckyUSD: ['all', 'reward', 'trade'],
    Rocket: ['all', 'reward', 'withdraw']
  };

  // 将筛选类别映射到API的transaction_type
  const getTransactionTypesByFilter = (filter) => {
    const typeMap = {
      'deposit': ['DEPOSIT', 'TEST_ADD', 'LUSD_CLAIM'],
      'withdraw': ['WITHDRAW'],
      'trade': ['BET', 'WIN', 'LOSE', 'REFUND', 'FEE', 'MEMBERSHIP_UPGRADE'],
      'reward': ['REFERRAL_REWARD', 'TRADING_MINING_REWARD', 'STAKE_REWARD', 'MEMBERSHIP_UPGRADE_REWARD', 'REFERRAL_ACTIVITY_REWARD', 'REFERRAL_ACTIVITY_LAYER_REWARD']
    };
    return typeMap[filter] || [];
  };

  // 根据单个 transaction_type 反向映射到筛选类别
  const mapTypeToFilter = (type) => {
    return transactionService.getTransactionCategory(type) || 'all';
  };

  // 加载交易记录数据
  const loadTransactions = useCallback(async (pageNum = 1, isLoadMore = false) => {
    if (!isAuthenticated) {
      console.log('用户未认证，跳过加载交易记录');
      return;
    }

    if (loading) return;

    try {
      setLoading(true);
      setError(null);

      // 构建API请求参数
      const params = {
        limit: pageSize,
        offset: (pageNum - 1) * pageSize,
        token_symbol: tokenSymbolMap[activeTab]
      };

      // 如果有筛选条件，添加transaction_type参数
      if (activeFilter !== 'all') {
        const transactionTypes = getTransactionTypesByFilter(activeFilter);
        if (transactionTypes.length > 0) {
          // API只支持单个transaction_type，所以我们需要分别请求然后合并
          // 为了简化，这里先用第一个类型，后续可以优化为多次请求合并
          params.transaction_type = transactionTypes[0];
        }
      }

      console.log('🔄 加载交易记录，参数:', params);

      const result = await transactionService.getTransactions(params);

      if (result.success) {
        const newTransactions = result.data || [];

        if (isLoadMore) {
          setTransactions(prev => [...prev, ...newTransactions]);
        } else {
          setTransactions(newTransactions);
        }

        setTotalCount(result.count || 0);
        // 使用count和当前已加载的数据量来判断是否还有更多数据
        const currentTotal = isLoadMore ? transactions.length + newTransactions.length : newTransactions.length;
        setHasMore(result.count > currentTotal);
        setPage(pageNum);

        console.log(`✅ 成功加载 ${newTransactions.length} 条交易记录`);
      }
    } catch (error) {
      console.error('❌ 加载交易记录失败:', error);
      setError(error.message || '加载失败');

      if (!isLoadMore) {
        setTransactions([]);
      }

      toast.error('加载交易记录失败');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, activeTab, activeFilter, pageSize]);

  // 处理触底加载更多
  const handleLoadMore = useCallback(() => {
    if (loading || !hasMore) return;
    loadTransactions(page + 1, true);
  }, [loading, hasMore, page, loadTransactions]);

  // 解析路由查询参数并设置默认 Tab/Filter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token_symbol') || searchParams.get('token');
    const type = searchParams.get('transaction_type');

    let nextTab = null;
    let nextFilter = null;

    if (token && symbolToTabMap[token]) {
      nextTab = symbolToTabMap[token];
    }

    if (type && type !== 'all') {
      nextFilter = mapTypeToFilter(type);
    } else if (searchParams.has('transaction_type') && type === 'all') {
      nextFilter = 'all';
    }

    // 批量更新状态并触发初始加载
    if (nextTab) setActiveTab(nextTab);
    if (nextFilter) setActiveFilter(nextFilter);

    // 若仅 token 存在，且未显式指定 type，则默认 all
    if (token && !searchParams.has('transaction_type')) {
      setActiveFilter('all');
    }
  }, [location.search]);

  // 初始加载和认证状态变化时加载数据
  useEffect(() => {
    if (isAuthenticated) {
      loadTransactions(1, false);
    } else {
      setTransactions([]);
      setTotalCount(0);
      setHasMore(false);
      setError(null);
    }
  }, [isAuthenticated]); // 移除loadTransactions依赖

  // 切换tab时重置数据和筛选
  useEffect(() => {
    setActiveFilter('all'); // 重置筛选为全部
    setTransactions([]);
    setPage(1);
    setHasMore(true);
    setError(null);

    if (isAuthenticated) {
      // 延迟一下让activeFilter状态更新完成
      setTimeout(() => {
        loadTransactions(1, false);
      }, 100);
    }
  }, [activeTab, isAuthenticated]); // 添加isAuthenticated依赖

  // 切换筛选时重置数据
  useEffect(() => {
    setTransactions([]);
    setPage(1);
    setHasMore(true);
    setError(null);

    if (isAuthenticated) {
      loadTransactions(1, false);
    }
  }, [activeFilter, isAuthenticated]); // 添加isAuthenticated依赖

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

  // 精确到秒的时间显示（统一工具）
  const formatTime = (isoString) => formatPreciseTime(isoString);

  // 获取交易类型的翻译（适配API返回的transaction_type）
  const getTransactionTypeText = (transactionType) => {
    // 优先使用 i18n 多语言映射，若未配置则回退到服务内置格式
    const i18nKey = `token_history.transaction_types.${transactionType}`;
    const translated = t(i18nKey);
    if (translated && translated !== i18nKey) {
      return translated;
    }
    return transactionService.formatTransactionType(transactionType);
  };

  // 格式化金额显示
  const formatAmount = (amount) => {
    return transactionService.formatAmount(amount);
  };



  return (
    <div className="px-[16vw] md:px-4 pt-[20vw] md:pt-5 pb-[24vw] md:pb-6">
      {/* Tab选择器 */}
      <div className="pb-[16vw] md:pb-4">
        <div className="flex gap-[8vw] md:gap-2">
          {['USDT', 'USDR', 'LuckyUSD', 'Rocket'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-[14vw] md:px-3.5 py-[12vw] md:py-3 rounded-[34vw] md:rounded-full text-size-[14vw] md:text-sm font-medium transition-all flex-1 text-center ${
                activeTab === tab
                  ? 'text-black'
                  : 'text-white'
              }`}
              style={{
                backgroundColor: activeTab === tab ? 'rgb(200, 200, 200)' : 'rgb(41, 41, 41)',
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
          {(filterOptions[activeTab] || []).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-[16vw] md:px-4 py-[8vw] md:py-2 rounded-[20vw] md:rounded-full text-size-[14vw] md:text-sm font-medium transition-all ${
                activeFilter === filter
                  ? 'text-black'
                  : 'text-[#8f8f8f]'
              }`}
              style={{
                backgroundColor: activeFilter === filter ? 'rgb(200, 200, 200)' : 'rgb(31, 31, 31)',
              }}
            >
              {t(`token_history.filters.${filter}`)}
            </button>
          ))}
        </div>
      </div>

      {/* 错误状态 */}
      {error && !loading && (!Array.isArray(transactions) || transactions.length === 0) && (
        <div className="flex flex-col items-center justify-center py-[40vw] md:py-10">
          <div className="text-red-400 text-size-[16vw] md:text-base mb-[8vw] md:mb-2">
            {error}
          </div>
          <button
            onClick={() => loadTransactions(1, false)}
            className="px-[24vw] md:px-6 py-[12vw] md:py-3 bg-blue-600 text-white rounded-[8vw] md:rounded-lg text-size-[14vw] md:text-sm"
          >
            重试
          </button>
        </div>
      )}

      {/* 未认证状态 */}
      {!isAuthenticated && (
        <div className="flex flex-col items-center justify-center py-[40vw] md:py-10">
          <div className="text-[#8f8f8f] text-size-[16vw] md:text-base">
            请先连接钱包并登录
          </div>
        </div>
      )}

      {/* 初始加载状态 */}
      {loading && (!Array.isArray(transactions) || transactions.length === 0) && (
        <div className="flex justify-center py-[40vw] md:py-10">
          <div className="text-[#8f8f8f] text-size-[14vw] md:text-sm">
            {t('token_history.loading')}
          </div>
        </div>
      )}

      {/* 空数据状态 */}
      {!loading && !error && isAuthenticated && (!Array.isArray(transactions) || transactions.length === 0) && (
        <div className="flex flex-col items-center justify-center py-[40vw] md:py-10">
          <div className="text-[#8f8f8f] text-size-[16vw] md:text-base">
            暂无交易记录
          </div>
        </div>
      )}

      {/* 交易列表 */}
      {Array.isArray(transactions) && transactions.length > 0 && (
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
                    {(
                      activeTab === 'LuckyUSD' && transaction.transaction_type === 'BET'
                        ? '下单'
                        : activeTab === 'LuckyUSD' && transaction.transaction_type === 'WIN'
                        ? '盈利'
                        : getTransactionTypeText(transaction.transaction_type)
                    )}
                  </span>
                  <span className="text-[#8f8f8f] text-size-[13vw] md:text-sm">
                    {formatTime(transaction.created_at)}
                  </span>
                </div>
              </div>

              {/* 右侧金额 */}
              <div className="text-white text-size-[17vw] md:text-lg font-semibold" style={{ fontWeight: 600 }}>
                {formatAmount(transaction.amount)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 加载更多指示器 */}
      {Array.isArray(transactions) && transactions.length > 0 && (
        <div ref={loadMoreRef} className="pt-[24vw] md:pt-6 pb-[24vw] md:pb-6 flex justify-center">
          {loading && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span className="text-[#8f8f8f] text-size-[14vw] md:text-sm">
                {t('token_history.loading')}
              </span>
            </div>
          )}
          {!hasMore && !loading && totalCount > 0 && (
            <div className="text-[#8f8f8f] text-size-[14vw] md:text-sm">
              {t('token_history.no_more_data')} (共 {totalCount} 条记录)
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
