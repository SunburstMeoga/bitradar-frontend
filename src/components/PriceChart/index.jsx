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
    ctx.roundRect(rightX, currentPriceY - labelHeight/2, labelWidth, labelHeight, cornerRadius);
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

    if (!scales.y || !scales.x) return;

    // 调试信息
    if (userBets.length > 0) {
      console.log('🎨 绘制用户下注点:', userBets.length, '个点');
    }

    if (userBets.length === 0) return;

    const yScale = scales.y;
    const xScale = scales.x;
    const dataset = data.datasets[0];
    const dataArray = dataset.data;

    ctx.save();

    userBets.forEach(bet => {
      // 找到下注时间对应的数据点索引
      const betTime = bet.timestamp;

      // 从数据数组中找到最接近下注时间的数据点
      let closestIndex = -1;
      let minTimeDiff = Infinity;

      for (let i = 0; i < dataArray.length; i++) {
        if (dataArray[i] !== null && dataArray[i] !== undefined) {
          // 计算数据点的时间戳（基于当前时间往前推算）
          const dataPointTime = Date.now() - ((119 - i) * 1000);
          const timeDiff = Math.abs(dataPointTime - betTime);

          if (timeDiff < minTimeDiff) {
            minTimeDiff = timeDiff;
            closestIndex = i;
          }
        }
      }

      // 如果找不到合适的数据点或者时间差太大（超过60秒），跳过
      if (closestIndex === -1 || minTimeDiff > 60000) return;

      // 获取下注时的价格位置
      const betPriceY = yScale.getPixelForValue(bet.price);
      const betPriceX = xScale.getPixelForValue(closestIndex);

      // 绘制下注点
      drawBetPoint(ctx, betPriceX, betPriceY, bet.direction);
    });

    ctx.restore();
  }
};

// 绘制单个下注点的函数
function drawBetPoint(ctx, x, y, direction) {
  const pointSize = 10; // 点的宽高
  const triangleSize = 4; // 三角形宽度

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

ChartJS.register(customDrawPlugin, userBetsPlugin);

const PriceChart = ({ onPriceUpdate, userBets = [] }) => {
  const chartRef = useRef(null);

  // 调试：监听userBets变化
  useEffect(() => {
    if (userBets.length > 0) {
      console.log('📊 PriceChart收到userBets:', userBets);
    }
  }, [userBets]);

  const [mockData, setMockData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceChanged, setPriceChanged] = useState(false);
  const [timeUpdate, setTimeUpdate] = useState(0); // 用于强制更新时间
  const animationRef = useRef(null);
  const previousPriceRef = useRef(null);
  const blinkStartTimeRef = useRef(null); // 记录闪烁开始时间



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

  // 生成模拟历史数据（2分钟，每秒一个数据点）
  useEffect(() => {
    const generateMockData = () => {
      const now = Date.now();
      const data = [];
      const basePrice = currentPrice || 67234.56;

      // 生成120个数据点（2分钟）
      for (let i = 119; i >= 0; i--) {
        const timestamp = now - (i * 1000);
        // 生成随机价格变化（±0.3%）
        const randomChange = (Math.random() - 0.5) * 0.006; // ±0.3%
        const price = basePrice * (1 + randomChange * (i / 120)); // 早期数据变化更大

        data.push([
          timestamp,
          price + (Math.random() - 0.5) * 50 // 添加一些噪音
        ]);
      }

      // 返回新的数据格式
      return { data };
    };

    setMockData(generateMockData());
  }, [currentPrice]);

  // 模拟WebSocket数据推送（每秒更新）- 滑动窗口
  useEffect(() => {
    const interval = setInterval(() => {
      if (mockData && mockData.data && mockData.data.length > 0) {
        // 模拟新的价格数据
        const lastDataPoint = mockData.data[mockData.data.length - 1];
        const lastPrice = lastDataPoint ? lastDataPoint[1] : 67234.56;
        const priceChange = (Math.random() - 0.5) * 0.002; // ±0.1%
        const newPrice = lastPrice * (1 + priceChange);

        const newTimestamp = Date.now();
        const newDataPoint = [newTimestamp, newPrice];

        // 更新mock数据 - 滑动窗口：新数据进来，最老数据移出
        setMockData(prevMockData => {
          const newData = [...prevMockData.data, newDataPoint];
          // 保持120个数据点
          const updatedData = newData.slice(-120);
          return { data: updatedData };
        });

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

        // 触发时间更新
        setTimeUpdate(prev => prev + 1);

        // 通知父组件价格更新
        if (onPriceUpdate) {
          onPriceUpdate({
            timestamp: newTimestamp,
            price: newPrice,
            time: new Date(newTimestamp).toLocaleTimeString('en-US', {
              hour12: false,
              minute: '2-digit',
              second: '2-digit'
            })
          });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [mockData, onPriceUpdate]);

  // 处理模拟数据（新格式）
  const combinedData = useMemo(() => {
    if (!mockData || !mockData.data || mockData.data.length === 0) {
      return [];
    }

    // 将新格式的数据转换为组件内部使用的格式
    return mockData.data.map(([timestamp, price]) => ({
      timestamp,
      price,
      time: new Date(timestamp).toLocaleTimeString('en-US', {
        hour12: false,
        minute: '2-digit',
        second: '2-digit'
      })
    }));
  }, [mockData]);

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
    // 动画配置 - 滑动窗口平滑动画
    animation: {
      duration: 800, // 800ms动画时长
      easing: 'easeInOutQuart', // 平滑的缓动函数
    },
    // 数据更新时的动画
    transitions: {
      active: {
        animation: {
          duration: 800, // 数据更新时使用800ms动画
          easing: 'easeInOutQuart',
        }
      }
    },
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
    <div className="w-[375vw] md:w-full h-[346vw] md:h-80 relative" style={{ backgroundColor: '#121212' }}>
      {!hasEnoughData ? (
        // Loading状态
        <div className="absolute inset-0 flex items-center justify-center">
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
