import { useState } from 'react';
import { useWeb3Store } from '../../store';
import SlideModal from '../SlideModal';
import SendCard from '../SendCard';
import ActivityCard from '../ActivityCard';
import WalletCard from '../WalletCard';



const WalletModal = ({ isOpen, onClose }) => {
  const { account } = useWeb3Store();
  const [currentCardIndex, setCurrentCardIndex] = useState(0); // 0: 钱包卡片, 1: Send卡片, 2: Activity卡片

  // 处理卡片切换
  const handleCardChange = (index) => {
    setCurrentCardIndex(index);
  };

  // 返回到钱包卡片
  const handleBackToWallet = () => {
    setCurrentCardIndex(0);
  };

  if (!account) return null;

  return (
    <SlideModal
      isOpen={isOpen}
      onClose={onClose}
      currentIndex={currentCardIndex}
      onIndexChange={handleCardChange}
      totalCards={3}
    >
      {/* 钱包卡片 */}
      <WalletCard
        onClose={onClose}
        onSendClick={() => setCurrentCardIndex(1)}
        onActivityClick={() => setCurrentCardIndex(2)}
      />

      {/* Send卡片 */}
      <SendCard
        onBack={handleBackToWallet}
        onClose={onClose}
      />

      {/* Activity卡片 */}
      <ActivityCard
        onBack={handleBackToWallet}
        onClose={onClose}
      />
    </SlideModal>
  );
};

export default WalletModal;
