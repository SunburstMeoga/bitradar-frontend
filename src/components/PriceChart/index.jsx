import { useEffect, useRef, useState } from 'react';
import useWebSocket from '../../hooks/useWebSocket';

const PriceChart = ({ onPriceUpdate }) => {
  const canvasRef = useRef();
  const [priceData, setPriceData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);

  // WebSocket连接
  const { data: wsData, connectionStatus, error } = useWebSocket('wss://crypto.nickwongon99.top');

  // 绘制图表
  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // 清空画布
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // 如果没有数据，显示占位文本
    if (priceData.length === 0) {
      ctx.fillStyle = '#8f8f8f';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('等待价格数据...', width / 2, height / 2);
      return;
    }

    // 绘制网格线
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 3]); // 虚线

    // 垂直网格线 (时间轴)
    for (let i = 1; i < 8; i++) {
      const x = (width / 8) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // 水平网格线 (价格轴)
    for (let i = 1; i < 6; i++) {
      const y = (height / 6) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 计算价格范围
    const prices = priceData.map(d => d.value);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // 添加一些边距
    const padding = priceRange * 0.1;
    const adjustedMin = minPrice - padding;
    const adjustedMax = maxPrice + padding;
    const adjustedRange = adjustedMax - adjustedMin;

    // 绘制价格线
    ctx.setLineDash([]); // 实线
    ctx.strokeStyle = '#c5ff33';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    priceData.forEach((point, index) => {
      const x = (width / Math.max(priceData.length - 1, 1)) * index;
      const y = height - ((point.value - adjustedMin) / adjustedRange) * height;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // 绘制最后一个点的圆点
    if (priceData.length > 0) {
      const lastPoint = priceData[priceData.length - 1];
      const lastX = (width / Math.max(priceData.length - 1, 1)) * (priceData.length - 1);
      const lastY = height - ((lastPoint.value - adjustedMin) / adjustedRange) * height;

      ctx.fillStyle = '#c5ff33';
      ctx.beginPath();
      ctx.arc(lastX, lastY, 3, 0, 2 * Math.PI);
      ctx.fill();
    }

    // 绘制Y轴价格标签
    ctx.fillStyle = '#8f8f8f';
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const price = adjustedMin + (adjustedRange / 5) * (5 - i);
      const y = (height / 5) * i + 3;
      ctx.fillText(price.toFixed(2), width - 5, y);
    }

    // 绘制时间标签（简化版）
    ctx.textAlign = 'center';
    const now = new Date();
    for (let i = 0; i < 4; i++) {
      const time = new Date(now.getTime() - (3 - i) * 30000); // 每30秒一个标签
      const x = (width / 4) * i + (width / 8);
      const timeStr = time.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
      ctx.fillText(timeStr, x, height - 5);
    }
  };

  // 初始化Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 设置Canvas尺寸
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 375;
    canvas.height = rect.height || 346;

    drawChart();
  }, [priceData, currentPrice]);

  // 响应式处理
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width || 375;
      canvas.height = rect.height || 346;
      drawChart();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [priceData, currentPrice]);

  // 处理WebSocket数据
  useEffect(() => {
    if (wsData && wsData.price && wsData.timestamp) {
      const newDataPoint = {
        time: wsData.timestamp,
        value: wsData.price,
      };

      setCurrentPrice(wsData.price);

      setPriceData(prev => {
        const newData = [...prev, newDataPoint];
        // 保持最近100个数据点
        if (newData.length > 100) {
          return newData.slice(-100);
        }
        return newData;
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

  return (
    <div className="w-[375vw] h-[346vw] relative">
      {/* Canvas图表 */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ backgroundColor: '#1a1a1a' }}
      />

      {/* 连接状态指示器 */}
      <div className="absolute top-[8vw] left-[8vw] flex items-center gap-[4vw]">
        <div
          className={`w-[8vw] h-[8vw] rounded-full ${
            connectionStatus === 'Connected' ? 'bg-[#c5ff33]' :
            connectionStatus === 'Connecting' ? 'bg-yellow-500' :
            'bg-red-500'
          }`}
        />
        <span className="text-white text-size-[10vw]">
          {connectionStatus === 'Connected' ? '实时' :
           connectionStatus === 'Connecting' ? '连接中' :
           '断开'}
        </span>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="absolute top-[24vw] left-[8vw] right-[8vw] bg-red-500 bg-opacity-80 text-white text-size-[12vw] p-[8vw] rounded-[4vw]">
          {error}
        </div>
      )}

      {/* 当前价格显示 */}
      {currentPrice && (
        <div className="absolute top-[8vw] right-[8vw] bg-[#c5ff33] text-black px-[8vw] py-[4vw] rounded-[4vw] text-size-[12vw] font-semibold">
          ${currentPrice.toFixed(2)}
        </div>
      )}
    </div>
  );
};

export default PriceChart;
