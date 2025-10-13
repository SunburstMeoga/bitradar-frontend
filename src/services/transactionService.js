import { ApiService } from './api.js';

class TransactionService extends ApiService {
  /**
   * 获取用户的交易记录（Transaction History）
   * @param {Object} params - 查询参数
   * @param {number} params.limit - 每页数量 (最大 100)，默认 50
   * @param {number} params.offset - 偏移量（跳过前 N 筆記錄），默认 0
   * @param {number} params.token_id - 按代幣 ID 篩選：例如 1, 2, 3
   * @param {string} params.token_symbol - 按代幣符號篩選：例如 "LUSD", "USDT", "USDR"
   * @param {string} params.transaction_type - 按交易類型篩選
   * @returns {Promise<Object>} 交易记录数据
   */
  async getTransactions(params = {}) {
    try {
      console.log('💰 获取用户交易记录...', params);
      
      // 构建查询参数
      const queryParams = new URLSearchParams();
      
      // 设置默认值
      const limit = params.limit || 50;
      const offset = params.offset || 0;
      
      queryParams.append('limit', limit);
      queryParams.append('offset', offset);
      
      // 可选参数
      if (params.token_id !== undefined && params.token_id !== null) {
        queryParams.append('token_id', params.token_id);
      }
      
      if (params.token_symbol && params.token_symbol !== 'all') {
        queryParams.append('token_symbol', params.token_symbol);
      }
      
      if (params.transaction_type && params.transaction_type !== 'all') {
        queryParams.append('transaction_type', params.transaction_type);
      }
      
      const url = `/users/transactions?${queryParams.toString()}`;
      const response = await this.get(url);

      console.log('💰 交易记录API响应:', response);

      if (response.success) {
        // 处理数据，即使 data 为 null 也要正确处理
        const transactions = Array.isArray(response.data) ? response.data : [];
        const count = response.count || 0;

        // 在控制台打印交易记录信息
        console.log('=== 用户交易记录 ===');
        console.log(`总记录数: ${count}`);
        console.log(`当前页记录数: ${transactions.length}`);
        console.log(`API返回的data:`, response.data);

        if (transactions.length > 0) {
          transactions.slice(0, 3).forEach((transaction, index) => {
            console.log(`交易 ${index + 1}:`);
            console.log('  ID:', transaction.id);
            console.log('  用户ID:', transaction.user_id);
            console.log('  订单ID:', transaction.order_id);
            console.log('  代币ID:', transaction.token_id);
            console.log('  代币符号:', transaction.token_symbol);
            console.log('  交易类型:', transaction.transaction_type);
            console.log('  金额:', transaction.amount);
            console.log('  交易前余额:', transaction.balance_before);
            console.log('  交易后余额:', transaction.balance_after);
            console.log('  描述:', transaction.description);
            console.log('  创建时间:', transaction.created_at);
            console.log('  ---');
          });
          if (transactions.length > 3) {
            console.log(`... 还有 ${transactions.length - 3} 条记录`);
          }
        } else {
          console.log('没有交易记录');
        }
        console.log('==================');

        return {
          success: true,
          data: transactions,
          count: count,
          pagination: {
            limit: limit,
            offset: offset,
            hasMore: count > offset + transactions.length // 使用count来判断是否还有更多数据
          }
        };
      }

      throw new Error(response.message || '获取交易记录失败');
    } catch (error) {
      console.error('获取交易记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取分页交易记录（便捷方法）
   * @param {number} page - 页码（从1开始）
   * @param {number} pageSize - 每页大小
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Object>} 交易记录数据
   */
  async getTransactionsByPage(page = 1, pageSize = 20, filters = {}) {
    const offset = (page - 1) * pageSize;
    return this.getTransactions({
      limit: pageSize,
      offset: offset,
      ...filters
    });
  }

  /**
   * 根据代币符号获取交易记录
   * @param {string} tokenSymbol - 代币符号
   * @param {Object} params - 其他查询参数
   * @returns {Promise<Object>} 交易记录数据
   */
  async getTransactionsByToken(tokenSymbol, params = {}) {
    return this.getTransactions({
      token_symbol: tokenSymbol,
      ...params
    });
  }

  /**
   * 根据交易类型获取交易记录
   * @param {string} transactionType - 交易类型
   * @param {Object} params - 其他查询参数
   * @returns {Promise<Object>} 交易记录数据
   */
  async getTransactionsByType(transactionType, params = {}) {
    return this.getTransactions({
      transaction_type: transactionType,
      ...params
    });
  }

  /**
   * 格式化交易类型显示文本
   * @param {string} type - 交易类型代码
   * @returns {string} 格式化后的显示文本
   */
  formatTransactionType(type) {
    const typeMap = {
      'DEPOSIT': '充值',
      'WITHDRAW': '提款',
      'BET': '下注',
      'WIN': '获胜',
      'LOSE': '失败',
      'REFUND': '退款（平局）',
      'TEST_ADD': '测试添加',
      'REFERRAL_REWARD': '推荐奖励',
      'FEE': '手续费',
      'TRADING_MINING_REWARD': '交易挖礦獎勵',
      'STAKE_REWARD': '质押收益',
      'MEMBERSHIP_UPGRADE': '会员升级',
      'LUSD_CLAIM': 'LuckyUSD 领取',
      'REFERRAL_ACTIVITY_LAYER_REWARD': '拉新活动层级奖励'
    };
    
    return typeMap[type] || type;
  }

  /**
   * 格式化金额显示（带符号）
   * @param {string|number} amount - 金额
   * @returns {string} 格式化后的金额字符串
   */
  formatAmount(amount) {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '0.00';

    const sign = numAmount >= 0 ? '+' : '';
    return `${sign}${numAmount.toFixed(2)}`;
  }

  /**
   * 判断交易类型的分类
   * @param {string} type - 交易类型
   * @returns {string} 分类：'deposit', 'withdraw', 'trade', 'reward'
   */
  getTransactionCategory(type) {
    const categoryMap = {
      'DEPOSIT': 'deposit',
      'WITHDRAW': 'withdraw',
      'BET': 'trade',
      'WIN': 'trade',
      'LOSE': 'trade',
      'REFUND': 'trade',
      'TEST_ADD': 'deposit',
      'REFERRAL_REWARD': 'reward',
      'FEE': 'trade',
      'TRADING_MINING_REWARD': 'reward',
      'STAKE_REWARD': 'reward',
      'MEMBERSHIP_UPGRADE': 'trade',
      'LUSD_CLAIM': 'reward',
      'REFERRAL_ACTIVITY_LAYER_REWARD': 'reward'
    };
    
    return categoryMap[type] || 'trade';
  }

  /**
   * 获取支持的交易类型列表
   * @returns {Array} 交易类型列表
   */
  getSupportedTransactionTypes() {
    return [
      { code: 'DEPOSIT', name: '充值', category: 'deposit' },
      { code: 'WITHDRAW', name: '提款', category: 'withdraw' },
      { code: 'BET', name: '下注', category: 'trade' },
      { code: 'WIN', name: '获胜', category: 'trade' },
      { code: 'LOSE', name: '失败', category: 'trade' },
      { code: 'REFUND', name: '退款（平局）', category: 'trade' },
      { code: 'TEST_ADD', name: '测试添加', category: 'deposit' },
      { code: 'REFERRAL_REWARD', name: '推荐奖励', category: 'reward' },
      { code: 'FEE', name: '手续费', category: 'trade' },
      { code: 'TRADING_MINING_REWARD', name: '交易挖礦獎勵', category: 'reward' },
      { code: 'STAKE_REWARD', name: '质押收益', category: 'reward' },
      { code: 'MEMBERSHIP_UPGRADE', name: '会员升级', category: 'trade' },
      { code: 'LUSD_CLAIM', name: 'LuckyUSD 领取', category: 'reward' }
      ,{ code: 'REFERRAL_ACTIVITY_LAYER_REWARD', name: '拉新活动层级奖励', category: 'reward' }
    ];
  }
}

export default new TransactionService();
