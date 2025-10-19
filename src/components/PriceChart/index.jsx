import { useEffect, useRef, useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { priceService } from '../../services';


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// 自定义插件：闪烁当前价格点和价格线
const customDrawPlugin = {
  id: 'customDraw',
  afterDatasetsDraw: (chart) => {
    const { ctx, scales, data } = chart;

    if (!scales.y || !data.datasets[0]) return;

    // 找到第120个数据点（索引119）作为当前价格点
    const dataset = data.datasets[0];
    const dataArray = dataset.data;
    const targetIndex = 119; // 第120个数据点（索引119）
    let currentPrice = null;

    // 检查第120个数据点是否存在且有效
    if (targetIndex < dataArray.length && dataArray[targetIndex] !== null && dataArray[targetIndex] !== undefined) {
      currentPrice = dataArray[targetIndex];
    } else {
      // 如果第120个数据点不存在，找最后一个有效数据点
      for (let i = Math.min(targetIndex, dataArray.length - 1); i >= 0; i--) {
        if (dataArray[i] !== null && dataArray[i] !== undefined) {
          currentPrice = dataArray[i];
          break;
        }
      }
    }

    if (!currentPrice) return;

    const yScale = scales.y;
    const xScale = scales.x;

    // 计算当前价格点的位置（固定在第120个数据点位置）
    const currentPriceY = yScale.getPixelForValue(currentPrice);
    const currentPriceX = xScale.getPixelForValue(targetIndex);

    // 检查是否有价格变化来决定是否闪烁
    const shouldBlink = chart.options.priceChanged || false;

    ctx.save();

    // 注意：此插件仅绘制当前价格线与点，不依赖时间戳映射

    // 绘制水平虚线（从图表最左边到最右边）
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#C5FF33';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(chart.chartArea.left, currentPriceY);
    ctx.lineTo(chart.width, currentPriceY); // 延伸到canvas最右边
    ctx.stroke();
    ctx.setLineDash([]);

    // 绘制闪烁的当前价格点
    let opacity = 1; // 默认完全显示

    if (shouldBlink && chart.options.blinkStartTime) {
      const currentTime = Date.now();
      const elapsed = currentTime - chart.options.blinkStartTime;

      if (elapsed < 700) {
        // 700ms内从0淡入到1
        opacity = elapsed / 700;
      } else {
        // 700ms后保持完全显示
        opacity = 1;
      }
    }

    // 绘制光点和阴影
    ctx.save();

    // 绘制单层阴影（透明度20%）
    ctx.globalAlpha = opacity * 0.17;
    ctx.fillStyle = '#C5FF33';
    ctx.beginPath();
    ctx.arc(currentPriceX, currentPriceY, 10, 0, 2 * Math.PI); // 阴影半径8px
    ctx.fill();

    // 绘制主光点
    ctx.globalAlpha = opacity;
    ctx.fillStyle = '#C5FF33';
    ctx.beginPath();
    ctx.arc(currentPriceX, currentPriceY, 4, 0, 2 * Math.PI); // 主光点半径4px
    ctx.fill();



    // 绘制右侧价格标签
    const priceText = currentPrice.toFixed(1);
    const fontSize = window.innerWidth >= 768 ? 14 : 12; // PC端14px，移动端12px
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // 测量文字尺寸
    const textMetrics = ctx.measureText(priceText);
    const textWidth = textMetrics.width;
    const paddingH = window.innerWidth >= 768 ? 3 : 2; // PC端3px，移动端2px水平方向
    const paddingV = window.innerWidth >= 768 ? 2 : 1; // PC端2px，移动端1px垂直方向
    const labelWidth = textWidth + paddingH * 2;
    const labelHeight = fontSize + paddingV * 2;

    // 绘制圆角矩形背景
    const rightX = chart.width - labelWidth;
    const cornerRadius = 3;

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#C5FF33';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(rightX, currentPriceY - labelHeight/2, labelWidth, labelHeight, cornerRadius);
    } else {
      drawRoundedRect(ctx, rightX, currentPriceY - labelHeight/2, labelWidth, labelHeight, cornerRadius);
    }
    ctx.fill();

    // 绘制价格文字
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText(priceText, rightX + labelWidth/2, currentPriceY);

    ctx.restore();
  }
};

// 用户下注点绘制插件
const userBetsPlugin = {
  id: 'userBets',
  afterDatasetsDraw: (chart) => {
    const { ctx, scales, data } = chart;
    const userBets = chart.options.userBets || [];

    if (!scales.y || !scales.x || userBets.length === 0) return;

    const yScale = scales.y;
    const xScale = scales.x;
    const dataset = data.datasets[0];
    const dataArray = dataset.data;
    const indexTimestampsLeft = chart.options.indexTimestampsLeft || [];
    const lastTimestamp = chart.options.lastTimestamp;

    ctx.save();

    // 在左侧真实数据位置中，依据时间戳找到稳定匹配索引（容忍度2秒）
    const findNearestLeftIndex = (ts) => {
      if (!indexTimestampsLeft || indexTimestampsLeft.length === 0 || typeof ts !== 'number') return -1;
      let nearestIndex = -1;
      let minDiff = Infinity;
      for (let i = 0; i < indexTimestampsLeft.length; i++) {
        const diff = Math.abs(indexTimestampsLeft[i] - ts);
        if (diff < minDiff) {
          minDiff = diff;
          nearestIndex = i;
        }
      }
      return minDiff <= 2000 ? nearestIndex : -1;
    };

    userBets.forEach(bet => {
      const betTime = bet.timestamp;
      const settlementTime = (typeof bet.settlementTime === 'number') ? bet.settlementTime : (betTime + 60000); // 60秒后结算

      // 基于时间判断是否已经结算，避免跨页面返回时出现状态延迟
      const hasSettled = (typeof lastTimestamp === 'number') && (settlementTime <= lastTimestamp);

      // 依据时间戳在左侧数据区域定位稳定索引；未稳定匹配则不绘制以避免闪烁
      const betIndex = findNearestLeftIndex(betTime);
      let settlementIndex;
      if (hasSettled) {
        settlementIndex = findNearestLeftIndex(settlementTime);
      } else if (typeof lastTimestamp === 'number') {
        const futureOffsetSec = Math.floor((settlementTime - lastTimestamp) / 1000);
        settlementIndex = 119 + futureOffsetSec; // 预测区域
      } else {
        settlementIndex = null;
      }

      // 计算用于绘制的价格（优先使用图表数据以确保点位在折线上）
      const betPriceValue = (betIndex >= 0 && betIndex < dataArray.length && dataArray[betIndex] != null)
        ? dataArray[betIndex]
        : bet.price;

      const settlementPriceValue = (settlementIndex >= 0 && settlementIndex < dataArray.length && dataArray[settlementIndex] != null)
        ? dataArray[settlementIndex]
        : (typeof bet.settlementPrice === 'number' ? bet.settlementPrice : bet.price);

      if (hasSettled) {
        // 已结算的交易：显示结算信息（位置与胜负基于图表数据计算）
        if (settlementIndex >= 0 && settlementIndex < 180) {
          const settlementX = xScale.getPixelForValue(settlementIndex);
          const settlementY = yScale.getPixelForValue(settlementPriceValue);

          // 绘制结算点（黑色三角形）
          drawSettlementPoint(ctx, settlementX, settlementY, bet.direction);

          // 依据图表数据计算胜负与盈利金额，避免因取价时机误差导致样式错误
          const isWin = (bet.direction === 'up')
            ? (settlementPriceValue > betPriceValue)
            : (settlementPriceValue < betPriceValue);
          const profit = isWin ? (bet.amount * (1 - 0.03)) : 0;

          if (isWin && profit > 0) {
            drawProfitAmount(ctx, settlementX, settlementY, profit, bet.direction);
          }
        }
      } else {
        // 活跃的下注：显示下注点和预测线
        // 如果下注点已经超出显示范围，跳过
        if (betIndex < 0 || betIndex >= dataArray.length) return;

        // 获取下注点位置（对齐到折线）
        const betPriceY = yScale.getPixelForValue(betPriceValue);
        const betPriceX = xScale.getPixelForValue(betIndex);

        // 绘制下注点（新尺寸20px）
        drawBetPoint(ctx, betPriceX, betPriceY, bet.direction);

        // 如果结算时间点在可见范围内，绘制虚线和连接点
        if (settlementIndex >= 0 && settlementIndex < 180) {
          const settlementX = xScale.getPixelForValue(settlementIndex);

          // 绘制结算虚线
          drawSettlementLine(ctx, settlementX, chart.chartArea, bet.direction);

          // 绘制连接线和连接点（水平连接到结算时间）
          drawConnectionLine(ctx, betPriceX, betPriceY, settlementX, betPriceY, bet.direction);
          drawConnectionPoint(ctx, settlementX, betPriceY, bet.direction);
        }
      }
    });

    ctx.restore();
  }
};

// 绘制单个下注点的函数（新尺寸20px）
function drawBetPoint(ctx, x, y, direction) {
  const pointSize = 20; // 点的宽高（从10改为20）
  const triangleSize = 8; // 三角形宽度（从4改为8）

  // 根据方向决定颜色
  const backgroundColor = direction === 'up' ? '#00bc4b' : '#f5384e';

  ctx.save();

  // 绘制圆形背景
  ctx.fillStyle = backgroundColor;
  ctx.beginPath();
  ctx.arc(x, y, pointSize / 2, 0, 2 * Math.PI);
  ctx.fill();

  // 绘制白色三角形
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();

  if (direction === 'up') {
    // 向上三角形
    ctx.moveTo(x, y - triangleSize / 2);
    ctx.lineTo(x - triangleSize / 2, y + triangleSize / 2);
    ctx.lineTo(x + triangleSize / 2, y + triangleSize / 2);
  } else {
    // 向下三角形
    ctx.moveTo(x, y + triangleSize / 2);
    ctx.lineTo(x - triangleSize / 2, y - triangleSize / 2);
    ctx.lineTo(x + triangleSize / 2, y - triangleSize / 2);
  }

  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// 绘制结算虚线的函数
function drawSettlementLine(ctx, x, chartArea, direction) {
  const color = direction === 'up' ? '#00bc4b' : '#f5384e';

  ctx.save();
  ctx.setLineDash([5, 5]); // 虚线样式
  ctx.strokeStyle = color;
  ctx.lineWidth = 1; // 改为1px，更细
  ctx.beginPath();
  ctx.moveTo(x, chartArea.top);
  ctx.lineTo(x, chartArea.bottom);
  ctx.stroke();
  ctx.setLineDash([]); // 重置虚线
  ctx.restore();
}

// 绘制连接线的函数
function drawConnectionLine(ctx, startX, startY, endX, endY, direction) {
  const color = direction === 'up' ? '#00bc4b' : '#f5384e';

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.restore();
}

// 绘制连接点的函数
function drawConnectionPoint(ctx, x, y, direction) {
  const pointSize = 10; // 连接点大小
  const color = direction === 'up' ? '#00bc4b' : '#f5384e';

  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, pointSize / 2, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();
}

// 绘制结算点的函数（黑色三角形）
function drawSettlementPoint(ctx, x, y, direction) {
  const pointSize = 20; // 点的宽高，与下注点一致
  const triangleSize = 8; // 三角形宽度，与下注点一致

  // 根据方向决定颜色
  const backgroundColor = direction === 'up' ? '#00bc4b' : '#f5384e';

  ctx.save();

  // 绘制圆形背景
  ctx.fillStyle = backgroundColor;
  ctx.beginPath();
  ctx.arc(x, y, pointSize / 2, 0, 2 * Math.PI);
  ctx.fill();

  // 绘制黑色三角形（与下注点的白色三角形不同）
  ctx.fillStyle = '#000000';
  ctx.beginPath();

  if (direction === 'up') {
    // 向上三角形
    ctx.moveTo(x, y - triangleSize / 2);
    ctx.lineTo(x - triangleSize / 2, y + triangleSize / 2);
    ctx.lineTo(x + triangleSize / 2, y + triangleSize / 2);
  } else {
    // 向下三角形
    ctx.moveTo(x, y + triangleSize / 2);
    ctx.lineTo(x - triangleSize / 2, y - triangleSize / 2);
    ctx.lineTo(x + triangleSize / 2, y - triangleSize / 2);
  }

  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// 绘制盈利金额的函数
function drawProfitAmount(ctx, x, y, profit, direction) {
  const fontSize = 10; // 字体大小10px
  const padding = 4; // 内边距
  const borderRadius = 8; // 圆角半径
  const overlap = 2; // 与结算点的重叠距离

  // 根据方向决定边框和文字颜色
  const borderColor = direction === 'up' ? '#00bc4b' : '#f5384e';
  const textColor = borderColor;

  ctx.save();

  // 设置字体
  ctx.font = `${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 格式化金额文本（显示小数点后两位）
  const profitText = `+${profit.toFixed(2)}`;

  // 测量文字尺寸
  const textMetrics = ctx.measureText(profitText);
  const textWidth = textMetrics.width;
  const labelWidth = textWidth + padding * 2;
  const labelHeight = fontSize + padding * 2;

  // 计算金额标签位置（在结算点左边，有重叠）
  const labelX = x - labelWidth / 2 - 10 + overlap; // 向左偏移10px，然后重叠2px
  const labelY = y;

  // 绘制黑色背景的圆角矩形
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  drawRoundedRect(ctx, labelX - labelWidth / 2, labelY - labelHeight / 2, labelWidth, labelHeight, borderRadius);
  ctx.fill();

  // 绘制边框
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  drawRoundedRect(ctx, labelX - labelWidth / 2, labelY - labelHeight / 2, labelWidth, labelHeight, borderRadius);
  ctx.stroke();

  // 绘制文字
  ctx.fillStyle = textColor;
  ctx.fillText(profitText, labelX, labelY);

  ctx.restore();
}

// 绘制圆角矩形的辅助函数
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// 参考线插件：绘制最近一次下注的水平参考线
const referenceLinePlugin = {
  id: 'referenceLine',
  afterDatasetsDraw: (chart) => {
    const ref = chart.options.referenceLine;
    if (!ref) return;

    const { ctx, scales } = chart;
    if (!scales.y) return;

    const yScale = scales.y;
    const y = yScale.getPixelForValue(ref.price);
    const color = ref.direction === 'up' ? '#00bc4b' : (ref.direction === 'down' ? '#f5384e' : '#C5FF33');

    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(chart.chartArea.left, y);
    ctx.lineTo(chart.chartArea.right, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // 绘制右侧标签
    const label = 'Last Bet';
    const fontSize = window.innerWidth >= 768 ? 12 : 10;
    const paddingH = 4;
    const paddingV = 2;
    ctx.font = `${fontSize}px Arial`;
    const textWidth = ctx.measureText(label).width;
    const labelWidth = textWidth + paddingH * 2;
    const labelHeight = fontSize + paddingV * 2;
    const rightX = chart.chartArea.right - labelWidth - 2; // 贴近图表区域右侧

    // 背景
    ctx.fillStyle = color;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(rightX, y - labelHeight / 2, labelWidth, labelHeight, 4);
    } else {
      drawRoundedRect(ctx, rightX, y - labelHeight / 2, labelWidth, labelHeight, 4);
    }
    ctx.fill();

    // 文本
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, rightX + labelWidth / 2, y);

    ctx.restore();
  }
};

ChartJS.register(customDrawPlugin, userBetsPlugin, referenceLinePlugin);

const PriceChart = ({ onPriceUpdate, userBets = [], onVisibleUserBetsChange }) => {
  const chartRef = useRef(null);

  const [priceData, setPriceData] = useState([]); // 存储价格数据（120个数据点）
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceChanged, setPriceChanged] = useState(false);
  const [timeUpdate, setTimeUpdate] = useState(0); // 用于强制更新时间
  const [isLoading, setIsLoading] = useState(true); // 加载状态
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false); // 历史数据是否已加载
  const [referenceLine, setReferenceLine] = useState(null); // 最近一次下注参考线
  const animationRef = useRef(null);
  const previousPriceRef = useRef(null);
  const blinkStartTimeRef = useRef(null); // 记录闪烁开始时间
  const wsRef = useRef(null); // WebSocket连接引用
  const reconnectTimeoutRef = useRef(null); // 重连定时器引用
  const latestBaselineRef = useRef(null); // 记录60秒前的基准价格
  // 移除加载延迟隐藏逻辑，直接在数据就绪后隐藏加载



  // 启动持续的动画循环来支持闪烁效果
  useEffect(() => {
    const animate = () => {
      if (chartRef.current) {
        chartRef.current.update('none'); // 不使用动画更新，只重绘
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // 在组件卸载或严格模式下的效果重连前，主动销毁 Chart 实例，避免“Canvas is already in use”错误
  useEffect(() => {
    return () => {
      try {
        if (chartRef.current && typeof chartRef.current.destroy === 'function') {
          chartRef.current.destroy();
          chartRef.current = null;
        }
      } catch (e) {
        // 安全忽略销毁异常
      }
    };
  }, []);

  // 获取历史价格数据（120秒，119个数据点）- 只在组件初始化时执行一次
  useEffect(() => {
    const fetchHistoryData = async () => {
      try {
        setIsLoading(true);
        console.log('📊 开始获取历史价格数据...');

        const response = await priceService.getHistoryPrice('1m', 119);

        if (response.success && response.data && Array.isArray(response.data)) {
          // API返回的数据格式: {count: 1000, data: [{price, timestamp, symbol}, ...]}
          // 转换为内部使用的格式: [[timestamp, price], ...]
          // 取最新的119个数据点（保留1个位置给当前价格）
          const rawData = response.data.slice(-119);
          const historyData = rawData.map(item => [item.timestamp, parseFloat(item.price)]);

          console.log('📊 历史价格数据获取成功:', {
            totalPoints: response.data.length,
            usedPoints: historyData.length,
            firstPrice: historyData[0] ? historyData[0][1].toFixed(2) : 'N/A',
            lastPrice: historyData[historyData.length - 1] ? historyData[historyData.length - 1][1].toFixed(2) : 'N/A',
            timeRange: historyData.length > 0 ?
              `${new Date(historyData[0][0]).toLocaleTimeString()} - ${new Date(historyData[historyData.length - 1][0]).toLocaleTimeString()}` : 'N/A'
          });

          setPriceData(historyData);
          setIsHistoryLoaded(true);
          // 历史数据已就绪后立即隐藏Loading（保留转圈样式，但不延迟）
          setIsLoading(false);
        } else {
          throw new Error('历史价格数据格式错误');
        }
      } catch (error) {
        console.error('❌ 获取历史价格数据失败:', error);
        // 如果是频率限制错误，等待更长时间再重试
        const retryDelay = error.message && error.message.includes('頻繁') ? 5000 : 2000;
        console.log(`⏰ ${retryDelay/1000}秒后重试获取历史数据...`);
        setTimeout(fetchHistoryData, retryDelay);
      }
    };

    // 只在组件初始化时获取一次历史数据
    if (!isHistoryLoaded) {
      fetchHistoryData();
    }
  }, [isHistoryLoaded]); // 依赖历史数据加载状态

  // 组件卸载时无需清理加载延迟定时器（已移除）。

  // 用于存储最新的价格数据，供父组件回调使用
  const latestPriceDataRef = useRef(null);

  // WebSocket连接管理 - 历史数据加载完成后开始
  useEffect(() => {
    if (!isHistoryLoaded) return; // 等待历史数据加载完成

    const connectWebSocket = () => {
      try {
        console.log('🔌 正在连接WebSocket到: wss://ws.bitrockets.xyz/ws/price');
        wsRef.current = new WebSocket('wss://ws.bitrockets.xyz/ws/price');

        wsRef.current.onopen = () => {
          console.log('✅ WebSocket连接成功');
          // 清除重连定时器
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
        };

        wsRef.current.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);

            // 只处理价格更新消息
            if (message.type === 'price_update') {
              const newPrice = parseFloat(message.data.price);
              const newTimestamp = message.timestamp;

              // 检查价格是否变化来决定是否闪烁
              if (previousPriceRef.current !== null && previousPriceRef.current !== newPrice) {
                setPriceChanged(true);
                blinkStartTimeRef.current = Date.now(); // 记录闪烁开始时间

                // 700ms后停止闪烁状态
                setTimeout(() => {
                  setPriceChanged(false);
                }, 700);
              }

              previousPriceRef.current = newPrice;
              setCurrentPrice(newPrice);

              // 更新价格数据 - 滑动窗口：新数据进来，最老数据移出
              // 更新价格数据并计算60秒前的基准价格
              setPriceData(prevData => {
                const newDataPoint = [newTimestamp, newPrice];
                const updatedData = [...prevData, newDataPoint];
                // 保持120个数据点
                const finalData = updatedData.slice(-120);
                // 计算60秒前的价格（如果不足60个数据点，则取最早的数据）
                const baselineIndex = finalData.length > 60 ? finalData.length - 60 : 0;
                const baselinePoint = finalData[baselineIndex];
                latestBaselineRef.current = Array.isArray(baselinePoint) ? baselinePoint[1] : null;
                return finalData;
              });

              // 触发时间更新
              setTimeUpdate(prev => prev + 1);

              // 存储最新价格数据到ref，供单独的useEffect使用
              latestPriceDataRef.current = {
                timestamp: newTimestamp,
                price: newPrice,
                time: new Date(newTimestamp).toLocaleTimeString('en-US', {
                  hour12: false,
                  minute: '2-digit',
                  second: '2-digit'
                }),
                // 透传60秒前的基准价格给父组件
                price60sAgo: latestBaselineRef.current
              };

              console.log('💰 WebSocket价格更新:', {
                symbol: message.data.symbol,
                price: newPrice.toFixed(2),
                timestamp: newTimestamp,
                time: new Date(newTimestamp).toLocaleTimeString(),
                price60sAgo: latestBaselineRef.current
              });
            }
          } catch (error) {
            console.error('❌ WebSocket消息解析失败:', error);
          }
        };

        wsRef.current.onerror = (error) => {
          console.error('❌ WebSocket连接错误:', error);
        };

        wsRef.current.onclose = (event) => {
          console.log('🔌 WebSocket连接关闭:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });

          // 只有在组件还存在时才重连
          if (wsRef.current !== null) {
            console.log('🔄 1秒后重连WebSocket...');
            reconnectTimeoutRef.current = setTimeout(connectWebSocket, 1000);
          }
        };

      } catch (error) {
        console.error('❌ WebSocket连接失败:', error.message);
        // 连接失败时也要重连
        console.log('🔄 1秒后重试连接WebSocket...');
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 1000);
      }
    };

    // 建立WebSocket连接
    connectWebSocket();

    return () => {
      // 清理WebSocket连接和重连定时器
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [isHistoryLoaded]); // 依赖历史数据加载状态

  // 单独的useEffect来处理父组件回调，避免在渲染过程中调用
  useEffect(() => {
    if (latestPriceDataRef.current && onPriceUpdate) {
      // console.log('📤 发送价格数据给Trade组件:', latestPriceDataRef.current);
      onPriceUpdate(latestPriceDataRef.current);
    }
  }, [currentPrice, onPriceUpdate]); // 当currentPrice变化时触发回调

  // 处理价格数据
  const combinedData = useMemo(() => {
    if (!priceData || priceData.length === 0) {
      return [];
    }

    // 将API数据转换为组件内部使用的格式
    return priceData.map(([timestamp, price]) => ({
      timestamp,
      price,
      time: new Date(timestamp).toLocaleTimeString('en-US', {
        hour12: false,
        minute: '2-digit',
        second: '2-digit'
      })
    }));
  }, [priceData]);

  // 计算Y轴范围
  const yAxisRange = useMemo(() => {
    if (combinedData.length === 0) return { min: 0, max: 100000 };

    const prices = combinedData.map(item => item.price);
    // 将参考线价格纳入范围计算，避免参考线超出可见区域
    const refPrice = referenceLine && typeof referenceLine.price === 'number' ? referenceLine.price : null;
    if (refPrice !== null) prices.push(refPrice);

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice;
    const padding = range * 0.1; // 10% padding

    return {
      min: minPrice - padding,
      max: maxPrice + padding
    };
  }, [combinedData, referenceLine]);

  // 生成时间标签（6个时间点）- 基于120个数据点
  const timeLabels = useMemo(() => {
    if (!combinedData || combinedData.length === 0) {
      // 如果没有数据，使用当前时间生成默认标签
      const now = Date.now();
      const labels = [];

      // 前4个标签：模拟120个数据点中的索引[0,39,79,119]
      for (let i = 0; i < 4; i++) {
        const timeOffset = (119 - [0, 39, 79, 119][i]) * 1000; // 往前推的时间
        const time = new Date(now - timeOffset);
        labels.push(time.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }));
      }

      // 后2个标签：预测时间（+30秒，+60秒）
      labels.push(new Date(now + 30000).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
      labels.push(new Date(now + 60000).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));

      return labels;
    }

    const labels = [];
    const dataLength = combinedData.length;

    // 前4个标签：基于视觉平均分布，对应数据区域的时间点
    // 视觉位置对应的数据索引：36->27, 72->54, 107->81, 143->108 (按比例映射到120个数据点)
    const visualToDataIndices = [
      0,                                    // 第1个标签：数据索引0
      Math.round(36 * 120 / 180),         // 第2个标签：视觉位置36对应数据索引24
      Math.round(72 * 120 / 180),         // 第3个标签：视觉位置72对应数据索引48
      Math.round(107 * 120 / 180)         // 第4个标签：视觉位置107对应数据索引71
    ];

    for (let i = 0; i < 4; i++) {
      const index = visualToDataIndices[i];
      if (index < dataLength) {
        const timestamp = combinedData[index].timestamp;
        labels.push(new Date(timestamp).toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }));
      } else {
        // 如果数据不足，使用最后一个数据的时间
        const lastTimestamp = combinedData[dataLength - 1].timestamp;
        labels.push(new Date(lastTimestamp).toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }));
      }
    }

    // 后2个标签：预测时间（基于最后一个数据点的时间+30秒，+60秒）
    const lastTimestamp = combinedData[dataLength - 1].timestamp;
    labels.push(new Date(lastTimestamp + 30000).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }));
    labels.push(new Date(lastTimestamp + 60000).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }));

    return labels;
  }, [combinedData, timeUpdate]); // 依赖数据和时间更新状态

  // 定时更新时间标签
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUpdate(prev => prev + 1);
    }, 1000); // 每秒更新一次时间

    return () => clearInterval(interval);
  }, []);

  // 根据可见时间窗口过滤下注点并回传给父组件，同时同步到本地存储
  const lastVisibleIdsRef = useRef(null);
  useEffect(() => {
    if (!combinedData || combinedData.length === 0) return;
    const leftTs = combinedData[0].timestamp;
    const filtered = (userBets || []).filter(b => typeof b.timestamp === 'number' && b.timestamp >= leftTs);
    const idsSig = JSON.stringify(filtered.map(b => b.id));
    // 如果可见集合未变化，则不回传，避免循环更新
    if (lastVisibleIdsRef.current === idsSig) return;
    lastVisibleIdsRef.current = idsSig;
    if (typeof onVisibleUserBetsChange === 'function') {
      onVisibleUserBetsChange(filtered);
    }
  }, [combinedData, userBets, onVisibleUserBetsChange]);

  // 闪烁动画循环
  useEffect(() => {
    if (priceChanged) {
      const animate = () => {
        if (chartRef.current) {
          chartRef.current.update('none'); // 闪烁效果不使用动画，只重新渲染
        }
        if (priceChanged) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [priceChanged]);

  // 数据更新时触发滑动动画
  useEffect(() => {
    if (chartRef.current && combinedData.length > 0) {
      // 使用默认动画模式更新图表，实现滑动效果
      setTimeout(() => {
        if (chartRef.current) {
          chartRef.current.update('active');
        }
      }, 50); // 延迟50ms确保数据已经更新
    }
  }, [combinedData]);

  // Chart.js 配置
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    currentPrice: currentPrice, // 传递当前价格给插件
    priceChanged: priceChanged, // 传递价格变化状态给插件
    blinkStartTime: blinkStartTimeRef.current, // 传递闪烁开始时间给插件
    userBets: userBets, // 传递用户下注数据给插件
    indexTimestampsLeft: combinedData.slice(-120).map(d => d.timestamp),
    lastTimestamp: combinedData.length ? combinedData[combinedData.length - 1].timestamp : null,
    // 禁用初始与更新动画，避免进入页面时的上升/淡入效果
    animation: false,
    transitions: {},
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    scales: {
      x: {
        type: 'category',
        display: true,
        position: 'bottom', // 明确指定位置
        offset: false, // 关键：不偏移，贴边显示
        grid: {
          display: false, // 移除横线
          drawBorder: false,
          offset: false, // 网格也不偏移
        },
        ticks: {
          display: true,
          color: '#8f8f8f',
          font: {
            size: window.innerWidth >= 768 ? 12 : 10, // PC端12px，移动端10px
          },
          maxTicksLimit: 6,
          autoSkip: false,
          padding: 0, // 类似Y轴的padding控制
          callback: function(_, index) {
            // 显示6个时间点，基于120个数据点的新布局
            // 前4个标签对应数据索引[0,39,79,119]，后2个标签在预测区域
            // 图表总宽度需要容纳120个数据点 + 预测区域
            // 假设总宽度为180个位置（120个数据 + 60个预测区域）
            const totalPositions = 180;

            // 计算6个标签的位置 - 视觉上平均分布
            // 总共180个位置，6个标签平均分布
            const positions = [
              0,                                    // 第1个位置
              Math.round((totalPositions - 1) * 1 / 5), // 第2个位置 (1/5)
              Math.round((totalPositions - 1) * 2 / 5), // 第3个位置 (2/5)
              Math.round((totalPositions - 1) * 3 / 5), // 第4个位置 (3/5)
              Math.round((totalPositions - 1) * 4 / 5), // 第5个位置 (4/5)
              totalPositions - 1                    // 第6个位置 (最右端)
            ];

            if (positions.includes(index)) {
              const labelIndex = positions.indexOf(index);
              return timeLabels[labelIndex] || '';
            }
            return '';
          }
        },
        border: {
          display: false,
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'right',
        min: yAxisRange.min,
        max: yAxisRange.max,
        grid: {
          display: false, // 移除横线
          drawBorder: false,
        },
        ticks: {
          display: true,
          color: '#8f8f8f',
          font: {
            size: window.innerWidth >= 768 ? 12 : 10, // PC端12px，移动端10px
          },
          count: 6,
          padding: window.innerWidth >= 768 ? 6 : 4, // PC端6px，移动端4px距离右边
          callback: function(value) {
            return value.toFixed(1);
          }
        },
        border: {
          display: false,
        },
      },
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 0,
      },
      line: {
        borderWidth: 1, // 线条宽度1px
        tension: 0.1,
      },
    },
    layout: {
      padding: {
        left: 0, // 恢复正常padding
        right: 0,
        top: 0,
        bottom: 0
      }
    },
  };



  // 准备图表数据，120个数据点显示在左侧2/3区域
  const displayData = useMemo(() => {
    const totalLength = 180; // 总图表宽度（120个数据位置 + 60个预测区域位置）

    // 创建完整的数据数组，右侧1/3为空
    const fullData = new Array(totalLength).fill(null);

    // 填充左侧数据区域
    if (combinedData.length > 0) {
      // 确保我们有120个数据点
      const dataToShow = combinedData.slice(-120); // 取最新的120个数据点

      // 将120个数据点填充到前120个位置
      dataToShow.forEach((item, index) => {
        if (item && item.price !== undefined) {
          fullData[index] = item.price;
        }
      });
    }

    return fullData;
  }, [combinedData]);

  const data = {
    labels: new Array(180).fill(''), // 总共180个标签位置
    datasets: [
      {
        label: 'BTC Price',
        data: displayData,
        borderColor: '#C5FF33', // rgb(197, 255, 51) 转换为16进制
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;

          if (!chartArea) return null;

          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(204, 255, 51, 0.44)');
          gradient.addColorStop(1, 'rgba(204, 255, 51, 0)');

          return gradient;
        },
        fill: true,
        pointRadius: 0, // 所有点都不显示，通过插件绘制闪烁点
        pointBackgroundColor: 'transparent',
        pointBorderColor: 'transparent',
        pointBorderWidth: 0,
        spanGaps: false, // 不连接空数据点
        stepped: false,
        cubicInterpolationMode: 'default',
        // 线条动画配置
        tension: 0.4, // 增加线条平滑度
        borderWidth: 1, // 线条宽度1px
      },
    ],
  };

  // 检查是否有足够的数据来显示图表
  const hasEnoughData = combinedData.length > 10;

  return (
    <div className="w-[375vw] md:w-full h-full relative" style={{ backgroundColor: '#121212' }}>
      {isLoading || !hasEnoughData ? (
        // Loading状态
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-[32vw] md:w-8 h-[32vw] md:h-8 border-2 border-[#95C02A] border-t-transparent rounded-full animate-spin mb-[8vw] md:mb-2" />
          <div className="text-white text-size-[16vw] md:text-base">Loading...</div>
        </div>
      ) : (
        // 图表内容
        <>
          {/* Chart.js 图表 - 稍微向左移动，贴左边 */}
          <div className="w-full h-full relative overflow-hidden">
            {/* 图表容器，向左偏移一小段距离 */}
            <div className="absolute left-[-4%] md:left-0 top-0 w-[103%] md:w-full h-full">
              <Line ref={chartRef} data={data} options={chartOptions} />
            </div>
          </div>


        </>
      )}
    </div>
  );
};

export default PriceChart;
