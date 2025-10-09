import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import usePageTitle from '../hooks/usePageTitle';

const PageTitleTest = () => {
  const { t, i18n } = useTranslation();
  const [currentTitle, setCurrentTitle] = useState('');
  const [selectedPage, setSelectedPage] = useState('trade');

  // 使用选中的页面设置标题
  usePageTitle(selectedPage);

  // 监听document.title的变化
  useEffect(() => {
    const updateTitle = () => {
      setCurrentTitle(document.title);
    };

    // 初始设置
    updateTitle();

    // 创建一个MutationObserver来监听title变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.target.nodeName === 'TITLE') {
          updateTitle();
        }
      });
    });

    // 监听title元素的变化
    const titleElement = document.querySelector('title');
    if (titleElement) {
      observer.observe(titleElement, { childList: true });
    }

    // 也监听整个head的变化，以防title元素被替换
    observer.observe(document.head, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  // 页面选项
  const pageOptions = [
    { key: 'trade', label: 'Trade' },
    { key: 'home', label: 'Home' },
    { key: 'history', label: 'History' },
    { key: 'account', label: 'Account' },
    { key: 'network_details', label: 'Network Details' },
    { key: 'exchange', label: 'Exchange' },
    { key: 'transaction_history', label: 'Transaction History' },
    { key: 'not_found', label: 'Not Found' }
  ];

  // 语言选项
  const languageOptions = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文' },
    { code: 'ko', name: '한국어' }
  ];

  const handlePageChange = (pageKey) => {
    setSelectedPage(pageKey);
  };

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
  };

  const getExpectedTitle = (pageKey, langCode) => {
    const appName = 'BitRocket';
    const pageTitles = {
      en: {
        trade: 'Trade',
        home: 'Home',
        history: 'History',
        account: 'Account',
        network_details: 'Network Details',
        exchange: 'Exchange',
        transaction_history: 'Transaction History',
        not_found: 'Page Not Found'
      },
      zh: {
        trade: '交易',
        home: '首页',
        history: '历史记录',
        account: '账户',
        network_details: '网体详情',
        exchange: '兑换',
        transaction_history: '交易记录',
        not_found: '页面未找到'
      },
      ko: {
        trade: '거래',
        home: '홈',
        history: '기록',
        account: '계정',
        network_details: '네트워크 세부정보',
        exchange: '교환',
        transaction_history: '거래 내역',
        not_found: '페이지를 찾을 수 없음'
      },
      vi: {
        trade: 'Giao dịch',
        home: 'Trang chủ',
        history: 'Lịch sử',
        account: 'Tài khoản',
        network_details: 'Chi tiết mạng',
        exchange: 'Đổi',
        transaction_history: 'Lịch sử giao dịch',
        not_found: 'Không tìm thấy trang'
      }
    };

    const pageTitle = pageTitles[langCode]?.[pageKey] || pageKey;
    return `${pageTitle} | ${appName}`;
  };

  const expectedTitle = getExpectedTitle(selectedPage, i18n.language);
  const isCorrect = currentTitle === expectedTitle;

  return (
    <div className="p-[20vw] md:p-8 bg-[#121212] text-white min-h-screen">
      <h1 className="text-size-[24vw] md:text-2xl font-bold text-[#c5ff33] mb-[20vw] md:mb-8">
        页面标题测试组件
      </h1>

      <div className="space-y-[16vw] md:space-y-6">
        {/* 当前标题显示 */}
        <div className="bg-[#1f1f1f] p-[16vw] md:p-4 rounded-[8vw] md:rounded-lg">
          <h2 className="text-size-[18vw] md:text-lg font-semibold mb-[8vw] md:mb-2">当前页面标题</h2>
          <p className="text-size-[14vw] md:text-sm">
            <span className="text-[#8f8f8f]">实际标题: </span>
            <span className={`font-mono ${isCorrect ? 'text-[#00bc4b]' : 'text-[#f5384e]'}`}>
              "{currentTitle}"
            </span>
          </p>
          <p className="text-size-[14vw] md:text-sm mt-[4vw] md:mt-1">
            <span className="text-[#8f8f8f]">预期标题: </span>
            <span className="font-mono text-[#c5ff33]">"{expectedTitle}"</span>
          </p>
          <p className="text-size-[14vw] md:text-sm mt-[4vw] md:mt-1">
            <span className="text-[#8f8f8f]">状态: </span>
            <span className={isCorrect ? 'text-[#00bc4b]' : 'text-[#f5384e]'}>
              {isCorrect ? '✓ 正确' : '✗ 不匹配'}
            </span>
          </p>
        </div>

        {/* 页面选择 */}
        <div className="bg-[#1f1f1f] p-[16vw] md:p-4 rounded-[8vw] md:rounded-lg">
          <h2 className="text-size-[18vw] md:text-lg font-semibold mb-[8vw] md:mb-2">选择页面</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[8vw] md:gap-2">
            {pageOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => handlePageChange(option.key)}
                className={`p-[8vw] md:p-2 rounded-[4vw] md:rounded text-size-[12vw] md:text-sm transition-colors ${
                  selectedPage === option.key
                    ? 'bg-[#c5ff33] text-black'
                    : 'bg-[#3d3d3d] text-white hover:bg-[#4d4d4d]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 语言选择 */}
        <div className="bg-[#1f1f1f] p-[16vw] md:p-4 rounded-[8vw] md:rounded-lg">
          <h2 className="text-size-[18vw] md:text-lg font-semibold mb-[8vw] md:mb-2">选择语言</h2>
          <div className="flex gap-[8vw] md:gap-2">
            {languageOptions.map((option) => (
              <button
                key={option.code}
                onClick={() => handleLanguageChange(option.code)}
                className={`p-[8vw] md:p-2 rounded-[4vw] md:rounded text-size-[12vw] md:text-sm transition-colors ${
                  i18n.language === option.code
                    ? 'bg-[#c5ff33] text-black'
                    : 'bg-[#3d3d3d] text-white hover:bg-[#4d4d4d]'
                }`}
              >
                {option.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageTitleTest;
