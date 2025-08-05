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

const PriceChart = ({ priceData, currentPrice }) => {
  const chartRef = useRef(null);
  const [chartData, setChartData] = useState([]);
  const [mockData, setMockData] = useState([]);

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

  // 处理新的价格数据
  useEffect(() => {
    if (priceData) {
      const newDataPoint = {
        timestamp: priceData.timestamp,
        price: priceData.price,
        time: new Date(priceData.timestamp).toLocaleTimeString('en-US', { 
          hour12: false, 
          minute: '2-digit', 
          second: '2-digit' 
        })
      };

      setChartData(prev => {
        const updated = [...prev, newDataPoint];
        // 只保留最近90秒的数据
        const cutoffTime = Date.now() - 90000;
        return updated.filter(item => item.timestamp > cutoffTime);
      });
    }
  }, [priceData]);

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

  // Chart.js 配置
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
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
        grid: {
          display: false,
        },
        ticks: {
          display: true,
          color: '#8f8f8f',
          font: {
            size: 10,
          },
          maxTicksLimit: 6,
          callback: function(value, index) {
            const data = combinedData[index];
            if (!data) return '';
            
            // 只显示部分时间标签
            if (index % Math.ceil(combinedData.length / 5) === 0) {
              return data.time;
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
          display: true,
          color: '#333333',
          drawBorder: false,
        },
        ticks: {
          display: true,
          color: '#8f8f8f',
          font: {
            size: 10,
          },
          count: 6,
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
        borderWidth: 2,
        tension: 0.1,
      },
    },
    animation: {
      duration: 0,
    },
  };

  const data = {
    labels: combinedData.map(item => item.time),
    datasets: [
      {
        label: 'BTC Price',
        data: combinedData.map(item => item.price),
        borderColor: '#95C02A',
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
        pointRadius: combinedData.map((_, index) => {
          // 最后一个点（当前价格点）显示并闪烁
          return index === combinedData.length - 1 ? 4 : 0;
        }),
        pointBackgroundColor: combinedData.map((_, index) => {
          return index === combinedData.length - 1 ? '#95C02A' : 'transparent';
        }),
        pointBorderColor: combinedData.map((_, index) => {
          return index === combinedData.length - 1 ? '#95C02A' : 'transparent';
        }),
        pointBorderWidth: 2,
      },
    ],
  };

  return (
    <div className="w-full h-full relative">
      {/* 当前时间分割线 */}
      <div 
        className="absolute top-0 bottom-0 w-[1px] bg-white opacity-50 z-10"
        style={{ 
          left: '66.67%', // 2/3 位置
          borderLeft: '1px dashed #ffffff80'
        }}
      />
      
      {/* 当前价格标签 */}
      {currentPrice && (
        <div 
          className="absolute right-[8vw] bg-[#95C02A] text-black px-[8vw] py-[4vw] rounded-[4vw] text-size-[12vw] font-semibold z-20"
          style={{ 
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        >
          {currentPrice.toFixed(2)}
        </div>
      )}
      
      <Line ref={chartRef} data={data} options={chartOptions} />
      
      {/* 闪烁效果的CSS */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .chart-container canvas {
          animation: none;
        }
        
        /* 当前价格点闪烁效果 */
        .chart-container .chartjs-render-monitor::after {
          content: '';
          position: absolute;
          top: 50%;
          right: 33.33%;
          width: 8px;
          height: 8px;
          background: #95C02A;
          border-radius: 50%;
          transform: translate(50%, -50%);
          animation: pulse 1s infinite;
          z-index: 15;
        }
      `}</style>
    </div>
  );
};

export default PriceChart;
