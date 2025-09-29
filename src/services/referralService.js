import { ApiService } from './api.js';

class ReferralService extends ApiService {
  /**
   * 验证邀请码是否有效（公开接口）
   * @param {string} code - 邀请码
   * @returns {Promise<Object>} 验证结果
   */
  async validateInviteCode(code) {
    try {
      console.log('🔍 验证邀请码:', code);
      
      const response = await this.get(`/referral/validate/${code}`);
      
      if (response.success && response.data) {
        console.log('✅ 邀请码验证成功:', response.data);
        return {
          success: true,
          data: response.data
        };
      }

      throw new Error(response.message || '邀请码验证失败');
    } catch (error) {
      console.error('邀请码验证失败:', error);
      throw error;
    }
  }

  /**
   * 获取当前用户的邀请码（需要认证）
   * @returns {Promise<Object>} 用户邀请码信息
   */
  async getMyInviteCode() {
    try {
      console.log('📋 获取我的邀请码...');
      
      const response = await this.get('/referral/my-invite-code');
      
      if (response.success && response.data) {
        console.log('✅ 获取邀请码成功:', response.data);
        return {
          success: true,
          data: response.data
        };
      }

      throw new Error(response.message || '获取邀请码失败');
    } catch (error) {
      console.error('获取邀请码失败:', error);
      throw error;
    }
  }

  /**
   * 使用邀请码建立推荐关系（需要认证）
   * @param {string} inviteCode - 邀请码
   * @returns {Promise<Object>} 使用结果
   */
  async useInviteCode(inviteCode) {
    try {
      console.log('🎯 使用邀请码:', inviteCode);
      
      const response = await this.post('/referral/use-invite-code', {
        invite_code: inviteCode
      });
      
      if (response.success && response.data) {
        console.log('✅ 使用邀请码成功:', response.data);
        return {
          success: true,
          data: response.data
        };
      }

      throw new Error(response.message || '使用邀请码失败');
    } catch (error) {
      console.error('使用邀请码失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户的推荐网络树状结构（需要认证）
   * @returns {Promise<Object>} 推荐树数据
   */
  async getMyReferralTree() {
    try {
      console.log('🌳 获取推荐树...');
      
      const response = await this.get('/referral/my-tree');
      
      if (response.success && response.data) {
        console.log('✅ 获取推荐树成功:', response.data);
        return {
          success: true,
          data: response.data
        };
      }

      throw new Error(response.message || '获取推荐树失败');
    } catch (error) {
      console.error('获取推荐树失败:', error);
      throw error;
    }
  }
}

export default new ReferralService();
