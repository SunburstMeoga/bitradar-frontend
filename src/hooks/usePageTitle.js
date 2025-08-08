import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * 自定义Hook用于设置页面标题
 * @param {string} pageKey - 页面标题的翻译key，对应page_titles中的key
 * @param {string} customTitle - 可选的自定义标题，如果提供则直接使用
 */
const usePageTitle = (pageKey, customTitle = null) => {
  const { t } = useTranslation();

  useEffect(() => {
    let title;
    
    if (customTitle) {
      // 如果提供了自定义标题，直接使用
      title = customTitle;
    } else if (pageKey) {
      // 使用翻译的页面标题
      title = t(`page_titles.${pageKey}`);
    } else {
      // 如果没有提供任何标题，只显示应用名称
      title = t('common.app_name');
      document.title = title;
      return;
    }

    // 构建完整的标题：页面名称 | 应用名称
    const appName = t('common.app_name');
    const fullTitle = `${title} | ${appName}`;
    
    document.title = fullTitle;
  }, [pageKey, customTitle, t]);
};

export default usePageTitle;
