/**
 * 通用剪贴板功能，兼容非HTTPS环境
 * 在HTTPS环境下使用navigator.clipboard.writeText
 * 在非HTTPS环境下使用document.execCommand('copy')
 */

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 * @returns {Promise<boolean>} - 复制是否成功
 */
export const copyToClipboard = async (text) => {
  try {
    // 首先尝试使用现代API (仅在HTTPS环境下可用)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // 回退方案：使用传统方法
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // 设置样式使元素不可见
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    
    // 选择文本并执行复制命令
    textArea.focus();
    textArea.select();
    
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    return success;
  } catch (error) {
    console.error('复制到剪贴板失败:', error);
    return false;
  }
};