import { ApiService, TokenManager } from './api.js';
import i18n from '../i18n';

class AuthService extends ApiService {
  /**
   * Web3钱包签名登录
   * @param {string} message - 签名消息
   * @param {string} signature - 签名结果
   * @returns {Promise<Object>} 登录结果
   */
  async login(message, signature) {
    try {
      const response = await this.post('/auth/login', {
        message,
        signature
      });

      if (response.success && response.data) {
        const { token, refreshToken, user } = response.data;

        // 保存tokens
        const authToken = token;
        TokenManager.setToken(authToken);
        if (refreshToken) {
          TokenManager.setRefreshToken(refreshToken);
        }

        return {
          success: true,
          user,
          token: authToken
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

      console.log('🖊️ 正在请求用户签名...');

      // 使用 personal_sign 进行签名
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, account]
      });

      console.log('✅ 签名成功:', signature);
      return signature;
    } catch (error) {
      console.error('❌ 签名失败:', error);
      throw error;
    }
  }

  /**
   * 获取多语言签名消息
   * @returns {string} 签名消息
   */
  getSignMessage() {
    // 从localStorage获取当前语言，默认为英文
    const currentLanguage = localStorage.getItem('i18nextLng') || 'en';

    // 根据语言返回对应的签名消息
    const messages = {
      'en': 'Welcome to BitRocket Binary Options Trading Platform! 🚀',
      'zh': '欢迎使用 BitRocket 二元期权交易平台！🚀',
      'ko': 'BitRocket 바이너리 옵션 거래 플랫폼에 오신 것을 환영합니다! 🚀'
    };

    return messages[currentLanguage] || messages['en'];
  }

  /**
   * 完整的Web3登录流程
   * @param {string} account - 钱包地址
   * @param {string} customMessage - 自定义签名消息（可选）
   * @returns {Promise<Object>} 登录结果
   */
  async web3Login(account, customMessage = null) {
    try {
      console.log('🚀 开始Web3登录流程...');

      // 1. 获取签名消息（支持多语言）
      const message = customMessage || this.getSignMessage();
      console.log('📝 签名消息:', message);

      // 2. 签名消息
      const signature = await this.signMessage(message, account);

      // 3. 登录
      console.log('🔐 正在验证签名并登录...');
      const result = await this.login(message, signature);

      if (result.success) {
        console.log('🎉 登录成功！');
        console.log('用户信息:', result.user);
      }

      return result;
    } catch (error) {
      console.error('❌ Web3登录失败:', error);
      throw error;
    }
  }
}

export default new AuthService();
