import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWeb3Store } from '../../store';
import SlideModal from '../SlideModal';
import SendCard from '../SendCard';
import ActivityCard from '../ActivityCard';
import WalletCard from '../WalletCard';
import SelectTokenCard from '../SelectTokenCard';
import AddReferrerCard from '../AddReferrerCard';
import MembershipCard from '../MembershipCard';
import PaymentConfirmCard from '../PaymentConfirmCard';

const WalletModal = ({ isOpen, onClose }) => {
  const { account } = useWeb3Store();
  const { t } = useTranslation();
  const [currentCardIndex, setCurrentCardIndex] = useState(0); // 0: 钱包卡片, 1: AddReferrer卡片, 2: Send卡片, 3: Activity卡片, 4: SelectToken卡片, 5: Membership卡片, 6: PaymentConfirm卡片
  const [selectedMembershipLevel, setSelectedMembershipLevel] = useState(null);

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
  const handlePaymentSuccess = (membershipLevel) => {
    console.log('支付成功，会员等级：', membershipLevel);
    // 返回到钱包卡片
    setCurrentCardIndex(0);
  };

  // 处理关闭弹窗
  const handleClose = () => {
    setCurrentCardIndex(0); // 重置到第一个卡片
    setSelectedMembershipLevel(null); // 重置选中的会员等级
    onClose();
  };

  // 配置每个卡片的标题
  const cardTitles = [
    '', // 钱包卡片没有标题
    t('wallet.join_community'), // AddReferrer卡片
    t('wallet.send'), // Send卡片
    t('wallet.activity'), // Activity卡片
    'Select Token', // SelectToken卡片
    t('wallet.membership_buy'), // Membership卡片
    selectedMembershipLevel === 'silver' ? t('wallet.membership_payment_title_silver') : t('wallet.membership_payment_title_gold') // PaymentConfirm卡片
  ];

  // 配置每个卡片是否显示返回按钮
  const showBackButtons = [
    false, // 钱包卡片不显示返回按钮
    true,  // AddReferrer卡片显示返回按钮
    true,  // Send卡片显示返回按钮
    true,  // Activity卡片显示返回按钮
    true,  // SelectToken卡片显示返回按钮
    true,  // Membership卡片显示返回按钮
    true   // PaymentConfirm卡片显示返回按钮
  ];

  // 处理返回按钮点击
  const handleBackClick = () => {
    if (currentCardIndex === 6) {
      // 从PaymentConfirm返回到Membership
      handleBackToMembership();
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
      totalCards={7}
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
      />

      {/* AddReferrer卡片 */}
      <AddReferrerCard
        onBack={handleBackToWallet}
        onClose={handleClose}
        onSuccess={handleBackToWallet}
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
      />
    </SlideModal>
  );
};

export default WalletModal;
