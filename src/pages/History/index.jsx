import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';

import { useAuthStore, useUserStore } from '../../store';
import { ErrorDisplay, LoadingSpinner } from '../../components/ErrorBoundary';
import historyUpIcon from '../../assets/icons/history-up.png';
import historyDownIcon from '../../assets/icons/history-down.png';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';

// 右上45度箭头SVG组件（表示涨）- 加大尺寸
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

// 右下135度箭头SVG组件（表示跌）- 加大尺寸
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

// 下拉箭头SVG组件
const DropdownArrowIcon = ({ color = '#fff' }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M4 6L8 10L12 6"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 状态选择组件
const StatusSelector = ({ selectedStatus, onStatusChange }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const statusOptions = [
    { value: 'all', label: t('history.all_status'), displayName: t('history.all') },
    { value: 'pending', label: t('history.pending_status'), displayName: t('history.pending') },
    { value: 'win', label: t('history.win_status'), displayName: t('history.win') },
    { value: 'lose', label: t('history.lose_status'), displayName: t('history.lose') }
  ];

  const handleStatusSelect = (status) => {
    onStatusChange(status.value);
    setIsModalOpen(false);
  };

  const getDisplayText = () => {
    const selected = statusOptions.find(option => option.value === selectedStatus);
    return selected ? selected.displayName : t('history.all');
  };

  const getButtonStyle = () => {
    return {
      backgroundColor: selectedStatus === 'all' ? '#292929' : '#fff',
      color: selectedStatus === 'all' ? '#fff' : '#292929'
    };
  };

  return (
    <>
      {/* 选择按钮 */}
      <div
        onClick={() => setIsModalOpen(true)}
        className="h-[34px] rounded-full flex items-center cursor-pointer gap-[8px] inline-flex"
        style={{
          ...getButtonStyle(),
          padding: '0 12px 0 16px',
          fontSize: '15px',
          fontWeight: 600,
          minWidth: 'fit-content',
          whiteSpace: 'nowrap',
          width: 'auto'
        }}
      >
        <span>{getDisplayText()}</span>
        <DropdownArrowIcon color={selectedStatus === 'all' ? '#fff' : '#292929'} />
      </div>

      {/* 选择弹窗 */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-[20px]">
          <h3 className="text-white text-[18px] font-semibold mb-[20px]">
            {t('history.select_status')}
          </h3>
          <div className="space-y-[12px]">
            {statusOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => handleStatusSelect(option)}
                className="w-full h-[44px] rounded-[8px] flex items-center justify-center cursor-pointer transition-colors"
                style={{
                  backgroundColor: selectedStatus === option.value ? '#fff' : '#292929',
                  color: selectedStatus === option.value ? '#292929' : '#fff',
                  fontSize: '15px',
                  fontWeight: 600
                }}
              >
                {option.displayName}
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
};



const History = () => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, token } = useAuthStore();
  const { fetchOrders } = useUserStore();
  const navigate = useNavigate();

  // 设置页面标题
  usePageTitle('history');
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [status, setStatus] = useState('all');
  const initialLoadRef = useRef(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // 直接使用fetchOrders，不需要防重复调用包装

  // 更新当前时间的定时器
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 计算倒计时信息
  const getCountdownInfo = (item) => {
    if (!item.backend_confirm_time) {
      return null;
    }

    // backend_confirm_time 已经是毫秒时间戳，直接使用
    const confirmTime = item.backend_confirm_time;
    const settlementTime = confirmTime + 60000; // 加1分钟（60000毫秒）
    const remainingTime = settlementTime - currentTime;

    if (remainingTime <= 0) {
      return { isExpired: true, progress: 0, remainingSeconds: 0 };
    }

    const totalTime = 60000; // 1分钟总时长
    const progress = (totalTime - remainingTime) / totalTime; // 已过去的进度
    const remainingSeconds = Math.ceil(remainingTime / 1000);

    return {
      isExpired: false,
      progress: Math.min(Math.max(progress, 0), 1), // 确保在0-1之间
      remainingSeconds
    };
  };

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

  // 加载数据
  const loadData = useCallback(async (pageNum = 1, isRefresh = false) => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      // 使用真实API
      const result = await fetchOrders(pageNum, 20, status, false);

      console.log('📋 loadData收到结果:', result);

      if (result && result.success) {
        const newData = result.data || [];
        const paginationData = result.pagination;

        console.log('📋 处理数据:', {
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

        // 更新历史数据
        if (isRefresh) {
          setHistoryData(newData);
          setPage(1);
          setHasMore(true);
        } else {
          setHistoryData(prev => {
            const prevArray = Array.isArray(prev) ? prev : [];
            const existingIds = new Set(prevArray.map(item => item.id));
            const filteredNewData = newData.filter(item => !existingIds.has(item.id));
            return [...prevArray, ...filteredNewData];
          });
        }
      } else {
        console.error('❌ API调用结果无效:', result);
        throw new Error(result?.message || '获取订单历史失败');
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [loading, status, fetchOrders]);

  // 初始加载
  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      console.log('📋 History页面初始化:', {
        isAuthenticated,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : null
      });
      loadData(1, true);
    }
  }, []);

  // 状态变化时重新加载数据
  useEffect(() => {
    if (initialLoadRef.current) {
      setPage(1);
      setHasMore(true);
      loadData(1, true);
    }
  }, [status]);

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

  return (
    <div className="min-h-screen pb-[86vw] md:pb-20" style={{ backgroundColor: 'rgb(18,18,18)' }}>
      {/* 标题 */}
      <div className="px-[16vw] md:px-4 pt-[20vw] md:pt-5 pb-[16vw] md:pb-4">
        <div className="flex justify-between items-center mb-[12vw] md:mb-3">
          <h1 className="text-white font-size-[28vw] md:text-2xl font-semibold" style={{ fontWeight: 600 }}>
            {t('history.title')}
          </h1>
          <button
            onClick={() => navigate('/active-orders')}
            className="h-[34px] px-[16px] rounded-full bg-[#fff] text-[#292929] font-semibold text-[15px] hover:bg-[#f0f0f0] transition-colors"
          >
            {t('active_orders.title')}
          </button>
        </div>
        <StatusSelector selectedStatus={status} onStatusChange={setStatus} />
      </div>

      {/* 历史记录列表 */}
      <div className="px-[16vw] md:px-4">
        {/* 错误状态 */}
        {error && !loading && historyData.length === 0 && (
          <ErrorDisplay
            error={error}
            onRetry={() => loadData(1, true)}
            message="加载交易历史失败"
          />
        )}

        {/* 初始加载状态 */}
        {loading && historyData.length === 0 && (
          <LoadingSpinner message="加载交易历史中..." />
        )}

        {Array.isArray(historyData) && historyData.map((item) => (
          <div
            key={item.id}
            className="w-[342vw] md:w-full h-[150vw] md:h-auto mb-[12vw] md:mb-3 rounded-[12vw] md:rounded-lg p-[16vw] md:p-4"
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
                {/* 涨跌标志 - 根据order_type判断 */}
                <img
                  src={item.order_type === 'CALL' ? historyUpIcon : historyDownIcon}
                  alt={item.order_type === 'CALL' ? 'Up' : 'Down'}
                  className="w-[24vw] md:w-6 h-[24vw] md:h-6 object-contain -ml-[8vw] md:-ml-2"
                />
                {/* 交易对和时间文案 */}
                <div className="ml-[8vw] md:ml-2 flex items-center gap-[8vw] md:gap-2">
                  {/* 交易对文案 */}
                  <span className="text-white font-size-[13vw] md:text-sm font-semibold" style={{ fontWeight: 600 }}>
                    BTC-USD
                  </span>
                  {/* 固定的1m文案 */}
                  <span className="text-[#8f8f8f] font-size-[13vw] md:text-sm" style={{ fontWeight: 400 }}>
                    · 1m
                  </span>
                </div>
              </div>

              {/* 右侧倒计时或状态 */}
              <div className="flex items-center">
                {(() => {
                  const countdownInfo = getCountdownInfo(item);
                  if (countdownInfo && !countdownInfo.isExpired) {
                    // 显示倒计时
                    return (
                      <div className="flex items-center gap-[4vw] md:gap-1">
                        <span className="text-white font-size-[13vw] md:text-sm">
                          {countdownInfo.remainingSeconds}s
                        </span>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" stroke="#3d3d3d" strokeWidth="2"/>
                          <circle
                            cx="8"
                            cy="8"
                            r="7"
                            stroke={item.order_type === 'CALL' ? '#00bc4b' : '#f5384e'}
                            strokeWidth="2"
                            strokeDasharray={`${2 * Math.PI * 7}`}
                            strokeDashoffset={`${2 * Math.PI * 7 * (1 - countdownInfo.progress)}`}
                            transform="rotate(-90 8 8)"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    );
                  } else {
                    // 显示状态箭头
                    return item.status === 'win' ? (
                      <UpArrowIcon color="#00bc4b" />
                    ) : item.status === 'lose' ? (
                      <DownArrowIcon color="#f5384e" />
                    ) : (
                      <div className="w-[24px] h-[24px] rounded-full bg-gray-500 flex items-center justify-center">
                        <span className="text-white text-xs">?</span>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>

            {/* 倒计时进度条（如果订单正在结算中） */}
            {(() => {
              const countdownInfo = getCountdownInfo(item);
              if (countdownInfo && !countdownInfo.isExpired) {
                return (
                  <div className="w-full h-[2px] my-[12vw] md:my-3 bg-[#3d3d3d] relative overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full transition-all duration-1000 ease-linear"
                      style={{
                        width: `${countdownInfo.progress * 100}%`,
                        backgroundColor: item.order_type === 'CALL' ? '#00bc4b' : '#f5384e'
                      }}
                    />
                  </div>
                );
              }
              return null;
            })()}

            {/* 下半部分 - 三行数据 */}
            <div className="mt-[12vw] md:mt-3 space-y-[3vw] md:space-y-1">
              {/* 第一行：投注金额和盈亏 */}
              <div className="flex justify-between items-center">
                <span className="text-white font-size-[16vw] md:text-lg font-semibold" style={{ fontWeight: 600 }}>
                  {formatAmount(item.amount)} USDT
                </span>
                <span
                  className="font-size-[16vw] md:text-lg font-semibold"
                  style={{
                    fontWeight: 600,
                    color: parseFloat(item.profit_loss || 0) > 0 ? 'rgb(197, 255, 51)' : '#f5384e'
                  }}
                >
                  {parseFloat(item.profit_loss || 0) > 0 ? '+' : ''}{formatAmount(item.profit_loss)} USDT
                </span>
              </div>

              {/* 第二行：开盘价和收盘价（无标签） */}
              <div className="flex justify-between items-center">
                <span className="text-[#8f8f8f] font-size-[13vw] md:text-sm">
                  {formatPrice(item.entry_price)}
                </span>
                <span className="text-[#8f8f8f] font-size-[13vw] md:text-sm">
                  {formatPrice(item.exit_price)}
                </span>
              </div>

              {/* 第三行：开盘时间和结算时间（无标签） */}
              <div className="flex justify-between items-center">
                <span className="text-[#8f8f8f] font-size-[13vw] md:text-sm">
                  {formatTime(item.created_at)}
                </span>
                <span className="text-[#8f8f8f] font-size-[13vw] md:text-sm">
                  {item.settlement_time
                    ? formatTime(new Date(item.settlement_time).toISOString())
                    : formatTime(new Date(item.backend_confirm_time + 60000).toISOString())
                  }
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* 加载状态 */}
        {loading && (
          <div className="text-center py-[20vw] md:py-5">
            <span className="text-[#8f8f8f] font-size-[14vw] md:text-sm">{t('history.loading')}</span>
          </div>
        )}

        {/* 没有更多数据 */}
        {!hasMore && historyData.length > 0 && (
          <div className="text-center py-[20vw] md:py-5">
            <span className="text-[#8f8f8f] font-size-[14vw] md:text-sm">{t('history.no_more_data')}</span>
          </div>
        )}

        {/* 空状态 */}
        {!loading && !error && historyData.length === 0 && (
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
                  {t('history.no_data')}
                </span>
                <span className="text-[#8f8f8f] font-size-[14vw] md:text-sm text-center max-w-[280vw] md:max-w-80">
                  {status === 'all'
                    ? t('history.no_data_description')
                    : t('history.no_data_filtered_description', { status: t(`history.${status}`) })
                  }
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
