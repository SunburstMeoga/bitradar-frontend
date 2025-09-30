import { ApiService } from './api.js';

class OrderService extends ApiService {
  /**
   * 创建新的二元期权订单
   * @param {Object} orderData - 订单数据
   * @param {string} orderData.orderType - 订单类型 (CALL, PUT)
   * @param {number} orderData.amount - 下注金额，最小 1.00
   * @param {number} orderData.entryPrice - 入场价格 (当前BTC价格)
   * @param {string} orderData.betTokenSymbol - 下注代币符号 (USDT, LUSD等)
   * @param {string} orderData.tradingPairSymbol - 交易对符号 (BTCUSDT)
   * @param {number} orderData.ratio - 比率
   * @param {number} orderData.frontendSubmitTime - 前端提交时间戳
   * @returns {Promise<Object>} 订单创建结果
   */
  async createOrder(orderData) {
    try {
      // 验证参数
      if (!orderData.amount) {
        throw new Error('下注金额不能为空');
      }

      const betAmount = parseFloat(orderData.amount);
      if (isNaN(betAmount) || betAmount < 1.00) {
        throw new Error('下注金额必须大于等于 1.00');
      }

      if (!orderData.betTokenSymbol || !['USDT', 'LUSD', 'USDR'].includes(orderData.betTokenSymbol)) {
        throw new Error('代币类型必须是 USDT, LUSD 或 USDR');
      }

      if (!orderData.orderType || !['CALL', 'PUT'].includes(orderData.orderType)) {
        throw new Error('订单类型必须是 CALL 或 PUT');
      }

      if (!orderData.tradingPairSymbol) {
        throw new Error('交易对不能为空');
      }

      if (!orderData.entryPrice || parseFloat(orderData.entryPrice) <= 0) {
        throw new Error('入场价格必须大于0');
      }

      if (!orderData.ratio || parseFloat(orderData.ratio) <= 0) {
        throw new Error('比率必须大于0');
      }

      if (!orderData.frontendSubmitTime) {
        throw new Error('前端提交时间不能为空');
      }

      console.log('🎯 发送订单创建请求:', orderData);

      // 使用新的API参数格式
      const apiParams = {
        orderType: orderData.orderType,
        amount: orderData.amount,
        entryPrice: orderData.entryPrice,
        betTokenSymbol: orderData.betTokenSymbol,
        tradingPairSymbol: orderData.tradingPairSymbol,
        ratio: orderData.ratio,
        frontendSubmitTime: orderData.frontendSubmitTime
      };

      console.log('🎯 API请求参数:', apiParams);

      // 使用相对路径，会自动拼接baseURL和API版本
      const response = await this.post('/orders', apiParams);

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
      console.error('错误详情:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
          headers: error.config?.headers
        }
      });

      // 详细打印响应数据
      if (error.response?.data) {
        console.error('API响应数据:', JSON.stringify(error.response.data, null, 2));
      }

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

  /**
   * 获取用户当前活跃的订单列表
   * @param {number} page - 页码，默认1
   * @param {number} limit - 每页数量，默认20
   * @returns {Promise<Object>} 活跃订单列表
   */
  async getActiveOrders(page = 1, limit = 20) {
    try {
      let url = `/orders/active/list?page=${page}&limit=${limit}`;

      console.log('🎯 请求活跃订单列表:', {
        url,
        page,
        limit
      });

      const response = await this.get(url);

      console.log('🎯 活跃订单列表响应:', response);
      console.log('🎯 响应分析:', {
        hasSuccess: 'success' in response,
        successValue: response.success,
        hasData: 'data' in response,
        dataValue: response.data,
        responseType: typeof response,
        responseKeys: Object.keys(response || {})
      });

      // 检查响应是否成功 - 更宽松的条件判断
      if (response && (response.success === true || response.success === undefined)) {
        // 处理数据
        const responseData = response.data || response;
        const orders = responseData.orders || responseData || [];
        const pagination = response.pagination || responseData.pagination;

        console.log('🎯 处理后的数据:', {
          ordersLength: Array.isArray(orders) ? orders.length : 0,
          hasPagination: !!pagination,
          pagination
        });

        return {
          success: true,
          data: Array.isArray(orders) ? orders : [],
          pagination: pagination || {
            current_page: page,
            per_page: limit,
            total: Array.isArray(orders) ? orders.length : 0,
            last_page: Math.ceil((Array.isArray(orders) ? orders.length : 0) / limit)
          }
        };
      }

      throw new Error(response?.message || '获取活跃订单列表失败');
    } catch (error) {
      console.error('获取活跃订单列表失败:', error);
      throw error;
    }
  }
}

export default new OrderService();
