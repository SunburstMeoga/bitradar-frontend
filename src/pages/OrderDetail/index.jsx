import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';

import { useAuthStore } from '../../store';
import orderService from '../../services/orderService';
import { ErrorDisplay, LoadingSpinner } from '../../components/ErrorBoundary';
import historyUpIcon from '../../assets/icons/history-up.png';
import historyDownIcon from '../../assets/icons/history-down.png';
import toast from 'react-hot-toast';

// 返回箭头SVG组件
const BackArrowIcon = ({ color = '#fff' }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M19 12H5M12 19L5 12L12 5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

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

const OrderDetail = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuthStore();

  // 设置页面标题
  usePageTitle('order_detail');
  const [orderDetail, setOrderDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // 获取状态显示文本
  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return t('order_detail.pending');
      case 'win':
        return t('order_detail.win');
      case 'lose':
        return t('order_detail.lose');
      default:
        return status;
    }
  };

  // 获取状态颜色
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#8f8f8f';
      case 'win':
        return '#00bc4b';
      case 'lose':
        return '#f5384e';
      default:
        return '#8f8f8f';
    }
  };

  // 加载订单详情
  const loadOrderDetail = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      console.log('📋 请求订单详情:', { orderId: id });
      const result = await orderService.getOrder(id);

      console.log('📋 订单详情响应:', result);

      if (result && result.success) {
        setOrderDetail(result.data.order || result.data);
      } else {
        throw new Error(result?.message || t('common.request_failed'));
      }
    } catch (err) {
      console.error('Error loading order detail:', err);
      setError(err);
      toast.error(t('common.request_failed'));
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    if (id) {
      loadOrderDetail();
    }
  }, [id]);

  // 返回按钮处理
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen pb-[86vw] md:pb-20" style={{ backgroundColor: 'rgb(18,18,18)' }}>
      {/* 标题栏 */}
      <div className="px-[16vw] md:px-4 pt-[20vw] md:pt-5 pb-[16vw] md:pb-4">
        <div className="flex items-center gap-[12vw] md:gap-3 mb-[12vw] md:mb-3">
          <button
            onClick={handleBack}
            className="w-[32vw] md:w-8 h-[32vw] md:h-8 flex items-center justify-center"
          >
            <BackArrowIcon />
          </button>
          <h1 className="text-white font-size-[28vw] md:text-2xl font-semibold" style={{ fontWeight: 600 }}>
            {t('order_detail.title')}
          </h1>
        </div>
      </div>

      {/* 订单详情内容 */}
      <div className="px-[16vw] md:px-4">
        {/* 错误状态 */}
        {error && !loading && (
          <ErrorDisplay
            error={error}
            onRetry={() => loadOrderDetail()}
            message={t('common.request_failed')}
          />
        )}

        {/* 加载状态 */}
        {loading && (
          <LoadingSpinner message={t('loading')} />
        )}

        {/* 订单详情 */}
        {orderDetail && (
          <div
            className="w-[342vw] md:w-full rounded-[12vw] md:rounded-lg p-[20vw] md:p-5"
            style={{
              backgroundColor: '#1f1f1f'
            }}
          >
            {/* 订单头部信息 */}
            <div
              className="flex justify-between items-center border-b pb-[16vw] md:pb-4 mb-[16vw] md:mb-4"
              style={{
                borderBottomColor: '#3d3d3d'
              }}
            >
              {/* 左侧：交易对和方向 */}
              <div className="flex items-center">
                {/* BTC图标 */}
                <img
                  src="https://s2.coinmarketcap.com/static/img/coins/64x64/1.png"
                  alt="BTC"
                  className="w-[32vw] md:w-8 h-[32vw] md:h-8 object-contain"
                />
                {/* 涨跌标志 */}
                <img
                  src={orderDetail.direction === 'up' ? historyUpIcon : historyDownIcon}
                  alt={orderDetail.direction === 'up' ? 'Up' : 'Down'}
                  className="w-[32vw] md:w-8 h-[32vw] md:h-8 object-contain -ml-[10vw] md:-ml-3"
                />
                {/* 交易对信息 */}
                <div className="ml-[12vw] md:ml-3">
                  <div className="text-white font-size-[18vw] md:text-lg font-semibold" style={{ fontWeight: 600 }}>
                    {orderDetail.trading_pair || 'BTC/USDT'}
                  </div>
                  <div className="text-[#8f8f8f] font-size-[14vw] md:text-sm">
                    {t('order_detail.order_id')}: #{orderDetail.id}
                  </div>
                </div>
              </div>

              {/* 右侧：状态 */}
              <div className="text-right">
                <div
                  className="font-size-[16vw] md:text-base font-semibold"
                  style={{
                    fontWeight: 600,
                    color: getStatusColor(orderDetail.status)
                  }}
                >
                  {getStatusText(orderDetail.status)}
                </div>
                {orderDetail.status === 'win' ? (
                  <UpArrowIcon color="#00bc4b" />
                ) : orderDetail.status === 'lose' ? (
                  <DownArrowIcon color="#f5384e" />
                ) : (
                  <div className="w-[24px] h-[24px] rounded-full bg-gray-500 flex items-center justify-center ml-auto">
                    <span className="text-white text-xs">?</span>
                  </div>
                )}
              </div>
            </div>

            {/* 订单详细信息 */}
            <div className="space-y-[16vw] md:space-y-4">
              {/* 投注信息 */}
              <div className="grid grid-cols-2 gap-[16vw] md:gap-4">
                <div>
                  <div className="text-[#8f8f8f] font-size-[14vw] md:text-sm mb-[4vw] md:mb-1">
                    {t('order_detail.bet_amount')}
                  </div>
                  <div className="text-white font-size-[18vw] md:text-lg font-semibold" style={{ fontWeight: 600 }}>
                    {formatAmount(orderDetail.bet_amount)} {orderDetail.token || 'USDT'}
                  </div>
                </div>
                <div>
                  <div className="text-[#8f8f8f] font-size-[14vw] md:text-sm mb-[4vw] md:mb-1">
                    {t('order_detail.direction')}
                  </div>
                  <div
                    className="font-size-[18vw] md:text-lg font-semibold"
                    style={{
                      fontWeight: 600,
                      color: orderDetail.direction === 'up' ? '#00bc4b' : '#f5384e'
                    }}
                  >
                    {orderDetail.direction === 'up' ? t('order_detail.up') : t('order_detail.down')}
                  </div>
                </div>
              </div>

              {/* 价格信息 */}
              <div className="grid grid-cols-2 gap-[16vw] md:gap-4">
                <div>
                  <div className="text-[#8f8f8f] font-size-[14vw] md:text-sm mb-[4vw] md:mb-1">
                    {t('order_detail.entry_price')}
                  </div>
                  <div className="text-white font-size-[18vw] md:text-lg font-semibold" style={{ fontWeight: 600 }}>
                    {formatPrice(orderDetail.entry_price)}
                  </div>
                </div>
                <div>
                  <div className="text-[#8f8f8f] font-size-[14vw] md:text-sm mb-[4vw] md:mb-1">
                    {t('order_detail.close_price')}
                  </div>
                  <div className="text-white font-size-[18vw] md:text-lg font-semibold" style={{ fontWeight: 600 }}>
                    {orderDetail.close_price ? formatPrice(orderDetail.close_price) : t('order_detail.pending')}
                  </div>
                </div>
              </div>

              {/* 盈亏信息 */}
              {orderDetail.profit !== null && orderDetail.profit !== undefined && (
                <div>
                  <div className="text-[#8f8f8f] font-size-[14vw] md:text-sm mb-[4vw] md:mb-1">
                    {t('order_detail.profit')}
                  </div>
                  <div
                    className="font-size-[20vw] md:text-xl font-semibold"
                    style={{
                      fontWeight: 600,
                      color: parseFloat(orderDetail.profit || 0) > 0 ? 'rgb(197, 255, 51)' : '#f5384e'
                    }}
                  >
                    {parseFloat(orderDetail.profit || 0) > 0 ? '+' : ''}{formatAmount(orderDetail.profit)} {orderDetail.token || 'USDT'}
                  </div>
                </div>
              )}

              {/* 时间信息 */}
              <div className="grid grid-cols-1 gap-[12vw] md:gap-3">
                <div>
                  <div className="text-[#8f8f8f] font-size-[14vw] md:text-sm mb-[4vw] md:mb-1">
                    {t('order_detail.created_at')}
                  </div>
                  <div className="text-white font-size-[16vw] md:text-base">
                    {formatTime(orderDetail.created_at)}
                  </div>
                </div>
                <div>
                  <div className="text-[#8f8f8f] font-size-[14vw] md:text-sm mb-[4vw] md:mb-1">
                    {t('order_detail.expires_at')}
                  </div>
                  <div className="text-white font-size-[16vw] md:text-base">
                    {formatTime(orderDetail.expires_at)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetail;
