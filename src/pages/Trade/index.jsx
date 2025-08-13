import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import usePageTitle from '../../hooks/usePageTitle';
import { useApiCall } from '../../hooks/useApiCall';
import { useAuthStore, useUserStore } from '../../store';
import { safeParseFloat, formatNumber } from '../../utils/format';
import { orderService } from '../../services';
import Modal from '../../components/Modal';
import PriceChart from '../../components/PriceChart';
import pUSDIcon from '../../assets/icons/pUSD.png';
import upDownIcon from '../../assets/icons/up-down.png';
import buyUpIcon from '../../assets/icons/buy-up.png';
import buyDownIcon from '../../assets/icons/buy-down.png';
import timeIcon from '../../assets/icons/time.png';
import toast from 'react-hot-toast';
import sliderIcon from '../../assets/icons/slider.png';

const Trade = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const { balance, fetchBalance } = useUserStore();

  // 设置页面标题
  usePageTitle('trade');

  const [tradeAmount, setTradeAmount] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(67234.56);
  const [priceChange, setPriceChange] = useState(2.34);
  const [selectedToken, setSelectedToken] = useState('USDT');
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [userBets, setUserBets] = useState([]); // 用户下注记录
  const [luckyUSDBalance, setLuckyUSDBalance] = useState(0); // LuckyUSD随机余额
  const [isPlacingBet, setIsPlacingBet] = useState(false); // 下注加载状态

  // 使用 ref 来跟踪前一个价格，避免循环依赖
  const previousPriceRef = useRef(67234.56);
  const balanceFetchedRef = useRef(false);

  // 使用防重复调用的API hook
  const safeFetchBalance = useApiCall(fetchBalance, []);

  // 生成LuckyUSD随机余额（0-10000，两位小数）
  const generateLuckyUSDBalance = () => {
    const randomBalance = Math.random() * 10000;
    return Math.round(randomBalance * 100) / 100; // 保留两位小数
  };

  // 获取当前选中币种的余额
  const getCurrentTokenBalance = () => {
    if (selectedToken === 'USDT') {
      // USDT余额，如果余额数据为null/undefined或网络请求失败，返回0
      return safeParseFloat(balance?.usdtBalance, 0);
    } else if (selectedToken === 'LuckyUSD') {
      return luckyUSDBalance;
    }
    return 0;
  };

  const userBalance = getCurrentTokenBalance();
  const isUp = priceChange > 0;
  const isButtonsDisabled = tradeAmount === 0 || isPlacingBet || userBalance < tradeAmount;

  // 滑动条是否禁用（余额 <= 0）
  const isSliderDisabled = userBalance <= 0;

  // 确保滑动条计算的安全性
  const safeUserBalance = Math.max(userBalance, 1); // 最小值为1，避免除零错误

  // 可选择的币种列表
  const tokenOptions = [
    { name: 'USDT', icon: pUSDIcon },
    { name: 'LuckyUSD', icon: pUSDIcon }
  ];

  // 处理滑块变化
  const handleSliderChange = (e) => {
    // 如果滑动条被禁用，不处理变化
    if (isSliderDisabled) return;

    const value = parseFloat(e.target.value);
    setSliderValue(value);
    setTradeAmount(Math.floor(value));
  };

  // 处理输入框变化
  const handleInputChange = (e) => {
    // 如果滑动条被禁用，不处理变化
    if (isSliderDisabled) return;

    const value = parseFloat(e.target.value) || 0;
    // 确保输入值在有效范围内：不超过用户余额，且不超过1000
    const clampedValue = Math.min(value, userBalance, 1000);
    setTradeAmount(clampedValue);
    setSliderValue(clampedValue);
  };

  // 处理币种选择框点击
  const handleTokenSelectorClick = () => {
    setIsTokenModalOpen(true);
  };

  // 处理币种选择
  const handleTokenSelect = (tokenName) => {
    setSelectedToken(tokenName);
    setIsTokenModalOpen(false);

    // 币种切换时重置滑动条值
    const newBalance = tokenName === 'USDT'
      ? safeParseFloat(balance?.usdtBalance, 0)
      : luckyUSDBalance;

    if (newBalance <= 0) {
      // 余额为0时，滑动条和交易金额都设为0
      setSliderValue(0);
      setTradeAmount(0);
    } else if (newBalance >= 1) {
      // 余额>=1时，设置默认值为1
      setSliderValue(1);
      setTradeAmount(1);
    } else {
      // 余额在0-1之间时，设置为余额值
      setSliderValue(newBalance);
      setTradeAmount(newBalance);
    }
  };

  // 关闭币种选择弹窗
  const handleCloseTokenModal = () => {
    setIsTokenModalOpen(false);
  };

  // 处理用户下注
  const handlePlaceBet = async (direction) => {
    if (tradeAmount === 0 || !currentPrice || isPlacingBet) return;

    // 检查用户是否已认证
    if (!isAuthenticated) {
      toast.error('请先连接钱包并登录');
      return;
    }

    // 检查余额是否足够
    const userBalance = getCurrentTokenBalance();
    if (userBalance < tradeAmount) {
      toast.error('余额不足');
      return;
    }

    setIsPlacingBet(true);

    try {
      const now = Date.now();

      // 准备API请求数据
      const orderData = {
        orderType: direction === 'up' ? 'CALL' : 'PUT',
        amount: tradeAmount,
        frontendSubmitTime: now
      };

      console.log('🎯 发送下注请求:', orderData);

      // 调用API创建订单
      const result = await orderService.createOrder(orderData);

      if (result.success) {
        // API调用成功，显示成功消息
        toast.success(result.message || '下单成功');

        // 创建本地下注记录（用于图表显示）
        const newBet = {
          id: result.data.orderId,
          direction,
          amount: tradeAmount,
          price: result.data.entryPrice || currentPrice,
          timestamp: result.data.entryTime || now,
          settlementTime: result.data.expiryTime || (now + 60000),
          settlementPrice: null,
          isWin: null,
          profit: null,
          status: 'active',
          // 保存API返回的完整数据
          apiData: result.data
        };

        setUserBets(prev => [...prev, newBet]);
        console.log('✅ 下注成功:', newBet);

        // 刷新用户余额
        if (fetchBalance) {
          fetchBalance();
        }

        // 重置交易金额
        setTradeAmount(0);
        setSliderValue(0);
      }
    } catch (error) {
      console.error('❌ 下注失败:', error);

      // 显示错误消息
      const errorMessage = error.message || '下注失败，请重试';
      toast.error(errorMessage);
    } finally {
      setIsPlacingBet(false);
    }
  };

  // 处理价格更新的回调函数，使用useCallback稳定引用
  const handlePriceUpdate = useCallback((priceData) => {
    const newPrice = priceData.price;
    const prevPrice = previousPriceRef.current;
    const currentTime = Date.now();

    // 更新当前价格
    setCurrentPrice(newPrice);

    // 计算价格变化百分比（基于前一个价格）
    if (prevPrice && prevPrice !== newPrice) {
      const changePercent = ((newPrice - prevPrice) / prevPrice) * 100;
      setPriceChange(changePercent);
    }

    // 检查并处理到期的下注记录
    setUserBets(prev => {
      return prev.map(bet => {
        // 如果下注已经结算过，跳过
        if (bet.status === 'settled') return bet;

        // 检查是否到达结算时间
        if (currentTime >= bet.settlementTime) {
          // 计算是否猜中
          const priceChange = newPrice - bet.price;
          const isWin = (bet.direction === 'up' && priceChange > 0) ||
                       (bet.direction === 'down' && priceChange < 0);

          // 计算盈利金额（赔率1赔1，手续费3%）
          const profit = isWin ? bet.amount * (1 - 0.03) : 0;

          console.log('🎯 交易结算:', {
            id: bet.id,
            direction: bet.direction,
            betPrice: bet.price,
            settlementPrice: newPrice,
            priceChange,
            isWin,
            profit
          });

          return {
            ...bet,
            settlementPrice: newPrice,
            isWin,
            profit,
            status: 'settled'
          };
        }

        return bet;
      });
    });

    // 更新前一个价格的引用
    previousPriceRef.current = newPrice;
  }, []); // 移除依赖，使用 ref 避免循环依赖

  // 初始化LuckyUSD随机余额
  useEffect(() => {
    const initialLuckyUSDBalance = generateLuckyUSDBalance();
    setLuckyUSDBalance(initialLuckyUSDBalance);
  }, []); // 只在组件挂载时执行一次

  // 获取用户余额
  useEffect(() => {
    if (isAuthenticated && !balanceFetchedRef.current) {
      balanceFetchedRef.current = true;
      safeFetchBalance().catch(error => {
        console.error('获取余额失败:', error);
        balanceFetchedRef.current = false; // 失败时重置，允许重试
      });
    }
  }, [isAuthenticated]); // 移除 safeFetchBalance 依赖，避免循环依赖

  // 当余额数据更新时，设置滑动条默认值
  useEffect(() => {
    const currentBalance = getCurrentTokenBalance();

    if (currentBalance <= 0) {
      // 余额为0时，滑动条和交易金额都设为0
      setSliderValue(0);
      setTradeAmount(0);
    } else if (currentBalance >= 1 && tradeAmount === 0) {
      // 余额>=1且当前交易金额为0时，设置默认值为1
      setSliderValue(1);
      setTradeAmount(1);
    }
  }, [balance, luckyUSDBalance, selectedToken]); // 只依赖余额数据和选中的币种

  // 清理过期的下注记录（只清理未结算且超过结算时间5秒的记录）
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setUserBets(prev => prev.filter(bet => {
        // 保留已结算的记录（永久显示）
        if (bet.status === 'settled') return true;

        // 对于活跃记录，只有在超过结算时间5秒后才清理
        // 这样给结算逻辑足够的时间来处理
        const timeAfterSettlement = now - bet.settlementTime;
        return timeAfterSettlement < 5000; // 结算后5秒才清理
      }));
    }, 1000); // 每1秒检查一次

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen pb-[86vw] md:pb-20" style={{ backgroundColor: '#121212' }}>
      {/* 价格信息栏 */}
      <div
        className="w-full h-[64vw] md:h-16 px-[16vw] md:px-4 flex items-center justify-between border-t border-b mt-[10vw] md:mt-3"
        style={{ borderColor: '#292929' }}
      >
        {/* 左侧：图片和文案 */}
        <div className="flex items-center gap-[8vw] md:gap-2">
          <img
            src="https://s2.coinmarketcap.com/static/img/coins/64x64/1.png"
            alt="BTC"
            className="w-[34vw] md:w-9 h-[34vw] md:h-9 object-contain"
          />
          <div className="h-[34vw] md:h-9 flex flex-col justify-between -mt-[7vw] md:mt-0">
            <p className="text-white text-size-[15vw] md:text-base font-semibold h-[18vw] md:h-auto">BTC-USD</p>
            <p className="text-white text-size-[13vw] md:text-sm h-[15vw] md:h-auto">{t('trade.binary_options')}</p>
          </div>
        </div>

        {/* 右侧：价格趋势 */}
        <div className="h-[34vw] md:h-9 flex flex-col justify-between items-end -mt-[1vw] md:mt-0">
          <div className="text-white text-size-[15vw] md:text-base font-semibold h-[18vw] md:h-auto">
            {currentPrice.toFixed(2)}
          </div>
          <div className="flex items-center gap-[4vw] md:gap-1 h-[15vw] md:h-auto">
            {/* 三角形 */}
            <div
              className={`w-0 h-0 ${isUp ? 'triangle-up' : 'triangle-down'}`}
              style={{
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderBottom: isUp ? `6px solid ${isUp ? '#00bc4b' : '#f5384e'}` : 'none',
                borderTop: !isUp ? `6px solid ${isUp ? '#00bc4b' : '#f5384e'}` : 'none',
              }}
            />
            <span
              className="text-size-[13vw] md:text-sm"
              style={{ color: isUp ? '#00bc4b' : '#f5384e' }}
            >
              {isUp ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

    
      {/* 价格图表 */}
      <div className='w-full h-[346vw] md:h-80 mb-[10vw] md:mb-3'>
        <PriceChart
          userBets={userBets}
          onPriceUpdate={handlePriceUpdate}
        />
      </div>

      {/* 交易卡片 */}
      <div className="w-[375vw] md:w-full h-[246vw] md:h-auto flex flex-col items-center justify-center px-[16vw] md:px-4">
        {/* 第一部分：Trade Amount */}
        <div
          className="w-[343vw] md:w-full h-[116vw] md:h-auto pt-[16vw] md:pt-4 pr-[16vw] md:pr-4 pb-[14vw] md:pb-4 pl-[16vw] md:pl-4 rounded-[12vw] md:rounded-lg"
          style={{ backgroundColor: '#1f1f1f' }}
        >
          {/* 第一行：标题和余额 */}
          <div className="flex justify-between items-center mb-[6vw] md:mb-2">
            <span className="text-white text-size-[13vw] md:text-sm">{t('trade.trade_amount')}</span>
            <span className="text-[#8f8f8f] text-size-[13vw] md:text-sm">{t('trade.balance')}: {formatNumber(userBalance, 2)}</span>
          </div>

          {/* 第二行：输入框和按钮 */}
          <div className="w-full flex items-center mb-[6vw] md:mb-2">
            <div className="flex-1 min-w-0">
              <input
                type="number"
                value={tradeAmount}
                onChange={handleInputChange}
                disabled={isSliderDisabled}
                min="0"
                max="1000"
                step="0.01"
                className="w-full h-[40vw] md:h-10 bg-transparent border-none outline-none text-[#c5ff33] text-size-[34vw] md:text-2xl font-semibold"
                style={{ appearance: 'none' }}
              />
            </div>
            <div className="w-[8vw] md:w-2 flex-shrink-0"></div>
            <div
              className="h-[34vw] md:h-8 bg-[#3d3d3d] rounded-[34vw] md:rounded-full px-[10vw] md:px-2.5 py-[8vw] md:py-2 flex items-center gap-[4vw] md:gap-1 cursor-pointer flex-shrink-0"
              onClick={handleTokenSelectorClick}
            >
              <img src={pUSDIcon} alt="token" className="w-[14vw] md:w-3.5 h-[14vw] md:h-3.5 flex-shrink-0" />
              <span className="text-white font-medium text-size-[12vw] md:text-xs whitespace-nowrap">{selectedToken}</span>
              <img src={upDownIcon} alt="up-down" className="w-[14vw] md:w-3.5 h-[14vw] md:h-3.5 flex-shrink-0" />
            </div>
          </div>

          {/* 第三行：滑块 */}
          <div className="w-[311vw] md:w-full h-[20vw] md:h-5 relative flex items-center">
            {/* 滑块轨道背景 */}
            <div className="w-full h-[4vw] md:h-1 bg-[#3d3d3d] rounded-full relative">
              {/* 绿色进度条 */}
              <div
                className="h-full bg-[#c5ff33] rounded-full transition-all duration-200"
                style={{
                  width: `${(sliderValue / safeUserBalance) * 100}%`
                }}
              />

              {/* 滑块按钮 */}
              <div
                className={`absolute w-[17vw] md:w-4 h-[17vw] md:h-4 top-1/2 transform -translate-y-1/2 ${isSliderDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                style={{
                  left: `calc(${(sliderValue / safeUserBalance) * 100}% - 8.5vw)`,
                  minWidth: '17vw'
                }}
              >
                <img
                  src={sliderIcon}
                  alt="slider"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* 隐藏的input用于处理交互 */}
            <input
              type="range"
              min="0"
              max={safeUserBalance}
              value={sliderValue}
              onChange={handleSliderChange}
              disabled={isSliderDisabled}
              className={`absolute inset-0 w-full h-full opacity-0 ${isSliderDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            />
          </div>
        </div>

        {/* 第二部分：Payout */}
        <div
          className="w-[343vw] md:w-full h-[50vw] md:h-12 -mt-[17vw] md:-mt-4 border rounded-[12vw] md:rounded-lg flex items-center justify-center"
          style={{ borderColor: '#1f1f1f' }}
        >
          <span className="text-[#8f8f8f] text-size-[13vw] md:text-sm pb-[2vw]"> <br /> {t('trade.payout')}: 456.45</span>
        </div>

        {/* 第三部分：按钮和时间 */}
        <div className="w-[343vw] md:w-full flex items-center justify-between mt-[12vw] md:mt-3">
          {/* Up按钮 */}
          <div
            className={`w-[127vw] md:w-32 h-[50vw] md:h-12 rounded-[12vw] md:rounded-lg flex items-center justify-center gap-[8vw] md:gap-2 ${isButtonsDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            style={{
              backgroundColor: '#00bc4b',
              filter: isButtonsDisabled ? 'brightness(0.3)' : 'brightness(1)'
            }}
            onClick={() => !isButtonsDisabled && handlePlaceBet('up')}
          >
            {isPlacingBet ? (
              <div className="w-[24vw] md:w-6 h-[24vw] md:h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <img src={buyUpIcon} alt="Up" className="w-[24vw] md:w-6 h-[24vw] md:h-6" />
            )}
            <span className="text-white text-size-[17vw] md:text-lg font-semibold">
              {isPlacingBet ? '下注中...' : t('trade.up')}
            </span>
          </div>

          {/* 中间时间显示 */}
          <div className="flex-1 h-[38vw] md:h-10 flex flex-col items-center justify-center">
            <img src={timeIcon} alt="Time" className="w-[16vw] md:w-4 h-[16vw] md:h-4 mb-[4vw] md:mb-1" />
            <span className="text-white text-size-[15vw] md:text-sm font-semibold">1m</span>
          </div>

          {/* Down按钮 */}
          <div
            className={`w-[127vw] md:w-32 h-[50vw] md:h-12 rounded-[12vw] md:rounded-lg flex items-center justify-center gap-[8vw] md:gap-2 ${isButtonsDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            style={{
              backgroundColor: '#f5384e',
              filter: isButtonsDisabled ? 'brightness(0.3)' : 'brightness(1)'
            }}
            onClick={() => !isButtonsDisabled && handlePlaceBet('down')}
          >
            {isPlacingBet ? (
              <div className="w-[24vw] md:w-6 h-[24vw] md:h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <img src={buyDownIcon} alt="Down" className="w-[24vw] md:w-6 h-[24vw] md:h-6" />
            )}
            <span className="text-white text-size-[17vw] md:text-lg font-semibold">
              {isPlacingBet ? '下注中...' : t('trade.down')}
            </span>
          </div>
        </div>
      </div>

      {/* 币种选择弹窗 */}
      <Modal isOpen={isTokenModalOpen} onClose={handleCloseTokenModal}>
        <div className="p-[20vw] md:p-5">
          {/* 弹窗标题 */}
          <div className="text-center mb-[20vw] md:mb-5">
            <h3 className="text-white text-size-[18vw] md:text-lg font-semibold">{t('trade.select_token')}</h3>
          </div>

          {/* 币种选项列表 */}
          <div className="space-y-[12vw] md:space-y-3">
            {tokenOptions.map((token) => (
              <div
                key={token.name}
                className={`w-full h-[50vw] md:h-12 rounded-[12vw] md:rounded-lg px-[16vw] md:px-4 flex items-center gap-[12vw] md:gap-3 cursor-pointer transition-colors ${
                  selectedToken === token.name
                    ? 'bg-[#c5ff33] bg-opacity-20 border border-[#c5ff33]'
                    : 'bg-[#3d3d3d] hover:bg-[#4d4d4d]'
                }`}
                onClick={() => handleTokenSelect(token.name)}
              >
                <img src={token.icon} alt={token.name} className="w-[24vw] md:w-6 h-[24vw] md:h-6 flex-shrink-0" />
                <span className={`text-size-[16vw] md:text-base font-medium ${
                  selectedToken === token.name ? 'text-[#c5ff33]' : 'text-white'
                }`}>
                  {token.name}
                </span>
                {selectedToken === token.name && (
                  <div className="ml-auto w-[16vw] md:w-4 h-[16vw] md:h-4 rounded-full bg-[#c5ff33] flex items-center justify-center">
                    <div className="w-[8vw] md:w-2 h-[8vw] md:h-2 rounded-full bg-white"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Trade;
