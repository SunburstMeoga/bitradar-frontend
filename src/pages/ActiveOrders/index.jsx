import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';

import { useAuthStore } from '../../store';
import orderService from '../../services/orderService';
import { ErrorDisplay, LoadingSpinner } from '../../components/ErrorBoundary';
import historyUpIcon from '../../assets/icons/history-up.png';
import historyDownIcon from '../../assets/icons/history-down.png';
import toast from 'react-hot-toast';

// 右上45度箭头SVG组件（表示涨）
const UpArrowIcon = ({ color = '#00bc4b' }) => (
  <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
    <path
      d="M5 11L11 5M11 5H7M11 5V9"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 右下135度箭头SVG组件（表示跌）
const DownArrowIcon = ({ color = '#f5384e' }) => (
  <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
    <path
      d="M5 5L11 11M11 11H7M11 11V7"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ActiveOrders = () => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, token } = useAuthStore();
  const navigate = useNavigate();

  // 设置页面标题
  usePageTitle('active_orders');
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const initialLoadRef = useRef(false);

  // 格式化时间
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const locale = i18n.language === 'zh' ? 'zh-CN' : i18n.language === 'ko' ? 'ko-KR' : 'en-US';
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '-');
  };

  // 格式化价格
  const formatPrice = (price) => {
    if (price === null || price === undefined) return '0.00';
    return parseFloat(price).toFixed(2);
  };

  // 格式化金额
  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) return '0.00';
    return parseFloat(amount).toFixed(2);
  };

  // 格式化剩余时间
  const formatRemainingTime = (remainingTime) => {
    if (!remainingTime || remainingTime <= 0) return '00:00';
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // 加载数据
  const loadData = useCallback(async (pageNum = 1, isRefresh = false) => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const result = await orderService.getActiveOrders(pageNum, 20);

      console.log('📋 loadData收到活跃订单结果:', result);

      if (result && result.success) {
        const newData = result.data || [];
        const paginationData = result.pagination;

        console.log('📋 处理活跃订单数据:', {
          newDataLength: newData.length,
          paginationData,
          isRefresh
        });

        // 更新分页信息
        setPagination(paginationData);

        // 检查是否还有更多数据
        if (paginationData && pageNum >= paginationData.last_page) {
          setHasMore(false);
        } else if (!paginationData && newData.length < 20) {
          setHasMore(false);
        }

        // 更新活跃订单数据
        if (isRefresh) {
          setActiveOrders(newData);
          setPage(1);
          setHasMore(true);
        } else {
          setActiveOrders(prev => {
            const prevArray = Array.isArray(prev) ? prev : [];
            const existingIds = new Set(prevArray.map(item => item.id));
            const filteredNewData = newData.filter(item => !existingIds.has(item.id));
            return [...prevArray, ...filteredNewData];
          });
        }
      } else {
        console.error('❌ API调用结果无效:', result);
        throw new Error(result?.message || t('common.request_failed'));
      }
    } catch (err) {
      console.error('Error loading active orders:', err);
      setError(err);
      toast.error(t('common.request_failed'));
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // 初始加载
  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      console.log('📋 ActiveOrders页面初始化:', {
        isAuthenticated,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : null
      });
      loadData(1, true);
    }
  }, []);

  // 触底加载更多
  const handleScroll = useCallback(() => {
    if (loading || !hasMore) return;

    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    const clientHeight = document.documentElement.clientHeight || window.innerHeight;

    if (scrollTop + clientHeight >= scrollHeight - 100) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadData(nextPage, false);
    }
  }, [loading, hasMore, page, loadData]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // 点击订单项跳转到详情页
  const handleOrderClick = (orderId) => {
    navigate(`/order/${orderId}`);
  };

  return (
    <div className="min-h-screen pb-[86vw] md:pb-20" style={{ backgroundColor: 'rgb(18,18,18)' }}>
      {/* 标题 */}
      <div className="px-[16vw] md:px-4 pt-[20vw] md:pt-5 pb-[16vw] md:pb-4">
        <div className="flex justify-between items-center mb-[12vw] md:mb-3">
          <h1 className="text-white font-size-[28vw] md:text-2xl font-semibold" style={{ fontWeight: 600 }}>
            {t('active_orders.title')}
          </h1>
          <button
            onClick={() => navigate('/history')}
            className="h-[34px] px-[16px] rounded-full bg-[#292929] text-[#fff] font-semibold text-[15px] hover:bg-[#3d3d3d] transition-colors"
          >
            {t('history.title')}
          </button>
        </div>
      </div>

      {/* 活跃订单列表 */}
      <div className="px-[16vw] md:px-4">
        {/* 错误状态 */}
        {error && !loading && activeOrders.length === 0 && (
          <ErrorDisplay
            error={error}
            onRetry={() => loadData(1, true)}
            message={t('common.request_failed')}
          />
        )}

        {/* 初始加载状态 */}
        {loading && activeOrders.length === 0 && (
          <LoadingSpinner message={t('loading')} />
        )}

        {Array.isArray(activeOrders) && activeOrders.map((item) => (
          <div
            key={item.id}
            onClick={() => handleOrderClick(item.id)}
            className="w-[342vw] md:w-full h-[150vw] md:h-auto mb-[12vw] md:mb-3 rounded-[12vw] md:rounded-lg p-[16vw] md:p-4 cursor-pointer hover:bg-[#252525] transition-colors"
            style={{
              backgroundColor: '#1f1f1f'
            }}
          >
            {/* 上半部分 */}
            <div
              className="w-[312vw] md:w-full h-[26vw] md:h-auto flex justify-between items-center border-b pb-[12vw] md:pb-3"
              style={{
                borderBottomColor: '#3d3d3d'
              }}
            >
              {/* 左侧内容 */}
              <div className="flex items-center">
                {/* BTC图标 */}
                <img
                  src="https://s2.coinmarketcap.com/static/img/coins/64x64/1.png"
                  alt="BTC"
                  className="w-[24vw] md:w-6 h-[24vw] md:h-6 object-contain"
                />
                {/* 涨跌标志 - 用负margin实现重叠 */}
                <img
                  src={item.direction === 'up' ? historyUpIcon : historyDownIcon}
                  alt={item.direction === 'up' ? 'Up' : 'Down'}
                  className="w-[24vw] md:w-6 h-[24vw] md:h-6 object-contain -ml-[8vw] md:-ml-2"
                />
                {/* 交易对和状态文案 */}
                <div className="ml-[8vw] md:ml-2 flex items-center gap-[8vw] md:gap-2">
                  {/* 交易对文案 */}
                  <span className="text-white font-size-[13vw] md:text-sm font-semibold" style={{ fontWeight: 600 }}>
                    BTC-USD
                  </span>

                  {/* 状态文案 */}
                  <span className="text-[rgb(143,143,143)] font-size-[13vw] md:text-sm" style={{ fontWeight: 400 }}>
                    · {t('active_orders.pending')}
                  </span>
                </div>
              </div>

              {/* 右侧剩余时间 */}
              <div className="text-[#f5384e] font-size-[13vw] md:text-sm font-semibold">
                {formatRemainingTime(item.remaining_time)}
              </div>
            </div>

            {/* 下半部分 - 三行数据 */}
            <div className="mt-[12vw] md:mt-3 space-y-[3vw] md:space-y-1">
              {/* 第一行：投注金额和入场价格 */}
              <div className="flex justify-between items-center">
                <span className="text-white font-size-[16vw] md:text-lg font-semibold" style={{ fontWeight: 600 }}>
                  {formatAmount(item.bet_amount)} {item.token || 'USDT'}
                </span>
                <span className="text-white font-size-[16vw] md:text-lg font-semibold" style={{ fontWeight: 600 }}>
                  {formatPrice(item.entry_price)}
                </span>
              </div>

              {/* 第二行：创建时间和到期时间 */}
              <div className="flex justify-between items-center">
                <span className="text-[#8f8f8f] font-size-[13vw] md:text-sm">
                  {t('active_orders.created_at')}: {formatTime(item.created_at)}
                </span>
                <span className="text-[#8f8f8f] font-size-[13vw] md:text-sm">
                  {t('active_orders.expires_at')}: {formatTime(item.expires_at)}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* 加载状态 */}
        {loading && (
          <div className="text-center py-[20vw] md:py-5">
            <span className="text-[#8f8f8f] font-size-[14vw] md:text-sm">{t('active_orders.loading')}</span>
          </div>
        )}

        {/* 没有更多数据 */}
        {!hasMore && activeOrders.length > 0 && (
          <div className="text-center py-[20vw] md:py-5">
            <span className="text-[#8f8f8f] font-size-[14vw] md:text-sm">{t('active_orders.no_more_data')}</span>
          </div>
        )}

        {/* 空状态 */}
        {!loading && !error && activeOrders.length === 0 && (
          <div className="text-center py-[60vw] md:py-16">
            <div className="flex flex-col items-center gap-[16vw] md:gap-4">
              {/* 空状态图标 */}
              <div className="w-[80vw] md:w-20 h-[80vw] md:h-20 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="w-[40vw] md:w-10 h-[40vw] md:h-10">
                  <path
                    d="M9 11H15M9 15H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L19.7071 9.70711C19.8946 9.89464 20 10.149 20 10.4142V19C20 20.1046 19.1046 21 18 21H17ZM17 21V11H13V7H7V19H17Z"
                    stroke="#8f8f8f"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* 空状态文字 */}
              <div className="flex flex-col items-center gap-[8vw] md:gap-2">
                <span className="text-white font-size-[18vw] md:text-xl font-semibold">
                  {t('active_orders.no_data')}
                </span>
                <span className="text-[#8f8f8f] font-size-[14vw] md:text-sm text-center max-w-[280vw] md:max-w-80">
                  {t('active_orders.no_data_description')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveOrders;
