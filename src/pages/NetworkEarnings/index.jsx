import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import usePageTitle from '../../hooks/usePageTitle';
import networkService from '../../services/networkService';
import toast from 'react-hot-toast';

// 自定义动画金额组件
const AnimatedAmount = ({ amount, fontSize = '14vw', mdFontSize = 'text-sm', className = 'text-white' }) => {
  const [currentValue, setCurrentValue] = useState(0);
  const smallerFontSize = `${parseInt(fontSize) / 2}vw`;

  useEffect(() => {
    const duration = 2000; // 2秒
    const steps = 60; // 60帧
    const increment = amount / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(current + increment, amount);
      setCurrentValue(current);

      if (step >= steps || current >= amount) {
        setCurrentValue(amount);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [amount]);

  const [integerPart, decimalPart] = currentValue.toFixed(2).split('.');

  return (
    <span className={`${className} text-size-[${fontSize}] md:${mdFontSize} font-medium`}>
      {integerPart}
      <span className={`text-size-[${smallerFontSize}] md:text-xs align-baseline`}>
        .{decimalPart}
      </span>
    </span>
  );
};

const NetworkEarnings = () => {
  const { t } = useTranslation();
  
  // 设置页面标题
  usePageTitle('network_earnings');
  
  // 状态管理
  const [loading, setLoading] = useState(true);
  const [earningsData, setEarningsData] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    reward_type: 'all',
    date_range: 'month'
  });

  // 加载收益数据
  const loadEarningsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await networkService.getNetworkEarnings(filters);
      
      if (response.success) {
        setEarningsData(response.data);
      } else {
        throw new Error(t('network_earnings.loading_failed'));
      }
    } catch (err) {
      console.error('加载收益数据失败:', err);
      setError(err.message || t('network_earnings.loading_failed'));
      toast.error(t('network_earnings.error_retry'));
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadEarningsData();
  }, [filters]);

  // 处理筛选条件变化
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 格式化金额显示
  const formatAmount = (amount, fontSize = '14vw', className = 'text-white') => {
    return <AnimatedAmount amount={parseFloat(amount || 0)} fontSize={fontSize} className={className} />;
  };

  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // 加载状态
  if (loading) {
    return (
      <div className="px-[16vw] md:px-4 pt-[20vw] md:pt-5 pb-[20vw] md:pb-5">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-size-[16vw] md:text-lg">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="px-[16vw] md:px-4 pt-[20vw] md:pt-5 pb-[20vw] md:pb-5">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <p className="text-red-400 text-size-[16vw] md:text-lg mb-4">{error}</p>
            <button
              onClick={loadEarningsData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('common.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-[16vw] md:px-4 pt-[20vw] md:pt-5 pb-[20vw] md:pb-5">
      {/* 页面标题 */}
      <h1 className="text-white text-size-[20vw] md:text-2xl font-semibold mb-[20vw] md:mb-5" style={{ fontWeight: 600 }}>
        {t('network_details.earnings.title')}
      </h1>

      {/* 筛选器 */}
      <div className="mb-[20vw] md:mb-5 flex flex-wrap gap-[12vw] md:gap-3">
        {/* 奖励类型筛选 */}
        <select
          value={filters.reward_type}
          onChange={(e) => handleFilterChange('reward_type', e.target.value)}
          className="px-[12vw] md:px-3 py-[8vw] md:py-2 bg-gray-700 text-white rounded-[6vw] md:rounded text-size-[14vw] md:text-sm"
        >
          <option value="all">{t('network_details.earnings.reward_type')}: {t('network_earnings.reward_type_all')}</option>
          <option value="differential">{t('network_earnings.reward_type_differential')}</option>
          <option value="flat">{t('network_earnings.reward_type_flat')}</option>
          <option value="fee">{t('network_earnings.reward_type_fee')}</option>
        </select>

        {/* 时间范围筛选 */}
        <select
          value={filters.date_range}
          onChange={(e) => handleFilterChange('date_range', e.target.value)}
          className="px-[12vw] md:px-3 py-[8vw] md:py-2 bg-gray-700 text-white rounded-[6vw] md:rounded text-size-[14vw] md:text-sm"
        >
          <option value="today">{t('network_details.earnings.date_range.today')}</option>
          <option value="week">{t('network_details.earnings.date_range.week')}</option>
          <option value="month">{t('network_details.earnings.date_range.month')}</option>
        </select>
      </div>

      {/* 收益汇总 */}
      {earningsData?.summary && (
        <div className="mb-[24vw] md:mb-6">
          <h2 className="text-white text-size-[18vw] md:text-xl font-semibold mb-[16vw] md:mb-4" style={{ fontWeight: 600 }}>
            {t('network_earnings.summary_title')}
          </h2>
          
          <div className="grid grid-cols-2 gap-[12vw] md:gap-3 mb-[16vw] md:mb-4">
            <div
              className="p-[16vw] md:p-4 rounded-[8vw] md:rounded-lg"
              style={{ backgroundColor: 'rgb(41, 41, 41)' }}
            >
              <div className="text-[#8f8f8f] text-size-[12vw] md:text-xs mb-[4vw] md:mb-1">{t('network_earnings.differential_label')}</div>
              {formatAmount(earningsData.summary.total_differential, '14vw', 'text-green-400')}
            </div>
            
            <div
              className="p-[16vw] md:p-4 rounded-[8vw] md:rounded-lg"
              style={{ backgroundColor: 'rgb(41, 41, 41)' }}
            >
              <div className="text-[#8f8f8f] text-size-[12vw] md:text-xs mb-[4vw] md:mb-1">{t('network_earnings.flat_label')}</div>
              {formatAmount(earningsData.summary.total_flat, '14vw', 'text-blue-400')}
            </div>
            
            <div
              className="p-[16vw] md:p-4 rounded-[8vw] md:rounded-lg"
              style={{ backgroundColor: 'rgb(41, 41, 41)' }}
            >
              <div className="text-[#8f8f8f] text-size-[12vw] md:text-xs mb-[4vw] md:mb-1">{t('network_earnings.fee_label')}</div>
              {formatAmount(earningsData.summary.total_fee_dividends, '14vw', 'text-yellow-400')}
            </div>
            
            <div
              className="p-[16vw] md:p-4 rounded-[8vw] md:rounded-lg"
              style={{ backgroundColor: 'rgb(41, 41, 41)' }}
            >
              <div className="text-[#8f8f8f] text-size-[12vw] md:text-xs mb-[4vw] md:mb-1">{t('network_earnings.total_label')}</div>
              {formatAmount(earningsData.summary.grand_total, '14vw', 'text-white')}
            </div>
          </div>
        </div>
      )}

      {/* 收益明细列表 */}
      <div>
        <h2 className="text-white text-size-[18vw] md:text-xl font-semibold mb-[16vw] md:mb-4" style={{ fontWeight: 600 }}>
          {t('network_earnings.details_title')}
        </h2>
        
        {earningsData?.earnings && earningsData.earnings.length > 0 ? (
          <div className="space-y-[12vw] md:space-y-3">
            {earningsData.earnings.map((dayEarning, index) => (
              <div
                key={index}
                className="p-[16vw] md:p-4 rounded-[8vw] md:rounded-lg"
                style={{ backgroundColor: 'rgb(31, 31, 31)' }}
              >
                {/* 日期和日总收益 */}
                <div className="flex justify-between items-center mb-[12vw] md:mb-3">
                  <span className="text-white text-size-[16vw] md:text-lg font-medium">
                    {formatDate(dayEarning.date)}
                  </span>
                  <span className="text-green-400 text-size-[16vw] md:text-lg font-medium">
                    +{dayEarning.daily_total}
                  </span>
                </div>

                {/* 各类奖励详情 */}
                <div className="space-y-[8vw] md:space-y-2">
                  {/* 极差奖励 */}
                  {dayEarning.differential_rewards?.map((reward, idx) => (
                    <div key={idx} className="flex justify-between items-center text-size-[14vw] md:text-sm">
                      <div className="text-[#8f8f8f]">
                        {t('network_earnings.item_differential', { user: reward.from_user, fromLevel: reward.from_user_level, toLevel: reward.my_level.replace('VIP','') })}
                      </div>
                      <div className="text-green-400">+{reward.earned_amount} {reward.token}</div>
                    </div>
                  ))}

                  {/* 平级奖励 */}
                  {dayEarning.flat_rewards?.map((reward, idx) => (
                    <div key={idx} className="flex justify-between items-center text-size-[14vw] md:text-sm">
                      <div className="text-[#8f8f8f]">
                        {t('network_earnings.item_flat', { user: reward.from_user, sameLevel: reward.same_level })}
                      </div>
                      <div className="text-blue-400">+{reward.earned_amount} {reward.token}</div>
                    </div>
                  ))}

                  {/* 手续费分红 */}
                  {dayEarning.fee_dividends?.map((dividend, idx) => (
                    <div key={idx} className="flex justify-between items-center text-size-[14vw] md:text-sm">
                      <div className="text-[#8f8f8f]">
                        {t('network_earnings.item_fee', { user: dividend.from_user, rate: dividend.my_dividend_rate })}
                      </div>
                      <div className="text-yellow-400">+{dividend.earned_amount} {dividend.token}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-[#8f8f8f] text-size-[16vw] md:text-lg">
              {t('network_earnings.empty')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkEarnings;
