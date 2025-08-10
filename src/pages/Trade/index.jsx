import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import usePageTitle from '../../hooks/usePageTitle';
import Modal from '../../components/Modal';
import PriceChart from '../../components/PriceChart';
import pUSDIcon from '../../assets/icons/pUSD.png';
import upDownIcon from '../../assets/icons/up-down.png';
import buyUpIcon from '../../assets/icons/buy-up.png';
import buyDownIcon from '../../assets/icons/buy-down.png';
import timeIcon from '../../assets/icons/time.png';
import sliderIcon from '../../assets/icons/slider.png';

const Trade = () => {
  const { t } = useTranslation();

  // 设置页面标题
  usePageTitle('trade');

  const [tradeAmount, setTradeAmount] = useState(1);
  const [sliderValue, setSliderValue] = useState(1);
  const [currentPrice, setCurrentPrice] = useState(67234.56);
  const [priceChange, setPriceChange] = useState(2.34);
  const [selectedToken, setSelectedToken] = useState('LuckyUSD');
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [userBets, setUserBets] = useState([]); // 用户下注记录

  const balance = 654.3;
  const isUp = priceChange > 0;
  const isButtonsDisabled = tradeAmount === 0;

  // 可选择的币种列表
  const tokenOptions = [
    { name: 'USDR', icon: pUSDIcon },
    { name: 'LuckyUSD', icon: pUSDIcon }
  ];

  // 处理滑块变化
  const handleSliderChange = (e) => {
    const value = parseFloat(e.target.value);
    setSliderValue(value);
    setTradeAmount(Math.floor(value));
  };

  // 处理输入框变化
  const handleInputChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setTradeAmount(value);
    setSliderValue(value);
  };

  // 处理币种选择框点击
  const handleTokenSelectorClick = () => {
    setIsTokenModalOpen(true);
  };

  // 处理币种选择
  const handleTokenSelect = (tokenName) => {
    setSelectedToken(tokenName);
    setIsTokenModalOpen(false);
  };

  // 关闭币种选择弹窗
  const handleCloseTokenModal = () => {
    setIsTokenModalOpen(false);
  };

  // 处理用户下注
  const handlePlaceBet = (direction) => {
    if (tradeAmount === 0 || !currentPrice) return;

    const newBet = {
      id: Date.now(), // 简单的ID生成
      direction, // 'up' 或 'down'
      amount: tradeAmount,
      price: currentPrice,
      timestamp: Date.now(),
      settlementTime: Date.now() + 60000, // 60秒后结算
      status: 'active' // active, settled
    };

    setUserBets(prev => [...prev, newBet]);
    console.log('🎯 用户下注:', newBet);
  };

  // 清理过期的下注记录
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setUserBets(prev => prev.filter(bet =>
        now - bet.timestamp < 180000 // 保留3分钟内的下注记录
      ));
    }, 30000); // 每30秒清理一次

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

      {/* 调试信息 */}
      {userBets.length > 0 && (
        <div className="text-white text-center mb-2">
          当前下注数量: {userBets.length}
        </div>
      )}

      {/* 价格图表 */}
      <div className='w-full h-[346vw] md:h-80 mb-[10vw] md:mb-3'>
        <PriceChart
          userBets={userBets}
          onPriceUpdate={(priceData) => {
            setCurrentPrice(priceData.price);
            // 计算价格变化百分比（这里简化处理，实际应该基于前一个价格）
            const changePercent = ((priceData.price - currentPrice) / currentPrice) * 100;
            setPriceChange(changePercent);
          }}
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
            <span className="text-[#8f8f8f] text-size-[13vw] md:text-sm">{t('trade.balance')}: {balance}</span>
          </div>

          {/* 第二行：输入框和按钮 */}
          <div className="w-full flex items-center mb-[6vw] md:mb-2">
            <div className="flex-1 min-w-0">
              <input
                type="number"
                value={tradeAmount}
                onChange={handleInputChange}
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
                  width: `${(sliderValue / balance) * 100}%`
                }}
              />

              {/* 滑块按钮 */}
              <div
                className="absolute w-[17vw] md:w-4 h-[17vw] md:h-4 top-1/2 transform -translate-y-1/2 cursor-pointer"
                style={{
                  left: `calc(${(sliderValue / balance) * 100}% - 8.5vw)`,
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
              max={balance}
              value={sliderValue}
              onChange={handleSliderChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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
            <img src={buyUpIcon} alt="Up" className="w-[24vw] md:w-6 h-[24vw] md:h-6" />
            <span className="text-white text-size-[17vw] md:text-lg font-semibold">{t('trade.up')}</span>
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
            <img src={buyDownIcon} alt="Down" className="w-[24vw] md:w-6 h-[24vw] md:h-6" />
            <span className="text-white text-size-[17vw] md:text-lg font-semibold">{t('trade.down')}</span>
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
