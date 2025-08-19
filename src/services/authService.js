import { ApiService, TokenManager } from './api.js';
import Web3 from 'web3';

class AuthService extends ApiService {
  /**
   * Web3钱包签名登录
   * @param {string} walletAddress - 钱包地址
   * @param {string} message - 签名消息
   * @param {string} signature - 签名结果
   * @returns {Promise<Object>} 登录结果
   */
  async login(walletAddress, message, signature) {
    try {
      const response = await this.post('/auth/login', {
        signature,
        message
      });

      if (response.success && response.data) {
        const { token, refreshToken, user } = response.data;
        
        // 保存tokens
        TokenManager.setToken(token);
        if (refreshToken) {
          TokenManager.setRefreshToken(refreshToken);
        }

        return {
          success: true,
          user,
          token
        };
      }

      throw new Error(response.message || '登录失败');
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }

  /**
   * 刷新token
   * @returns {Promise<Object>} 刷新结果
   */
  async refreshToken() {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (!refreshToken) {
        throw new Error('没有刷新token');
      }

      const response = await this.post('/auth/refresh', {
        refreshToken
      });

      if (response.success && response.data) {
        const { token } = response.data;
        TokenManager.setToken(token);
        return { success: true, token };
      }

      throw new Error(response.message || 'Token刷新失败');
    } catch (error) {
      console.error('Token刷新失败:', error);
      TokenManager.clearTokens();
      throw error;
    }
  }

  /**
   * 登出
   */
  logout() {
    TokenManager.clearTokens();
  }

  /**
   * 检查是否已登录
   * @returns {boolean} 是否已登录
   */
  isLoggedIn() {
    const token = TokenManager.getToken();
    return token && !TokenManager.isTokenExpired(token);
  }

  /**
   * 获取当前用户token
   * @returns {string|null} 当前token
   */
  getCurrentToken() {
    return TokenManager.getToken();
  }

  /**
   * Web3签名辅助函数
   * @param {string} message - 要签名的消息
   * @param {string} account - 钱包地址
   * @returns {Promise<string>} 签名结果
   */
  async signMessage(message, account) {
    try {
      if (!window.ethereum) {
        throw new Error('请安装MetaMask钱包');
      }

      const web3 = new Web3(window.ethereum);
      const signature = await web3.eth.personal.sign(message, account, '');
      
      return signature;
    } catch (error) {
      console.error('签名失败:', error);
      throw error;
    }
  }

  /**
   * 完整的Web3登录流程
   * @param {string} account - 钱包地址
   * @param {string} customMessage - 自定义签名消息（可选）
   * @returns {Promise<Object>} 登录结果
   */
  async web3Login(account, customMessage = null) {
    try {
      // 使用自定义消息或默认消息
      const message = customMessage || `欢迎使用 BitRocket 二元期权交易平台！\n\n时间戳: ${Date.now()}`;
      
      // 签名消息
      const signature = await this.signMessage(message, account);
      
      // 登录
      const result = await this.login(account, message, signature);
      
      return result;
    } catch (error) {
      console.error('Web3登录失败:', error);
      throw error;
    }
  }
}

export default new AuthService();
