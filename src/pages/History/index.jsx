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

// 倒计时图标SVG组件
const CountdownIcon = ({ color = '#8f8f8f' }) => (
  <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5" fill="none"/>
    <path d="M8 4v4l3 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

// 代币选择组件
const TokenSelector = ({ selectedToken, onTokenChange }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tokenOptions = [
    { value: 'all', label: t('history.all_tokens'), displayName: t('history.all') },
    { value: 'LUSD', label: 'LuckyUSD', displayName: 'LuckyUSD' },
    { value: 'USDT', label: 'USDT', displayName: 'USDT' },
    { value: 'USDR', label: 'USDR', displayName: 'USDR' }
  ];

  const handleTokenSelect = (token) => {
    onTokenChange(token.value);
    setIsModalOpen(false);
  };

  const getDisplayText = () => {
    const selected = tokenOptions.find(option => option.value === selectedToken);
    return selected ? selected.displayName : t('history.all');
  };

  const getButtonStyle = () => {
    return {
      backgroundColor: selectedToken === 'all' ? '#292929' : '#fff',
      color: selectedToken === 'all' ? '#fff' : '#292929'
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
        <DropdownArrowIcon color={selectedToken === 'all' ? '#fff' : '#292929'} />
      </div>

      {/* 选择弹窗 */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-[20px]">
          <h3 className="text-white text-[18px] font-semibold mb-[20px]">
            {t('history.select_token')}
          </h3>
          <div className="space-y-[12px]">
            {tokenOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => handleTokenSelect(option)}
                className="w-full h-[44px] rounded-[8px] flex items-center justify-center cursor-pointer transition-colors"
                style={{
                  backgroundColor: selectedToken === option.value ? '#fff' : '#292929',
                  color: selectedToken === option.value ? '#292929' : '#fff',
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
  const [betToken, setBetToken] = useState('all');
  const initialLoadRef = useRef(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // 实时价格相关状态
  const [currentPrice, setCurrentPrice] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // 订单状态轮询相关
  const pollIntervalRef = useRef(null);
  const [pendingOrderIds, setPendingOrderIds] = useState(new Set());

  // 直接使用fetchOrders，不需要防重复调用包装

  // WebSocket连接逻辑
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        console.log('🔌 History页面连接WebSocket...');
        wsRef.current = new WebSocket('wss://ws.bitrockets.xyz/ws/price');

        wsRef.current.onopen = () => {
          console.log('✅ History页面WebSocket连接成功');
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
        };

        wsRef.current.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'price_update') {
              const newPrice = parseFloat(message.data.price);
              setCurrentPrice(newPrice);
            }
          } catch (error) {
            console.error('❌ History页面WebSocket消息解析失败:', error);
          }
        };

        wsRef.current.onerror = (error) => {
          console.error('❌ History页面WebSocket连接错误:', error);
        };

        wsRef.current.onclose = (event) => {
          console.log('🔌 History页面WebSocket连接关闭');
          if (wsRef.current !== null) {
            reconnectTimeoutRef.current = setTimeout(connectWebSocket, 1000);
          }
        };

      } catch (error) {
        console.error('❌ History页面WebSocket连接失败:', error);
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 1000);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, []);

  // 订单状态轮询逻辑
  useEffect(() => {
    const pollPendingOrders = async () => {
      if (pendingOrderIds.size === 0) return;

      try {
        const result = await fetchOrders(1, 20, betToken, false);
        if (result && result.success && result.data) {
          const updatedOrders = result.data;
          let hasUpdates = false;
          const newPendingIds = new Set(pendingOrderIds);

          // 检查每个待结算订单的状态
          updatedOrders.forEach(order => {
            if (pendingOrderIds.has(order.id) && order.profit_loss !== "0") {
              // 订单已结算，更新历史数据中的对应项
              setHistoryData(prevData =>
                prevData.map(item =>
                  item.id === order.id ? { ...item, ...order } : item
                )
              );
              newPendingIds.delete(order.id);
              hasUpdates = true;
              console.log(`✅ 订单 ${order.id} 已结算，盈亏: ${order.profit_loss}`);
            }
          });

          if (hasUpdates) {
            setPendingOrderIds(newPendingIds);
          }
        }
      } catch (error) {
        console.error('❌ 轮询订单状态失败:', error);
      }
    };

    // 如果有待结算订单，启动轮询
    if (pendingOrderIds.size > 0) {
      pollIntervalRef.current = setInterval(pollPendingOrders, 5000); // 每5秒轮询一次
    } else {
      // 没有待结算订单，清除轮询
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [pendingOrderIds, betToken, fetchOrders]);

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
    const remainingSeconds = Math.ceil(remainingTime / 1000);

    // 计算进度条的宽度（从右边开始收缩）
    // remainingTime / totalTime 表示剩余的比例
    // 1 - (remainingTime / totalTime) 表示已消耗的比例，即进度条应该显示的宽度
    const progressWidth = Math.min(Math.max(1 - (remainingTime / totalTime), 0), 1);

    return {
      isExpired: false,
      progressWidth, // 进度条宽度（0-1）
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
      const result = await fetchOrders(pageNum, 20, betToken, false);

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

        // 识别待结算订单（profit_loss为"0"的订单）
        const pendingIds = new Set();
        newData.forEach(order => {
          if (order.profit_loss === "0") {
            pendingIds.add(order.id);
          }
        });

        // 更新待结算订单ID集合
        if (isRefresh) {
          setPendingOrderIds(pendingIds);
        } else {
          setPendingOrderIds(prev => new Set([...prev, ...pendingIds]));
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
  }, [loading, betToken, fetchOrders]);

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

  // 代币筛选变化时重新加载数据
  useEffect(() => {
    if (initialLoadRef.current) {
      setPage(1);
      setHasMore(true);
      loadData(1, true);
    }
  }, [betToken]);

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
        <TokenSelector selectedToken={betToken} onTokenChange={setBetToken} />
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
              className={`w-[312vw] md:w-full h-[26vw] md:h-auto flex justify-between items-center pb-[12vw] md:pb-3 ${
                getCountdownInfo(item) && !getCountdownInfo(item).isExpired ? '' : 'border-b'
              }`}
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
                    // 显示倒计时图标，文案颜色根据order_type决定
                    const textColor = item.order_type === 'CALL' ? '#00bc4b' : '#f5384e';
                    return (
                      <div className="flex items-center gap-[4vw] md:gap-1">
                        <span
                          className="font-size-[13vw] md:text-sm"
                          style={{ color: textColor }}
                        >
                          {countdownInfo.remainingSeconds}s
                        </span>
                        <CountdownIcon color="#8f8f8f" />
                      </div>
                    );
                  } else {
                    // 显示状态箭头，根据price_change判断
                    const priceChange = parseFloat(item.price_change || 0);
                    if (priceChange < 0) {
                      return <DownArrowIcon color="#f5384e" />;
                    } else {
                      // priceChange > 0 或 priceChange === null 都显示绿色上箭头
                      return <UpArrowIcon color="#00bc4b" />;
                    }
                  }
                })()}
              </div>
            </div>

            {/* 倒计时进度条（替代分割线位置） */}
            {(() => {
              const countdownInfo = getCountdownInfo(item);
              if (countdownInfo && !countdownInfo.isExpired) {
                // 计算剩余时间比例，用于确定有色线条的宽度
                const remainingRatio = countdownInfo.remainingSeconds / 60; // 60秒总时长
                const coloredWidth = Math.max(remainingRatio * 100, 0); // 有色部分宽度百分比

                return (
                  <div className="w-full h-[0.5px] bg-[#3d3d3d] relative overflow-hidden">
                    <div
                      className="absolute right-0 top-0 h-full transition-all duration-1000 ease-linear"
                      style={{
                        width: `${coloredWidth}%`,
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
                  {formatAmount(item.amount)} {item.bet_token_symbol || 'USDT'}
                </span>
                {(() => {
                  const countdownInfo = getCountdownInfo(item);
                  // 如果订单正在倒计时中，显示"-{amount} USDT"
                  if (countdownInfo && !countdownInfo.isExpired) {
                    return (
                      <span
                        className="font-size-[13vw] md:text-sm"
                        style={{
                          color: '#8f8f8f'
                        }}
                      >
                        -{formatAmount(item.amount)} {item.bet_token_symbol || 'USDT'}
                      </span>
                    );
                  }
                  // 已结算订单显示盈亏
                  const profitLoss = parseFloat(item.profit_loss || 0);
                  return (
                    <span
                      className="font-size-[16vw] md:text-lg font-semibold"
                      style={{
                        fontWeight: 600,
                        color: profitLoss > 0 ? '#c5ff33' : '#ffffff'
                      }}
                    >
                      {`${profitLoss > 0 ? '+' : ''}${formatAmount(item.profit_loss)} ${item.settlement_token_symbol || 'USDT'}`}
                    </span>
                  );
                })()}
              </div>

              {/* 第二行：开盘价和收盘价（无标签） */}
              <div className="flex justify-between items-center">
                <span className="text-[#8f8f8f] font-size-[13vw] md:text-sm">
                  {formatPrice(item.entry_price)}
                </span>
                <span className="text-[#8f8f8f] font-size-[13vw] md:text-sm">
                  {(() => {
                    const countdownInfo = getCountdownInfo(item);
                    // 如果订单正在倒计时中，显示实时价格
                    if (countdownInfo && !countdownInfo.isExpired && currentPrice) {
                      return formatPrice(currentPrice);
                    }
                    // 否则显示固定的收盘价
                    return formatPrice(item.exit_price);
                  })()}
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
                  {betToken === 'all'
                    ? t('history.no_data_description')
                    : t('history.no_data_filtered_description', { token: betToken })
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
