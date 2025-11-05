// 统一导出所有服务
export { default as authService } from './authService.js';
export { default as userService } from './userService.js';
export { default as priceService } from './priceService.js';
export { default as orderService } from './orderService.js';
export { default as tokenService } from './tokenService.js';
export { default as referralService } from './referralService.js';
export { default as networkService } from './networkService.js';
export { default as membershipService } from './membershipService.js';
export { default as lusdService } from './lusdService.js';
export { default as transactionService } from './transactionService.js';
export { default as withdrawalService } from './withdrawalService.js';
export { default as paymentService } from './paymentService.js';
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
import lusdService from './lusdService.js';
import withdrawalService from './withdrawalService.js';
import paymentService from './paymentService.js';

export const services = {
  auth: authService,
  user: userService,
  price: priceService,
  order: orderService,
  token: tokenService,
  referral: referralService,
  network: networkService,
  membership: membershipService,
  lusd: lusdService,
  withdrawal: withdrawalService,
  payment: paymentService
};

export default services;
