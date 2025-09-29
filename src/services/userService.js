import { ApiService } from './api.js';

class UserService extends ApiService {
  /**
   * 获取用户资料
   * @returns {Promise<Object>} 用户资料数据
   */
  async getProfile() {
    try {
      const response = await this.get('/users/profile');

      if (response.success && response.data) {
        // 在控制台打印用户信息
        console.log('=== 用户信息 ===');
        console.log('用户ID:', response.data.id);
        console.log('钱包地址:', response.data.wallet_address);
        console.log('VIP等级:', response.data.vip_level);
        console.log('邀请码:', response.data.invite_code);
        console.log('邀请人ID:', response.data.inviter_id);
        console.log('总投注金额:', response.data.total_bet_amount);
        console.log('总盈利:', response.data.total_profit);
        console.log('总亏损:', response.data.total_loss);
        console.log('创建时间:', response.data.created_at);
        console.log('更新时间:', response.data.updated_at);
        console.log('===============');

        return {
          success: true,
          data: response.data
        };
      }

      throw new Error(response.message || '获取用户资料失败');
    } catch (error) {
      console.error('获取用户资料失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户余额
   * @returns {Promise<Object>} 余额数据
   */
  async getBalance() {
    try {
      const response = await this.get('/users/balance');

      if (response.success && response.data) {
        // 在控制台打印余额信息
        console.log('=== 用户余额信息 ===');
        if (response.data.balances && Array.isArray(response.data.balances)) {
          response.data.balances.forEach((balance, index) => {
            console.log(`代币 ${index + 1}:`);
            console.log('  代币符号:', balance.token_symbol);
            console.log('  可用余额:', balance.available_balance);
            console.log('  冻结余额:', balance.frozen_balance);
            console.log('  总余额:', balance.total_balance);
            console.log('  ---');
          });
        }
        console.log('==================');

        return {
          success: true,
          data: response.data
        };
      }

      throw new Error(response.message || '获取余额失败');
    } catch (error) {
      console.error('获取余额失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户统计
   * @returns {Promise<Object>} 统计数据
   */
  async getStats() {
    try {
      const response = await this.get('/users/stats');
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data
        };
      }

      throw new Error(response.message || '获取统计数据失败');
    } catch (error) {
      console.error('获取统计数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取订单历史
   * @param {number} page - 页码，默认1
   * @param {number} limit - 每页数量，默认20
   * @param {string} status - 订单状态过滤：pending, win, lose, all，默认all
   * @returns {Promise<Object>} 订单历史数据
   */
  async getOrders(page = 1, limit = 20, status = 'all') {
    try {
      let url = `/users/orders?page=${page}&limit=${limit}`;
      if (status && status !== 'all') {
        url += `&status=${status}`;
      }

      console.log('📋 请求订单历史:', {
        url,
        page,
        limit,
        status
      });

      const response = await this.get(url);

      console.log('📋 订单历史完整响应:', response);
      console.log('📋 订单历史响应分析:', {
        responseType: typeof response,
        hasSuccess: 'success' in response,
        successValue: response.success,
        hasData: 'data' in response,
        dataValue: response.data,
        hasCount: 'count' in response,
        countValue: response.count,
        ordersCount: response.data?.orders?.length || response.data?.length || 0,
        hasPagination: !!(response.data?.pagination || response.pagination)
      });

      // 检查响应是否成功
      if (response && response.success === true) {
        // 处理空状态：count为0或data为null
        if (response.count === 0 || response.data === null) {
          console.log('📋 检测到空状态:', { count: response.count, data: response.data });
          return {
            success: true,
            data: [],
            pagination: {
              current_page: page,
              per_page: limit,
              total: 0,
              last_page: 1
            }
          };
        }

        // 处理有数据的情况
        const responseData = response.data || response;
        const orders = responseData.orders || responseData;
        const pagination = responseData.pagination || response.pagination;

        console.log('📋 处理后的数据:', {
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
            total: Array.isArray(orders) ? orders.length : (response.count || 0),
            last_page: Math.ceil((Array.isArray(orders) ? orders.length : (response.count || 0)) / limit)
          }
        };
      }

      throw new Error(response.message || '获取订单历史失败');
    } catch (error) {
      console.error('获取订单历史失败:', error);
      if (error.response?.status === 401) {
        console.error('❌ 401错误 - Token可能无效或已过期');
      }
      throw error;
    }
  }

  /**
   * 获取完整的用户信息（包含资料、余额、统计）
   * @returns {Promise<Object>} 完整用户信息
   */
  async getFullUserInfo() {
    try {
      // 并行请求所有用户相关数据
      const [profileResult, balanceResult, statsResult] = await Promise.allSettled([
        this.getProfile(),
        this.getBalance(),
        this.getStats()
      ]);

      const result = {
        success: true,
        data: {}
      };

      // 处理用户资料
      if (profileResult.status === 'fulfilled' && profileResult.value.success) {
        result.data.profile = profileResult.value.data;
      } else {
        console.warn('获取用户资料失败:', profileResult.reason);
        result.data.profile = null;
      }

      // 处理余额信息
      if (balanceResult.status === 'fulfilled' && balanceResult.value.success) {
        result.data.balance = balanceResult.value.data;
      } else {
        console.warn('获取余额失败:', balanceResult.reason);
        result.data.balance = null;
      }

      // 处理统计信息
      if (statsResult.status === 'fulfilled' && statsResult.value.success) {
        result.data.stats = statsResult.value.data;
      } else {
        console.warn('获取统计失败:', statsResult.reason);
        result.data.stats = null;
      }

      return result;
    } catch (error) {
      console.error('获取完整用户信息失败:', error);
      throw error;
    }
  }
}

export default new UserService();
