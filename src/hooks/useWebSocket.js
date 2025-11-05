import { useState, useEffect, useRef, useCallback } from 'react';

const useWebSocket = (url) => {
  const [data, setData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [error, setError] = useState(null);
  const ws = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectDelay = 30000; // 30秒
  const baseDelay = 1000; // 1秒

  const connect = useCallback(() => {
    try {
      setConnectionStatus('Connecting');
      setError(null);
      
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log('WebSocket连接成功');
        setConnectionStatus('Connected');
        reconnectAttempts.current = 0; // 重置重连次数
        setError(null);
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          // 打印所有接收到的WebSocket数据
          console.log('📡 WebSocket接收数据:', {
            原始数据: event.data,
            解析后数据: message,
            时间戳: new Date().toLocaleTimeString()
          });

          switch(message.type) {
            case 'connected':
              console.log('✅ WebSocket连接成功 - 连接ID:', message.connectionId);
              break;
            case 'price_update':
              const priceData = {
                symbol: message.symbol,
                price: parseFloat(message.price),
                timestamp: new Date(message.timestamp).getTime(),
                rawTimestamp: message.timestamp
              };
              console.log('💰 价格更新:', priceData);
              setData(priceData);
              break;
            case 'maintenance_status':
              console.log('🔧 维护状态更新:', message.data);
              // 使用自定义事件通知维护横幅组件
              window.dispatchEvent(new CustomEvent('maintenance-status-update', {
                detail: message.data
              }));
              break;
            default:
              console.log('❓ 未知消息类型:', message);
          }
        } catch (err) {
          console.error('❌ 解析WebSocket消息失败:', err, '原始数据:', event.data);
          setError('数据解析错误');
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket错误:', error);
        setError('连接错误');
        setConnectionStatus('Error');
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket连接关闭:', event.code, event.reason);
        setConnectionStatus('Disconnected');
        
        // 实现指数退避重连策略
        if (reconnectAttempts.current < 10) { // 最多重连10次
          const delay = Math.min(
            baseDelay * Math.pow(2, reconnectAttempts.current),
            maxReconnectDelay
          );
          
          console.log(`${delay}ms 后重连... (尝试 ${reconnectAttempts.current + 1}/10)`);
          reconnectAttempts.current++;
          
          setTimeout(() => {
            if (ws.current?.readyState === WebSocket.CLOSED) {
              connect();
            }
          }, delay);
        } else {
          setError('重连次数超限，请刷新页面');
        }
      };

    } catch (err) {
      console.error('WebSocket连接失败:', err);
      setError('连接失败');
      setConnectionStatus('Error');
    }
  }, [url]);

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    setConnectionStatus('Disconnected');
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttempts.current = 0;
    connect();
  }, [connect, disconnect]);

  useEffect(() => {
    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  return {
    data,
    connectionStatus,
    error,
    reconnect,
    disconnect
  };
};

export default useWebSocket;
