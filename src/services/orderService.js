import { ApiService } from './api.js';

class OrderService extends ApiService {
  /**
   * 创建新的二元期权订单
   * @param {Object} orderData - 订单数据
   * @param {string} orderData.orderType - 订单类型 "CALL" (买升) 或 "PUT" (买跌)
   * @param {number} orderData.amount - 下注金额 (USDT)，范围: 1-1000
   * @param {number} orderData.frontendSubmitTime - 前端提交时间戳 (毫秒)
   * @returns {Promise<Object>} 订单创建结果
   */
  async createOrder(orderData) {
    try {
      // 验证参数
      if (!orderData.orderType || !['CALL', 'PUT'].includes(orderData.orderType)) {
        throw new Error('订单类型必须是 CALL 或 PUT');
      }

      if (!orderData.amount || orderData.amount < 1 || orderData.amount > 1000) {
        throw new Error('下注金额必须在 1-1000 USDT 范围内');
      }

      if (!orderData.frontendSubmitTime) {
        throw new Error('前端提交时间戳不能为空');
      }

      const response = await this.post('/orders', {
        orderType: orderData.orderType,
        amount: orderData.amount,
        frontendSubmitTime: orderData.frontendSubmitTime
      });

      if (response.success && response.data) {
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
