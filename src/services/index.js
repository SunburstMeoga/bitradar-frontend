// 统一导出所有服务
export { default as authService } from './authService.js';
export { default as userService } from './userService.js';
export { default as priceService } from './priceService.js';
export { default as orderService } from './orderService.js';
export { ApiService, TokenManager, apiClient } from './api.js';

// 便捷的服务实例导出
import authService from './authService.js';
import userService from './userService.js';
import priceService from './priceService.js';
import orderService from './orderService.js';

export const services = {
  auth: authService,
  user: userService,
  price: priceService,
  order: orderService
};

export default services;
