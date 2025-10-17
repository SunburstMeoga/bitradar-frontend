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

const resources = {
  en: {
    translation: en
  },
  zh: {
    translation: zh
  },
  ko: {
    translation: ko
  }
  ,
  vi: {
    translation: vi
  },
  ja: {
    translation: ja
  },
  pt: {
    translation: pt
  },
  es: {
    translation: es
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'zh',
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
