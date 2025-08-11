/**
 * 格式化工具函数
 */

/**
 * 安全地将值转换为数字
 * @param {any} value - 要转换的值
 * @param {number} defaultValue - 默认值
 * @returns {number} 转换后的数字
 */
export const safeParseFloat = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * 安全地将值转换为整数
 * @param {any} value - 要转换的值
 * @param {number} defaultValue - 默认值
 * @returns {number} 转换后的整数
 */
export const safeParseInt = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * 格式化数字为指定小数位数
 * @param {number|string} value - 要格式化的值
 * @param {number} decimals - 小数位数
 * @param {string} defaultValue - 默认值
 * @returns {string} 格式化后的字符串
 */
export const formatNumber = (value, decimals = 2, defaultValue = '0.00') => {
  const num = safeParseFloat(value);
  if (num === 0 && value !== 0 && value !== '0') {
    return defaultValue;
  }
  return num.toFixed(decimals);
};

/**
 * 格式化余额显示
 * @param {number|string} balance - 余额值
 * @returns {object} 包含整数部分和小数部分的对象
 */
export const formatBalance = (balance) => {
  const num = safeParseFloat(balance);
  const balanceStr = num.toFixed(2);
  const parts = balanceStr.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1] || '00';
  
  return { integerPart, decimalPart };
};

/**
 * 格式化价格变化百分比
 * @param {number|string} change - 变化值
 * @returns {string} 格式化后的百分比字符串
 */
export const formatPriceChange = (change) => {
  const num = safeParseFloat(change);
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
};

/**
 * 格式化大数字（K, M, B）
 * @param {number|string} value - 要格式化的值
 * @returns {string} 格式化后的字符串
 */
export const formatLargeNumber = (value) => {
  const num = safeParseFloat(value);
  
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  
  return num.toFixed(2);
};

/**
 * 验证是否为有效数字
 * @param {any} value - 要验证的值
 * @returns {boolean} 是否为有效数字
 */
export const isValidNumber = (value) => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};
