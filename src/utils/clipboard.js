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

/**
 * 读取剪贴板文本
 * 在不安全上下文（非HTTPS）下，提供可选的提示框回退
 * @returns {Promise<string>} - 剪贴板中的文本
 */
export const readFromClipboard = async () => {
  try {
    if (navigator.clipboard && window.isSecureContext && navigator.clipboard.readText) {
      const text = await navigator.clipboard.readText();
      return text;
    }
    // 非安全上下文或不支持clipboard API
    console.warn('Clipboard read not supported in current context. Falling back to prompt.');
    const fallbackText = window.prompt('当前环境无法直接读取剪贴板，请手动输入或使用快捷键粘贴', '');
    if (fallbackText !== null) {
      return fallbackText;
    }
    throw new Error('Clipboard read not supported and user cancelled prompt');
  } catch (error) {
    console.error('读取剪贴板失败:', error);
    throw error; // 让上层组件的catch打印原因并提示
  }
};