import { useRef, useCallback } from 'react';

/**
 * 防止重复API调用的自定义hook
 * @param {Function} apiFunction - 要调用的API函数
 * @param {Array} dependencies - 依赖项数组
 * @returns {Function} 包装后的API调用函数
 */
export const useApiCall = (apiFunction, dependencies = []) => {
  const isCallingRef = useRef(false);
  const lastCallParamsRef = useRef(null);

  const wrappedApiCall = useCallback(async (...args) => {
    // 检查是否正在调用中
    if (isCallingRef.current) {
      console.log('API call already in progress, skipping...');
      return { success: false, message: 'API调用正在进行中' };
    }

    // 检查参数是否与上次调用相同
    const currentParams = JSON.stringify(args);
    if (lastCallParamsRef.current === currentParams) {
      console.log('Same API call parameters, skipping...');
      return { success: false, message: '相同的API调用参数' };
    }

    try {
      isCallingRef.current = true;
      lastCallParamsRef.current = currentParams;

      const result = await apiFunction(...args);
      return result;
    } catch (error) {
      throw error;
    } finally {
      isCallingRef.current = false;
      // 延迟重置参数，允许短时间内的重复调用被过滤
      setTimeout(() => {
        lastCallParamsRef.current = null;
      }, 1000);
    }
  }, dependencies);

  return wrappedApiCall;
};

/**
 * 防止重复初始化的自定义hook
 * @param {Function} initFunction - 初始化函数
 * @param {Array} dependencies - 依赖项数组
 */
export const useOnceEffect = (initFunction, dependencies = []) => {
  const hasInitializedRef = useRef(false);

  const initialize = useCallback(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      initFunction();
    }
  }, dependencies);

  return initialize;
};

export default useApiCall;
