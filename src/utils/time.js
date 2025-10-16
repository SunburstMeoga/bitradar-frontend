import i18n from '../i18n';

/**
 * 格式化 ISO 时间字符串为精确到秒的本地化字符串
 * 示例输入："2025-10-15T07:58:11Z"
 * 输出（zh-CN）："2025-10-15 15:58:11"（随本地时区变化）
 * 输出（en-US/ko-KR）：按各自 locale 显示且包含秒
 */
export const formatPreciseTime = (isoString, lang) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const language = lang || (i18n && i18n.language) || 'en';
  const locale = language === 'zh' ? 'zh-CN' : language === 'ko' ? 'ko-KR' : 'en-US';
  return date
    .toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    .replace(/\//g, '-');
};

export default {
  formatPreciseTime,
};