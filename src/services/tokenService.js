import { ApiService } from './api.js';

class TokenService extends ApiService {
  /**
   * 获取可用于下注的代币列表
   * @returns {Promise<Object>} 代币列表数据
   */
  async getBetTokens() {
    try {
      console.log('🪙 请求可用于下注的代币列表...');
      
      const response = await this.get('/tokens/bet');

      console.log('🪙 代币列表API响应:', response);

      if (response.success && response.data && response.data.bet_tokens) {
        const tokens = response.data.bet_tokens;
        
        // 在控制台打印代币信息
        console.log('=== 可用于下注的代币列表 ===');
        tokens.forEach((token, index) => {
          console.log(`代币 ${index + 1}:`);
          console.log('  符号:', token.symbol);
          console.log('  名称:', token.name);
          console.log('  最小下注:', token.min_bet);
          console.log('  最大下注:', token.max_bet);
          console.log('  胜率:', token.win_rate);
          console.log('  ---');
        });
        console.log('============================');

        return {
          success: true,
          data: tokens
        };
      }

      throw new Error(response.message || '获取代币列表失败');
    } catch (error) {
      console.error('获取代币列表失败:', error);
      
      // 如果API调用失败，返回默认的代币列表作为fallback
      console.warn('🪙 API调用失败，使用默认代币列表');
      const fallbackTokens = [
        {
          symbol: "USDT",
          name: "Tether USD",
          min_bet: "1.00",
          max_bet: "10000.00",
          win_rate: "80%"
        },
        {
          symbol: "USDR",
          name: "USD Reserve",
          min_bet: "1.00",
          max_bet: "5000.00",
          win_rate: "80%"
        },
        {
          symbol: "LuckyUSD",
          name: "Lucky USD",
          min_bet: "1.00",
          max_bet: "5000.00",
          win_rate: "80%"
        }
      ];

      return {
        success: true,
        data: fallbackTokens,
        isFallback: true
      };
    }
  }

  /**
   * 根据代币符号获取代币详情
   * @param {string} symbol - 代币符号
   * @returns {Promise<Object>} 代币详情
   */
  async getTokenDetails(symbol) {
    try {
      const tokensResult = await this.getBetTokens();
      
      if (tokensResult.success && tokensResult.data) {
        const token = tokensResult.data.find(t => t.symbol === symbol);
        
        if (token) {
          return {
            success: true,
            data: token
          };
        }
      }

      throw new Error(`未找到代币: ${symbol}`);
    } catch (error) {
      console.error('获取代币详情失败:', error);
      throw error;
    }
  }
}

export default new TokenService();
