import { ApiService } from './api.js';

class OrderService extends ApiService {
  /**
   * 创建新的二元期权订单
   * @param {Object} orderData - 订单数据
   * @param {string} orderData.bet_amount - 下注金额 (字符串格式，如 "100.00")，最小 1.00
   * @param {string} orderData.token - 下注代币 (USDT, LuckyUSD)
   * @param {string} orderData.direction - 预测方向 (up, down)
   * @param {string} orderData.trading_pair - 交易对 (BTC/USDT)
   * @returns {Promise<Object>} 订单创建结果
   */
  async createOrder(orderData) {
    try {
      // 验证参数
      if (!orderData.bet_amount) {
        throw new Error('下注金额不能为空');
      }

      const betAmount = parseFloat(orderData.bet_amount);
      if (isNaN(betAmount) || betAmount < 1.00) {
        throw new Error('下注金额必须大于等于 1.00');
      }

      if (!orderData.token || !['USDT', 'LuckyUSD', 'USDR'].includes(orderData.token)) {
        throw new Error('代币类型必须是 USDT, LuckyUSD 或 USDR');
      }

      if (!orderData.direction || !['up', 'down'].includes(orderData.direction)) {
        throw new Error('预测方向必须是 up 或 down');
      }

      if (!orderData.trading_pair) {
        throw new Error('交易对不能为空');
      }

      console.log('🎯 发送订单创建请求:', orderData);

      // 使用完整的URL路径，不带/api/v1前缀
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const fullUrl = `${API_BASE_URL}/orders`;

      console.log('📡 API请求URL:', fullUrl);

      const response = await this.client.post(fullUrl, {
        bet_amount: orderData.bet_amount,
        token: orderData.token,
        direction: orderData.direction,
        trading_pair: orderData.trading_pair
      });

      if (response.success && response.data) {
        console.log('✅ 订单创建成功:', response.data);
        return {
          success: true,
          data: response.data,
          message: response.message || '下单成功'
        };
      }

      throw new Error(response.message || '下单失败');
    } catch (error) {
      console.error('创建订单失败:', error);

      // 处理特定的错误情况，但不在这里显示toast
      // toast会在调用方或者api.js的拦截器中统一处理
      if (error.response?.status === 400 && error.response?.data?.message) {
        // 时间验证失败等业务错误，直接抛出错误信息
        const apiError = new Error(error.response.data.message);
        apiError.skipToast = true; // 标记跳过API层的toast显示
        throw apiError;
      }

      // 其他错误也标记跳过toast，让调用方处理
      if (error.response) {
        error.skipToast = true;
      }

      throw error;
    }
  }

  /**
   * 获取订单详情
   * @param {number} orderId - 订单ID
   * @returns {Promise<Object>} 订单详情
   */
  async getOrder(orderId) {
    try {
      const response = await this.get(`/orders/${orderId}`);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data
        };
      }

      throw new Error(response.message || '获取订单详情失败');
    } catch (error) {
      console.error('获取订单详情失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户订单列表
   * @param {number} page - 页码，默认1
   * @param {number} limit - 每页数量，默认20
   * @param {string} status - 订单状态过滤，可选
   * @returns {Promise<Object>} 订单列表
   */
  async getOrders(page = 1, limit = 20, status = null) {
    try {
      let url = `/orders?page=${page}&limit=${limit}`;
      if (status) {
        url += `&status=${status}`;
      }

      const response = await this.get(url);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          pagination: response.pagination || {
            page,
            limit,
            total: response.data.length
          }
        };
      }

      throw new Error(response.message || '获取订单列表失败');
    } catch (error) {
      console.error('获取订单列表失败:', error);
      throw error;
    }
  }
}

export default new OrderService();
