import { ApiService } from './api.js';

class LusdService extends ApiService {
  /**
   * 查询LUSD领取状态
   * @returns {Promise<Object>} 领取状态数据
   */
  async getClaimStatus() {
    try {
      console.log('🔍 查询LUSD领取状态...');
      const response = await this.get('/lusd-claim/status');

      if (response.success && response.data) {
        console.log('✅ LUSD领取状态查询成功:', {
          can_claim: response.data.can_claim,
          remaining_minutes: response.data.remaining_minutes,
          current_balance: response.data.current_balance,
          last_claim_at: response.data.last_claim_at,
          next_claim_time: response.data.next_claim_time,
          balance_ok: response.data.balance_ok,
          time_ok: response.data.time_ok
        });

        return {
          success: true,
          data: response.data
        };
      }

      throw new Error(response.message || '查询领取状态失败');
    } catch (error) {
      console.error('❌ 查询LUSD领取状态失败:', error);
      throw error;
    }
  }

  /**
   * 领取LUSD测试币
   * @returns {Promise<Object>} 领取结果
   */
  async claimLusd() {
    try {
      console.log('💰 正在领取LUSD...');
      const response = await this.post('/lusd-claim/claim');

      if (response.success && response.data) {
        console.log('🎉 LUSD领取成功:', {
          claimed_amount: response.data.claimed_amount,
          balance_before: response.data.balance_before,
          balance_after: response.data.balance_after,
          next_claim_time: response.data.next_claim_time
        });

        return {
          success: true,
          message: response.message,
          data: response.data
        };
      }

      throw new Error(response.message || '领取LUSD失败');
    } catch (error) {
      console.error('❌ 领取LUSD失败:', error);
      
      // 处理特定的错误情况
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.remaining_minutes !== undefined) {
          // 时间未到的错误
          throw {
            ...error,
            isTimeError: true,
            remaining_minutes: errorData.remaining_minutes,
            message: errorData.message
          };
        } else {
          // 余额不符的错误
          throw {
            ...error,
            isBalanceError: true,
            message: errorData.message
          };
        }
      }
      
      throw error;
    }
  }

  /**
   * 格式化剩余时间显示
   * @param {number} minutes - 剩余分钟数
   * @returns {string} 格式化的时间字符串
   */
  formatRemainingTime(minutes) {
    if (minutes <= 0) {
      return '可立即领取';
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}小时${mins}分钟`;
    } else {
      return `${mins}分钟`;
    }
  }

  /**
   * 格式化下次领取时间
   * @param {string} nextClaimTime - ISO时间字符串
   * @returns {string} 格式化的时间字符串
   */
  formatNextClaimTime(nextClaimTime) {
    if (!nextClaimTime) {
      return '未知';
    }

    try {
      const date = new Date(nextClaimTime);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      console.error('时间格式化失败:', error);
      return nextClaimTime;
    }
  }
}

export default new LusdService();
