import { ApiService } from './api.js';

class PriceService extends ApiService {
  /**
   * 获取当前BTC价格
   * @returns {Promise<Object>} 当前价格数据
   */
  async getCurrentPrice() {
    try {
      const response = await this.get('/price/current');
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data
        };
      }

      throw new Error(response.message || '获取当前价格失败');
    } catch (error) {
      console.error('获取当前价格失败:', error);
      throw error;
    }
  }

  /**
   * 获取价格统计
   * @param {number} duration - 统计时间段（毫秒），默认5分钟
   * @returns {Promise<Object>} 价格统计数据
   */
  async getPriceStats(duration = 300000) {
    try {
      const response = await this.get(`/price/stats?duration=${duration}`);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data
        };
      }

      throw new Error(response.message || '获取价格统计失败');
    } catch (error) {
      console.error('获取价格统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取历史价格数据
   * @param {string} interval - 时间间隔：1m, 5m, 15m, 1h, 4h, 1d，默认1m
   * @param {number} limit - 数据点数量（最大1000），默认100
   * @returns {Promise<Object>} 历史价格数据
   */
  async getHistoryPrice(interval = '1m', limit = 100) {
    try {
      const response = await this.get(`/price/history?interval=${interval}&limit=${limit}`);

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          message: response.message
        };
      }

      throw new Error(response.message || '获取历史价格失败');
    } catch (error) {
      console.error('获取历史价格失败:', error);
      throw error;
    }
  }

  /**
   * 检查价格数据健康状态
   * @returns {Promise<Object>} 健康检查结果
   */
  async checkPriceHealth() {
    try {
      const response = await this.get('/price/health');
      
      if (response.success) {
        return {
          success: true,
          data: response.data
        };
      }

      throw new Error(response.message || '价格数据健康检查失败');
    } catch (error) {
      console.error('价格数据健康检查失败:', error);
      throw error;
    }
  }
}

export default new PriceService();
