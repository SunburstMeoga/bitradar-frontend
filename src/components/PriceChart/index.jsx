import React, { useEffect, useRef, useState, useMemo } from 'react';
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
import useWebSocket from '../../hooks/useWebSocket';

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

    // 找到最后一个有效数据点
    const dataset = data.datasets[0];
    const dataArray = dataset.data;
    let lastValidIndex = -1;
    let lastValidPrice = null;

    // 从后往前找最后一个非null值
    for (let i = dataArray.length - 1; i >= 0; i--) {
      if (dataArray[i] !== null && dataArray[i] !== undefined) {
        lastValidIndex = i;
        lastValidPrice = dataArray[i];
        break;
      }
    }

    if (lastValidIndex === -1 || !lastValidPrice) return;

    const yScale = scales.y;
    const xScale = scales.x;

    // 计算当前价格点的位置
    const currentPriceY = yScale.getPixelForValue(lastValidPrice);
    const currentPriceX = xScale.getPixelForValue(lastValidIndex);

    // 检查是否有价格变化来决定是否闪烁
    const shouldBlink = chart.options.priceChanged || false;

    ctx.save();

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
    ctx.globalAlpha = opacity * 0.2;
    ctx.fillStyle = '#C5FF33';
    ctx.beginPath();
    ctx.arc(currentPriceX, currentPriceY, 8, 0, 2 * Math.PI); // 阴影半径8px
    ctx.fill();

    // 绘制主光点
    ctx.globalAlpha = opacity;
    ctx.fillStyle = '#C5FF33';
    ctx.beginPath();
    ctx.arc(currentPriceX, currentPriceY, 3, 0, 2 * Math.PI); // 主光点半径3px
    ctx.fill();



    // 绘制右侧价格标签
    const priceText = lastValidPrice.toFixed(1);
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // 测量文字尺寸
    const textMetrics = ctx.measureText(priceText);
    const textWidth = textMetrics.width;
    const paddingH = 2; // 水平方向2px
    const paddingV = 1; // 垂直方向1px
    const labelWidth = textWidth + paddingH * 2;
    const labelHeight = 12 + paddingV * 2;

    // 绘制圆角矩形背景
    const rightX = chart.width - labelWidth;
    const cornerRadius = 3;

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#C5FF33';
    ctx.beginPath();
    ctx.roundRect(rightX, currentPriceY - labelHeight/2, labelWidth, labelHeight, cornerRadius);
    ctx.fill();

    // 绘制价格文字
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText(priceText, rightX + labelWidth/2, currentPriceY);

    ctx.restore();
  }
};

ChartJS.register(customDrawPlugin);

const PriceChart = ({ onPriceUpdate }) => {
  const chartRef = useRef(null);
  const [chartData, setChartData] = useState([]);
  const [mockData, setMockData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceChanged, setPriceChanged] = useState(false);
  const [timeUpdate, setTimeUpdate] = useState(0); // 用于强制更新时间
  const animationRef = useRef(null);
  const previousPriceRef = useRef(null);
  const blinkStartTimeRef = useRef(null); // 记录闪烁开始时间

  // WebSocket连接
  const { data: wsData, error } = useWebSocket('wss://crypto.nickwongon99.top');

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

  // 生成模拟历史数据（1分30秒，每秒一个数据点）
  useEffect(() => {
    const generateMockData = () => {
      const now = Date.now();
      const data = [];
      const basePrice = currentPrice || 67234.56;

      // 生成90个数据点（1分30秒）
      for (let i = 90; i >= 0; i--) {
        const timestamp = now - (i * 1000);
        // 生成随机价格变化（±0.5%）
        const randomChange = (Math.random() - 0.5) * 0.01; // ±0.5%
        const price = basePrice * (1 + randomChange * (i / 90)); // 早期数据变化更大

        data.push({
          timestamp,
          price: price + (Math.random() - 0.5) * 100, // 添加一些噪音
          time: new Date(timestamp).toLocaleTimeString('en-US', {
            hour12: false,
            minute: '2-digit',
            second: '2-digit'
          })
        });
      }

      return data;
    };

    setMockData(generateMockData());
  }, [currentPrice]);

  // 合并模拟数据和真实数据
  const combinedData = useMemo(() => {
    const now = Date.now();
    const cutoffTime = now - 90000; // 1分30秒前

    // 过滤掉过期的模拟数据
    const validMockData = mockData.filter(item => item.timestamp > cutoffTime);

    // 合并数据
    const combined = [...validMockData, ...chartData];

    // 按时间排序并去重
    const sorted = combined
      .sort((a, b) => a.timestamp - b.timestamp)
      .filter((item, index, arr) =>
        index === 0 || item.timestamp !== arr[index - 1].timestamp
      );

    return sorted;
  }, [mockData, chartData]);

  // 计算Y轴范围
  const yAxisRange = useMemo(() => {
    if (combinedData.length === 0) return { min: 0, max: 100000 };

    const prices = combinedData.map(item => item.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice;
    const padding = range * 0.1; // 10% padding

    return {
      min: minPrice - padding,
      max: maxPrice + padding
    };
  }, [combinedData]);

  // 生成时间标签（6个时间点）- 实时更新
  const timeLabels = useMemo(() => {
    const now = Date.now();
    const labels = [];

    // 左侧3个时间点（往前1分30秒，等分）
    for (let i = 2; i >= 0; i--) {
      const time = new Date(now - (90000 / 3) * (i + 1));
      labels.push(time.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    }

    // 当前时间（在2/3位置）
    labels.push(new Date(now).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }));

    // 右侧2个时间点（未来时间，间隔约37秒）
    labels.push(new Date(now + 37000).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }));
    labels.push(new Date(now + 74000).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }));

    return labels;
  }, [timeUpdate]); // 依赖时间更新状态

  // 定时更新时间标签
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUpdate(prev => prev + 1);
    }, 1000); // 每秒更新一次时间

    return () => clearInterval(interval);
  }, []);

  // 闪烁动画循环
  useEffect(() => {
    if (priceChanged) {
      const animate = () => {
        if (chartRef.current) {
          chartRef.current.update('none'); // 强制重新渲染
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

  // Chart.js 配置
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    currentPrice: currentPrice, // 传递当前价格给插件
    priceChanged: priceChanged, // 传递价格变化状态给插件
    blinkStartTime: blinkStartTimeRef.current, // 传递闪烁开始时间给插件
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
            size: 10,
          },
          maxTicksLimit: 6,
          autoSkip: false,
          padding: 0, // 类似Y轴的padding控制
          callback: function(_, index) {
            // 显示6个时间点，均匀分布
            // 总共90个点，6个时间点的位置：0, 18, 36, 54, 72, 89
            const positions = [0, 18, 36, 54, 72, 89];

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
            size: 10,
          },
          count: 6,
          padding: 4, // 4px距离右边
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
        borderWidth: 1, // 调整为1px，视觉上看起来像2px
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
    animation: {
      duration: 800, // 800ms的平滑滑动动画
      easing: 'easeOutQuart', // 缓出动画，更自然的滑动效果
    },
  };

  // 处理新的价格数据
  useEffect(() => {
    if (wsData && wsData.price && wsData.timestamp) {
      const newDataPoint = {
        timestamp: wsData.timestamp,
        price: wsData.price,
        time: new Date(wsData.timestamp).toLocaleTimeString('en-US', {
          hour12: false,
          minute: '2-digit',
          second: '2-digit'
        })
      };

      // 每次WebSocket推送都触发闪烁（无论价格是否变化）
      setPriceChanged(true);
      blinkStartTimeRef.current = Date.now(); // 记录闪烁开始时间

      // 700ms后停止闪烁状态
      setTimeout(() => {
        setPriceChanged(false);
      }, 700);

      previousPriceRef.current = wsData.price;
      setCurrentPrice(wsData.price);

      // 实现向左滑动效果：新数据推入，所有数据向左移动
      setChartData(prev => {
        const updated = [...prev, newDataPoint];
        // 保持固定数量的数据点，新数据从右边推入，老数据从左边移出
        const maxPoints = 60; // 左侧2/3区域的数据点数
        return updated.slice(-maxPoints);
      });

      // 通知父组件价格更新
      if (onPriceUpdate) {
        onPriceUpdate({
          price: wsData.price,
          timestamp: wsData.timestamp,
          symbol: wsData.symbol
        });
      }
    }
  }, [wsData, onPriceUpdate]);

  // 准备图表数据，实现向左滑动效果
  const displayData = useMemo(() => {
    const totalLength = 90; // 总共90个点
    const leftSideLength = 60; // 左侧60个点（2/3）

    // 创建完整的数据数组，右侧1/3为空
    const fullData = new Array(totalLength).fill(null);

    // 填充左侧数据，实现向左滑动
    if (combinedData.length > 0) {
      // 取最新的数据填充到左侧区域的最右边（第60个位置）
      const recentData = combinedData.slice(-leftSideLength);

      // 从左侧区域的右边开始填充，新数据在最右边
      recentData.forEach((item, index) => {
        if (item && item.price) {
          const position = leftSideLength - recentData.length + index;
          if (position >= 0 && position < leftSideLength) {
            fullData[position] = item.price;
          }
        }
      });
    }

    return fullData;
  }, [combinedData]);

  const data = {
    labels: new Array(90).fill(''),
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
      },
    ],
  };

  // 检查是否有足够的数据来显示图表
  const hasEnoughData = combinedData.length > 10;

  return (
    <div className="w-[375vw] h-[346vw] relative" style={{ backgroundColor: '#121212' }}>
      {!hasEnoughData ? (
        // Loading状态
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-size-[16vw]">Loading...</div>
        </div>
      ) : (
        // 图表内容
        <>
          {/* Chart.js 图表 */}
          <div className="w-full h-full">
            <Line ref={chartRef} data={data} options={chartOptions} />
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="absolute top-[24vw] left-[8vw] right-[8vw] bg-red-500 bg-opacity-80 text-white text-size-[12vw] p-[8vw] rounded-[4vw] z-20">
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PriceChart;
