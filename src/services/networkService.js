import { ApiService } from './api.js';

class NetworkService extends ApiService {
  /**
   * 获取完整的推荐网体结构树和统计数据（需要认证）
   * @param {Object} params - 查询参数
   * @param {number} params.depth - 查询深度（最大 10 层），默认 3
   * @param {boolean} params.include_inactive - 是否包含未质押用户，默认 false
   * @returns {Promise<Object>} 网体结构树数据
   */
  async getMyNetworkTree(params = {}) {
    try {
      console.log('🌳 获取网体结构树...', params);
      
      const queryParams = new URLSearchParams();
      if (params.depth !== undefined) queryParams.append('depth', params.depth);
      if (params.include_inactive !== undefined) queryParams.append('include_inactive', params.include_inactive);
      
      const url = `/referral/my-tree${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.get(url);
      
      if (response.success && response.tree) {
        console.log('✅ 获取网体结构树成功:', response.tree);

        // 适配页面期望的数据结构
        const treeStructure = {
          children: response.tree.children || [], // 使用API返回的children字段
          user_id: response.tree.user_id,
          wallet_address: response.tree.wallet_address,
          invite_code: response.tree.invite_code,
          level: response.tree.level,
          direct_invites: response.tree.direct_invites || 0,
          total_invites: response.tree.total_invites || 0,
          total_rewards: response.tree.total_rewards || '0'
        };

        return {
          success: true,
          data: {
            tree_structure: treeStructure,
            statistics: {
              total_referrals: response.tree.total_invites || 0,
              total_network_volume: response.tree.total_rewards || '0'
            }
          }
        };
      }

      throw new Error(response.message || '获取网体结构树失败');
    } catch (error) {
      console.error('获取网体结构树失败:', error);
      throw error;
    }
  }

  /**
   * 获取网体收益明细（需要认证）
   * @param {Object} params - 查询参数
   * @param {string} params.reward_type - 奖励类型：differential, flat, fee, all
   * @param {string} params.date_range - 时间范围：today, week, month, custom
   * @param {number} params.from_user - 特定下级用户ID（可选）
   * @param {string} params.start_date - 自定义开始日期（当date_range为custom时）
   * @param {string} params.end_date - 自定义结束日期（当date_range为custom时）
   * @returns {Promise<Object>} 收益明细数据
   */
  async getNetworkEarnings(params = {}) {
    try {
      console.log('💰 获取网体收益明细...', params);
      
      const queryParams = new URLSearchParams();
      if (params.reward_type) queryParams.append('reward_type', params.reward_type);
      if (params.date_range) queryParams.append('date_range', params.date_range);
      if (params.from_user) queryParams.append('from_user', params.from_user);
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);
      
      const url = `/network/earnings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.get(url);
      
      if (response.success && response.data) {
        console.log('✅ 获取网体收益明细成功:', response.data);
        return {
          success: true,
          data: response.data
        };
      }

      throw new Error(response.message || '获取网体收益明细失败');
    } catch (error) {
      console.error('获取网体收益明细失败:', error);
      throw error;
    }
  }

  /**
   * 绑定推荐关系（需要认证）
   * @param {Object} params - 绑定参数
   * @param {string} params.referral_code - 推荐人的邀请码
   * @param {string} params.wallet_address - 新用户的钱包地址
   * @returns {Promise<Object>} 绑定结果
   */
  async bindReferral(params) {
    try {
      console.log('🔗 绑定推荐关系...', { referral_code: params.referral_code });

      const response = await this.post('/referral/use-invite-code', {
        referral_code: params.referral_code,
        wallet_address: params.wallet_address
      });

      // 成功判断兼容：有标准success/data结构或仅返回成功message
      if (response?.success && response?.data) {
        console.log('✅ 绑定推荐关系成功:', response.data);
        return {
          success: true,
          data: response.data
        };
      }

      if (typeof response?.message === 'string') {
        const msg = response.message;
        const successHints = ['成功', '已建立', 'success'];
        if (successHints.some(hint => msg.toLowerCase().includes(hint))) {
          console.log('✅ 绑定推荐关系成功(消息判定):', msg);
          return {
            success: true,
            data: { message: msg }
          };
        }
      }

      throw new Error(response?.message || '绑定推荐关系失败');
    } catch (error) {
      console.error('绑定推荐关系失败:', error);
      throw error;
    }
  }

  /**
   * 获取推荐奖励统计和历史记录（需要认证）
   * @returns {Promise<Object>} 推荐奖励数据
   */
  async getReferralRewards() {
    try {
      console.log('🎁 获取推荐奖励统计...');
      
      const response = await this.get('/referral/rewards');
      
      const isSuccess = (response && (response.success === true || response.status === 200 || response.code === 0));
      if (isSuccess) {
        const data =
          response?.data !== undefined
            ? response.data
            : response?.rewards !== undefined
            ? { rewards: response.rewards }
            : Array.isArray(response)
            ? response
            : response?.list !== undefined
            ? { rewards: response.list }
            : {};

        console.log('✅ 获取推荐奖励统计成功:', data);
        return {
          success: true,
          data
        };
      }

      const message = response?.message || '获取推荐奖励统计失败';
      console.warn('⚠️ 推荐奖励接口未成功:', message, response);
      return {
        success: false,
        message
      };
    } catch (error) {
      console.error('获取推荐奖励统计失败:', error);
      return {
        success: false,
        message: error.message || '获取推荐奖励统计失败'
      };
    }
  }

  /**
   * 获取网络奖励计算配置（公开接口）
   * @returns {Promise<Object>} 奖励配置数据
   */
  async getNetworkRewardConfig() {
    try {
      console.log('⚙️ 获取网络奖励配置...');
      
      const response = await this.get('/network-reward/config');
      
      if (response.success && response.data) {
        console.log('✅ 获取网络奖励配置成功:', response.data);
        return {
          success: true,
          data: response.data
        };
      }

      throw new Error(response.message || '获取网络奖励配置失败');
    } catch (error) {
      console.error('获取网络奖励配置失败:', error);
      throw error;
    }
  }

  /**
   * 计算用户的网络奖励（需要认证）
   * 注意：此接口可能缺少完整的参数说明
   * @param {Object} params - 计算参数
   * @returns {Promise<Object>} 计算结果
   */
  async calculateNetworkReward(params = {}) {
    try {
      console.log('🧮 计算网络奖励...', params);
      
      const response = await this.post('/network-reward/calculate', params);
      
      if (response.success && response.data) {
        console.log('✅ 计算网络奖励成功:', response.data);
        return {
          success: true,
          data: response.data
        };
      }

      throw new Error(response.message || '计算网络奖励失败');
    } catch (error) {
      console.error('计算网络奖励失败:', error);
      throw error;
    }
  }
}

export default new NetworkService();
