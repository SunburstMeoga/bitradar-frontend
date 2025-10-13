import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWeb3Store, useAuthStore, useUserStore } from '../../store';
import { referralService } from '../../services';
import SlideModal from '../SlideModal';
import SendCard from '../SendCard';
import ActivityCard from '../ActivityCard';
import WalletCard from '../WalletCard';
import SelectTokenCard from '../SelectTokenCard';
import AddReferrerCard from '../AddReferrerCard';
import MembershipCard from '../MembershipCard';
import PaymentConfirmCard from '../PaymentConfirmCard';
import ReferralStatsCard from '../ReferralStatsCard';
import ReferralTreeCard from '../ReferralTreeCard';
import ReferralBindModal from '../ReferralBindModal';

const WalletModal = ({ isOpen, onClose }) => {
  const { account } = useWeb3Store();
  const { isAuthenticated } = useAuthStore();
  const { profile, fetchMembershipInfo } = useUserStore();
  const { t } = useTranslation();
  const [currentCardIndex, setCurrentCardIndex] = useState(0); // 0: 钱包卡片, 1: AddReferrer卡片, 2: Send卡片, 3: Activity卡片, 4: SelectToken卡片, 5: Membership卡片, 6: PaymentConfirm卡片, 7: ReferralStats卡片, 8: ReferralTree卡片
  const [selectedMembershipLevel, setSelectedMembershipLevel] = useState(null);
  const [hasReferralRelation, setHasReferralRelation] = useState(false);
  const [isCheckingReferral, setIsCheckingReferral] = useState(true);
  const [shouldAutoShowInvite, setShouldAutoShowInvite] = useState(false);
  const [isReferralBindOpen, setIsReferralBindOpen] = useState(false);

  // 处理卡片切换
  const handleCardChange = (index) => {
    setCurrentCardIndex(index);
  };

  // 返回到钱包卡片
  const handleBackToWallet = () => {
    setCurrentCardIndex(0);
  };

  // 跳转到SelectToken卡片
  const handleSelectToken = () => {
    setCurrentCardIndex(4); // SelectToken卡片现在是索引4
  };

  // 从SelectToken返回到Send卡片
  const handleBackToSend = () => {
    setCurrentCardIndex(2); // Send卡片现在是索引2
  };

  // 跳转到AddReferrer卡片
  const handleAddReferrer = () => {
    console.log('跳转到AddReferrer卡片，当前索引：', currentCardIndex, '目标索引：1');
    setCurrentCardIndex(1); // AddReferrer卡片现在是索引1
  };

  // 跳转到Membership卡片
  const handleBuyMembership = () => {
    console.log('跳转到Membership卡片，当前索引：', currentCardIndex, '目标索引：5');
    setCurrentCardIndex(5); // Membership卡片现在是索引5
  };

  // 从Membership卡片跳转到PaymentConfirm卡片
  const handleMembershipPayment = (membershipLevel) => {
    console.log('跳转到PaymentConfirm卡片，会员等级：', membershipLevel);
    setSelectedMembershipLevel(membershipLevel);
    setCurrentCardIndex(6); // PaymentConfirm卡片现在是索引6
  };

  // 从PaymentConfirm返回到Membership卡片
  const handleBackToMembership = () => {
    setCurrentCardIndex(5); // 返回到Membership卡片
  };

  // 支付成功处理
  const handlePaymentSuccess = async (membershipLevel) => {
    console.log('支付成功，会员等级：', membershipLevel);

    // 刷新会员信息以确保界面显示最新状态
    try {
      await fetchMembershipInfo();
      console.log('✅ 支付成功后会员信息已刷新');
    } catch (error) {
      console.error('❌ 刷新会员信息失败:', error);
    }

    // 返回到钱包卡片
    setCurrentCardIndex(0);
  };

  // 跳转到推荐统计卡片
  const handleViewReferralStats = () => {
    console.log('跳转到推荐统计卡片，当前索引：', currentCardIndex, '目标索引：7');
    setCurrentCardIndex(7); // ReferralStats卡片现在是索引7
  };

  // 跳转到推荐树卡片
  const handleViewReferralTree = () => {
    console.log('跳转到推荐树卡片，当前索引：', currentCardIndex, '目标索引：8');
    setCurrentCardIndex(8); // ReferralTree卡片现在是索引8
  };

  // 检查用户推荐关系
  const checkReferralRelation = async () => {
    if (!isAuthenticated || !profile) {
      setIsCheckingReferral(false);
      return;
    }

    // 基于用户profile中的invited_by字段判断是否有推荐人
    const hasReferrer = profile.invited_by && profile.invited_by > 0;

    console.log('检查推荐关系:', {
      invited_by: profile.invited_by,
      hasReferrer: hasReferrer
    });

    setHasReferralRelation(hasReferrer);

    if (!hasReferrer) {
      // 用户没有推荐人，检查URL中是否有推荐参数，如果没有则自动显示邀请码输入
      const urlParams = new URLSearchParams(window.location.search);
      const hasRefParam = urlParams.has('ref');
      setShouldAutoShowInvite(!hasRefParam);
    } else {
      setShouldAutoShowInvite(false);
    }

    setIsCheckingReferral(false);
  };

  // 当弹窗打开且用户已认证且profile可用时检查推荐关系
  useEffect(() => {
    if (isOpen && isAuthenticated && profile && !isCheckingReferral) {
      checkReferralRelation();
    }
  }, [isOpen, isAuthenticated, profile]);

  // 根据检查结果自动显示邀请码输入界面
  useEffect(() => {
    if (isOpen && !isCheckingReferral && shouldAutoShowInvite && currentCardIndex === 0) {
      // 延迟一下，让用户看到钱包界面再跳转
      const timer = setTimeout(() => {
        setCurrentCardIndex(1); // 跳转到AddReferrer卡片
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isOpen, isCheckingReferral, shouldAutoShowInvite, currentCardIndex]);

  // 处理关闭弹窗
  const handleClose = () => {
    setCurrentCardIndex(0); // 重置到第一个卡片
    setSelectedMembershipLevel(null); // 重置选中的会员等级
    setShouldAutoShowInvite(false); // 重置自动显示状态
    onClose();
  };

  // 处理邀请码使用成功
  const handleInviteCodeSuccess = () => {
    setHasReferralRelation(true);
    setShouldAutoShowInvite(false);
    handleBackToWallet();
  };

  // 处理需要绑定推荐码的场景：打开绑定弹窗
  const handleRequireReferralBinding = () => {
    setIsReferralBindOpen(true);
  };

  // 配置每个卡片的标题
  const cardTitles = [
    '', // 钱包卡片没有标题
    t('wallet.join_community'), // AddReferrer卡片
    t('wallet.send'), // Send卡片
    t('wallet.activity'), // Activity卡片
    'Select Token', // SelectToken卡片
    t('wallet.membership_buy'), // Membership卡片
    selectedMembershipLevel === 'silver' ? t('wallet.membership_payment_title_silver') : t('wallet.membership_payment_title_gold'), // PaymentConfirm卡片
    t('wallet.referral_stats'), // ReferralStats卡片
    t('wallet.referral_tree') // ReferralTree卡片
  ];

  // 配置每个卡片是否显示返回按钮
  const showBackButtons = [
    false, // 钱包卡片不显示返回按钮
    true,  // AddReferrer卡片显示返回按钮
    true,  // Send卡片显示返回按钮
    true,  // Activity卡片显示返回按钮
    true,  // SelectToken卡片显示返回按钮
    true,  // Membership卡片显示返回按钮
    true,  // PaymentConfirm卡片显示返回按钮
    true,  // ReferralStats卡片显示返回按钮
    true   // ReferralTree卡片显示返回按钮
  ];

  // 处理返回按钮点击
  const handleBackClick = () => {
    if (currentCardIndex === 6) {
      // 从PaymentConfirm返回到Membership
      handleBackToMembership();
    } else if (currentCardIndex === 8) {
      // 从ReferralTree返回到ReferralStats
      setCurrentCardIndex(7);
    } else {
      // 其他情况返回到钱包卡片
      handleBackToWallet();
    }
  };

  if (!account) return null;

  return (
    <SlideModal
      isOpen={isOpen}
      onClose={handleClose}
      currentIndex={currentCardIndex}
      onIndexChange={handleCardChange}
      totalCards={9}
      titles={cardTitles}
      showBackButton={showBackButtons}
      onBack={handleBackClick}
    >
      {/* 钱包卡片 */}
      <WalletCard
        onClose={handleClose}
        onSendClick={() => setCurrentCardIndex(2)} // Send卡片现在是索引2
        onActivityClick={() => setCurrentCardIndex(3)} // Activity卡片现在是索引3
        onAddReferrerClick={handleAddReferrer}
        onBuyMembershipClick={handleBuyMembership}
        onViewReferralStatsClick={handleViewReferralStats}
      />

      {/* AddReferrer卡片 */}
      <AddReferrerCard
        onBack={handleBackToWallet}
        onClose={handleClose}
        onSuccess={handleInviteCodeSuccess}
      />

      {/* Send卡片 */}
      <SendCard
        onBack={handleBackToWallet}
        onClose={handleClose}
        onSelectToken={handleSelectToken}
      />

      {/* Activity卡片 */}
      <ActivityCard
        onBack={handleBackToWallet}
        onClose={handleClose}
      />

      {/* SelectToken卡片 */}
      <SelectTokenCard
        onBack={handleBackToSend}
        onClose={handleClose}
      />

      {/* Membership卡片 */}
      <MembershipCard
        onBack={handleBackToWallet}
        onClose={handleClose}
        onBuyMembership={handleMembershipPayment}
      />

      {/* PaymentConfirm卡片 */}
      <PaymentConfirmCard
        membershipLevel={selectedMembershipLevel}
        onBack={handleBackToMembership}
        onClose={handleClose}
        onPaymentSuccess={handlePaymentSuccess}
        onRequireReferralBinding={handleRequireReferralBinding}
      />

      {/* ReferralStats卡片 */}
      <ReferralStatsCard
        onBack={handleBackToWallet}
        onClose={handleClose}
        onViewTree={handleViewReferralTree}
      />

      {/* ReferralTree卡片 */}
      <ReferralTreeCard
        onBack={() => setCurrentCardIndex(7)} // 返回到ReferralStats卡片
        onClose={handleClose}
      />

      {/* 邀请码绑定弹窗 */}
      <ReferralBindModal
        isOpen={isReferralBindOpen}
        onClose={() => setIsReferralBindOpen(false)}
        walletAddress={account}
      />
    </SlideModal>
  );
};

export default WalletModal;
