import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWeb3Store } from '../../store';
import { formatAddress, getBNBBalance } from '../../utils/web3';

// 导入图片
import sendImg from '../../assets/images/send.png';
import activityImg from '../../assets/images/activity.png';
import languageImg from '../../assets/images/language.png';
import disconnectImg from '../../assets/images/disconnect.png';

// 右箭头SVG组件
const ArrowRightIcon = ({ isRotated = false }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    style={{
      transform: isRotated ? 'rotate(90deg)' : 'rotate(0deg)',
      transition: 'transform 0.3s ease'
    }}
  >
    <path
      d="M5.25 3.5L8.75 7L5.25 10.5"
      stroke="#949E9E"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 关闭按钮SVG组件
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path 
      d="M12 4L4 12M4 4L12 12" 
      stroke="white" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// 复制按钮SVG组件
const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path 
      d="M13.333 6h-6c-.736 0-1.333.597-1.333 1.333v6c0 .736.597 1.333 1.333 1.333h6c.736 0 1.333-.597 1.333-1.333v-6c0-.736-.597-1.333-1.333-1.333z" 
      stroke="#e4e7e7" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M3.333 10h-.666c-.737 0-1.334-.597-1.334-1.333v-6c0-.736.597-1.333 1.334-1.333h6c.736 0 1.333.597 1.333 1.333v.666" 
      stroke="#e4e7e7" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

const WalletCard = ({ onClose, onSendClick, onActivityClick }) => {
  const { account, reset } = useWeb3Store();
  const { i18n, t } = useTranslation();
  const [bnbBalance, setBnbBalance] = useState('0.000');
  const [isLanguageExpanded, setIsLanguageExpanded] = useState(false);

  // 根据当前语言设置显示的语言名称
  const getLanguageDisplayName = (langCode) => {
    const languageMap = {
      'zh': '简体中文',
      'en': 'English',
      'ko': '한국인'
    };
    return languageMap[langCode] || 'English';
  };

  const [selectedLanguage, setSelectedLanguage] = useState(getLanguageDisplayName(i18n.language));

  // 获取BNB余额
  useEffect(() => {
    const fetchBalance = async () => {
      if (account) {
        const balance = await getBNBBalance(account);
        setBnbBalance(balance);
      }
    };

    fetchBalance();
  }, [account]);

  // 复制地址到剪贴板
  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(account);
      console.log('地址已复制到剪贴板');
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 断开连接
  const handleDisconnect = () => {
    reset();
    onClose();
  };

  // 切换语言展开状态
  const handleLanguageToggle = () => {
    setIsLanguageExpanded(!isLanguageExpanded);
  };

  // 选择语言
  const handleLanguageSelect = (language, langCode) => {
    setSelectedLanguage(language);
    setIsLanguageExpanded(false);
    i18n.changeLanguage(langCode);
  };

  // 语言选项
  const languageOptions = [
    { code: 'zh', label: '简体中文' },
    { code: 'en', label: 'English' },
    { code: 'ko', label: '한국인' }
  ];

  // 菜单项配置
  const menuItems = [
    {
      id: 'send',
      label: t('wallet.send'),
      image: sendImg,
      textColor: '#FFFFFF',
      showArrow: true,
      onClick: onSendClick
    },
    {
      id: 'activity',
      label: t('wallet.activity'),
      image: activityImg,
      textColor: '#FFFFFF',
      showArrow: true,
      onClick: onActivityClick
    },
    {
      id: 'language',
      label: t('wallet.language'),
      image: languageImg,
      textColor: '#9D9D9D',
      showArrow: true,
      isExpanded: isLanguageExpanded,
      onClick: handleLanguageToggle
    },
    {
      id: 'disconnect',
      label: t('wallet.disconnect'),
      image: disconnectImg,
      textColor: '#9D9D9D',
      showArrow: false,
      onClick: handleDisconnect
    }
  ];

  return (
    <div className="w-full h-full p-[20px] relative box-border">
      {/* 第一部分：关闭按钮 */}
      <div className="h-[64px] flex justify-end items-start">
        <button
          onClick={onClose}
          className="absolute top-[25px] right-[25px] w-[16px] h-[16px] flex items-center justify-center"
        >
          <CloseIcon />
        </button>
      </div>

      {/* 第二部分：用户头像 */}
      <div className="flex justify-center mb-[16px]">
        <div className="w-[64px] h-[64px] rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
          <span className="text-white text-[24px] font-bold">
            {account ? account.slice(2, 4).toUpperCase() : 'U'}
          </span>
        </div>
      </div>

      {/* 第三部分：钱包地址 */}
      <div className="flex items-center justify-center gap-[8px] mb-[12px]">
        <span
          className="text-[20px]"
          style={{ color: '#E4E7E7', fontWeight: 600 }}
        >
          {formatAddress(account)}
        </span>
        <button onClick={handleCopyAddress} className="w-[16px] h-[16px]">
          <CopyIcon />
        </button>
      </div>

      {/* 第四部分：BNB余额 */}
      <div className="text-center mb-[20px]">
        <span 
          className="text-[16px]"
          style={{ color: '#949E9E', fontWeight: 500 }}
        >
          {bnbBalance} BNB
        </span>
      </div>

      {/* 第五六七八部分：菜单项 */}
      <div className="space-y-[8px]">
        {menuItems.map((item) => (
          <div key={item.id}>
            {/* 主菜单项 */}
            <div
              onClick={item.onClick}
              className="w-[290px] h-[54px] bg-[#2a2a2a] rounded-[8px] cursor-pointer hover:bg-[#333333] transition-colors box-border"
              style={{ padding: '11px 18px 11px 12px' }}
            >
              <div className="flex items-center justify-between h-full">
                {/* 左侧：图片和文字 */}
                <div className="flex items-center gap-[12px]">
                  <img
                    src={item.image}
                    alt={item.label}
                    className="w-[32px] h-[32px] object-contain"
                  />
                  <span
                    className="text-[16px] font-medium"
                    style={{ color: item.textColor }}
                  >
                    {item.label}
                  </span>
                </div>

                {/* 右侧：箭头（如果需要显示） */}
                {item.showArrow && (
                  <ArrowRightIcon isRotated={item.isExpanded} />
                )}
              </div>
            </div>

            {/* 语言展开内容 */}
            {item.id === 'language' && isLanguageExpanded && (
              <div className="mt-[4px] bg-[#2a2a2a] rounded-[8px] overflow-hidden">
                {languageOptions.map((lang) => (
                  <div
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.label, lang.code)}
                    className="w-[290px] h-[44px] cursor-pointer hover:bg-[#333333] transition-colors box-border flex items-center"
                    style={{ padding: '0 18px 0 56px' }}
                  >
                    <span
                      className="text-[14px] font-medium"
                      style={{
                        color: selectedLanguage === lang.label ? '#FFFFFF' : '#9D9D9D'
                      }}
                    >
                      {lang.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WalletCard;
