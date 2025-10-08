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
    const originalRequest = error.config;

    // 处理401错误（token过期）
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = TokenManager.getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}${API_VERSION}/auth/refresh`, {
            refreshToken
          });

          const { token: newToken } = response.data.data;
          TokenManager.setToken(newToken);

          // 重新发送原始请求
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token刷新失败:', refreshError);
        TokenManager.clearTokens();
        // 可以在这里触发登出逻辑
        window.location.href = '/';
      }
    }

    // 处理其他错误
    handleApiError(error);
    return Promise.reject(error);
  }
);

// 错误处理函数
const handleApiError = (error) => {
  // 如果错误被标记为跳过toast显示，则不显示
  if (error.skipToast) {
    return;
  }

  if (error.response) {
    const { status, data } = error.response;
    const message = data?.message || '请求失败';

    switch (status) {
      case 400:
        toast.error(`请求参数错误: ${message}`);
        break;
      case 401:
        toast.error('认证失败，请重新登录');
        break;
      case 403:
        toast.error('权限不足');
        break;
      case 404:
        toast.error('请求的资源不存在');
        break;
      case 429:
        toast.error('请求过于频繁，请稍后再试');
        break;
      case 500:
        toast.error('服务器内部错误');
        break;
      default:
        toast.error(`请求失败: ${message}`);
    }
  } else if (error.request) {
    toast.error('网络连接失败，请检查网络设置');
  } else {
    toast.error(`请求错误: ${error.message}`);
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
