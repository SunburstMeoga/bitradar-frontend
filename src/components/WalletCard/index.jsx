import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useWeb3Store, useAuthStore, useUserStore } from '../../store';
import { formatAddress, getBNBBalance } from '../../utils/web3';
import { MEMBERSHIP_LEVELS, MEMBERSHIP_COLORS } from '../MembershipCard';
import { referralService } from '../../services';
import toast from 'react-hot-toast';
import { copyToClipboard } from '../../utils/clipboard';
import { setLanguagePreference } from '../../utils/languagePref'


// 导入图片
import sendImg from '../../assets/images/send.png';
import activityImg from '../../assets/images/activity.png';
import languageImg from '../../assets/images/language.png';
import disconnectImg from '../../assets/images/disconnect.png';

// 推荐人图标SVG组件
const ReferrerIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="10" r="4" stroke="#9D9D9D" strokeWidth="2" fill="none"/>
    <path d="M8 24c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="#9D9D9D" strokeWidth="2" fill="none"/>
  </svg>
);

// 推荐链接图标SVG组件
const LinkIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path d="M13.5 18.5L18.5 13.5" stroke="#9D9D9D" strokeWidth="2" strokeLinecap="round"/>
    <path d="M15 11H11C9.343 11 8 12.343 8 14V18C8 19.657 9.343 21 11 21H15" stroke="#9D9D9D" strokeWidth="2" strokeLinecap="round"/>
    <path d="M17 21H21C22.657 21 24 19.657 24 18V14C24 12.343 22.657 11 21 11H17" stroke="#9D9D9D" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// 会员图标SVG组件
const MembershipIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path d="M16 2L20.5 11L31 11L22.5 18L27 27L16 21L5 27L9.5 18L1 11L11.5 11L16 2Z" stroke="#9D9D9D" strokeWidth="2" fill="none"/>
  </svg>
);

// Loading 图标SVG组件
const LoadingIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="animate-spin">
    <circle cx="16" cy="16" r="12" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeDasharray="75.4" strokeDashoffset="75.4">
      <animate attributeName="stroke-dashoffset" dur="1s" values="75.4;0;75.4" repeatCount="indefinite"/>
    </circle>
  </svg>
);

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

// 复制按钮SVG组件
const CopyIcon = ({ color = "#e4e7e7" }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path 
      d="M13.333 6h-6c-.736 0-1.333.597-1.333 1.333v6c0 .736.597 1.333 1.333 1.333h6c.736 0 1.333-.597 1.333-1.333v-6c0-.736-.597-1.333-1.333-1.333z" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M3.333 10h-.666c-.737 0-1.334-.597-1.334-1.333v-6c0-.736.597-1.333 1.334-1.333h6c.736 0 1.333.597 1.333 1.333v.666" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// 格式化余额显示组件（小数点后字体较小）
const FormattedBalance = ({ balance, className = "text-[16px] md:text-base", style = {} }) => {
  if (!balance || balance === '0.00') {
    return (
      <span className={className} style={style}>
        0.00 BNB
      </span>
    );
  }

  const [integerPart, decimalPart] = balance.split('.');
  const smallerFontSize = className.includes('[16px]') ? 'text-[12px]' : 'text-xs';

  return (
    <span className={className} style={style}>
      {integerPart}
      <span className={`${smallerFontSize} align-baseline`}>
        .{decimalPart}
      </span>
      {' BNB'}
    </span>
  );
};

const WalletCard = ({ onClose, onSendClick, onActivityClick, onAddReferrerClick, onBuyMembershipClick, onViewReferralStatsClick }) => {
  const { account, reset } = useWeb3Store();
  const { isAuthenticated, logout } = useAuthStore();
  const {
    profile,
    membershipInfo,
    fetchProfile,
    fetchMembershipInfo
  } = useUserStore();
  const { i18n, t } = useTranslation();
  const [bnbBalance, setBnbBalance] = useState('0.00');
  const [isLanguageExpanded, setIsLanguageExpanded] = useState(false);
  const [hasReferralRelation, setHasReferralRelation] = useState(false);
  const [isCheckingReferral, setIsCheckingReferral] = useState(true);
  const [isGeneratingReferralCode, setIsGeneratingReferralCode] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const inviteInputRef = useRef(null);
  // 用户信息加载状态（用于在请求过程中显示骨架/loading）
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isMembershipLoading, setIsMembershipLoading] = useState(false);


  // 从URL参数获取推荐人地址
  const getReferrerFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('ref') || null;
  };
  
  const referrerAddress = getReferrerFromUrl();
  const hasReferrer = !!referrerAddress;

  // 检查用户是否已有推荐关系
  const checkReferralRelation = async () => {
    if (!isAuthenticated || !profile) {
      setIsCheckingReferral(false);
      return;
    }

    // 基于用户profile中的invited_by字段判断是否有推荐人
    const hasReferrer = profile.invited_by && profile.invited_by > 0;

    console.log('WalletCard检查推荐关系:', {
      invited_by: profile.invited_by,
      hasReferrer: hasReferrer
    });

    setHasReferralRelation(hasReferrer);
    setIsCheckingReferral(false);
  };

  // 根据当前语言设置显示的语言名称
  const getLanguageDisplayName = (langCode) => {
    const languageMap = {
      'zh': '简体中文',
      'en': 'English',
      'ko': '한국인',
      'vi': 'Tiếng Việt'
    };
    return languageMap[langCode] || 'English';
  };

  const [selectedLanguage, setSelectedLanguage] = useState(getLanguageDisplayName(i18n.language));

  // 获取当前会员等级
  const getCurrentMembershipLevel = () => {
    // 优先使用 membershipInfo 中的数据
    if (membershipInfo && membershipInfo.membership_type) {
      return membershipInfo.membership_type;
    }

    // 如果没有 membershipInfo，尝试从 profile 的 vip_level 转换
    if (profile && profile.vip_level !== undefined) {
      switch (profile.vip_level) {
        case 1:
          return MEMBERSHIP_LEVELS.SILVER;
        case 2:
          return MEMBERSHIP_LEVELS.GOLD;
        case 0:
        default:
          return MEMBERSHIP_LEVELS.NONE;
      }
    }

    // 默认返回无会员
    return MEMBERSHIP_LEVELS.NONE;
  };

  const currentMembershipLevel = getCurrentMembershipLevel();

  // 获取用户资料数据
  useEffect(() => {
    if (isAuthenticated && !profile) {
      setIsProfileLoading(true);
      fetchProfile()
        .catch(error => {
          console.error('获取用户资料失败:', error);
        })
        .finally(() => {
          setIsProfileLoading(false);
        });
    }
  }, [isAuthenticated, profile, fetchProfile]);

  // 获取会员信息
  useEffect(() => {
    if (isAuthenticated && !membershipInfo) {
      setIsMembershipLoading(true);
      fetchMembershipInfo()
        .catch(error => {
          console.error('获取会员信息失败:', error);
        })
        .finally(() => {
          setIsMembershipLoading(false);
        });
    }
  }, [isAuthenticated, membershipInfo, fetchMembershipInfo]);

  // 检查推荐关系
  useEffect(() => {
    if (isAuthenticated && profile) {
      checkReferralRelation();
    }
  }, [isAuthenticated, profile]);

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
      const success = await copyToClipboard(account);
      if (success) {
        toast.success(t('wallet.address_copied'));
      } else {
        toast.error(t('wallet.copy_failed'));
      }
    } catch (error) {
      console.error('复制地址失败:', error);
      toast.error(t('wallet.copy_failed'));
    }
  };

  // 复制推荐人地址
  const handleCopyReferrerAddress = async () => {
    if (!referrerAddress) return;

    try {
      const success = await copyToClipboard(referrerAddress);
      if (success) {
        toast.success(t('wallet.referrer_address_copied'));
      } else {
        toast.error(t('wallet.copy_failed'));
      }
    } catch (error) {
      console.error('复制推荐人地址失败:', error);
      toast.error(t('wallet.copy_failed'));
    }
  };

  // 生成推荐码（仅显示，不自动复制）
  const handleGenerateInviteCode = async () => {
    if (isGeneratingReferralCode) return; // 防止重复点击

    setIsGeneratingReferralCode(true);

    // 重试机制：最多重试3次
    const maxRetries = 3;
    let retryCount = 0;

    const attemptGetReferralCode = async () => {
      try {
        const result = await referralService.getMyInviteCode();
        if (result.success && result.data && result.data.invite_code) {
          setReferralCode(result.data.invite_code);
          return true;
        } else {
          throw new Error('获取推荐码失败：数据格式错误');
        }
      } catch (error) {
        console.error(`获取推荐码失败 (尝试 ${retryCount + 1}/${maxRetries}):`, error);

        if (retryCount < maxRetries - 1) {
          retryCount++;
          // 等待一小段时间后重试
          await new Promise(resolve => setTimeout(resolve, 500));
          return attemptGetReferralCode();
        } else {
          // 所有重试都失败了，显示错误提示
          toast.error(error.message || t('toast.get_referral_failed'));
          return false;
        }
      }
    };

    try {
      await attemptGetReferralCode();
    } finally {
      setIsGeneratingReferralCode(false);
    }
  };

  // 复制邀请码，失败时选择文本方便手动复制
  const handleCopyInviteCode = async () => {
    if (!referralCode) return;
    try {
      const success = await copyToClipboard(referralCode);
      if (success) {
        toast.success(t('wallet.invite_code_copied'));
      } else {
        // 选中文本以便用户手动复制
        if (inviteInputRef.current) {
          inviteInputRef.current.focus();
          inviteInputRef.current.select();
        }
        toast.error(t('wallet.copy_failed_manual'));
      }
    } catch (error) {
      console.error('复制邀请码失败:', error);
      if (inviteInputRef.current) {
        inviteInputRef.current.focus();
        inviteInputRef.current.select();
      }
      toast.error(t('wallet.copy_failed_manual'));
    }
  };

  // 断开连接
  const handleDisconnect = () => {
    // 登出认证
    logout();
    // 重置Web3状态
    reset();
    // 清理本地钱包地址存储
    try {
      localStorage.removeItem('web3-storage');
    } catch (e) {
      console.warn('清理本地地址失败:', e);
    }
    // 关闭弹窗
    onClose();
    toast.success(t('toast.wallet_disconnected'));
  };

  // 切换语言展开状态
  const handleLanguageToggle = () => {
    setIsLanguageExpanded(!isLanguageExpanded);
  };

  // 选择语言
  const handleLanguageSelect = async (language, langCode) => {
    setSelectedLanguage(language);
    setIsLanguageExpanded(false);
    try {
      await setLanguagePreference(langCode, true);
    } catch (_) {}
  };

  // 处理添加推荐人点击（先关闭语言选项）
  const handleAddReferrerClick = () => {
    // 如果语言选项展开，先关闭它
    if (isLanguageExpanded) {
      setIsLanguageExpanded(false);
    }
    // 然后调用原始的回调
    if (onAddReferrerClick) {
      onAddReferrerClick();
    }
  };

  // 处理购买会员点击
  const handleBuyMembershipClick = () => {
    // 如果语言选项展开，先关闭它
    if (isLanguageExpanded) {
      setIsLanguageExpanded(false);
    }
    // 然后调用原始的回调
    if (onBuyMembershipClick) {
      onBuyMembershipClick();
    }
  };

  // 获取会员等级显示信息
  const getMembershipDisplayInfo = () => {
    const configs = {
      [MEMBERSHIP_LEVELS.GOLD]: {
        text: t('wallet.membership_level_gold'),
        color: MEMBERSHIP_COLORS[MEMBERSHIP_LEVELS.GOLD]
      },
      [MEMBERSHIP_LEVELS.SILVER]: {
        text: t('wallet.membership_level_silver'),
        color: MEMBERSHIP_COLORS[MEMBERSHIP_LEVELS.SILVER]
      },
      [MEMBERSHIP_LEVELS.NONE]: {
        text: t('wallet.membership_level_none'),
        color: MEMBERSHIP_COLORS[MEMBERSHIP_LEVELS.NONE]
      }
    };
    return configs[currentMembershipLevel] || configs[MEMBERSHIP_LEVELS.NONE];
  };

  // 语言选项
  const languageOptions = [
    { code: 'zh', label: '简体中文' },
    { code: 'en', label: 'English' },
    { code: 'ko', label: '한국인' },
    { code: 'vi', label: 'Tiếng Việt' },
    { code: 'ja', label: '日本語' },
    { code: 'pt', label: 'Português' },
    { code: 'es', label: 'Español' }
  ];

  // 菜单项配置
  // 推荐相关入口在检查推荐关系时默认隐藏；检查完成后：
  // - 有推荐人：不显示“推荐统计”和“填写推荐码”入口
  // - 无推荐人：显示“填写推荐码”入口
  // 恢复此前逻辑：仅当未绑定推荐关系且未填写推荐码时显示入口
  const referralMenuItems = isCheckingReferral
    ? []
    : (hasReferralRelation
        ? []
        : [{
            id: 'referrer',
            label: hasReferrer ? t('wallet.referrer') : t('wallet.add_referrer'),
            icon: ReferrerIcon,
            textColor: '#9D9D9D',
            showArrow: !hasReferrer,
            showReferrerInfo: hasReferrer,
            onClick: hasReferrer ? () => {} : handleAddReferrerClick
          }]);

  const menuItems = [
    ...referralMenuItems,
    {
      id: 'generate-referral',
      label: isGeneratingReferralCode ? t('wallet.generating_referral_code') : t('wallet.generate_referral_link'),
      icon: isGeneratingReferralCode ? LoadingIcon : LinkIcon,
      textColor: isGeneratingReferralCode ? '#666' : '#9D9D9D',
      showArrow: false,
      isLoading: isGeneratingReferralCode,
      onClick: handleGenerateInviteCode
    },
    {
      id: 'buy-membership',
      label: t('wallet.membership_buy'),
      icon: MembershipIcon,
      textColor: '#9D9D9D',
      showArrow: true,
      onClick: handleBuyMembershipClick
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
    <>
      <div className="w-full relative box-border">
        {/* 用户头像 */}
        <div className="flex justify-center mb-[16px] md:mb-4">
          <div className="w-[64px] h-[64px] md:w-16 md:h-16 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
            <span className="text-white text-[24px] md:text-2xl font-bold">
              {account ? account.slice(2, 4).toUpperCase() : 'U'}
            </span>
          </div>
        </div>

        {/* 钱包地址 */}
        <div className="flex items-center justify-center gap-[8px] md:gap-2 mb-[8px] md:mb-2">
          <span
            className="text-[20px] md:text-xl"
            style={{ color: '#E4E7E7', fontWeight: 600 }}
          >
            {formatAddress(account, 3, 3)}
          </span>
          <button onClick={handleCopyAddress} className="w-[16px] h-[16px] md:w-4 md:h-4">
            <CopyIcon />
          </button>
        </div>

        {/* 会员等级状态：在数据请求中显示骨架屏 */}
        {isProfileLoading || isMembershipLoading ? (
          <div className="flex items-center justify-center gap-[6px] md:gap-1 mb-[12px] md:mb-3">
            <div className="w-[8px] h-[8px] md:w-2 md:h-2 rounded-full bg-[#3a3a3a]" />
            <div className="h-[16px] md:h-4 w-[120px] md:w-24 rounded bg-[#3a3a3a] animate-pulse" />
          </div>
        ) : (
          <div className="flex items-center justify-center gap-[4px] md:gap-1 mb-[12px] md:mb-3">
            <div
              className="w-[8px] h-[8px] md:w-2 md:h-2 rounded-full"
              style={{ backgroundColor: getMembershipDisplayInfo().color }}
            />
            <span
              className="text-[14px] md:text-sm"
              style={{ color: getMembershipDisplayInfo().color, fontWeight: 500 }}
            >
              {getMembershipDisplayInfo().text}
            </span>
          </div>
        )}

        {/* BNB余额 */}
        <div className="text-center mb-[20px] md:mb-5">
          <FormattedBalance
            balance={bnbBalance}
            className="text-[16px] md:text-base"
            style={{ color: '#949E9E', fontWeight: 500 }}
          />
        </div>

        {/* 推荐码展示区域：仅在生成后显示，位于地址与余额之后、功能列表之前 */}
        {referralCode && (
          <div className="w-full mb-[12px] md:mb-3 flex flex-col items-center">
            <div className="w-[290px] md:w-full bg-[#2a2a2a] rounded-[8px] md:rounded-lg p-[12px] md:p-3 flex items-center justify-between">
              <div className="flex flex-col flex-1 mr-2">
                <span className="text-[12px] md:text-xs text-[#9D9D9D] mb-[6px] md:mb-1">{t('wallet.referrer_address')}</span>
                <input
                  ref={inviteInputRef}
                  value={referralCode}
                  readOnly
                  className="w-full bg-[#1f1f1f] text-[#e4e7e7] text-[14px] md:text-sm rounded-[6px] md:rounded-md px-2 py-1"
                />
              </div>
              <button
                onClick={handleCopyInviteCode}
                className="ml-2 px-3 py-2 bg-[#3D3D3D] hover:bg-[#4A4A4A] text-white text-[12px] md:text-sm rounded-[6px] md:rounded-md"
              >
                {t('common.copy')}
              </button>
            </div>
          </div>
        )}

        {/* 菜单项 */}
        <div className="space-y-[8px] md:space-y-2">
          {menuItems.map((item) => (
            <div key={item.id}>
              {/* 主菜单项 */}
              <div
                onClick={item.isLoading ? undefined : item.onClick}
                className={`w-[290px] md:w-full h-[54px] md:h-14 bg-[#2a2a2a] rounded-[8px] md:rounded-lg transition-colors box-border ${
                  item.isLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-[#333333]'
                }`}
                style={{ padding: '11px 18px 11px 12px' }}
              >
                <div className="flex items-center justify-between h-full">
                  {/* 左侧：图片和文字 */}
                  <div className="flex items-center gap-[12px] md:gap-3">
                    {item.icon ? (
                      <item.icon />
                    ) : (
                      <img
                        src={item.image}
                        alt={item.label}
                        className="w-[32px] h-[32px] md:w-8 md:h-8 object-contain"
                      />
                    )}
                    <span
                      className="text-[16px] md:text-base font-medium"
                      style={{ color: item.textColor }}
                    >
                      {item.label}
                    </span>
                  </div>

                  {/* 右侧：箭头或推荐人信息 */}
                  {item.showReferrerInfo && referrerAddress ? (
                    <div className="flex items-center gap-[8px] md:gap-2">
                      <span className="text-[12px] md:text-xs" style={{ color: '#949E9E' }}>
                        {formatAddress(referrerAddress)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyReferrerAddress();
                        }}
                        className="w-[16px] h-[16px] md:w-4 md:h-4 flex items-center justify-center"
                      >
                        <CopyIcon color="#949E9E" />
                      </button>
                    </div>
                  ) : item.showArrow ? (
                    <ArrowRightIcon isRotated={item.isExpanded} />
                  ) : null}
                </div>
              </div>

              {/* 语言展开内容 */}
              {item.id === 'language' && isLanguageExpanded && (
                <div
                  className="mt-[4px] md:mt-1 bg-[#2a2a2a] rounded-[8px] md:rounded-lg overflow-y-auto max-h-[200px] md:max-h-48 shadow-lg w-[290px] md:w-full"
                >
                  {languageOptions.map((lang) => (
                    <div
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang.label, lang.code)}
                      className="w-full h-[44px] md:h-11 cursor-pointer hover:bg-[#333333] transition-colors box-border flex items-center"
                      style={{ padding: '0 18px 0 56px' }}
                    >
                      <span
                        className="text-[14px] md:text-sm font-medium"
                        style={{
                          color: i18n.language?.startsWith(lang.code) ? '#FFFFFF' : '#9D9D9D'
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
    </>
  );
};

export default WalletCard;
