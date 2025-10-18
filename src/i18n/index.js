import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 导入语言资源
import en from './locales/en.json';
import zh from './locales/zh.json';
import ko from './locales/ko.json';
import vi from './locales/vi.json';
import ja from './locales/ja.json';
import pt from './locales/pt.json';
import es from './locales/es.json';

// 基于 zh 填充其他语言缺失键
function fillMissingKeys(base, target) {
  if (!base) return target || {};
  const result = { ...(target || {}) };
  for (const key of Object.keys(base)) {
    const baseVal = base[key];
    const targetVal = result[key];
    if (baseVal && typeof baseVal === 'object' && !Array.isArray(baseVal)) {
      result[key] = fillMissingKeys(baseVal, targetVal);
    } else {
      if (targetVal === undefined) {
        result[key] = baseVal;
      }
    }
  }
  return result;
}

const resources = {
  en: {
    translation: fillMissingKeys(zh, en)
  },
  zh: {
    translation: zh
  },
  ko: {
    translation: fillMissingKeys(zh, ko)
  },
  vi: {
    translation: fillMissingKeys(zh, vi)
  },
  ja: {
    translation: fillMissingKeys(zh, ja)
  },
  pt: {
    translation: fillMissingKeys(zh, pt)
  },
  es: {
    translation: fillMissingKeys(zh, es)
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    // 不设置初始 lng，避免在 localStorage 中预写入默认值
    fallbackLng: 'zh',
    debug: import.meta.env.VITE_APP_ENV === 'development',
    supportedLngs: ['en', 'zh', 'ko', 'vi', 'ja', 'pt', 'es'],
    nonExplicitSupportedLngs: true,
    load: 'currentOnly',
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;
