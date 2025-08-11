// 统一导出所有服务
export { default as authService } from './authService.js';
export { default as userService } from './userService.js';
export { default as priceService } from './priceService.js';
export { ApiService, TokenManager, apiClient } from './api.js';

// 便捷的服务实例导出
import authService from './authService.js';
import userService from './userService.js';
import priceService from './priceService.js';

export const services = {
  auth: authService,
  user: userService,
  price: priceService
};

export default services;
