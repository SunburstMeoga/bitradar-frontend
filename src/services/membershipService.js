import { ApiService } from './api';
import toast from 'react-hot-toast';

class MembershipService extends ApiService {
  constructor() {
    super();
  }

  /**
   * 获取会员配置（价格、奖励）
   * GET /membership/config
   * 无需认证
   */
  async getConfig() {
    try {
      console.log('🎯 获取会员配置...');
      const response = await this.get('/membership/config');
      
      if (response.success) {
        console.log('✅ 会员配置获取成功:', response.data);
        return {
          success: true,
          data: response.data
        };
      }
      
      throw new Error(response.message || '获取会员配置失败');
    } catch (error) {
      console.error('❌ 获取会员配置失败:', error);
      return {
        success: false,
        message: error.message || '获取会员配置失败'
      };
    }
  }

  /**
   * 获取当前会员信息
   * GET /membership/info
   * 需要认证
   */
  async getMembershipInfo() {
    try {
      console.log('🎯 获取会员信息...');
      const response = await this.get('/membership/info');
      
      if (response.success) {
        console.log('✅ 会员信息获取成功:', response.data);
        return {
          success: true,
          data: response.data
        };
      }
      
      throw new Error(response.message || '获取会员信息失败');
    } catch (error) {
      console.error('❌ 获取会员信息失败:', error);
      return {
        success: false,
        message: error.message || '获取会员信息失败'
      };
    }
  }

  /**
   * 执行会员升级
   * POST /membership/upgrade
   * 需要认证
   * @param {string} membershipType - 会员类型 ('silver' | 'gold')
   */
  async upgradeMembership(membershipType) {
    try {
      console.log('🎯 执行会员升级:', { membershipType });

      // 验证参数
      if (!membershipType || !['silver', 'gold'].includes(membershipType)) {
        throw new Error('无效的会员类型');
      }

      const requestData = {
        membership_type: membershipType
      };

      console.log('📤 发送升级请求到 /membership/upgrade:', requestData);

      const response = await this.post('/membership/upgrade', requestData);
      
      if (response.success) {
        console.log('✅ 会员升级成功:', response.data);
        toast.success('会员升级成功！');
        return {
          success: true,
          data: response.data
        };
      }
      
      throw new Error(response.message || '会员升级失败');
    } catch (error) {
      console.error('❌ 会员升级失败:', error);
      const status = error?.response?.status;
      const data = error?.response?.data;
      
      // 专门处理 400 错误，并在需要绑定推荐码时返回该需求给 UI
      if (status === 400 && data) {
        if (data?.requires_referral_binding === true) {
          const serverMessage = data?.message;
          return {
            success: false,
            message: serverMessage || '购买会员前需先绑定邀请码',
            data: data?.data,
            requires_referral_binding: true,
          };
        }
        // 其他已知错误类型提示
        let errorMessage = data?.message || '会员升级失败';
        if (data.message?.includes('余额不足') || data.message?.includes('insufficient')) {
          errorMessage = '余额不足，无法完成升级';
        } else if (data.message?.includes('无效') || data.message?.includes('invalid')) {
          errorMessage = '无效的升级路径';
        }
        toast.error(errorMessage);
        return {
          success: false,
          message: errorMessage,
          requires_referral_binding: false,
        };
      }
      
      const fallbackMessage = error.message || '会员升级失败';
      toast.error(fallbackMessage);
      return {
        success: false,
        message: fallbackMessage,
        requires_referral_binding: false,
      };
    }
  }

  /**
   * 查看升级历史
   * GET /membership/upgrade-history
   * 需要认证
   * @param {number} page - 页码，默认1
   * @param {number} limit - 每页数量，默认20
   */
  async getUpgradeHistory(page = 1, limit = 20) {
    try {
      console.log('🎯 获取升级历史:', { page, limit });
      const response = await this.get('/membership/upgrade-history', {
        params: { page, limit }
      });
      
      if (response.success) {
        console.log('✅ 升级历史获取成功:', response.data);
        return {
          success: true,
          data: response.data,
          pagination: response.pagination
        };
      }
      
      throw new Error(response.message || '获取升级历史失败');
    } catch (error) {
      console.error('❌ 获取升级历史失败:', error);
      return {
        success: false,
        message: error.message || '获取升级历史失败'
      };
    }
  }

  /**
   * 查看推广奖励记录
   * GET /membership/referral-rewards
   * 需要认证
   * @param {number} page - 页码，默认1
   * @param {number} limit - 每页数量，默认20
   */
  async getReferralRewards(page = 1, limit = 20) {
    try {
      console.log('🎯 获取推广奖励记录:', { page, limit });
      const response = await this.get('/membership/referral-rewards', {
        params: { page, limit }
      });
      
      if (response.success) {
        console.log('✅ 推广奖励记录获取成功:', response.data);
        return {
          success: true,
          data: response.data,
          pagination: response.pagination
        };
      }
      
      throw new Error(response.message || '获取推广奖励记录失败');
    } catch (error) {
      console.error('❌ 获取推广奖励记录失败:', error);
      return {
        success: false,
        message: error.message || '获取推广奖励记录失败'
      };
    }
  }

  /**
   * 查看推广奖励统计
   * GET /membership/referral-reward-stats
   * 需要认证
   */
  async getReferralRewardStats() {
    try {
      console.log('🎯 获取推广奖励统计...');
      const response = await this.get('/membership/referral-reward-stats');
      
      if (response.success) {
        console.log('✅ 推广奖励统计获取成功:', response.data);
        return {
          success: true,
          data: response.data
        };
      }
      
      throw new Error(response.message || '获取推广奖励统计失败');
    } catch (error) {
      console.error('❌ 获取推广奖励统计失败:', error);
      return {
        success: false,
        message: error.message || '获取推广奖励统计失败'
      };
    }
  }
}

// 创建并导出服务实例
const membershipService = new MembershipService();
export { membershipService };
export default membershipService;
