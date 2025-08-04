import { useState, useCallback } from 'react';
import PriceChart from '../../components/PriceChart';
import pUSDIcon from '../../assets/icons/pUSD.png';
import upDownIcon from '../../assets/icons/up-down.png';
import buyUpIcon from '../../assets/icons/buy-up.png';
import buyDownIcon from '../../assets/icons/buy-down.png';
import timeIcon from '../../assets/icons/time.png';
import sliderIcon from '../../assets/icons/slider.png';

const Trade = () => {
  const [tradeAmount, setTradeAmount] = useState(1);
  const [sliderValue, setSliderValue] = useState(1);
  const [currentPrice, setCurrentPrice] = useState(67234.56);
  const [priceChange, setPriceChange] = useState(2.34);

  const balance = 654.3;
  const isUp = priceChange > 0;
  const isButtonsDisabled = tradeAmount === 0; // 当交易金额为0时禁用按钮

  // 处理价格更新
  const handlePriceUpdate = useCallback((priceData) => {
    setCurrentPrice(prevPrice => {
      // 计算价格变化百分比
      if (prevPrice > 0) {
        const change = ((priceData.price - prevPrice) / prevPrice) * 100;
        setPriceChange(change);
      }
      return priceData.price;
    });
  }, []);

  // 处理滑块变化
  const handleSliderChange = (e) => {7
    const value = parseFloat(e.target.value);
    setSliderValue(value);
    setTradeAmount(Math.floor(value)); // 保留整数
  };

  // 处理输入框变化
  const handleInputChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setTradeAmount(value);
    setSliderValue(value);
  };

  return (
    <div className="min-h-screen pb-[86vw]" style={{ backgroundColor: '#121212' }}>
      {/* 价格信息栏 */}
      <div 
        className="w-full h-[64vw] px-[16vw] flex items-center justify-between border-t border-b mt-[10vw]"
        style={{ borderColor: '#292929' }}
      >
        {/* 左侧：图片和文案 */}
        <div className="flex items-center gap-[8vw]">
          <img 
            src="https://s2.coinmarketcap.com/static/img/coins/64x64/1.png" 
            alt="BTC" 
            className="w-[34vw] h-[34vw] object-contain"
          />
          <div className="h-[34vw] flex flex-col justify-between -mt-[7vw]">
            <p className="text-white text-size-[15vw] font-semibold h-[18vw] ">BTC-USD</p>
            <p className="text-white text-size-[13vw] h-[15vw]">Binary Options</p>
          </div>
        </div>

        {/* 右侧：价格趋势 */}
        <div className="h-[34vw] flex flex-col justify-between items-end -mt-[1vw]">
          <div className="text-white text-size-[15vw] font-semibold  h-[18vw]">
            {currentPrice.toFixed(2)}
          </div>
          <div className="flex items-center gap-[4vw]  h-[15vw]">
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
              className="text-size-[13vw]"
              style={{ color: isUp ? '#00bc4b' : '#f5384e' }}
            >
              {isUp ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* 实时价格图表 */}
      <PriceChart onPriceUpdate={handlePriceUpdate} />

      {/* 交易卡片 */}
      <div className="w-[375vw] h-[246vw] flex flex-col items-center justify-center">
        {/* 第一部分：Trade Amount */}
        <div 
          className="w-[343vw] h-[116vw] pt-[16vw] pr-[16vw] pb-[14vw] pl-[16vw] rounded-[12vw]"
          style={{ backgroundColor: '#1f1f1f' }}
        >
          {/* 第一行：标题和余额 */}
          <div className="flex justify-between items-center mb-[6vw]">
            <span className="text-white text-size-[13vw]">Trade Amount</span>
            <span className="text-[#8f8f8f] text-size-[13vw]">Balance: {balance}</span>
          </div>

          {/* 第二行：输入框和按钮 */}
          <div className="flex justify-between items-center mb-[6vw]">
            <input
              type="number"
              value={tradeAmount}
              onChange={handleInputChange}
              className="w-[196vw] h-[40vw] bg-transparent border-none outline-none text-[#c5ff33] text-size-[34vw] font-semibold"
              style={{ appearance: 'none' }}
            />
            <div className="w-[116vw] h-[34vw] bg-[#3d3d3d] rounded-[34vw] px-[16vw] py-[8vw] flex items-center justify-between">
              <img src={pUSDIcon} alt="pUSD" className="w-[16vw] h-[16vw]" />
              <span className="text-white font-semibold text-size-[15vw]">pUSD</span>
              <img src={upDownIcon} alt="up-down" className="w-[16vw] h-[16vw]" />
            </div>
          </div>

          {/* 第三行：滑块 - 最终正确实现 */}
          <div className="w-[311vw] h-[20vw] relative flex items-center">
            {/* 滑块轨道背景 */}
            <div className="w-full h-[4vw] bg-[#3d3d3d] rounded-full relative">
              {/* 绿色进度条 */}
              <div
                className="h-full bg-[#c5ff33] rounded-full transition-all duration-200"
                style={{
                  width: `${(sliderValue / balance) * 100}%`
                }}
              />

              {/* 滑块按钮 - 相对于轨道定位 */}
              <div
                className="absolute w-[17vw] h-[17vw] top-1/2 transform -translate-y-1/2 cursor-pointer"
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
          className="w-[343vw] h-[48vw] -mt-[17vw] border rounded-[12vw] flex items-start justify-center tracking-0.15 leading-20"
          style={{ borderColor: '#1f1f1f' }}
        >
          <span className="text-[#8f8f8f] text-size-[13vw]"> <br /> Payout: 456.45</span>
        </div> 

        {/* 第三部分：按钮和时间 */}
        <div className="w-[343vw] flex items-center justify-between mt-[12vw]">
          {/* Up按钮 */}
          <div
            className={`w-[127vw] h-[50vw] rounded-[12vw] flex items-center justify-center gap-[8vw] ${isButtonsDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            style={{
              backgroundColor: '#00bc4b',
              filter: isButtonsDisabled ? 'brightness(0.3)' : 'brightness(1)'
            }}
          >
            <img src={buyUpIcon} alt="Up" className="w-[24vw] h-[24vw]" />
            <span className="text-white text-size-[17vw] font-semibold">Up</span>
          </div>

          {/* 中间时间显示 */}
          <div className="flex-1 h-[38vw] flex flex-col items-center justify-center">
            <img src={timeIcon} alt="Time" className="w-[16vw] h-[16vw] mb-[4vw]" />
            <span className="text-white text-size-[15vw] font-semibold">1m</span>
          </div>

          {/* Down按钮 */}
          <div
            className={`w-[127vw] h-[50vw] rounded-[12vw] flex items-center justify-center gap-[8vw] ${isButtonsDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            style={{
              backgroundColor: '#f5384e',
              filter: isButtonsDisabled ? 'brightness(0.3)' : 'brightness(1)'
            }}
          >
            <img src={buyDownIcon} alt="Down" className="w-[24vw] h-[24vw]" />
            <span className="text-white text-size-[17vw] font-semibold">Down</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trade;
