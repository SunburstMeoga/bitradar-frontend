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

      if (response.success && response.data) {
        // 处理实际的API响应结构：data直接是数组
        const tokens = Array.isArray(response.data) ? response.data : response.data.bet_tokens || [];

        // 在控制台打印代币信息
        console.log('=== 可用于下注的代币列表 ===');
        tokens.forEach((token, index) => {
          console.log(`代币 ${index + 1}:`);
          console.log('  ID:', token.id);
          console.log('  符号:', token.symbol);
          console.log('  名称:', token.name);
          console.log('  小数位数:', token.decimals);
          console.log('  是否激活:', token.is_active);
          console.log('  是否可下注:', token.is_bet_enabled);
          console.log('  是否可结算:', token.is_settlement_enabled);
          console.log('  创建时间:', token.created_at);
          console.log('  更新时间:', token.updated_at);
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
          id: 2,
          symbol: "USDT",
          name: "Tether USD",
          decimals: 8,
          is_active: true,
          is_bet_enabled: true,
          is_settlement_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 3,
          symbol: "USDR",
          name: "USDR",
          decimals: 8,
          is_active: true,
          is_bet_enabled: true,
          is_settlement_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 4,
          symbol: "LUSD",
          name: "LuckyUSD",
          decimals: 8,
          is_active: true,
          is_bet_enabled: true,
          is_settlement_enabled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
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
