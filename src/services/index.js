// 统一导出所有服务
export { default as authService } from './authService.js';
export { default as userService } from './userService.js';
export { default as priceService } from './priceService.js';
export { default as orderService } from './orderService.js';
export { default as tokenService } from './tokenService.js';
export { default as referralService } from './referralService.js';
export { default as networkService } from './networkService.js';
export { default as membershipService } from './membershipService.js';
export { ApiService, TokenManager, apiClient } from './api.js';

// 便捷的服务实例导出
import authService from './authService.js';
import userService from './userService.js';
import priceService from './priceService.js';
import orderService from './orderService.js';
import tokenService from './tokenService.js';
import referralService from './referralService.js';
import networkService from './networkService.js';
import membershipService from './membershipService.js';

export const services = {
  auth: authService,
  user: userService,
  price: priceService,
  order: orderService,
  token: tokenService,
  referral: referralService,
  network: networkService,
  membership: membershipService
};

export default services;
