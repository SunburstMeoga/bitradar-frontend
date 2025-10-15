import axios from 'axios';
import toast from 'react-hot-toast';

// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_VERSION = '/api/v1';

// 创建axios实例
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}${API_VERSION}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token管理
class TokenManager {
  static getToken() {
    return localStorage.getItem('authToken');
  }

  static setToken(token) {
    localStorage.setItem('authToken', token);
  }

  static getRefreshToken() {
    // 不再持久化refreshToken到localStorage，改为内存保存，避免冗余
    return TokenManager._refreshToken || null;
  }

  static setRefreshToken(token) {
    // 仅在内存中保存refreshToken
    TokenManager._refreshToken = token || null;
  }

  static clearTokens() {
    localStorage.removeItem('authToken');
    // 清理内存中的refreshToken
    TokenManager._refreshToken = null;
  }

  static isTokenExpired(token) {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Token解析失败:', error);
      return true;
    }
  }
}

// 请求拦截器 - 添加认证token
apiClient.interceptors.request.use(
  (config) => {
    const token = TokenManager.getToken();
    if (token && !TokenManager.isTokenExpired(token)) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 API请求添加Token:', {
        url: config.url,
        method: config.method,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : null
      });
    } else {
      console.log('⚠️ API请求无Token:', {
        url: config.url,
        method: config.method,
        hasToken: !!token,
        isExpired: token ? TokenManager.isTokenExpired(token) : null
      });
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理token过期和错误
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    // 统一处理401/403：触发全局登录过期弹窗
    if (status === 401 || status === 403) {
      try {
        window.dispatchEvent(new CustomEvent('auth:expired', {
          detail: {
            status,
            url: error.config?.url,
            method: error.config?.method,
          }
        }));
      } catch (e) {
        console.warn('触发登录过期事件失败:', e);
      }
    }

    // 处理其他错误
    handleApiError(error);
    return Promise.reject(error);
  }
);

// 错误处理函数
const handleApiError = (error) => {
  // 全局错误处理不再弹出toast，由具体请求场景负责用户提示
  // 这里只做日志记录，避免重复弹窗
  try {
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || '请求失败';
      console.error('API请求失败:', { status, message, url: error.config?.url });
    } else if (error.request) {
      console.error('API请求网络错误: 无响应', { url: error.config?.url });
    } else {
      console.error('API请求错误:', error.message);
    }
  } catch (logError) {
    // 避免日志记录本身抛错
    console.warn('记录API错误失败:', logError);
  }
};

// API服务基类
class ApiService {
  constructor() {
    this.client = apiClient;
  }

  // GET请求
  async get(url, config = {}) {
    try {
      const response = await this.client.get(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // POST请求
  async post(url, data = {}, config = {}) {
    try {
      const response = await this.client.post(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // PUT请求
  async put(url, data = {}, config = {}) {
    try {
      const response = await this.client.put(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // DELETE请求
  async delete(url, config = {}) {
    try {
      const response = await this.client.delete(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export { ApiService, TokenManager, apiClient };
export default new ApiService();
