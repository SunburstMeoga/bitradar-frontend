import { ApiService } from './api.js';

class PaymentService extends ApiService {
  /**
   * 获取可用支付渠道列表（仅返回 is_enabled = true 的渠道）
   * GET /payment/channels
   */
  async getChannels() {
    try {
      const response = await this.get('/payment/channels');
      if (response.success) {
        // 标准化返回结构，确保调用方容易使用
        const channels = Array.isArray(response.data) ? response.data : [];
        // 新接口含有全局汇率字段 exchange_rate（例如 "0.14" 表示 1 CNY = 0.14 USDT）
        const exchangeRate = response.exchange_rate ?? null;
        return { success: true, data: channels, exchange_rate: exchangeRate };
      }
      throw new Error(response.message || '获取支付渠道失败');
    } catch (error) {
      console.error('获取支付渠道失败:', error);
      throw error;
    }
  }

  /**
   * 创建支付订单
   * POST /payment/create
   * @param {Object} params
   * @param {string} params.channel_code - 渠道代碼（如 ALIPAY_H5、WECHAT_H5）
   * @param {string} params.cny_amount - 金额（字符串格式，例如 "100.00"）
   */
  async createOrder({ channel_code, cny_amount }) {
    try {
      const payload = { channel_code, cny_amount: String(cny_amount) };
      const response = await this.post('/payment/create', payload);
      if (response.success) {
        return { success: true, data: response.data, message: response.message };
      }
      throw new Error(response.message || '创建支付订单失败');
    } catch (error) {
      console.error('创建支付订单失败:', error);
      throw error;
    }
  }
}

const paymentService = new PaymentService();
export { paymentService };
export default paymentService;