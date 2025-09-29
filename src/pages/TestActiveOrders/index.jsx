import { useState } from 'react';
import orderService from '../../services/orderService';

const TestActiveOrders = () => {
  const [activeOrders, setActiveOrders] = useState([]);
  const [orderDetail, setOrderDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 测试获取活跃订单列表
  const testGetActiveOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🧪 测试获取活跃订单列表...');
      const result = await orderService.getActiveOrders(1, 10);
      console.log('🧪 活跃订单列表结果:', result);
      setActiveOrders(result.data || []);
    } catch (err) {
      console.error('🧪 获取活跃订单列表失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 测试获取订单详情
  const testGetOrderDetail = async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🧪 测试获取订单详情...', orderId);
      const result = await orderService.getOrder(orderId);
      console.log('🧪 订单详情结果:', result);
      setOrderDetail(result.data.order || result.data);
    } catch (err) {
      console.error('🧪 获取订单详情失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: 'rgb(18,18,18)' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-white text-2xl font-bold mb-6">测试活跃订单API</h1>
        
        {/* 测试按钮 */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={testGetActiveOrders}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '加载中...' : '测试获取活跃订单列表'}
          </button>
          
          <button
            onClick={() => testGetOrderDetail(123)}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? '加载中...' : '测试获取订单详情(ID:123)'}
          </button>
        </div>

        {/* 错误显示 */}
        {error && (
          <div className="bg-red-600 text-white p-4 rounded mb-6">
            <h3 className="font-bold">错误:</h3>
            <p>{error}</p>
          </div>
        )}

        {/* 活跃订单列表 */}
        {activeOrders.length > 0 && (
          <div className="mb-6">
            <h2 className="text-white text-xl font-bold mb-4">活跃订单列表 ({activeOrders.length})</h2>
            <div className="bg-gray-800 p-4 rounded">
              <pre className="text-green-400 text-sm overflow-auto">
                {JSON.stringify(activeOrders, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* 订单详情 */}
        {orderDetail && (
          <div className="mb-6">
            <h2 className="text-white text-xl font-bold mb-4">订单详情</h2>
            <div className="bg-gray-800 p-4 rounded">
              <pre className="text-green-400 text-sm overflow-auto">
                {JSON.stringify(orderDetail, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* API 说明 */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-white text-xl font-bold mb-4">API 接口说明</h2>
          <div className="text-gray-300 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white">1. 获取活跃订单列表</h3>
              <p><strong>接口:</strong> GET /orders/active/list</p>
              <p><strong>参数:</strong> page (页码), limit (每页数量)</p>
              <p><strong>说明:</strong> 获取用户当前活跃的订单列表，需要认证</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white">2. 获取订单详情</h3>
              <p><strong>接口:</strong> GET /orders/{'{id}'}</p>
              <p><strong>参数:</strong> id (订单ID)</p>
              <p><strong>说明:</strong> 获取特定订单的详细信息，需要认证</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestActiveOrders;
