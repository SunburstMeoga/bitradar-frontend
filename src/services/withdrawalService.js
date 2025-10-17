import api from './api.js';

// 提现相关服务
const withdrawalService = {
  // 获取提现设置（所有代币）
  async getSettings() {
    return api.get('/withdrawal/settings');
  },

  // 提交提现申请
  async createWithdrawal({ token_symbol, amount, to_address }) {
    return api.post('/withdrawals', {
      token_symbol,
      amount,
      to_address,
    });
  },
};

export default withdrawalService;