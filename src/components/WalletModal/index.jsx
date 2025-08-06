import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWeb3Store } from '../../store';
import SlideModal from '../SlideModal';
import SendCard from '../SendCard';
import ActivityCard from '../ActivityCard';
import WalletCard from '../WalletCard';
import SelectTokenCard from '../SelectTokenCard';
import AddReferrerCard from '../AddReferrerCard';

const WalletModal = ({ isOpen, onClose }) => {
  const { account } = useWeb3Store();
  const { t } = useTranslation();
  const [currentCardIndex, setCurrentCardIndex] = useState(0); // 0: 钱包卡片, 1: AddReferrer卡片, 2: Send卡片, 3: Activity卡片, 4: SelectToken卡片

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

  // 处理关闭弹窗
  const handleClose = () => {
    setCurrentCardIndex(0); // 重置到第一个卡片
    onClose();
  };

  // 配置每个卡片的标题
  const cardTitles = [
    '', // 钱包卡片没有标题
    t('wallet.join_community'), // AddReferrer卡片
    t('wallet.send'), // Send卡片
    t('wallet.activity'), // Activity卡片
    'Select Token' // SelectToken卡片
  ];

  // 配置每个卡片是否显示返回按钮
  const showBackButtons = [
    false, // 钱包卡片不显示返回按钮
    true,  // AddReferrer卡片显示返回按钮
    true,  // Send卡片显示返回按钮
    true,  // Activity卡片显示返回按钮
    true   // SelectToken卡片显示返回按钮
  ];

  if (!account) return null;

  return (
    <SlideModal
      isOpen={isOpen}
      onClose={handleClose}
      currentIndex={currentCardIndex}
      onIndexChange={handleCardChange}
      totalCards={5}
      titles={cardTitles}
      showBackButton={showBackButtons}
      onBack={handleBackToWallet}
    >
      {/* 钱包卡片 */}
      <WalletCard
        onClose={handleClose}
        onSendClick={() => setCurrentCardIndex(2)} // Send卡片现在是索引2
        onActivityClick={() => setCurrentCardIndex(3)} // Activity卡片现在是索引3
        onAddReferrerClick={handleAddReferrer}
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
    </SlideModal>
  );
};

export default WalletModal;
