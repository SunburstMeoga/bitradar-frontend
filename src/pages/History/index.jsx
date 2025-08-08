import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import usePageTitle from '../../hooks/usePageTitle';
import historyUpIcon from '../../assets/icons/history-up.png';
import historyDownIcon from '../../assets/icons/history-down.png';

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



// 模拟交易历史数据
const generateMockData = (page = 1, pageSize = 10) => {
  const data = [];
  const startIndex = (page - 1) * pageSize;
  const timestamp = Date.now(); // 添加时间戳确保唯一性

  for (let i = 0; i < pageSize; i++) {
    const index = startIndex + i;
    const isUp = Math.random() > 0.5;
    const isWin = Math.random() > 0.4; // 60%胜率
    const amount = Math.floor(Math.random() * 300) + 50;
    const profit = isWin ? Math.floor(amount * (Math.random() * 0.8 + 0.2)) : -amount;
    const openPrice = 115000 + Math.random() * 1000;
    const closePrice = openPrice + (Math.random() - 0.5) * 500;

    // 随机选择交易时长
    const durations = ['1m', '5m', '15m', '30m', '1h'];
    const duration = durations[Math.floor(Math.random() * durations.length)];
    const durationMinutes = duration === '1m' ? 1 : duration === '5m' ? 5 : duration === '15m' ? 15 : duration === '30m' ? 30 : 60;

    // 生成时间
    const now = new Date();
    const openTime = new Date(now.getTime() - (index + 1) * 60000 * Math.random() * 10);
    const closeTime = new Date(openTime.getTime() + durationMinutes * 60000);

    data.push({
      id: `trade_${page}_${index}_${timestamp}_${i}`, // 使用页码、索引、时间戳和循环索引确保唯一性
      direction: isUp ? 'up' : 'down',
      result: isWin ? 'win' : 'lose',
      amount,
      profit,
      openPrice,
      closePrice,
      openTime: openTime.toISOString(),
      closeTime: closeTime.toISOString(),
      duration: duration
    });
  }

  return data;
};

const History = () => {
  const { t, i18n } = useTranslation();

  // 设置页面标题
  usePageTitle('history');
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // 格式化时间
  const formatTime = (isoString) => {
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
    return price.toFixed(2);
  };

  // 加载数据
  const loadData = useCallback(async (pageNum = 1, isRefresh = false) => {
    if (loading) return;

    setLoading(true);

    try {
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 500));

      const newData = generateMockData(pageNum, 10);

      if (isRefresh) {
        setHistoryData(newData);
        setPage(1); // 重置页码
      } else {
        setHistoryData(prev => {
          // 检查是否已存在相同的数据，避免重复添加
          const existingIds = new Set(prev.map(item => item.id));
          const filteredNewData = newData.filter(item => !existingIds.has(item.id));
          return [...prev, ...filteredNewData];
        });
      }

      // 模拟没有更多数据的情况
      if (pageNum >= 5) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // 初始加载
  useEffect(() => {
    loadData(1, true);
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

  return (
    <div className="min-h-screen pb-[86vw] md:pb-20" style={{ backgroundColor: 'rgb(18,18,18)' }}>
      {/* 标题 */}
      <div className="px-[16vw] md:px-4 pt-[20vw] md:pt-5 pb-[16vw] md:pb-4">
        <h1 className="text-white font-size-[28vw] md:text-2xl font-semibold" style={{ fontWeight: 600 }}>
          {t('history.title')}
        </h1>
      </div>

      {/* 历史记录列表 */}
      <div className="px-[16vw] md:px-4">
        {historyData.map((item) => (
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
                {/* 涨跌标志 - 用负margin实现重叠 */}
                <img
                  src={item.direction === 'up' ? historyUpIcon : historyDownIcon}
                  alt={item.direction === 'up' ? 'Up' : 'Down'}
                  className="w-[24vw] md:w-6 h-[24vw] md:h-6 object-contain -ml-[8vw] md:-ml-2"
                />
                {/* 交易对和时间文案 */}
                <div className="ml-[8vw] md:ml-2 flex items-center gap-[8vw] md:gap-2">
                  {/* 交易对文案 */}
                  <span className="text-white font-size-[13vw] md:text-sm font-semibold" style={{ fontWeight: 600 }}>
                    BTC-USD
                  </span>

                  {/* 时间文案 */}
                  <span className="text-[rgb(143,143,143)] font-size-[13vw] md:text-sm" style={{ fontWeight: 400 }}>
                    · {t(`history.duration_${item.duration}`)}
                  </span>
                </div>
              </div>

              {/* 右侧箭头 */}
              <div>
                {item.result === 'win' ? (
                  <UpArrowIcon color="#00bc4b" />
                ) : (
                  <DownArrowIcon color="#f5384e" />
                )}
              </div>
            </div>

            {/* 下半部分 - 三行数据 */}
            <div className="mt-[12vw] md:mt-3 space-y-[3vw] md:space-y-1">
              {/* 第一行：投注金额和盈亏 */}
              <div className="flex justify-between items-center">
                <span className="text-white font-size-[16vw] md:text-lg font-semibold" style={{ fontWeight: 600 }}>
                  {item.amount} pUSD
                </span>
                <span
                  className="font-size-[16vw] md:text-lg font-semibold"
                  style={{
                    fontWeight: 600,
                    color: item.profit > 0 ? 'rgb(197, 255, 51)' : '#f5384e'
                  }}
                >
                  {item.profit > 0 ? '+' : ''}{item.profit} pUSD
                </span>
              </div>

              {/* 第二行：开盘价和收盘价 */}
              <div className="flex justify-between items-center">
                <span className="text-[#8f8f8f] font-size-[13vw] md:text-sm">
                  {formatPrice(item.openPrice)}
                </span>
                <span className="text-[#8f8f8f] font-size-[13vw] md:text-sm">
                  {formatPrice(item.closePrice)}
                </span>
              </div>

              {/* 第三行：开盘时间和封盘时间 */}
              <div className="flex justify-between items-center">
                <span className="text-[#8f8f8f] font-size-[13vw] md:text-sm">
                  {formatTime(item.openTime)}
                </span>
                <span className="text-[#8f8f8f] font-size-[13vw] md:text-sm">
                  {formatTime(item.closeTime)}
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
        {!loading && historyData.length === 0 && (
          <div className="text-center py-[40vw] md:py-10">
            <span className="text-[#8f8f8f] font-size-[16vw] md:text-lg">{t('history.no_data')}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
